import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useModal } from '../../context/Modal';
import { boardsApi, pinsApi } from '../../utils/api';
import { CreateBoardModal } from '../CreateBoard';
import OpenModalButton from '../OpenModalButton';
import styles from './SavePinModal.module.css';

export const SavePinModal = ({ pin, onSaved }) => {
  const { closeModal } = useModal();
  const user = useSelector(state => state.session.user);
  
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const fetchBoards = async () => {
      if (!user) return;
      
      try {
        const userBoards = await boardsApi.getUserBoards();
        setBoards(userBoards.boards || userBoards || []);
      } catch (error) {
        console.error('Failed to fetch boards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [user]);

  const handleSaveToBoard = async (boardId) => {
    if (saving === boardId) return;
    
    setSaving(boardId);
    try {
      await pinsApi.savePin(pin.id, boardId);
      
      if (onSaved) {
        onSaved(boardId);
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to save pin to board:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleBoardCreated = (newBoard) => {
    setBoards(prev => [newBoard, ...prev]);
    // Auto-save to the newly created board
    handleSaveToBoard(newBoard.id);
  };

  if (!user) {
    return (
      <div className={styles.modal}>
        <div className={styles.content}>
          <h2>Please log in to save pins</h2>
          <button onClick={closeModal} className={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>Save Pin</h2>
          <button onClick={closeModal} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.pinPreview}>
          <img 
            src={pin.image_url} 
            alt={pin.title}
            className={styles.pinImage}
          />
          <div className={styles.pinInfo}>
            <h3 className={styles.pinTitle}>{pin.title}</h3>
            {pin.description && (
              <p className={styles.pinDescription}>{pin.description}</p>
            )}
          </div>
        </div>

        <div className={styles.boardsSection}>
          <div className={styles.sectionHeader}>
            <h3>Choose board</h3>
            <OpenModalButton
              buttonText="Create board"
              modalComponent={<CreateBoardModal onBoardCreated={handleBoardCreated} />}
              className={styles.createBoardButton}
            />
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading your boards...</p>
            </div>
          ) : Array.isArray(boards) && boards.length > 0 ? (
            <div className={styles.boardsList}>
              {Array.isArray(boards) && boards.map(board => (
                <button
                  key={board.id}
                  className={styles.boardOption}
                  onClick={() => handleSaveToBoard(board.id)}
                  disabled={saving === board.id}
                >
                  <div className={styles.boardPreview}>
                    {board.pins && board.pins.length > 0 ? (
                      <img 
                        src={board.pins[0].image_url} 
                        alt={board.name}
                        className={styles.boardImage}
                      />
                    ) : (
                      <div className={styles.emptyBoard}>
                        <span>📌</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.boardInfo}>
                    <h4 className={styles.boardName}>{board.name}</h4>
                    <p className={styles.boardCount}>
                      {board.pins?.length || 0} pins
                    </p>
                    {board.is_private && (
                      <span className={styles.privateLabel}>🔒 Secret</span>
                    )}
                  </div>
                  {saving === board.id && (
                    <div className={styles.savingSpinner}></div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>You don't have any boards yet.</p>
              <OpenModalButton
                buttonText="Create your first board"
                modalComponent={<CreateBoardModal onBoardCreated={handleBoardCreated} />}
                className={styles.createFirstBoardButton}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavePinModal;