import { forwardRef } from 'react';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import styles from './InfiniteScroll.module.css';

const InfiniteScroll = forwardRef(({
  children,
  fetchMore,
  hasNextPage = true,
  loading = false,
  error = null,
  threshold = 0.8,
  rootMargin = '100px',
  enabled = true,
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  endComponent: EndComponent = DefaultEndComponent,
  className = '',
  ...props
}, ref) => {
  const { isFetching, sentinelRef } = useInfiniteScroll({
    fetchMore,
    hasNextPage,
    threshold,
    rootMargin,
    enabled: enabled && !loading
  });

  const isLoading = loading || isFetching;

  return (
    <div ref={ref} className={`${styles.container} ${className}`} {...props}>
      {children}
      
      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className={styles.sentinel} />
      
      {/* Loading state */}
      {isLoading && hasNextPage && (
        <div className={styles.loadingContainer}>
          <LoadingComponent />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className={styles.errorContainer}>
          <ErrorComponent error={error} onRetry={fetchMore} />
        </div>
      )}
      
      {/* End of content */}
      {!hasNextPage && !isLoading && (
        <div className={styles.endContainer}>
          <EndComponent />
        </div>
      )}
    </div>
  );
});

InfiniteScroll.displayName = 'InfiniteScroll';

const DefaultLoadingComponent = () => (
  <div className={styles.defaultLoading}>
    <div className={styles.spinner} />
    <span>Loading more pins...</span>
  </div>
);

const DefaultErrorComponent = ({ error, onRetry }) => (
  <div className={styles.defaultError}>
    <p>Failed to load more content</p>
    <button onClick={onRetry} className={styles.retryButton}>
      Try again
    </button>
  </div>
);

const DefaultEndComponent = () => (
  <div className={styles.defaultEnd}>
    <p>You've reached the end!</p>
    <span>🎉</span>
  </div>
);

export default InfiniteScroll;