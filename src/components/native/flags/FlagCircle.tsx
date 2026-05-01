import { useState } from 'react';
import { Globe } from 'lucide-react';

type FlagSize = 'sm' | 'md' | 'lg';

interface FlagCircleProps {
  iso?: string;
  size?: FlagSize;
  className?: string;
}

const SIZES: Record<FlagSize, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

const GLOBE_SIZES: Record<FlagSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

export function FlagCircle({ iso, size = 'md', className = '' }: FlagCircleProps) {
  const [hasError, setHasError] = useState(false);
  const dimension = SIZES[size];
  const globeSize = GLOBE_SIZES[size];

  const normalizedIso = iso?.toLowerCase().trim();

  if (!normalizedIso || hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gray-100 ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        <Globe size={globeSize} className="text-gray-400" />
      </div>
    );
  }

  // Use HatScripts circle-flags CDN
  const flagUrl = `https://hatscripts.github.io/circle-flags/flags/${normalizedIso}.svg`;

  return (
    <img
      src={flagUrl}
      alt={`${normalizedIso} flag`}
      width={dimension}
      height={dimension}
      className={`inline-block rounded-full object-cover ${className}`}
      style={{ width: dimension, height: dimension, transform: 'scaleX(1)' }}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
