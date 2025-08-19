import { useState } from 'react';
import { useSelector } from 'react-redux';
import { commentsApi } from '../../utils/api';
import { UserAvatar } from '../UI';
import styles from './Comment.module.css';

const Comment = ({ comment, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentUser = useSelector(state => state.session.user);
  const isOwner = currentUser?.id === comment.user_id;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    
    setIsLoading(true);
    try {
      const updatedComment = await commentsApi.updateComment(comment.id, {
        content: editContent
      });
      
      onUpdate(updatedComment);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    setIsLoading(true);
    try {
      await commentsApi.deleteComment(comment.id);
      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.comment}>
      <UserAvatar 
        user={comment.user} 
        size="small"
        className={styles.avatar}
      />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.username}>
            {comment.user.first_name} {comment.user.last_name}
          </span>
          <span className={styles.date}>
            {formatDate(comment.created_at)}
          </span>
        </div>
        
        {isEditing ? (
          <div className={styles.editForm}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={styles.editTextarea}
              maxLength={500}
              disabled={isLoading}
            />
            <div className={styles.editActions}>
              <button
                onClick={handleUpdate}
                disabled={isLoading || !editContent.trim()}
                className={styles.saveButton}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isLoading}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.text}>
            {comment.content}
          </div>
        )}
        
        {isOwner && !isEditing && (
          <div className={styles.actions}>
            <button
              onClick={() => setIsEditing(true)}
              className={styles.actionButton}
              disabled={isLoading}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={styles.actionButton}
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;