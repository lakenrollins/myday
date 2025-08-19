import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BsPlus, BsGrid, BsLock } from 'react-icons/bs';
import { useModal } from '../../context/Modal';
import { boardsApi } from '../../utils/api';
import { CreateBoardModal } from '../../components/CreateBoard';
import styles from './Boards.module.css';

export const Boards = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.session.user);
  const { setModalContent } = useModal();
  
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchBoards();
  }, [currentUser, navigate]);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await boardsApi.getUserBoards();
      setBoards(response.boards || response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch boards:', err);
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = () => {
    const handleBoardCreated = (newBoard) => {
      setBoards(prev => [newBoard, ...prev]);
    };

    setModalContent(<CreateBoardModal onBoardCreated={handleBoardCreated} />);
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  if (!currentUser) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your boards...</p>
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
              <BsGrid className={styles.gridIcon} />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Your Boards</h1>
              <p className={styles.pageDescription}>
                Organize your pins into boards to keep your ideas sorted
              </p>
              <div className={styles.stats}>
                <span className={styles.statNumber}>{boards.length}</span>
                <span className={styles.statLabel}>Board{boards.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          <button className={styles.createButton} onClick={handleCreateBoard}>
            <BsPlus />
            Create Board
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button 
              onClick={fetchBoards}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        <div className={styles.content}>
          {boards.length > 0 ? (
            <div className={styles.boardsGrid}>
              {boards.map((board, index) => (
                <motion.div
                  key={board.id}
                  className={styles.boardCard}
                  onClick={() => handleBoardClick(board.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
                >
                  <div className={styles.boardPreview}>
                    {board.cover_image || (board.pins && board.pins.length > 0) ? (
                      <img 
                        src={board.cover_image || board.pins[0].image_url} 
                        alt={board.name}
                        className={styles.boardImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.emptyBoard}>
                        <BsGrid size={40} />
                      </div>
                    )}
                    
                    {board.is_private && (
                      <div className={styles.privateBadge}>
                        <BsLock />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.boardInfo}>
                    <h3 className={styles.boardName}>{board.name}</h3>
                    {board.description && (
                      <p className={styles.boardDescription}>{board.description}</p>
                    )}
                    <div className={styles.boardMeta}>
                      <span className={styles.pinCount}>
                        {board.pins_count || 0} pin{(board.pins_count || 0) !== 1 ? 's' : ''}
                      </span>
                      {board.followers_count > 0 && (
                        <span className={styles.followerCount}>
                          {board.followers_count} follower{board.followers_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Create new board card */}
              <motion.div
                className={`${styles.boardCard} ${styles.createCard}`}
                onClick={handleCreateBoard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: boards.length * 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
              >
                <div className={styles.createBoardContent}>
                  <div className={styles.createIcon}>
                    <BsPlus size={40} />
                  </div>
                  <h3 className={styles.createTitle}>Create Board</h3>
                  <p className={styles.createDescription}>
                    Start organizing your pins
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <BsGrid size={80} />
              </div>
              <h3 className={styles.emptyTitle}>No boards yet</h3>
              <p className={styles.emptyDescription}>
                Create your first board to start organizing your pins. Boards help you keep track of ideas for projects, trips, recipes, and more.
              </p>
              <button 
                className={styles.createFirstButton}
                onClick={handleCreateBoard}
              >
                <BsPlus />
                Create Your First Board
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Boards;