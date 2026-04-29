import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';

/**
 * Component that handles affiliate tracking on page load.
 * Should be included once at the app root level.
 */
export function AffiliateTracker() {
  // This hook automatically tracks affiliate clicks from URL params
  useAffiliateTracking();
  
  // This component doesn't render anything visible
  return null;
}
