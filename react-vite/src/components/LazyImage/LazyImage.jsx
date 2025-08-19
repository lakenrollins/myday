import { useState, useRef, useEffect } from 'react';
import styles from './LazyImage.module.css';

const LazyImage = ({
  src,
  alt = '',
  placeholder = null,
  fallback = null,
  className = '',
  style = {},
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef();
  const observerRef = useRef();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(img);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(img);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (!isInView || !src) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.(img);
    };

    img.onerror = (error) => {
      setHasError(true);
      setIsLoading(false);
      onError?.(error);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, onLoad, onError]);

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div className={styles.defaultPlaceholder}>
        <div className={styles.placeholderShimmer} />
      </div>
    );
  };

  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }

    return (
      <div className={styles.defaultFallback}>
        <div className={styles.fallbackIcon}>📷</div>
        <span className={styles.fallbackText}>Image unavailable</span>
      </div>
    );
  };

  const combinedClassName = [
    styles.lazyImage,
    className,
    isLoaded && styles.loaded,
    isLoading && styles.loading,
    hasError && styles.error
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={imgRef}
      className={combinedClassName}
      style={style}
      {...props}
    >
      {/* Placeholder while loading */}
      {!isLoaded && !hasError && renderPlaceholder()}

      {/* Error fallback */}
      {hasError && renderFallback()}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={styles.image}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          loading="lazy"
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.spinner} />
        </div>
      )}
    </div>
  );
};

export default LazyImage;