import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsHeart, BsHeartFill, BsShare, BsDownload, BsThreeDots, BsPencil, BsTrash } from 'react-icons/bs';
import { useModal } from '../../context/Modal';
import { SavePinModal } from '../SavePin';
import { PinDetailModal } from '../PinDetail';
import { UserAvatar } from '../UI';
import styles from './PinCard.module.css';

export const PinCard = ({ pin, onSave, onLike, showManageOptions = false, onEdit, onDelete }) => {
  const { setModalContent } = useModal();
  const [isLiked, setIsLiked] = useState(pin.liked || false);
  const [isSaved, setIsSaved] = useState(pin.saved || false);
  const [likesCount, setLikesCount] = useState(pin.likes_count || 0);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState({ like: false, save: false });

  const handleLike = async (e) => {
    e.stopPropagation();
    if (loading.like) return;
    
    setLoading(prev => ({ ...prev, like: true }));
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    
    // Optimistic update
    setIsLiked(newLiked);
    setLikesCount(newCount);
    
    try {
      if (onLike) {
        const result = await onLike(pin.id);
        // Update with actual values from server if provided
        if (result) {
          setIsLiked(result.liked);
          setLikesCount(result.likes_count);
        }
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

  const handleSave = (e) => {
    e.stopPropagation();
    
    const handleSaveToBoard = (boardId) => {
      setIsSaved(true);
      if (onSave) {
        onSave(pin.id, boardId);
      }
    };
    
    setModalContent(<SavePinModal pin={pin} onSaved={handleSaveToBoard} />);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: pin.title,
        url: pin.url || window.location.href,
      });
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = pin.image_url || pin.image;
    link.download = pin.title || 'pinterest-image';
    link.click();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(pin);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(pin.id);
    }
  };

  const handlePinClick = (e) => {
    // Open modal by default
    if (e.ctrlKey || e.metaKey) {
      // Open in new tab if Ctrl/Cmd clicked
      window.open(`/pin/${pin.id}`, '_blank');
    } else {
      setModalContent(<PinDetailModal pin={pin} onLike={onLike} onSave={onSave} />);
    }
  };

  return (
    <motion.div
      className={styles.pinContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handlePinClick}
    >
      <div className={styles.imageContainer}>
        <img 
          src={imageError ? 'https://via.placeholder.com/300x400/cccccc/666666?text=Image+Not+Found' : (pin.image_url || pin.image)} 
          alt={pin.title}
          className={styles.pinImage}
          onError={(e) => {
            if (!imageError) {
              console.log('Image failed to load:', pin.image_url || pin.image);
              setImageError(true);
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', pin.image_url || pin.image);
          }}
        />
        <div className={styles.pinOverlay}>
          <div className={styles.topActions}>
            {showManageOptions ? (
              <div className={styles.manageActions}>
                <button 
                  className={styles.manageButton}
                  onClick={handleEdit}
                  title="Edit pin"
                >
                  <BsPencil />
                </button>
                <button 
                  className={`${styles.manageButton} ${styles.deleteButton}`}
                  onClick={handleDelete}
                  title="Delete pin"
                >
                  <BsTrash />
                </button>
              </div>
            ) : (
              <button 
                className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
                onClick={handleSave}
              >
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
          <div className={styles.bottomActions}>
            <div className={styles.actionGroup}>
              <button className={styles.actionButton} onClick={handleShare} title="Share">
                <BsShare />
              </button>
              <button className={styles.actionButton} onClick={handleDownload} title="Download">
                <BsDownload />
              </button>
              <button className={styles.actionButton} title="More options">
                <BsThreeDots />
              </button>
            </div>
            {!showManageOptions && (
              <button 
                className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`} 
                onClick={handleLike} 
                title={`${isLiked ? 'Unlike' : 'Like'} (${likesCount})`}
                disabled={loading.like}
              >
                {isLiked ? (
                  <BsHeartFill className={styles.likedIcon} />
                ) : (
                  <BsHeart />
                )}
                {likesCount > 0 && <span className={styles.likesCount}>{likesCount}</span>}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {pin.title && (
        <div className={styles.pinInfo}>
          <h3 className={styles.pinTitle}>{pin.title}</h3>
          {pin.user && (
            <div className={styles.pinUser}>
              <UserAvatar 
                user={pin.user} 
                size={24} 
                className={styles.userAvatar}
              />
              <span className={styles.userName}>{pin.user.username || pin.user.name}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PinCard;