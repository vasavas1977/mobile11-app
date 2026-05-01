import { useState } from 'react';
import { Globe } from 'lucide-react';

type FlagSize = 'sm' | 'md' | 'lg' | 'xl';

interface FlagRectProps {
  iso?: string;
  size?: FlagSize;
  className?: string;
}

const SIZES: Record<FlagSize, { width: number; height: number }> = {
  sm: { width: 20, height: 15 },
  md: { width: 28, height: 21 },
  lg: { width: 36, height: 27 },
  xl: { width: 56, height: 42 },
};

const GLOBE_SIZES: Record<FlagSize, number> = {
  sm: 16,
  md: 22,
  lg: 28,
  xl: 40,
};

// Regional / multi-country codes that have no single flag
const REGIONAL_CODES = new Set([
  'global', 'asia', 'europe', 'americas', 'africa', 'oceania', 'middle-east',
]);

export function FlagRect({ iso, size = 'md', className = '' }: FlagRectProps) {
  const [hasError, setHasError] = useState(false);
  const dimensions = SIZES[size];
  const globeSize = GLOBE_SIZES[size];

  const normalizedIso = iso?.toLowerCase().trim();

  // Show globe for missing, regional, or errored flags
  if (!normalizedIso || REGIONAL_CODES.has(normalizedIso) || hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-sm bg-gray-100 ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <Globe size={globeSize * 0.7} className="text-gray-400" />
      </div>
    );
  }

  // Use flag-icons CDN for 4x3 rectangular flags
  const flagUrl = `https://flagcdn.com/w80/${normalizedIso}.png`;

  return (
    <img
      src={flagUrl}
      alt={`${normalizedIso} flag`}
      width={dimensions.width}
      height={dimensions.height}
      className={`inline-block rounded-sm object-cover shadow-sm ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
