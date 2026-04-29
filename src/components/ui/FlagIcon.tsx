import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { getCountryCodeFromName, isRegionalPackage, getRegionalCode } from '@/lib/countryCodeMapper';

// Map destination IDs to ISO country codes
const COUNTRY_CODE_MAP: Record<string, string> = {
  'thailand': 'th',
  'japan': 'jp',
  'china': 'cn',
  'korea': 'kr',
  'vietnam': 'vn',
  'taiwan': 'tw',
  'singapore': 'sg',
  'malaysia': 'my',
  'usa': 'us',
  'australia': 'au',
  'europe': 'eu',
  'hongkong-macau': 'hk',
};

// Destination IDs that should show a purple globe icon (multi-country regional)
const REGIONAL_GLOBE_IDS = new Set([
  'singapore-malaysia-thailand',
  'australia-new-zealand',
]);

const sizeClasses = {
  sm: 'w-5 h-4',      // ~20x16px
  md: 'w-7 h-5',      // ~28x20px
  lg: 'w-9 h-7',      // ~36x28px
};

const globeSizes = {
  sm: 16,
  md: 22,
  lg: 28,
};

interface FlagIconProps {
  countryCode?: string;
  countryName?: string;
  destinationId?: string;
  regionalId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FlagIcon({ 
  countryCode, 
  countryName,
  destinationId,
  regionalId,
  size = 'md', 
  className 
}: FlagIconProps) {
  // Determine the code to use (treat empty strings as missing)
  let code = countryCode?.trim() ? countryCode.toLowerCase() : undefined;
  
  // If destinationId provided, use that mapping
  if (destinationId) {
    code = COUNTRY_CODE_MAP[destinationId];
  }
  
  // If destinationId is a regional globe entry, show purple globe
  if (destinationId && REGIONAL_GLOBE_IDS.has(destinationId)) {
    return (
      <Globe 
        size={globeSizes[size]} 
        className={cn('text-primary', className)} 
      />
    );
  }
  
  // If no code yet, try to derive from countryName or regionalId
  const nameToCheck = countryName || regionalId;
  if (!code && nameToCheck) {
    // Check if it's a regional package first
    if (isRegionalPackage(nameToCheck)) {
      const regionalCode = getRegionalCode(nameToCheck);
      // Global/Asia/SEA/World - show globe icon
      if (regionalCode === 'global' || regionalCode === 'asia' || regionalCode === 'sea' || regionalCode === 'world') {
        return (
          <Globe 
            size={globeSizes[size]} 
            className={cn('text-primary', className)} 
          />
        );
      }
      code = regionalCode || undefined;
    } else {
      // Try to get country code from name
      code = getCountryCodeFromName(nameToCheck) || undefined;
    }
  }
  
  // Render square flag using flag-icons library
  if (code) {
    return (
      <span 
        className={cn(
          'fi',                          // flag-icons base
          `fi-${code}`,                  // country code (e.g., fi-th)
          sizeClasses[size],
          'inline-block rounded-sm shadow-sm',
          className
        )}
        style={{ backgroundSize: 'cover' }}
      />
    );
  }
  
  // Fallback - show globe for unknown
  return (
    <Globe 
      size={globeSizes[size]} 
      className={cn('text-muted-foreground', className)} 
    />
  );
}
