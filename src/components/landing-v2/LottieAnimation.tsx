import React, { useState, useRef, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieAnimationProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  devicePixelRatio?: number;
  speed?: number;
  useFrameInterpolation?: boolean;
  /** Lazy load: only render when element is near viewport */
  lazy?: boolean;
  /** Root margin for intersection observer (e.g., "200px" to load 200px before visible) */
  lazyRootMargin?: string;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  className = '',
  loop = true,
  autoplay = true,
  devicePixelRatio = 2,
  speed = 1,
  useFrameInterpolation = true,
  lazy = false,
  lazyRootMargin = '300px',
}) => {
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, shouldLoad, lazyRootMargin]);

  // Placeholder when lazy loading and not yet loaded
  if (lazy && !shouldLoad) {
    return <div ref={containerRef} className={className} />;
  }

  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      useFrameInterpolation={useFrameInterpolation}
      className={className}
      renderConfig={{ devicePixelRatio }}
    />
  );
};

export default LottieAnimation;
