import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SongkranPromoBanner } from '@/components/landing/SongkranPromoBanner';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { PackageConfigurator } from '@/components/esim/PackageConfigurator';
import { SimpleLimitlessConfigurator } from '@/components/esim/SimpleLimitlessConfigurator';
import { ConfiguratorFAQ } from '@/components/esim/ConfiguratorFAQ';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { SearchAutocomplete } from '@/components/esim/SearchAutocomplete';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Search, Globe, MapPin, Info, ChevronRight, Star } from 'lucide-react';
import { PlanTypesInfoSection } from '@/components/esim/PlanTypesInfoSection';
import { PackageComparisonTable } from '@/components/esim/PackageComparisonTable';
import * as regionalUtils from '@/lib/regionalPackageUtils';
import { normalizeCountryName } from '@/lib/destinationAvailability';
import { countryToSlug, getAllSupportedCountries, regionalToSlug, findCountryBySlug, slugToCountry } from '@/lib/countryDestinations';
import { getCountryFlag } from '@/lib/countryFlags';
import { getPopularDestinationsForUser, Destination } from '@/lib/popularDestinations';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useABTestVariant } from '@/hooks/useABTestVariant';
import { applyOrderingStrategy } from '@/lib/abTestUtils';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

import { SEO, SEO_CONFIG, getCountrySEO, getFAQStructuredData } from '@/components/SEO';
import { parseConfiguratorUrl, debouncedUrlUpdate } from '@/lib/configuratorUrlUtils';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import { SectionDecorations } from '@/components/landing-v2/FloatingDecorations';
import { PackagesHeroCarousel } from '@/components/packages/PackagesHeroCarousel';
import { StoreCategoryTabs } from '@/components/packages/StoreCategoryTabs';
import '@/styles/theme-v2.css';

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  short_name?: string;
  description: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  validity_period?: string;
  price: number;
  currency: string;
  qos_speed?: string;
  is_cancelable?: boolean;
  carrier?: string;
  network_type?: string;
  service_type?: string;
  sim_type?: string;
  support_voice?: boolean;
  support_sms?: boolean;
  support_data?: boolean;
  activation_note?: string;
  included_countries?: any;
  package_type?: string | null;
  speed_after_limit?: string | null;
  daily_data_reset?: boolean | null;
  daily_reset_amount?: string | null;
  category?: string;
  hot_spot?: boolean | null;
}

interface RecentlyViewedItem {
  country: string;
  countryCode: string;
  timestamp: number;
}

// Helper to check if URL params indicate configurator mode
const shouldStartInConfiguratorMode = (searchParams: URLSearchParams): boolean => {
  const countryParam = searchParams.get('country');
  const regionalParam = searchParams.get('regional');
  const globalParam = searchParams.get('global');
  return !!(countryParam || regionalParam || globalParam);
};

// Helper to get initial country from URL
const getInitialCountry = (searchParams: URLSearchParams): string => {
  const countryParam = searchParams.get('country');
  const regionalParam = searchParams.get('regional');
  const globalParam = searchParams.get('global');
  return countryParam || regionalParam || globalParam || 'all';
};

export function PackagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { language, t } = useLanguage();
  const { userCountry } = useUserLocation();
  const { variant } = useABTestVariant();
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const extendingOrderId = searchParams.get('extend');
  const extendingTypeParam = searchParams.get('type') as 'day_pass' | 'max_speed' | 'limitless' | null;
  const extendingDataParam = searchParams.get('data');
  const extendingSpeedParam = searchParams.get('speed');

  // Essential state
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState<string>(() =>
  getInitialCountry(searchParams)
  );
  const [explicitCountryFilter, setExplicitCountryFilter] = useState(() =>
  shouldStartInConfiguratorMode(searchParams)
  );
  const [packageType, setPackageType] = useState<'all' | 'local' | 'regional' | 'global'>('all');
  const [configuratorMode, setConfiguratorMode] = useState(() =>
  shouldStartInConfiguratorMode(searchParams)
  );
  const [configuratorCountry, setConfiguratorCountry] = useState<string | null>(() => {
    const country = getInitialCountry(searchParams);
    return country !== 'all' ? country : null;
  });
  const [extendingOrder, setExtendingOrder] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [simplifiedMode, setSimplifiedMode] = useState(true); // Show simplified Limitless configurator by default
  const [cameFromSimpleConfigurator, setCameFromSimpleConfigurator] = useState(false); // Track navigation for back button

  // Parse configurator state from URL (once on mount)
  const urlState = useMemo(() => parseConfiguratorUrl(searchParams), []);
  const initialCarrier = urlState.carrier;
  const initialType = urlState.type as 'limitless' | 'max_speed' | 'day_pass' | undefined;
  const initialDays = urlState.days;
  const initialOption = urlState.option;
  const initialSpeed = urlState.speed;
  const initialQty = urlState.qty;
  const initialView = urlState.view;

  // Set simplified mode based on URL view param
  useEffect(() => {
    if (initialView === 'full') {
      setSimplifiedMode(false);
    }
  }, [initialView]);

  // Handle state changes from SimpleLimitlessConfigurator
  const handleSimpleConfigStateChange = useCallback((state: {days: number;quantity: number;}) => {
    if (configuratorCountry) {
      debouncedUrlUpdate({
        country: configuratorCountry,
        isRegional: packageType === 'regional',
        type: 'limitless',
        days: state.days,
        qty: state.quantity,
        view: 'simple'
      });
    }
  }, [configuratorCountry, packageType]);

  // Handle state changes from PackageConfigurator
  const handleFullConfigStateChange = useCallback((state: {
    type: string | null;
    days: number | null;
    option: string | null;
    speed: string | null;
    carrier: string | null;
    quantity: number;
  }) => {
    if (configuratorCountry) {
      debouncedUrlUpdate({
        country: configuratorCountry,
        isRegional: packageType === 'regional',
        carrier: state.carrier || undefined,
        type: state.type || undefined,
        days: state.days || undefined,
        option: state.option || undefined,
        speed: state.speed || undefined,
        qty: state.quantity,
        view: 'full'
      });
    }
  }, [configuratorCountry, packageType]);

  // Helper: Get flag emoji from country code
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode.
    toUpperCase().
    split('').
    map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Helper: Normalize regional package names for comparison
  // Handles: spaces, hyphens, number-letter gaps, and casing
  const normalizeRegionalName = useCallback((name: string): string => {
    return name.
    trim().
    replace(/-/g, ' ') // Convert hyphens to spaces (for URL slugs like "hong-kong" → "hong kong")
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/(\d+)([A-Z])/g, '$1 $2') // Add space between number and letter (13Countries → 13 Countries)
    .toLowerCase().
    replace(/hongkong/g, 'hong kong'); // Normalize "hongkong" to "hong kong"
  }, []);

  // Helper: Get zone for country
  const getZone = (countryName: string): string => {
    const country = countryName.toLowerCase();

    if (country.includes('europe') || country.includes('유럽')) return 'Europe';
    if (country.includes('asia') || country.includes('아시아')) return 'Asia';
    if (country.includes('america') && country.includes('countries')) return 'Americas';

    if (['japan', 'korea', 'south korea', 'china', 'taiwan', 'hong kong', 'macau', 'mongolia'].some((c) => country.includes(c))) return 'Asia';
    if (['thailand', 'vietnam', 'singapore', 'malaysia', 'indonesia', 'philippines', 'myanmar', 'cambodia', 'laos', 'brunei'].some((c) => country.includes(c))) return 'Asia';
    if (['india', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'bhutan', 'maldives'].some((c) => country.includes(c))) return 'Asia';

    if (['uk', 'united kingdom', 'france', 'germany', 'netherlands', 'belgium', 'luxembourg', 'switzerland', 'austria'].some((c) => country.includes(c))) return 'Europe';
    if (['spain', 'portugal', 'italy', 'greece', 'malta', 'cyprus'].some((c) => country.includes(c))) return 'Europe';
    if (['sweden', 'norway', 'denmark', 'finland', 'iceland', 'estonia', 'latvia', 'lithuania'].some((c) => country.includes(c))) return 'Europe';
    if (['poland', 'czech', 'slovakia', 'hungary', 'romania', 'bulgaria', 'ukraine'].some((c) => country.includes(c))) return 'Europe';

    if (['usa', 'united states', 'canada', 'mexico'].some((c) => country.includes(c))) return 'Americas';
    if (['brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela'].some((c) => country.includes(c))) return 'Americas';

    if (['australia', 'new zealand', 'fiji'].some((c) => country.includes(c))) return 'Oceania';

    if (['uae', 'dubai', 'saudi', 'qatar', 'kuwait', 'israel', 'turkey'].some((c) => country.includes(c))) return 'Middle East & Africa';
    if (['egypt', 'south africa', 'nigeria', 'kenya'].some((c) => country.includes(c))) return 'Middle East & Africa';

    return 'Other';
  };

  // Fetch and order popular destinations based on user location and A/B test
  useEffect(() => {
    if (userCountry) {
      const rawDestinations = getPopularDestinationsForUser(userCountry, language);
      const orderedDestinations = applyOrderingStrategy(
        rawDestinations,
        variant?.config?.orderingStrategy
      );
      setPopularDestinations(orderedDestinations);
    }
  }, [userCountry, language, variant]);

  // Track viewed countries in localStorage
  const trackCountryView = useCallback((country: string, countryCode: string) => {
    const newEntry: RecentlyViewedItem = {
      country,
      countryCode,
      timestamp: Date.now()
    };

    const stored = localStorage.getItem('recentlyViewedCountries');
    let existing: RecentlyViewedItem[] = [];
    if (stored) {
      try {
        existing = JSON.parse(stored);
      } catch (e) {
        existing = [];
      }
    }

    const filtered = existing.filter((item) => item.country !== country);
    const updated = [newEntry, ...filtered].slice(0, 8);

    localStorage.setItem('recentlyViewedCountries', JSON.stringify(updated));
    setRecentlyViewed(updated);
  }, []);

  // Load recently viewed on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewedCountries');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const sorted = parsed.
        sort((a: RecentlyViewedItem, b: RecentlyViewedItem) => b.timestamp - a.timestamp).
        slice(0, 8);
        setRecentlyViewed(sorted);
      } catch (e) {
        console.error('Failed to parse recently viewed', e);
      }
    }
  }, []);

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        let allPackages: any[] = [];
        let start = 0;
        const batchSize = 1000;
        let hasMore = true;

        // Fetch in batches (Supabase has 1000 row limit per query)
        while (hasMore) {
          const { data, error } = await supabase.
          from('esim_packages').
          select('*, esim_providers(provider_code, provider_name)').
          eq('is_active', true).
          order('price', { ascending: true }).
          range(start, start + batchSize - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            const flattened = data.map((p: any) => ({
              ...p,
              provider_code: p.esim_providers?.provider_code,
              provider_name: p.esim_providers?.provider_name
            }));
            allPackages = [...allPackages, ...flattened];
            start += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        console.log(`Fetched ${allPackages.length} total packages`);
        setPackages(allPackages);
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast({
          title: t('packages.errorTitle'),
          description: t('packages.loadFailed'),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [toast]);

  // Fetch extending order details and auto-enter configurator mode
  useEffect(() => {
    if (extendingOrderId) {
      const fetchExtendingOrder = async () => {
        const { data, error } = await supabase.
        from('orders').
        select('*, esim_packages(*)').
        eq('id', extendingOrderId).
        single();

        if (error) {
          console.error('Error fetching extending order:', error);
          toast({
            title: t('packages.errorTitle'),
            description: t('packages.loadFailed'),
            variant: "destructive"
          });
          navigate('/orders');
        } else {
          setExtendingOrder(data);

          // Auto-enter configurator mode for the original order's country/region
          const countryName = data.esim_packages?.country_name;
          if (countryName) {
            setConfiguratorMode(true);
            setConfiguratorCountry(countryName);
            setSelectedCountry(countryName);
            setExplicitCountryFilter(true);

            // Set appropriate package type
            const isRegional = regionalUtils.isRegionalPackage(data.esim_packages);
            setPackageType(isRegional ? 'regional' : 'local');
          }
        }
      };
      fetchExtendingOrder();
    }
  }, [extendingOrderId, navigate, toast]);

  // Handle navigation state from popular destinations
  useEffect(() => {
    if (location.state) {
      const { filterType, filterValue } = location.state as {filterType?: string;filterValue?: string;};

      if (filterType === 'country' && filterValue) {
        const normalizedCountry = normalizeCountryName(filterValue);
        setSearchTerm('');
        setSelectedCountry(normalizedCountry);
        setExplicitCountryFilter(true);
        setConfiguratorMode(true);
        setConfiguratorCountry(normalizedCountry);
        setPackageType('local');
      } else if (filterType === 'regional' && filterValue) {
        setSearchTerm('');
        setSelectedCountry(filterValue);
        setExplicitCountryFilter(true);
        setConfiguratorMode(true);
        setConfiguratorCountry(filterValue);
        setPackageType('regional');
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle URL query parameters for direct navigation
  useEffect(() => {
    const countryParam = searchParams.get('country');
    const regionalParam = searchParams.get('regional');
    const globalParam = searchParams.get('global');

    if (countryParam && !extendingOrderId) {
      // Find matching package to determine if regional/global
      const matchingPkg = packages.find((p) =>
      normalizeRegionalName(p.country_name) === normalizeRegionalName(countryParam)
      );

      const isRegionalOrGlobal = matchingPkg ? regionalUtils.isRegionalPackage(matchingPkg) : false;

      setSearchTerm('');
      setSelectedCountry(countryParam);
      setExplicitCountryFilter(true);
      setConfiguratorMode(true);
      setConfiguratorCountry(countryParam);

      // Set package type based on what was selected
      if (isRegionalOrGlobal) {
        setPackageType('regional');
      } else {
        setPackageType('local');
      }

      // Track country view
      if (matchingPkg) {
        trackCountryView(countryParam, matchingPkg.country_code);
      }
    } else if (regionalParam && !extendingOrderId) {
      setSearchTerm('');
      setSelectedCountry(regionalParam);
      setExplicitCountryFilter(true);
      setConfiguratorMode(true);
      setConfiguratorCountry(regionalParam);
      setPackageType('regional');

      const pkg = packages.find((p) =>
      normalizeRegionalName(p.country_name) === normalizeRegionalName(regionalParam)
      );
      if (pkg) {
        trackCountryView(regionalParam, pkg.country_code);
      }
    } else if (globalParam && !extendingOrderId) {
      // Handle global parameter if needed
      setSearchTerm('');
      setPackageType('regional');
      setSelectedCountry('all');
      setConfiguratorMode(false);
    }
  }, [searchParams, packages, extendingOrderId, trackCountryView, normalizeRegionalName]);

  // Deduplicate packages by package_id
  const deduplicatedPackages = useMemo<EsimPackage[]>(() => {
    const seen = new Map<string, EsimPackage>();
    packages.forEach((pkg) => {
      if (!seen.has(pkg.package_id)) {
        seen.set(pkg.package_id, pkg);
      }
    });
    const result = Array.from(seen.values());

    // Debug: Log deduplication results
    console.log('=== AFTER DEDUPLICATION ===');
    console.log('Total deduplicated:', result.length);
    const asiaDedup = result.filter((p) =>
    p.country_name?.toLowerCase().includes('asia') &&
    p.country_name?.toLowerCase().includes('13')
    );
    console.log('Asia 13 deduplicated:', asiaDedup.length);
    console.log('Asia 13 unique package_ids:', [...new Set(asiaDedup.map((p) => p.package_id))].length);

    return result;
  }, [packages]);

  // Extract all supported countries for Local eSIM (all 151 from master list)
  // Keep full objects to access ISO codes for proper flag rendering
  const localCountries = useMemo(() => {
    return getAllSupportedCountries(); // Already sorted alphabetically by name
  }, []);

  // Extract regional and global plan names for Regional eSIM
  const regionalPlans = useMemo(() => {
    const nameMap = new Map<string, string>();

    deduplicatedPackages.
    filter((pkg) => regionalUtils.isRegionalPackage(pkg)).
    forEach((pkg) => {
      const original = pkg.country_name;
      const normalized = normalizeRegionalName(original);

      // Store first occurrence, or replace if current has better spacing
      if (!nameMap.has(normalized)) {
        nameMap.set(normalized, original);
      } else {
        const existing = nameMap.get(normalized)!;
        // Prefer version with proper spacing (space between number and letter)
        if (/\d\s[A-Z]/.test(original) && !/\d\s[A-Z]/.test(existing)) {
          nameMap.set(normalized, original);
        }
      }
    });

    // Custom sort to group regional packages by region
    const getRegionPriority = (name: string): {priority: number;subPriority: string;} => {
      const lower = name.toLowerCase();

      // Asia group (priority 1)
      if (lower.includes('asia') && lower.includes('13')) {
        return { priority: 1, subPriority: 'a' }; // Asia 13 first
      }
      if (lower.includes('south east asia') || lower.includes('southeast asia')) {
        return { priority: 1, subPriority: 'b' }; // SEA after Asia 13
      }

      // Europe group (priority 2)
      if (lower.includes('europe')) {
        return { priority: 2, subPriority: 'a' };
      }

      // Global group (priority 3)
      if (lower.includes('global')) {
        return { priority: 3, subPriority: name }; // Sort globals by name
      }

      // Other regions (priority 4)
      return { priority: 4, subPriority: name };
    };

    return Array.from(nameMap.values()).sort((a, b) => {
      const aPriority = getRegionPriority(a);
      const bPriority = getRegionPriority(b);

      // Sort by region priority first
      if (aPriority.priority !== bPriority.priority) {
        return aPriority.priority - bPriority.priority;
      }

      // Within same region, sort by sub-priority or name
      return aPriority.subPriority.localeCompare(bPriority.subPriority);
    });
  }, [deduplicatedPackages]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    if (extendingOrderId && !extendingOrder) {
      return [];
    }

    let filtered = deduplicatedPackages;

    // Debug: Log starting state
    console.log('=== FILTERED PACKAGES START ===');
    console.log('Starting with packages:', filtered.length);
    const asiaStart = filtered.filter((p) =>
    p.country_name?.toLowerCase().includes('asia') &&
    p.country_name?.toLowerCase().includes('13')
    );
    console.log('Asia 13 at start:', asiaStart.length);

    // Extension mode: filter by original country
    if (extendingOrderId && extendingOrder?.esim_packages) {
      const originalCountryCode = extendingOrder.esim_packages.country_code;
      const originalCountryName = extendingOrder.esim_packages.country_name;

      filtered = filtered.filter((pkg) => {
        if (originalCountryCode && pkg.country_code) {
          return pkg.country_code === originalCountryCode;
        }
        return pkg.country_name === originalCountryName;
      });
    } else if (extendingOrderId) {
      return [];
    } else {
      // Configurator mode: filter for specific country or region
      if (configuratorMode && configuratorCountry) {
        const isRegionalConfig = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania'].includes(configuratorCountry);

        if (isRegionalConfig) {
          // Filter regional packages by zone
          filtered = filtered.filter((pkg) => {
            const zone = getZone(pkg.country_name);
            return zone === configuratorCountry && regionalUtils.isRegionalPackage(pkg);
          });
        } else {
          // Filter by normalized name for direct packages only
          // Regional packages should NOT appear as carrier options for local countries
          const normalizedConfigCountry = normalizeRegionalName(configuratorCountry);
          filtered = filtered.filter((pkg) => {
            const directMatch = normalizeRegionalName(pkg.country_name) === normalizedConfigCountry;
            return directMatch;
          });

          // If no direct packages found, fall back to regional coverage
          if (filtered.length === 0) {
            filtered = deduplicatedPackages.filter((pkg) => {
              return regionalUtils.includesCountry(pkg, configuratorCountry);
            });
          }

          console.log(`[PackagesPage] Configurator filter for "${configuratorCountry}": found ${filtered.length} packages`);
        }
      } else {
        // Filter by package type
        if (packageType === 'local') {
          filtered = filtered.filter((pkg) => !regionalUtils.isRegionalPackage(pkg));
        } else if (packageType === 'regional') {
          filtered = filtered.filter((pkg) => regionalUtils.isRegionalPackage(pkg));
        }

        // Filter by country
        if (selectedCountry !== 'all') {
          const normalizedSelected = normalizeRegionalName(selectedCountry);
          filtered = filtered.filter((pkg) => {
            const countryMatch = normalizeRegionalName(pkg.country_name) === normalizedSelected;
            const regionalMatch = regionalUtils.includesCountry(pkg, selectedCountry);
            return countryMatch || regionalMatch;
          });
        }

        // Filter by category/zone
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((pkg) => getZone(pkg.country_name) === selectedCategory);
        }
      }
    }

    // Debug logging
    if (configuratorMode && configuratorCountry) {
      console.log('=== FILTERED PACKAGES DEBUG ===');
      console.log('configuratorCountry:', configuratorCountry);
      console.log('normalizedConfigCountry:', normalizeRegionalName(configuratorCountry));
      console.log('Total filtered packages:', filtered.length);
      console.log('Package types:', [...new Set(filtered.map((p) => p.package_type))]);
      console.log('Day Pass packages:', filtered.filter((p) => p.package_type === 'day_pass').length);
      console.log('Day Pass days:', [...new Set(filtered.filter((p) => p.package_type === 'day_pass').map((p) => p.validity_days))].sort((a, b) => a - b));
      console.log('Limitless packages:', filtered.filter((p) => p.package_type === 'limitless').length);
      console.log('Limitless days:', [...new Set(filtered.filter((p) => p.package_type === 'limitless').map((p) => p.validity_days))].sort((a, b) => a - b));
      console.log('Sample package names:', [...new Set(filtered.map((p) => p.country_name))]);
    }

    return filtered;
  }, [deduplicatedPackages, packageType, selectedCountry, selectedCategory, extendingOrderId, extendingOrder, configuratorMode, configuratorCountry]);

  // LINE-only redirect: When LINE chatbot traffic lands on empty packages, redirect to country page
  useEffect(() => {
    // Only redirect for LINE chatbot traffic (source=line query param)
    const isLineSource = searchParams.get('source') === 'line';
    if (!isLineSource) return;

    // Only redirect in configurator mode when no packages found
    if (!configuratorMode || !configuratorCountry) return;
    if (loading) return;
    if (filteredPackages.length > 0) return;
    if (extendingOrderId) return; // Never redirect during extension flow

    // Validate it's a known country before redirecting
    const countryParam = searchParams.get('country');
    if (!countryParam) return;

    // Use statically imported functions

    const countryData = findCountryBySlug(countryParam);
    if (!countryData) {
      console.log(`[PackagesPage] Unknown country slug "${countryParam}", not redirecting`);
      return;
    }

    // Build redirect URL with preserved filters
    const decodedCountry = slugToCountry(countryParam);
    const slug = countryToSlug(decodedCountry);
    const params = new URLSearchParams();

    // Preserve filter params
    const type = searchParams.get('type');
    const days = searchParams.get('days');
    const option = searchParams.get('option');

    if (type) params.set('type', type);
    if (days) params.set('days', days);
    if (option) params.set('option', option);

    const queryString = params.toString();
    const redirectUrl = `/esim/${slug}${queryString ? `?${queryString}` : ''}`;

    console.log(`[PackagesPage] LINE redirect: No packages for "${configuratorCountry}" → ${redirectUrl}`);
    navigate(redirectUrl, { replace: true });

  }, [configuratorMode, configuratorCountry, loading, filteredPackages.length, extendingOrderId, searchParams, navigate]);

  // Handle extension order
  const handleExtendOrder = (newPackageId: string) => {
    const selectedPackage = packages.find((pkg) => pkg.id === newPackageId);
    if (!selectedPackage) {
      toast({
        title: "Error",
        description: "Package not found",
        variant: "destructive"
      });
      return;
    }

    // Validate country match before navigating
    if (extendingOrder?.esim_packages) {
      const originalCountryCode = extendingOrder.esim_packages.country_code;
      const originalCountryName = extendingOrder.esim_packages.country_name;

      const countriesMatch = originalCountryCode && selectedPackage.country_code ?
      selectedPackage.country_code === originalCountryCode :
      selectedPackage.country_name === originalCountryName;

      if (!countriesMatch) {
        toast({
          title: "Invalid Extension",
          description: "You can only extend with packages from the same country",
          variant: "destructive"
        });
        return;
      }
    }

    // Navigate to CheckoutPage with extension context (unified flow)
    navigate('/checkout', {
      state: {
        cartItems: [{
          packageId: selectedPackage.id,
          name: selectedPackage.name,
          description: selectedPackage.description || '',
          country: selectedPackage.country_name,
          data_amount: selectedPackage.data_amount,
          validity: `${selectedPackage.validity_days}`,
          price: selectedPackage.price,
          quantity: 1,
          package_type: selectedPackage.package_type,
          speed_after_limit: selectedPackage.speed_after_limit,
          qos_speed: selectedPackage.qos_speed,
          carrier: selectedPackage.carrier,
          network_type: selectedPackage.network_type,
          sim_type: 'eSIM'
        }],
        isExtension: true,
        originalOrderId: extendingOrderId,
        originalOrder: extendingOrder
      }
    });
  };

  // Handle order
  const handleOrder = (packageId: string, quantity: number = 1) => {
    if (extendingOrderId) {
      handleExtendOrder(packageId);
    } else {
      const selectedPackage = packages.find((pkg) => pkg.id === packageId);
      if (selectedPackage) {
        for (let i = 0; i < quantity; i++) {
          addToCart({
            packageId: selectedPackage.id,
            name: selectedPackage.name,
            description: selectedPackage.description,
            price: selectedPackage.price,
            country: selectedPackage.country_name,
            data_amount: selectedPackage.data_amount,
            validity: `${selectedPackage.validity_days} days`,
            package_type: selectedPackage.package_type,
            speed_after_limit: selectedPackage.speed_after_limit || undefined,
            qos_speed: selectedPackage.qos_speed || undefined,
            carrier: selectedPackage.carrier || undefined,
            network_type: selectedPackage.network_type || undefined,
            sim_type: selectedPackage.sim_type || 'eSIM',
            daily_reset_amount: selectedPackage.daily_reset_amount || undefined,
            hot_spot: selectedPackage.hot_spot || false,
            support_sms: selectedPackage.support_sms || false,
            support_voice: selectedPackage.support_voice || false,
            support_data: selectedPackage.support_data ?? true
          });
        }
        toast({
          title: t('packages.addedToCart'),
          description: t('packages.addedToCartDesc').replace('{name}', selectedPackage.name)
        });
      }
    }
  };


  // Session ID helper for analytics
  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };

  // Track destination click for analytics
  const trackDestinationClick = async (destination: Destination) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = user ? null : getSessionId();

      const { data: analyticsData, error: analyticsError } = await supabase.
      from('destination_analytics').
      insert({
        destination: destination.nameEn,
        destination_type: destination.filterType,
        user_country: userCountry,
        user_language: language,
        user_id: user?.id || null,
        session_id: sessionId,
        test_id: variant?.testId,
        variant_id: variant?.variantId
      }).
      select('id').
      single();

      if (!analyticsError && analyticsData) {
        await supabase.from('destination_conversions').insert({
          test_id: variant?.testId,
          variant_id: variant?.variantId,
          analytics_id: analyticsData.id,
          user_id: user?.id || null,
          session_id: sessionId,
          destination: destination.nameEn,
          clicked_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to track destination click:', error);
    }
  };

  // Handle destination click
  const handleDestinationClick = (destination: Destination) => {
    if (destination.filterType === 'all') {
      // "View All" - reset to browse mode
      setSelectedCountry('');
      setPackageType('local');
      setExplicitCountryFilter(false);
      setConfiguratorMode(false);
      return;
    }

    if (destination.filterType === 'country') {
      setSelectedCountry(destination.filterValue!);
      setPackageType('local');
      setExplicitCountryFilter(true);
      setConfiguratorMode(true);
      setConfiguratorCountry(destination.filterValue!);
      setSimplifiedMode(true); // Reset to simplified mode for new destinations

      // Track for recently viewed
      const pkg = packages.find((p) => p.country_name === destination.filterValue);
      if (pkg) trackCountryView(destination.filterValue!, pkg.country_code);
    } else if (destination.filterType === 'regional') {
      setSelectedCountry(destination.filterValue!);
      setPackageType('regional');
      setExplicitCountryFilter(true);
      setConfiguratorMode(true);
      setConfiguratorCountry(destination.filterValue!);
      setSimplifiedMode(true); // Reset to simplified mode for new destinations
    }

    // Track analytics
    trackDestinationClick(destination);
  };

  // Get dynamic SEO based on selected country
  const countrySEO = configuratorCountry && configuratorCountry !== 'all' ?
  getCountrySEO(configuratorCountry) :
  SEO_CONFIG.packages;

  return (
    <div className="theme-v2 min-h-screen bg-[hsl(35,33%,96%)]">
      <SEO
        title={countrySEO.title}
        description={countrySEO.description}
        keywords={countrySEO.keywords}
        canonical={configuratorCountry && configuratorCountry !== 'all' ?
        `https://mobile11.com/packages?country=${encodeURIComponent(configuratorCountry)}` :
        'https://mobile11.com/packages'
        }
        structuredData={configuratorMode ? getFAQStructuredData([
          { question: String(t('configuratorFaq.q1.question')), answer: String(t('configuratorFaq.q1.answer')) },
          { question: String(t('configuratorFaq.q3.question')), answer: String(t('configuratorFaq.q3.answer')) },
          { question: String(t('configuratorFaq.q4.question')), answer: String(t('configuratorFaq.q4.answer')) },
          { question: String(t('configuratorFaq.q5.question')), answer: String(t('configuratorFaq.q5.answer')) },
          { question: String(t('configuratorFaq.q6.question')), answer: String(t('configuratorFaq.q6.answer')) },
          { question: String(t('configuratorFaq.q7.question')), answer: String(t('configuratorFaq.q7.answer')) },
          { question: String(t('configuratorFaq.q9.question')), answer: String(t('configuratorFaq.q9.answer')) },
          { question: String(t('configuratorFaq.q10.question')), answer: String(t('configuratorFaq.q10.answer')) },
        ]) : undefined}
      />

      <Header />
      <SongkranPromoBanner />
      
      {/* Extension Banner */}
      {extendingOrderId && extendingOrder &&
      <section className="bg-[#FAF7F2] pt-8">
          <div className="container max-w-7xl">
            <Alert className="bg-orange-500/10 border-orange-500/30 rounded-2xl">
              <Info className="h-4 w-4 text-orange-500" />
              <AlertTitle className="text-orange-500">Extending Your eSIM</AlertTitle>
              <AlertDescription className="text-gray-800">
                You are extending order <strong>#{extendingOrder.order_id}</strong>
                {extendingOrder.esim_packages && ` (${extendingOrder.esim_packages.name})`}.
                Select a package for <strong>{extendingOrder.esim_packages?.country_name || 'the same country'}</strong> below.
              </AlertDescription>
            </Alert>
          </div>
        </section>
      }

      {/* Hero Carousel (only show when not extending) */}
      {!extendingOrderId && <PackagesHeroCarousel />}

      {/* Airalo-Style Category Tabs */}
      {!extendingOrderId && !configuratorMode &&
      <StoreCategoryTabs
        packages={deduplicatedPackages}
        loading={loading}
        onCountryClick={(countryName) => {
          const slug = countryToSlug(countryName);
          const pkg = packages.find((p) => p.country_name === countryName);
          if (pkg) trackCountryView(countryName, pkg.country_code);
          navigate(`/esim/${slug}`);
        }}
        onRegionalClick={(regionName) => {
          const slug = regionalToSlug(regionName);
          navigate(`/esim/${slug}`);
        }} />

      }

      {/* Plan Types Section - Warm Beige Background with Decorations */}
      {!extendingOrderId && !configuratorMode &&
      <section className="bg-[hsl(35,33%,96%)] py-16 md:py-20 relative overflow-hidden">
          <SectionDecorations />
          <div className="container max-w-7xl relative z-10">
            <div className="max-w-5xl mx-auto space-y-12">
              <PlanTypesInfoSection
              selectedPlanType={null}
              onPlanTypeClick={() => {}} />

              <PackageComparisonTable />
            </div>
          </div>
        </section>
      }









      {/* Configurator Section - Warm Beige with Card Styling */}
      <section className="bg-[hsl(35,33%,96%)] relative">
        {/* Decorative Lottie on desktop */}
        <div className="absolute right-0 top-20 opacity-20 pointer-events-none hidden xl:block">
          <LottieAnimation
            src="/assets/lottie/selfie-traveler.lottie"
            className="w-[250px]"
            loop
            autoplay />

        </div>
        
        <div className="container py-10 md:py-16 max-w-7xl relative z-10">

          {/* Package Configurator - Full Focus */}
          {configuratorMode && configuratorCountry ?
          loading ?
          <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-[hsl(25,95%,53%)]/30 border-t-[hsl(25,95%,53%)] rounded-full animate-spin" />
                <p className="text-[hsl(20,6%,45%)] font-medium">Loading packages...</p>
              </div> :
          filteredPackages.length === 0 ?
          (() => {
            // Check if this is Hong Kong/Macau and redirect to SEA 8
            const normalized = normalizeRegionalName(configuratorCountry || '');
            if (normalized.includes('hong kong') && normalized.includes('macau')) {
              // Auto-redirect to South East Asia 8
              setTimeout(() => {
                navigate('/esim/south-east-asia-8-countries', { replace: true });
              }, 0);
              return (
                <div className="text-center py-20">
                      <div className="w-12 h-12 border-4 border-[hsl(25,95%,53%)]/30 border-t-[hsl(25,95%,53%)] rounded-full animate-spin mx-auto" />
                      <p className="mt-4 text-[hsl(20,6%,45%)]">Redirecting to South East Asia 8...</p>
                    </div>);

            }
            // Original empty state UI
            return (
              <div className="text-center py-20 bg-white rounded-3xl shadow-lg max-w-lg mx-auto">
                    <Globe className="h-20 w-20 mx-auto mb-6 text-[hsl(30,20%,85%)]" />
                     <h3 className="text-xl font-bold mb-3 text-[hsl(20,14%,10%)]">{t('packageSelector.noPackages')}</h3>
                     <p className="text-[hsl(20,6%,45%)] mb-8">
                       {t('packageSelector.noPackages')} - {configuratorCountry}
                     </p>
                     <button
                  onClick={() => {
                    setConfiguratorMode(false);
                    setConfiguratorCountry(null);
                    setSelectedCountry('all');
                    setExplicitCountryFilter(false);
                  }}
                  className="btn-v2-outline">

                       {t('destinations.backToBrowse')}
                     </button>
                  </div>);

          })() :
          simplifiedMode && !extendingOrderId && !regionalUtils.isRegionalPackage(filteredPackages.find((p) => normalizeRegionalName(p.country_name) === normalizeRegionalName(configuratorCountry || '')) || {}) && filteredPackages.some((p) => p.package_type === 'limitless') ?
          // Simplified Limitless Configurator (days-only selection)
          <>
              <SimpleLimitlessConfigurator
              countryCode={deduplicatedPackages.find((pkg) => normalizeRegionalName(pkg.country_name) === normalizeRegionalName(configuratorCountry || ''))?.country_code || ''}
              countryName={configuratorCountry}
              packages={filteredPackages}
              onAddToCart={(packageId, quantity) => {
                for (let i = 0; i < quantity; i++) {
                  handleOrder(packageId);
                }
              }}
              onShowFullConfigurator={() => {
                setCameFromSimpleConfigurator(true);
                setSimplifiedMode(false);
              }}
              onBack={() => {
                setConfiguratorMode(false);
                setConfiguratorCountry(null);
                setSelectedCountry('all');
                setExplicitCountryFilter(false);
                setSimplifiedMode(true);
                setCameFromSimpleConfigurator(false);
                navigate('/packages', { replace: true });
              }}
              isRegional={
              configuratorCountry ?
              regionalUtils.isRegionalPackage(
                filteredPackages.find((p) => normalizeRegionalName(p.country_name) === normalizeRegionalName(configuratorCountry)) || {}
              ) :
              false
              }
              initialDays={initialDays}
              initialQuantity={initialQty}
              onStateChange={handleSimpleConfigStateChange} />

              </> :

          // Full PackageConfigurator
          <div className="animate-in fade-in duration-300">
                <PackageConfigurator
              countryCode={deduplicatedPackages.find((pkg) => normalizeRegionalName(pkg.country_name) === normalizeRegionalName(configuratorCountry || ''))?.country_code || ''}
              countryName={configuratorCountry}
              packages={filteredPackages}
              onAddToCart={(packageId, quantity) => {
                if (extendingOrderId) {
                  handleOrder(packageId);
                } else {
                  for (let i = 0; i < quantity; i++) {
                    handleOrder(packageId);
                  }
                }
              }}
              onBack={() => {
                if (extendingOrderId) {
                  navigate(`/orders/${extendingOrderId}`);
                } else if (cameFromSimpleConfigurator) {
                  setSimplifiedMode(true);
                  setCameFromSimpleConfigurator(false);
                } else {
                  setConfiguratorMode(false);
                  setConfiguratorCountry(null);
                  setSelectedCountry('all');
                  setExplicitCountryFilter(false);
                  setSimplifiedMode(true);
                  navigate('/packages', { replace: true });
                }
              }}
              isRegional={
              configuratorCountry ?
              regionalUtils.isRegionalPackage(
                filteredPackages.find((p) => normalizeRegionalName(p.country_name) === normalizeRegionalName(configuratorCountry)) || {}
              ) :
              false
              }
              isExtending={!!extendingOrderId}
              extendingPackageName={extendingOrder?.esim_packages?.name}
              extendingPackageType={extendingTypeParam || extendingOrder?.esim_packages?.package_type as 'day_pass' | 'max_speed' | 'limitless' | undefined}
              extendingDataAmount={extendingDataParam || extendingOrder?.esim_packages?.data_amount}
              extendingSpeed={extendingSpeedParam || extendingOrder?.esim_packages?.speed_after_limit}
              initialCarrier={initialCarrier}
              initialPackageType={initialType}
              initialDays={initialDays}
              initialOption={initialOption}
              initialBackupSpeed={initialSpeed}
              initialQuantity={initialQty}
              onStateChange={handleFullConfigStateChange} />

              </div> :

          filteredPackages.length === 0 && loading ?
          <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-[hsl(25,95%,53%)]/30 border-t-[hsl(25,95%,53%)] rounded-full animate-spin" />
              <p className="text-[hsl(20,6%,45%)] font-medium">Loading packages...</p>
            </div> :
          filteredPackages.length === 0 ?
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg max-w-lg mx-auto">
              <Globe className="h-20 w-20 mx-auto mb-6 text-[hsl(30,20%,85%)]" />
              <h3 className="text-xl font-bold mb-3 text-[hsl(20,14%,10%)]">No packages found</h3>
              <p className="text-[hsl(20,6%,45%)] mb-8">
                Try searching for a different destination or region
              </p>
              <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCountry('all');
                setPackageType('all');
                setSelectedCategory('all');
                setConfiguratorMode(false);
                setConfiguratorCountry(null);
              }}
              className="btn-v2-outline">

                Clear Search
              </button>
            </div> :
          null}
        </div>
      </section>

      {/* FAQ Section - Warm Beige with enhanced styling */}
      {configuratorMode && configuratorCountry &&
      <section className="bg-[hsl(35,27%,93%)] py-16 md:py-20 relative overflow-hidden">
          <SectionDecorations />
          <div className="container max-w-4xl relative z-10">
            <ConfiguratorFAQ />
          </div>
        </section>
      }
      
      <FooterAiralo />
    </div>);

}