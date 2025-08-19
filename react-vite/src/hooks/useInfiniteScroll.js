import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = ({
  fetchMore,
  hasNextPage = true,
  threshold = 0.8,
  rootMargin = '100px',
  enabled = true
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef();
  const sentinelRef = useRef();

  const loadMore = useCallback(async () => {
    if (isFetching || !hasNextPage || !enabled) return;

    setIsFetching(true);
    setError(null);

    try {
      await fetchMore();
    } catch (err) {
      setError(err);
      console.error('Error fetching more data:', err);
    } finally {
      setIsFetching(false);
    }
  }, [fetchMore, hasNextPage, isFetching, enabled]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !isFetching) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );

    observer.observe(sentinel);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetching, loadMore, threshold, rootMargin, enabled]);

  // Alternative scroll-based approach for better compatibility
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      if (isFetching || !hasNextPage) return;

      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;

      const scrolledPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrolledPercentage >= threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching, hasNextPage, loadMore, threshold, enabled]);

  return {
    isFetching,
    error,
    sentinelRef
  };
};

export default useInfiniteScroll;