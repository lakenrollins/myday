import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BsHeart, BsHeartFill, BsShare, BsDownload, BsThreeDots, BsClock, BsEye } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../../context/Modal';
import { SavePinModal } from '../SavePin';
import { CommentSection } from '../Comment';
import { pinsApi, usersApi } from '../../utils/api';
import { UserAvatar } from '../UI';
import styles from './PinDetailModal.module.css';

export const PinDetailModal = ({ pin: initialPin, onLike, onSave }) => {
  const { closeModal, setModalContent } = useModal();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.session.user);
  
  const [pin, setPin] = useState(initialPin);
  const [isLiked, setIsLiked] = useState(initialPin?.liked || false);
  const [likesCount, setLikesCount] = useState(initialPin?.likes_count || 0);
  const [isSaved, setIsSaved] = useState(initialPin?.saved || false);
  const [loading, setLoading] = useState({ like: false, save: false, follow: false });
  const [imageError, setImageError] = useState(false);
  const [relatedPins, setRelatedPins] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Fetch full pin details if we don't have complete data
    const fetchPinDetails = async () => {
      if (!pin.id) return;
      
      try {
        const fullPin = await pinsApi.getPin(pin.id);
        setPin(fullPin);
        setIsLiked(fullPin.liked || false);
        setLikesCount(fullPin.likes_count || 0);
        setIsSaved(fullPin.saved || false);
      } catch (error) {
        console.error('Failed to fetch pin details:', error);
      }
    };

    // Fetch related pins
    const fetchRelatedPins = async () => {
      try {
        const related = await pinsApi.getRelatedPins(pin.id);
        setRelatedPins(related.slice(0, 6)); // Show max 6 related pins
      } catch (error) {
        console.error('Failed to fetch related pins:', error);
      }
    };

    // Check if following user
    const checkFollowStatus = async () => {
      if (!currentUser || !pin.user || currentUser.id === pin.user.id) return;
      
      try {
        const followStatus = await usersApi.getFollowStatus(pin.user.id);
        setIsFollowing(followStatus.following);
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    };

    if (pin.id) {
      fetchPinDetails();
      fetchRelatedPins();
      checkFollowStatus();
    }
  }, [pin.id, currentUser]);

  const handleLike = async () => {
    if (loading.like || !currentUser) return;
    
    setLoading(prev => ({ ...prev, like: true }));
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    
    // Optimistic update
    setIsLiked(newLiked);
    setLikesCount(newCount);
    
    try {
      if (onLike) {
        const result = await onLike(pin.id);
        if (result) {
          setIsLiked(result.liked);
          setLikesCount(result.likes_count);
        }
      } else {
        await pinsApi.likePin(pin.id);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
      console.error('Failed to like pin:', error);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleSave = () => {
    const handleSaveToBoard = (boardId) => {
      setIsSaved(true);
      if (onSave) {
        onSave(pin.id, boardId);
      }
    };
    
    setModalContent(<SavePinModal pin={pin} onSaved={handleSaveToBoard} />);
  };

  const handleFollow = async () => {
    if (loading.follow || !currentUser || !pin.user || currentUser.id === pin.user.id) return;
    
    setLoading(prev => ({ ...prev, follow: true }));
    const newFollowing = !isFollowing;
    
    // Optimistic update
    setIsFollowing(newFollowing);
    
    try {
      if (newFollowing) {
        await usersApi.followUser(pin.user.id);
      } else {
        await usersApi.unfollowUser(pin.user.id);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newFollowing);
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pin.title,
        text: pin.description,
        url: pin.url || window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pin.image_url || pin.image;
    link.download = pin.title || 'pinterest-image';
    link.click();
  };

  const handleRelatedPinClick = (relatedPin) => {
    setModalContent(<PinDetailModal pin={relatedPin} onLike={onLike} onSave={onSave} />);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!pin) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.modal}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div 
          className={styles.content}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button onClick={closeModal} className={styles.closeButton}>
            ×
          </button>

          <div className={styles.imageSection}>
            <img 
              src={imageError ? 'https://via.placeholder.com/500x600/cccccc/666666?text=Image+Not+Found' : (pin.image_url || pin.image)} 
              alt={pin.title}
              className={styles.pinImage}
              onError={() => {
                if (!imageError) {
                  setImageError(true);
                }
              }}
            />
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.header}>
              <div className={styles.actions}>
                <button 
                  className={styles.actionButton} 
                  onClick={handleShare} 
                  title="Share"
                >
                  <BsShare />
                </button>
                <button 
                  className={styles.actionButton} 
                  onClick={handleDownload} 
                  title="Download"
                >
                  <BsDownload />
                </button>
                <button className={styles.actionButton} title="More options">
                  <BsThreeDots />
                </button>
              </div>
              <button 
                className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
                onClick={handleSave}
              >
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>

            {pin.title && (
              <h1 className={styles.pinTitle}>{pin.title}</h1>
            )}

            {pin.description && (
              <p className={styles.pinDescription}>{pin.description}</p>
            )}

            {pin.user && (
              <div className={styles.userSection}>
                <UserAvatar 
                  user={pin.user} 
                  size={48} 
                  className={styles.userAvatar}
                />
                <div className={styles.userInfo}>
                  <h3 className={styles.userName}>
                    {pin.user.username || pin.user.name}
                  </h3>
                  <p className={styles.userStats}>
                    {pin.user.followers_count || 0} followers
                  </p>
                </div>
                {currentUser && pin.user.id !== currentUser.id && (
                  <button 
                    className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                    onClick={handleFollow}
                    disabled={loading.follow}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            )}

            <div className={styles.metaSection}>
              <div className={styles.metaItem}>
                <button 
                  className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`} 
                  onClick={handleLike}
                  disabled={loading.like}
                >
                  {isLiked ? <BsHeartFill /> : <BsHeart />}
                </button>
                <span className={styles.likesCount}>
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </span>
              </div>

              {pin.created_at && (
                <div className={styles.metaItem}>
                  <BsClock />
                  <span>Created {formatDate(pin.created_at)}</span>
                </div>
              )}

              {pin.views_count && (
                <div className={styles.metaItem}>
                  <BsEye />
                  <span>{pin.views_count} views</span>
                </div>
              )}

              {pin.url && (
                <div className={styles.metaItem}>
                  <FiExternalLink />
                  <a 
                    href={pin.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#e60023', textDecoration: 'none' }}
                  >
                    Visit source
                  </a>
                </div>
              )}
            </div>

            {pin.board && (
              <div className={styles.boardSection}>
                <div className={styles.boardInfo}>
                  {pin.board.cover_image ? (
                    <img 
                      src={pin.board.cover_image} 
                      alt={pin.board.name}
                      className={styles.boardImage}
                    />
                  ) : (
                    <div className={styles.boardImage} style={{ background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      📌
                    </div>
                  )}
                  <div>
                    <h4 className={styles.boardName}>{pin.board.name}</h4>
                    <p className={styles.boardCount}>
                      {pin.board.pins_count || 0} pins
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CommentSection pinId={pin.id} pinOwnerId={pin.user?.id} />

            {relatedPins.length > 0 && (
              <div className={styles.relatedSection}>
                <h3 className={styles.relatedTitle}>More like this</h3>
                <div className={styles.relatedPins}>
                  {relatedPins.map(relatedPin => (
                    <div 
                      key={relatedPin.id} 
                      className={styles.relatedPin}
                      onClick={() => handleRelatedPinClick(relatedPin)}
                    >
                      <img 
                        src={relatedPin.image_url || relatedPin.image} 
                        alt={relatedPin.title}
                        className={styles.relatedPinImage}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinDetailModal;