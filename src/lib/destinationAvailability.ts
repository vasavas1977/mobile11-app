import { supabase } from '@/integrations/supabase/client';

// Cache configuration
const CACHE_KEY = 'available_destinations';
const CACHE_TIME_KEY = 'available_destinations_time';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Normalize country names to handle variations in database
 */
export const normalizeCountryName = (name: string): string => {
  const mappings: Record<string, string> = {
    'Hongkong': 'Hong Kong',
    'USA': 'United States',
    'UK': 'United Kingdom',
    'UAE': 'United Arab Emirates',
    'Turkey(Türkiye)': 'Turkey',
    'Europe 42 Countries': 'Europe',
    'Asia 13 Countries': 'Asia',
    'South East Asia 8 Countries': 'Southeast Asia',
    'Southeast Asia 8 Countries': 'Southeast Asia'
  };
  
  return mappings[name] || name;
};

/**
 * Fetch available destinations from database
 */
export const getAvailableDestinations = async (): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('esim_packages')
    .select('country_name, country_code')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching available destinations:', error);
    return new Set();
  }

  // Create set of normalized country names
  const destinations = new Set(
    data.map(pkg => normalizeCountryName(pkg.country_name))
  );

  return destinations;
};

/**
 * Get cached available destinations or fetch fresh data
 */
export const getCachedAvailableDestinations = async (): Promise<Set<string>> => {
  // Check session storage cache first
  const cached = sessionStorage.getItem(CACHE_KEY);
  const cacheTime = sessionStorage.getItem(CACHE_TIME_KEY);

  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < CACHE_DURATION) {
      return new Set(JSON.parse(cached));
    }
  }

  // Fetch fresh data
  const destinations = await getAvailableDestinations();
  
  // Cache the result
  sessionStorage.setItem(CACHE_KEY, JSON.stringify([...destinations]));
  sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

  return destinations;
};

/**
 * Clear the destinations cache (useful when packages are updated)
 */
export const clearDestinationsCache = (): void => {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_TIME_KEY);
};
