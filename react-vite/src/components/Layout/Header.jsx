import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { BsSearch, BsPlus } from 'react-icons/bs';
import { thunkLogout } from '../../redux/session';
import OpenModalButton from '../OpenModalButton';
import LoginFormModal from '../LoginFormModal';
import SignupFormModal from '../SignupFormModal';
import { CreatePinModal } from '../CreatePin';
import { UserAvatar } from '../UI';
import styles from './Header.module.css';

export const Header = ({ user, onSearch }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    dispatch(thunkLogout());
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>P</div>
            Pinterest
          </Link>
          
          <nav className={styles.nav}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${isActiveLink('/') ? styles.active : ''}`}
            >
              Home
            </Link>
            {user && (
              <>
                <Link 
                  to="/boards" 
                  className={`${styles.navLink} ${isActiveLink('/boards') ? styles.active : ''}`}
                >
                  Boards
                </Link>
                <Link 
                  to="/liked" 
                  className={`${styles.navLink} ${isActiveLink('/liked') ? styles.active : ''}`}
                >
                  Liked
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className={styles.centerSection}>
          <form onSubmit={handleSearchSubmit} className={styles.searchContainer}>
            <BsSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search for ideas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </form>
        </div>

        <div className={styles.rightSection}>
          {user ? (
            <>
              <OpenModalButton
                buttonText={<BsPlus size={20} />}
                modalComponent={<CreatePinModal />}
                className={`${styles.iconButton} ${styles.createButton}`}
                title="Create Pin"
              />

              <div className={styles.profileDropdown} ref={dropdownRef}>
                <button 
                  onClick={toggleDropdown}
                  className={styles.profileButton}
                >
                  <UserAvatar 
                    user={user} 
                    size={48} 
                    className={styles.profileImage}
                  />
                </button>
                
                {showDropdown && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <UserAvatar 
                        user={user} 
                        size={48} 
                        className={styles.dropdownAvatar}
                      />
                      <div>
                        <div className={styles.dropdownName}>{user.username}</div>
                        <div className={styles.dropdownEmail}>{user.email}</div>
                      </div>
                    </div>
                    <hr className={styles.dropdownDivider} />
                    <Link to="/profile" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      Your profile
                    </Link>
                    <Link to="/my-pins" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      My pins
                    </Link>
                    <Link to="/boards" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      Your boards
                    </Link>
                    <Link to="/liked" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      Liked pins
                    </Link>
                    <hr className={styles.dropdownDivider} />
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.authButtons}>
              <OpenModalButton
                buttonText="Log in"
                modalComponent={<LoginFormModal />}
                className={styles.authButton}
              />
              <OpenModalButton
                buttonText="Sign up"
                modalComponent={<SignupFormModal />}
                className={`${styles.authButton} ${styles.signupButton}`}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;