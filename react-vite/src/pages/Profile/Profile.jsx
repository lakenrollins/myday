import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BsGear, BsShare, BsThreeDots } from 'react-icons/bs';
import { PinGrid } from '../../components/Pin';
import { Button, UserAvatar } from '../../components/UI';
import { usersApi, pinsApi } from '../../utils/api';
import styles from './Profile.module.css';

export const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.session.user);
  
  const [profileUser, setProfileUser] = useState(null);
  const [userPins, setUserPins] = useState([]);
  const [userBoards, setUserBoards] = useState([]);
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const isOwnProfile = currentUser && (!userId || parseInt(userId) === currentUser.id);
  const displayUserId = userId || currentUser?.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!displayUserId) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        const userResponse = await usersApi.getUser(displayUserId);
        setProfileUser(userResponse);

        // Fetch user's pins
        const pinsResponse = await pinsApi.getUserPins(displayUserId);
        setUserPins(pinsResponse.pins || pinsResponse);

        // Fetch user's boards
        const boardsResponse = await usersApi.getUserBoards(displayUserId);
        setUserBoards(boardsResponse);

        // Check if current user is following this profile
        if (currentUser && !isOwnProfile) {
          // TODO: Implement following check
          setFollowing(false);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [displayUserId, currentUser, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!currentUser || isOwnProfile) return;

    try {
      await usersApi.followUser(displayUserId);
      setFollowing(!following);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileUser?.username || 'User'}'s Pinterest Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.errorContainer}>
          <h2>User not found</h2>
          <p>The profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          <UserAvatar 
            user={profileUser} 
            size={120} 
            className={styles.avatar}
          />
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.username}>{profileUser.username}</h1>
          <p className={styles.fullName}>
            {profileUser.first_name && profileUser.last_name 
              ? `${profileUser.first_name} ${profileUser.last_name}`
              : profileUser.username
            }
          </p>
          
          {profileUser.bio && (
            <p className={styles.bio}>{profileUser.bio}</p>
          )}

          {profileUser.location && (
            <p className={styles.location}>{profileUser.location}</p>
          )}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{userPins.length}</span>
              <span className={styles.statLabel}>Pins</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{userBoards.length}</span>
              <span className={styles.statLabel}>Boards</span>
            </div>
            {/* TODO: Add followers/following stats */}
          </div>

          <div className={styles.actions}>
            {isOwnProfile ? (
              <Button variant="secondary" className={styles.actionButton}>
                <BsGear /> Edit profile
              </Button>
            ) : (
              <Button 
                variant={following ? "secondary" : "primary"}
                onClick={handleFollowToggle}
                className={styles.actionButton}
              >
                {following ? 'Unfollow' : 'Follow'}
              </Button>
            )}
            
            <button 
              className={styles.iconButton}
              onClick={handleShare}
              title="Share profile"
            >
              <BsShare />
            </button>
            
            <button className={styles.iconButton} title="More options">
              <BsThreeDots />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.profileContent}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'created' ? styles.active : ''}`}
            onClick={() => setActiveTab('created')}
          >
            Created
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'created' && (
            <div className={styles.pinsContainer}>
              {userPins.length > 0 ? (
                <PinGrid pins={userPins} />
              ) : (
                <div className={styles.emptyState}>
                  <h3>No pins yet</h3>
                  <p>
                    {isOwnProfile 
                      ? "Start creating pins to build your collection!" 
                      : `${profileUser.username} hasn't created any pins yet.`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className={styles.boardsContainer}>
              {userBoards.length > 0 ? (
                <div className={styles.boardsGrid}>
                  {userBoards.map(board => (
                    <div 
                      key={board.id} 
                      className={styles.boardCard}
                      onClick={() => navigate(`/board/${board.id}`)}
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
                        <p className={styles.boardDescription}>{board.description}</p>
                        <p className={styles.boardCount}>
                          {board.pins?.length || 0} pins
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3>No boards yet</h3>
                  <p>
                    {isOwnProfile 
                      ? "Create boards to organize your pins!" 
                      : `${profileUser.username} hasn't created any boards yet.`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;