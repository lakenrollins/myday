import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { usersApi } from '../../utils/api';
import styles from './FollowButton.module.css';

const FollowButton = ({ 
  userId, 
  initialFollowing = false, 
  size = 'medium',
  variant = 'primary',
  className = '',
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentUser = useSelector(state => state.session.user);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || !userId || currentUser.id === userId) return;
      
      try {
        const response = await usersApi.getFollowStatus(userId);
        setIsFollowing(response.following);
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    };

    checkFollowStatus();
  }, [userId, currentUser]);

  const handleClick = async () => {
    if (!currentUser || currentUser.id === userId || isLoading) return;
    
    setIsLoading(true);
    const newFollowing = !isFollowing;
    
    // Optimistic update
    setIsFollowing(newFollowing);
    
    try {
      const response = await usersApi.followUser(userId);
      setIsFollowing(response.following);
      
      if (onFollowChange) {
        onFollowChange(userId, response.following, response.followers_count);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newFollowing);
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if not logged in or if it's the current user
  if (!currentUser || currentUser.id === userId) {
    return null;
  }

  const buttonClasses = [
    styles.followButton,
    styles[size],
    styles[variant],
    isFollowing ? styles.following : styles.notFollowing,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={buttonClasses}
    >
      {isLoading ? (
        <span className={styles.loadingText}>
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </span>
      ) : (
        <span>
          {isFollowing ? 'Following' : 'Follow'}
        </span>
      )}
    </button>
  );
};

export default FollowButton;