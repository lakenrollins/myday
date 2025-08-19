import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearch } from '../../context/SearchContext';
import { PinGrid } from '../../components/Pin';
import { Button } from '../../components/UI';
import { fetchPins, searchPins, likePin, savePin } from '../../redux/pins';
import styles from './Home.module.css';

const categories = [
  'All', 'Architecture', 'Art', 'Food', 'Travel', 'Fashion', 
  'Interior', 'Photography', 'Nature', 'Technology'
];

export const Home = () => {
  const dispatch = useDispatch();
  const { items: pins, loading, hasMore, error, currentPage } = useSelector(state => state.pins);
  const user = useSelector(state => state.session.user);
  const { registerSearchCallback, unregisterSearchCallback, currentSearch } = useSearch();
  
  // Debug logging (commented out to reduce console noise)
  // console.log('Home component state:', { pins, loading, hasMore, error, pinsLength: pins.length, currentPage });
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const hasInitialLoad = useRef(false);

  // Load initial pins only once
  useEffect(() => {
    if (!hasInitialLoad.current && pins.length === 0 && !loading && !error) {
      hasInitialLoad.current = true;
      dispatch(fetchPins({ page: 1, per_page: 20 }))
        .catch(() => {
          // Reset the flag on error so user can retry
          hasInitialLoad.current = false;
        });
    }
  }, [dispatch, pins.length, loading, error]);

  // Register search callback
  const handleSearchFromHeader = useCallback((query) => {
    setSearchQuery(query);
    setActiveFilter('All');
    
    if (query.trim()) {
      dispatch(searchPins(query, { page: 1, per_page: 20 }));
    } else {
      dispatch(fetchPins({ page: 1, per_page: 20 }));
    }
  }, [dispatch]);

  useEffect(() => {
    registerSearchCallback(handleSearchFromHeader);
    return () => {
      unregisterSearchCallback(handleSearchFromHeader);
    };
  }, [registerSearchCallback, unregisterSearchCallback, handleSearchFromHeader]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return; // Prevent multiple simultaneous requests
    
    const nextPage = currentPage + 1;
    console.log('Loading more pins, page:', nextPage);
    
    try {
      await dispatch(fetchPins({ page: nextPage, per_page: 20, category: activeFilter !== 'All' ? activeFilter : undefined }));
    } catch (error) {
      console.error('Failed to load more pins:', error);
    }
  }, [dispatch, currentPage, activeFilter, loading, hasMore]);


  const handleFilterChange = async (filter) => {
    setActiveFilter(filter);
    
    const params = { page: 1, per_page: 20 };
    if (filter !== 'All') {
      params.category = filter;
    }
    
    try {
      if (searchQuery) {
        await dispatch(searchPins(searchQuery, params));
      } else {
        await dispatch(fetchPins(params));
      }
    } catch (error) {
      console.error('Filter change failed:', error);
    }
  };

  const handleSavePin = useCallback(async (pinId) => {
    if (!user) {
      // Redirect to login or show login modal
      console.log('Please log in to save pins');
      return;
    }
    
    try {
      // For now, we'll save to the first available board
      // In a real app, you'd show a board selection modal
      await dispatch(savePin(pinId, 1));
    } catch (error) {
      console.error('Failed to save pin:', error);
    }
  }, [dispatch, user]);

  const handleLikePin = useCallback(async (pinId) => {
    if (!user) {
      // Redirect to login or show login modal  
      console.log('Please log in to like pins');
      return;
    }
    
    try {
      await dispatch(likePin(pinId));
    } catch (error) {
      console.error('Failed to like pin:', error);
    }
  }, [dispatch, user]);

  return (
    <div className={styles.homePage}>
      {!user && pins.length > 0 && (
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Get your next idea
          </h1>
          <p className={styles.heroSubtitle}>
            Discover recipes, home ideas, style inspiration and other ideas to try.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" size="large">
              Sign up
            </Button>
            <Button variant="secondary" size="large">
              Learn more
            </Button>
          </div>
        </section>
      )}

      <section className={styles.quickFilters}>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.filterButton} ${
              activeFilter === category ? styles.active : ''
            }`}
            onClick={() => handleFilterChange(category)}
          >
            {category}
          </button>
        ))}
      </section>

      <section className={styles.pinsSection}>
        {error && (
          <div className={styles.error}>
            <p>Error loading pins: {error}</p>
            <button onClick={() => dispatch(fetchPins({ page: 1, per_page: 20 }))}>
              Try again
            </button>
          </div>
        )}
        
        {loading && pins.length === 0 && (
          <div className={styles.loading}>
            <p>Loading pins...</p>
          </div>
        )}
        
        {!loading && !error && pins.length === 0 && (
          <div className={styles.emptyState}>
            <p>No pins found. Try adjusting your search or filters.</p>
          </div>
        )}
        
        {pins.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>
              {(searchQuery || currentSearch) ? `Results for "${searchQuery || currentSearch}"` : 'Discover ideas'}
            </h2>
            <PinGrid
              pins={pins}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onSavePin={handleSavePin}
              onLikePin={handleLikePin}
            />
          </>
        )}
      </section>
    </div>
  );
};

export default Home;