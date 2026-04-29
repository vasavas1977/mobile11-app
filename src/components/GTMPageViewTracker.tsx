import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/gtmUtils';

export const GTMPageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track virtual page view on every route change
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
};
