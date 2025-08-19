import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BsHeart, BsHeartFill } from 'react-icons/bs';
import { useInView } from 'react-intersection-observer';
import { pinsApi } from '../../utils/api';
import { PinGrid } from '../../components/Pin';
import styles from './LikedPins.module.css';

export const LikedPins = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.session.user);
  
  const [likedPins, setLikedPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchLikedPins(1);
  }, [currentUser, navigate]);

  const fetchLikedPins = async (page = 1) => {
    const loadingState = page === 1 ? setLoading : setLoadingMore;
    loadingState(true);
    
    try {
      const response = await pinsApi.getLikedPins({ page, per_page: 20 });
      
      if (page === 1) {
        setLikedPins(response.pins || response);
      } else {
        setLikedPins(prev => [...prev, ...(response.pins || response)]);
      }
      
      setHasMore(response.has_next !== undefined ? response.has_next : (response.pins || response).length === 20);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch liked pins:', err);
      setError('Failed to load liked pins');
    } finally {
      loadingState(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    const nextPage = currentPage + 1;
    await fetchLikedPins(nextPage);
  }, [hasMore, loadingMore, currentPage]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore) {
      handleLoadMore();
    }
  }, [inView, hasMore, loadingMore, handleLoadMore]);

  const handlePinLike = async (pinId) => {
    try {
      await pinsApi.likePin(pinId);
      // Remove the pin from liked pins since it was unliked
      setLikedPins(prev => prev.filter(pin => pin.id !== pinId));
    } catch (error) {
      console.error('Failed to unlike pin:', error);
    }
  };

  const handlePinSave = async (pinId, boardId) => {
    try {
      await pinsApi.savePin(pinId, boardId);
      // Show success notification
    } catch (error) {
      console.error('Failed to save pin:', error);
    }
  };

  if (!currentUser) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your liked pins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.pageContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconContainer}>
              <BsHeartFill className={styles.heartIcon} />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Liked Pins</h1>
              <p className={styles.pageDescription}>
                All the pins you&apos;ve liked are saved here
              </p>
              <div className={styles.stats}>
                <span className={styles.statNumber}>{likedPins.length}</span>
                <span className={styles.statLabel}>Liked Pin{likedPins.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button 
              onClick={() => fetchLikedPins(1)}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        <div className={styles.content}>
          {likedPins.length > 0 ? (
            <>
              <div className={styles.pinsContainer}>
                <PinGrid 
                  pins={likedPins} 
                  onLike={handlePinLike}
                  onSave={handlePinSave}
                  showLikeButton={true}
                />
              </div>
              
              {hasMore && (
                <div ref={loadMoreRef} className={styles.loadMoreContainer}>
                  {loadingMore && (
                    <div className={styles.loadingMore}>
                      <div className={styles.spinner}></div>
                      <p>Loading more pins...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <BsHeart size={80} />
              </div>
              <h3 className={styles.emptyTitle}>No liked pins yet</h3>
              <p className={styles.emptyDescription}>
                Start exploring and like pins to see them here. Your liked pins will be saved automatically.
              </p>
              <button 
                className={styles.exploreButton}
                onClick={() => navigate('/')}
              >
                Explore Pins
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LikedPins;