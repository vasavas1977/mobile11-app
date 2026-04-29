import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LOCATION_CACHE_KEY = 'userCountry';
const LOCATION_CACHE_TIME_KEY = 'userCountryTime';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Custom hook to detect and cache user's country location
 * Uses IP geolocation edge function with 24-hour cache
 */
export const useUserLocation = () => {
  const [userCountry, setUserCountry] = useState<string>('DEFAULT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Check localStorage cache first
        const cached = localStorage.getItem(LOCATION_CACHE_KEY);
        const cachedTime = localStorage.getItem(LOCATION_CACHE_TIME_KEY);

        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age < LOCATION_CACHE_DURATION) {
            setUserCountry(cached);
            setLoading(false);
            return;
          }
        }

        // Fetch from edge function
        const { data, error: functionError } = await supabase.functions.invoke('get-user-location');

        if (functionError) {
          console.error('Error fetching user location:', functionError);
          setError(functionError.message);
          setUserCountry('DEFAULT');
        } else if (data?.countryCode) {
          const countryCode = data.countryCode;
          setUserCountry(countryCode);
          
          // Cache the result
          localStorage.setItem(LOCATION_CACHE_KEY, countryCode);
          localStorage.setItem(LOCATION_CACHE_TIME_KEY, Date.now().toString());
        } else {
          setUserCountry('DEFAULT');
        }
      } catch (err) {
        console.error('Error in location detection:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserCountry('DEFAULT');
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  return { userCountry, loading, error };
};
