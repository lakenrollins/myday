import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BsHeart, BsHeartFill, BsShare, BsDownload, BsThreeDots, BsClock, BsEye, BsArrowLeft } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { useModal } from '../../context/Modal';
import { SavePinModal } from '../../components/SavePin';
import { pinsApi, usersApi } from '../../utils/api';
import { PinGrid } from '../../components/Pin';
import { UserAvatar } from '../../components/UI';
import styles from './PinDetail.module.css';

export const PinDetail = () => {
  const { pinId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setModalContent } = useModal();
  const currentUser = useSelector(state => state.session.user);
  
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState({ like: false, save: false, follow: false });
  const [imageError, setImageError] = useState(false);
  const [relatedPins, setRelatedPins] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchPinData = async () => {
      if (!pinId) return;
      
      setLoading(true);
      try {
        // Fetch pin details
        const pinData = await pinsApi.getPin(pinId);
        setPin(pinData);
        setIsLiked(pinData.liked || false);
        setLikesCount(pinData.likes_count || 0);
        setIsSaved(pinData.saved || false);

        // Fetch related pins
        const related = await pinsApi.getRelatedPins(pinId);
        setRelatedPins(related.slice(0, 20)); // Show more related pins on the page

        // Check if following user
        if (currentUser && pinData.user && currentUser.id !== pinData.user.id) {
          const followStatus = await usersApi.getFollowStatus(pinData.user.id);
          setIsFollowing(followStatus.following);
        }
      } catch (err) {
        console.error('Failed to fetch pin data:', err);
        setError('Failed to load pin');
      } finally {
        setLoading(false);
      }
    };

    fetchPinData();
  }, [pinId, currentUser]);

  const handleLike = async () => {
    if (actionLoading.like || !currentUser) return;
    
    setActionLoading(prev => ({ ...prev, like: true }));
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    
    // Optimistic update
    setIsLiked(newLiked);
    setLikesCount(newCount);
    
    try {
      await pinsApi.likePin(pin.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
      console.error('Failed to like pin:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleSave = () => {
    const handleSaveToBoard = (boardId) => {
      setIsSaved(true);
    };
    
    setModalContent(<SavePinModal pin={pin} onSaved={handleSaveToBoard} />);
  };

  const handleFollow = async () => {
    if (actionLoading.follow || !currentUser || !pin.user || currentUser.id === pin.user.id) return;
    
    setActionLoading(prev => ({ ...prev, follow: true }));
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
      setActionLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pin.title,
        text: pin.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pin.image_url || pin.image;
    link.download = pin.title || 'pinterest-image';
    link.click();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading pin...</p>
        </div>
      </div>
    );
  }

  if (error || !pin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Pin not found</h2>
          <p>{error || 'The pin you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            <BsArrowLeft /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.pinContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <BsArrowLeft /> Back
        </button>

        <div className={styles.pinContent}>
          <div className={styles.imageSection}>
            <img 
              src={imageError ? 'https://via.placeholder.com/600x800/cccccc/666666?text=Image+Not+Found' : (pin.image_url || pin.image)} 
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
                  onClick={() => navigate(`/user/${pin.user.id}`)}
                />
                <div className={styles.userInfo}>
                  <h3 
                    className={styles.userName}
                    onClick={() => navigate(`/user/${pin.user.id}`)}
                  >
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
                    disabled={actionLoading.follow}
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
                  disabled={actionLoading.like}
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
                    className={styles.sourceLink}
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
                    <div className={styles.boardImage}>
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
          </div>
        </div>
      </motion.div>

      {relatedPins.length > 0 && (
        <motion.div 
          className={styles.relatedSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={styles.relatedTitle}>More like this</h2>
          <PinGrid 
            pins={relatedPins} 
            onLike={handleLike}
            onSave={handleSave}
          />
        </motion.div>
      )}
    </div>
  );
};

export default PinDetail;