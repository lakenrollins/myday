import Masonry from 'react-masonry-css';
import { InfiniteScroll } from '../InfiniteScroll';
import PinCard from './PinCard';
import styles from './PinGrid.module.css';

const breakpointColumnsObj = {
  default: 5,
  1200: 4,
  900: 3,
  600: 2,
  400: 1
};

export const PinGrid = ({ 
  pins = [], 
  loading = false, 
  hasMore = true, 
  onLoadMore,
  onSavePin,
  onLikePin,
  error = null 
}) => {
  if (!pins.length && !loading) {
    return (
      <div className={styles.gridContainer}>
        <div className={styles.emptyState}>
          <h3>No pins found</h3>
          <p>Try adjusting your search or explore different topics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className={styles.masonryGrid}
        columnClassName={styles.masonryColumn}
      >
        {pins.map((pin) => (
          <PinCard
            key={pin.id}
            pin={pin}
            onSave={onSavePin}
            onLike={onLikePin}
          />
        ))}
      </Masonry>
      
      {hasMore && !loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button onClick={onLoadMore} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Load More
          </button>
        </div>
      )}
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading more pins...
        </div>
      )}
    </div>
  );
};

export default PinGrid;