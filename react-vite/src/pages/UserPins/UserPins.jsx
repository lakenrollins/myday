import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useModal } from '../../context/Modal';
import { pinsApi } from '../../utils/api';
import { PinCard } from '../../components/Pin/PinCard';
import { CreatePinModal } from '../../components/CreatePin/CreatePinModal';
import { EditPinModal } from '../../components/EditPin/EditPinModal';
import styles from './UserPins.module.css';

const UserPins = () => {
  const currentUser = useSelector(state => state.session.user);
  const { setModalContent } = useModal();
  
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUserPins = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await pinsApi.getUserPins(currentUser.id, { 
        page: pageNum, 
        per_page: 20 
      });
      
      if (pageNum === 1) {
        setPins(response.pins);
      } else {
        setPins(prev => [...prev, ...response.pins]);
      }
      
      setHasMore(response.has_next);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load your pins');
      console.error('Error fetching user pins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserPins();
    }
  }, [currentUser]);

  const handleCreatePin = () => {
    setModalContent(
      <CreatePinModal onSuccess={() => fetchUserPins(1)} />
    );
  };

  const handleEditPin = (pin) => {
    setModalContent(
      <EditPinModal 
        pin={pin} 
        onSuccess={() => fetchUserPins(1)}
      />
    );
  };

  const handleDeletePin = async (pinId) => {
    if (!window.confirm('Are you sure you want to delete this pin?')) return;
    
    try {
      await pinsApi.deletePin(pinId);
      setPins(prev => prev.filter(pin => pin.id !== pinId));
    } catch (error) {
      console.error('Error deleting pin:', error);
      alert('Failed to delete pin. Please try again.');
    }
  };

  const loadMorePins = () => {
    if (!loading && hasMore) {
      fetchUserPins(page + 1);
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.notLoggedIn}>
          <h2>Please log in to manage your pins</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Your Pins</h1>
          <p>{pins.length} pins</p>
        </div>
        <button 
          onClick={handleCreatePin}
          className={styles.createButton}
        >
          + Create Pin
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {loading && pins.length === 0 ? (
        <div className={styles.loading}>
          Loading your pins...
        </div>
      ) : pins.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIcon}>📌</div>
            <h3>You haven&apos;t created any pins yet</h3>
            <p>Create your first pin to get started!</p>
            <button 
              onClick={handleCreatePin}
              className={styles.createFirstButton}
            >
              Create Your First Pin
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.pinsGrid}>
            {pins.map(pin => (
              <div key={pin.id} className={styles.pinWrapper}>
                <PinCard 
                  pin={pin} 
                  showManageOptions={true}
                  onEdit={() => handleEditPin(pin)}
                  onDelete={() => handleDeletePin(pin.id)}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMore}>
              <button 
                onClick={loadMorePins}
                disabled={loading}
                className={styles.loadMoreButton}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserPins;