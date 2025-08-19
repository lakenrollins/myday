import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BsArrowLeft, BsShare, BsThreeDots, BsPencil, BsPlus, BsHeart, BsLock } from 'react-icons/bs';
import { useInView } from 'react-intersection-observer';
import { useModal } from '../../context/Modal';
import { boardsApi, pinsApi } from '../../utils/api';
import { PinGrid } from '../../components/Pin';
import { CreatePinModal } from '../../components/CreatePin';
import { CreateBoardModal } from '../../components/CreateBoard';
import { UserAvatar } from '../../components/UI';
import styles from './BoardDetail.module.css';

export const BoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { setModalContent } = useModal();
  const currentUser = useSelector(state => state.session.user);
  
  const [board, setBoard] = useState(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPins, setLoadingPins] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, alphabetical
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState({ follow: false });

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  const isOwner = currentUser && board && currentUser.id === board.user_id;

  useEffect(() => {
    const fetchBoardData = async () => {
      if (!boardId) return;
      
      setLoading(true);
      try {
        // Fetch board details
        const boardData = await boardsApi.getBoard(boardId);
        setBoard(boardData);

        // Check if following board (if not owner)
        if (currentUser && boardData.user_id !== currentUser.id) {
          // Note: You might need to add this API endpoint
          // const followStatus = await boardsApi.getFollowStatus(boardId);
          // setIsFollowing(followStatus.following);
        }

        // Fetch board pins
        await fetchPins(1, 'recent', boardId);
      } catch (err) {
        console.error('Failed to fetch board data:', err);
        setError('Failed to load board');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, currentUser]);

  const fetchPins = async (page = 1, sort = sortBy, id = boardId) => {
    if (!id) return;

    setLoadingPins(true);
    try {
      const response = await boardsApi.getBoardPins(id, {
        page,
        per_page: 20,
        sort: sort
      });

      if (page === 1) {
        setPins(response.pins || response);
      } else {
        setPins(prev => [...prev, ...(response.pins || response)]);
      }

      setHasMore(response.has_next !== undefined ? response.has_next : response.length === 20);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch board pins:', error);
    } finally {
      setLoadingPins(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingPins) return;
    
    const nextPage = currentPage + 1;
    await fetchPins(nextPage, sortBy);
  }, [hasMore, loadingPins, currentPage, sortBy, boardId]);

  useEffect(() => {
    if (inView && hasMore && !loadingPins) {
      handleLoadMore();
    }
  }, [inView, hasMore, loadingPins, handleLoadMore]);

  const handleSortChange = async (newSort) => {
    if (newSort === sortBy) return;
    
    setSortBy(newSort);
    setCurrentPage(1);
    await fetchPins(1, newSort);
  };

  const handleFollow = async () => {
    if (actionLoading.follow || !currentUser || !board || isOwner) return;
    
    setActionLoading(prev => ({ ...prev, follow: true }));
    const newFollowing = !isFollowing;
    
    // Optimistic update
    setIsFollowing(newFollowing);
    
    try {
      if (newFollowing) {
        await boardsApi.followBoard(board.id);
      } else {
        // Note: You might need to add unfollow endpoint
        // await boardsApi.unfollowBoard(board.id);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newFollowing);
      console.error('Failed to follow/unfollow board:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleEdit = () => {
    const handleBoardUpdated = (updatedBoard) => {
      setBoard(updatedBoard);
    };

    setModalContent(<CreateBoardModal board={board} onBoardCreated={handleBoardUpdated} />);
  };

  const handleAddPin = () => {
    const handlePinCreated = (newPin) => {
      setPins(prev => [newPin, ...prev]);
    };

    setModalContent(<CreatePinModal defaultBoardId={board.id} onPinCreated={handlePinCreated} />);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: board.name,
        text: board.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePinLike = async (pinId) => {
    try {
      await pinsApi.likePin(pinId);
      // Update pin in local state if needed
      setPins(prev => prev.map(pin => 
        pin.id === pinId 
          ? { ...pin, liked: !pin.liked, likes_count: pin.liked ? (pin.likes_count || 1) - 1 : (pin.likes_count || 0) + 1 }
          : pin
      ));
    } catch (error) {
      console.error('Failed to like pin:', error);
    }
  };

  const handlePinSave = async (pinId, boardId) => {
    try {
      await pinsApi.savePin(pinId, boardId);
    } catch (error) {
      console.error('Failed to save pin:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading board...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Board not found</h2>
          <p>{error || 'The board you are looking for does not exist.'}</p>
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
        className={styles.boardContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <BsArrowLeft /> Back
        </button>

        <div className={styles.boardHeader}>
          {board.cover_image ? (
            <img 
              src={board.cover_image} 
              alt={board.name}
              className={styles.boardCover}
            />
          ) : (
            <div className={styles.emptyCover}>
              📌
            </div>
          )}

          <h1 className={styles.boardTitle}>{board.name}</h1>
          
          {board.description && (
            <p className={styles.boardDescription}>{board.description}</p>
          )}

          <div className={styles.boardMeta}>
            <div className={styles.boardStat}>
              <span className={styles.statNumber}>{pins.length}</span>
              <span className={styles.statLabel}>Pins</span>
            </div>
            
            {board.followers_count !== undefined && (
              <div className={styles.boardStat}>
                <span className={styles.statNumber}>{board.followers_count}</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
            )}

            {board.is_private && (
              <div className={styles.privacyBadge}>
                <BsLock />
                Secret
              </div>
            )}
          </div>

          {board.user && (
            <div className={styles.ownerSection}>
              <UserAvatar 
                user={board.user} 
                size={40} 
                className={styles.ownerAvatar}
                onClick={() => navigate(`/user/${board.user.id}`)}
              />
              <span 
                className={styles.ownerName}
                onClick={() => navigate(`/user/${board.user.id}`)}
              >
                {board.user.username || board.user.name}
              </span>
            </div>
          )}

          <div className={styles.boardActions}>
            {currentUser && !isOwner && (
              <button 
                className={`${styles.actionButton} ${styles.followButton} ${isFollowing ? styles.following : ''}`}
                onClick={handleFollow}
                disabled={actionLoading.follow}
              >
                <BsHeart />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            {isOwner && (
              <>
                <button 
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={handleEdit}
                >
                  <BsPencil />
                  Edit
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={handleAddPin}
                >
                  <BsPlus />
                  Add Pin
                </button>
              </>
            )}

            <button 
              className={`${styles.actionButton} ${styles.shareButton}`}
              onClick={handleShare}
            >
              <BsShare />
              Share
            </button>

            <button className={`${styles.actionButton} ${styles.moreButton}`}>
              <BsThreeDots />
            </button>
          </div>
        </div>

        <div className={styles.boardContent}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {pins.length} Pin{pins.length !== 1 ? 's' : ''}
            </h2>
            <div className={styles.sortControls}>
              <button 
                className={`${styles.sortButton} ${sortBy === 'recent' ? styles.active : ''}`}
                onClick={() => handleSortChange('recent')}
              >
                Recent
              </button>
              <button 
                className={`${styles.sortButton} ${sortBy === 'oldest' ? styles.active : ''}`}
                onClick={() => handleSortChange('oldest')}
              >
                Oldest
              </button>
              <button 
                className={`${styles.sortButton} ${sortBy === 'alphabetical' ? styles.active : ''}`}
                onClick={() => handleSortChange('alphabetical')}
              >
                A-Z
              </button>
            </div>
          </div>

          {pins.length > 0 ? (
            <div className={styles.pinsGrid}>
              <PinGrid 
                pins={pins} 
                onLike={handlePinLike}
                onSave={handlePinSave}
              />
              
              {hasMore && (
                <div ref={loadMoreRef} className={styles.loadMoreContainer}>
                  {loadingPins && (
                    <div className={styles.spinner}></div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3>No pins yet</h3>
              <p>
                {isOwner 
                  ? "Start building your board by adding pins you love"
                  : "This board doesn't have any pins yet"
                }
              </p>
              {isOwner && (
                <button className={styles.addPinButton} onClick={handleAddPin}>
                  <BsPlus /> Add your first pin
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BoardDetail;