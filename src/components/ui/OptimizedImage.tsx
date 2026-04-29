import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  placeholderEmoji?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
  sizes,
  placeholderEmoji
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute inset-0">
      {/* Blur placeholder with flag emoji */}
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm
          ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        aria-hidden="true"
      >
        {placeholderEmoji && (
          <span className="text-4xl drop-shadow-md">{placeholderEmoji}</span>
        )}
      </div>
      
      {/* Actual image */}
      <img 
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
