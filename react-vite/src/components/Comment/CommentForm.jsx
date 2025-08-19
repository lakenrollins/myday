import { useState } from 'react';
import { useSelector } from 'react-redux';
import { commentsApi } from '../../utils/api';
import { UserAvatar } from '../UI';
import styles from './CommentForm.module.css';

const CommentForm = ({ pinId, pinOwnerId, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const currentUser = useSelector(state => state.session.user);
  const isOwnPin = currentUser?.id === pinOwnerId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      const newComment = await commentsApi.createComment({
        content: content.trim(),
        pin_id: pinId,
      });
      
      onSubmit(newComment);
      setContent('');
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to post comment');
      }
    }
    setIsLoading(false);
  };

  if (!currentUser) {
    return (
      <div className={styles.loginPrompt}>
        <p>Please log in to leave a comment.</p>
      </div>
    );
  }

  if (isOwnPin) {
    return (
      <div className={styles.ownPinMessage}>
        <p>You cannot comment on your own pin.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <UserAvatar 
        user={currentUser} 
        size="small"
        className={styles.avatar}
      />
      
      <div className={styles.inputContainer}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className={styles.textarea}
          maxLength={500}
          disabled={isLoading}
        />
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <div className={styles.footer}>
          <span className={styles.charCount}>
            {content.length}/500
          </span>
          
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className={styles.submitButton}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;