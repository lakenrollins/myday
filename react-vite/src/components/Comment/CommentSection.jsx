import { useState, useEffect } from 'react';
import { commentsApi } from '../../utils/api';
import Comment from './Comment';
import CommentForm from './CommentForm';
import styles from './CommentSection.module.css';

const CommentSection = ({ pinId, pinOwnerId }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await commentsApi.getPinComments(pinId);
        setComments(data.comments);
      } catch (err) {
        setError('Failed to load comments');
        console.error('Error fetching comments:', err);
      }
      setIsLoading(false);
    };

    if (pinId) {
      fetchComments();
    }
  }, [pinId]);

  const handleNewComment = (newComment) => {
    setComments(prev => [newComment, ...prev]);
  };

  const handleUpdateComment = (updatedComment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleDeleteComment = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  if (isLoading) {
    return (
      <div className={styles.commentSection}>
        <div className={styles.loading}>Loading comments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.commentSection}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.commentSection}>
      <div className={styles.header}>
        <h3>Comments ({comments.length})</h3>
      </div>

      <CommentForm 
        pinId={pinId} 
        pinOwnerId={pinOwnerId}
        onSubmit={handleNewComment}
      />

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <div className={styles.noComments}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;