/**
 * Comprehensive country destinations utility
 * Builds a master list of all supported countries from regional presets
 * and tracks which have direct packages vs. only regional coverage
 */

import { 
  EUROPE_42, 
  EUROPE_41,
  EUROPE_33,
  ASIA_13, 
  ASIA_3, 
  ASIA_8, 
  HONGKONG_MACAU,
  CHINA_HONGKONG_MACAU,
  GLOBAL_109, 
  GLOBAL_151,
  AFRICA_18
} from './regionPresets';
import { RegionalPackageData } from './excelRegionalParser';

export interface CountryDestination {
  name: string;
  code: string;
  slug: string;
  carriers: { name: string; networks: string[] }[];
}

export interface RegionalPackageInfo {
  name: string;
  displayName: string;
  countryCount: number;
}

// Map of all regional presets
const REGIONAL_PRESETS: Record<string, { data: RegionalPackageData; displayName: string }> = {
  'europe_42': { data: EUROPE_42, displayName: 'Europe Premium 42 + Stopover' },
  'europe_41': { data: EUROPE_41, displayName: 'Europe Extended 41' },
  'europe_33': { data: EUROPE_33, displayName: 'Europe Essentials 33' },
  'asia_13': { data: ASIA_13, displayName: 'Asia 13 Countries' },
  'asia_3': { data: ASIA_3, displayName: 'South East Asia 3 Countries' },
  'asia_8': { data: ASIA_8, displayName: 'South East Asia 8 Countries' },
  'hongkong_macau': { data: HONGKONG_MACAU, displayName: 'Hong Kong & Macau' },
  'china_hongkong_macau': { data: CHINA_HONGKONG_MACAU, displayName: 'China, Hong Kong & Macau' },
  'global_109': { data: GLOBAL_109, displayName: 'Global 109 Countries' },
  'global_151': { data: GLOBAL_151, displayName: 'Global 151 Countries' },
  'africa_18': { data: AFRICA_18, displayName: 'Africa 18 Countries' },
};

// Map DB country_name values to new user-facing display names
const DISPLAY_NAME_MAP: Record<string, string> = {
  'Europe 33 Countries': 'Europe Essentials 33',
  'Europe 33Countries': 'Europe Essentials 33',
  'Europe 41 Countries': 'Europe Extended 41',
  'Europe 41Countries': 'Europe Extended 41',
  'Europe 42 Countries + 2Stopover': 'Europe Premium 42 + Stopover',
  'Europe 42Countries + 2Stopover': 'Europe Premium 42 + Stopover',
};

/**
 * Convert a DB package name to its user-facing display name.
 * Returns the original name if no mapping exists.
 */
export function getDisplayName(dbName: string): string {
  return DISPLAY_NAME_MAP[dbName] || dbName;
}

/**
 * Convert country name to URL-friendly slug
 */
export function countryToSlug(countryName: string): string {
  return countryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[&+]/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * Convert URL slug back to country name
 */
export function slugToCountry(slug: string): string {
  // Special mappings for common variations
const specialMappings: Record<string, string> = {
    'united-states': 'United States',
    'united-kingdom': 'United Kingdom',
    'new-zealand': 'New Zealand',
    'hong-kong': 'Hong Kong',
    'hongkong': 'Hong Kong',
    'south-korea': 'South Korea',
    'korea': 'South Korea',
    'south-africa': 'South Africa',
    'czech-republic': 'Czech Republic',
    'saudi-arabia': 'Saudi Arabia',
    'united-arab-emirates': 'United Arab Emirates',
    'sri-lanka': 'Sri Lanka',
    'costa-rica': 'Costa Rica',
    'dominican-republic': 'Dominican Republic',
    'puerto-rico': 'Puerto Rico',
    'papua-new-guinea': 'Papua New Guinea',
    'bosnia-and-herzegovina': 'Bosnia & Herzegovina',
    'isle-of-man': 'Isle of Man',
    'vatican-city': 'Vatican City',
    'san-marino': 'San Marino',
    // DB name variations
    'guamsaipan': 'Guam/Saipan',
    'guam-saipan': 'Guam/Saipan',
    'turkeyturkiye': 'Turkey(Türkiye)',
    'turkey-turkiye': 'Turkey(Türkiye)',
    'turkey': 'Turkey(Türkiye)',
    'turkeytrkiye': 'Turkey(Türkiye)',
    'egypt': 'Egypt',
    'uk': 'UK',
    'usa': 'USA',
    'usacanada': 'USA/Canada',
    'usa-canada': 'USA/Canada',
    'australia-and-new-zealand': 'Australia & New Zealand',
    'chinahong-kongmacau': 'China/Hong Kong/Macau',
    'china-hong-kong-macau': 'China/Hong Kong/Macau',
    'china-hongkong-macau': 'China/Hong Kong/Macau',
    'africa-18-countries': 'Africa 18 Countries',
  };

  if (specialMappings[slug]) {
    return specialMappings[slug];
  }

  // Convert slug back to title case
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build the master country list from all regional presets
 * Returns a map of country name (lowercase) to country data
 */
// Direct country destinations (local SIM / TUGE-only, not in any regional preset)
const DIRECT_COUNTRY_DESTINATIONS: CountryDestination[] = [
  { name: 'Israel', code: 'IL', slug: 'israel', carriers: [{ name: 'Partner/Cellcom', networks: ['4G', '5G'] }] },
  { name: 'Mongolia', code: 'MN', slug: 'mongolia', carriers: [{ name: 'Unitel', networks: ['5G', '4G'] }] },
  { name: 'Maldives', code: 'MV', slug: 'maldives', carriers: [{ name: 'Dhiraagu/Ooredoo', networks: ['4G'] }] },
];

function buildMasterCountryList(): Map<string, CountryDestination> {
  const countryMap = new Map<string, CountryDestination>();

  // Add direct country destinations first
  DIRECT_COUNTRY_DESTINATIONS.forEach(country => {
    countryMap.set(country.name.toLowerCase(), country);
  });

  Object.values(REGIONAL_PRESETS).forEach(({ data }) => {
    data.countries.forEach(country => {
      const key = country.name.toLowerCase();
      
      if (!countryMap.has(key)) {
        countryMap.set(key, {
          name: country.name,
          code: country.code,
          slug: countryToSlug(country.name),
          carriers: country.carriers || [],
        });
      } else {
        // Merge carriers if not already present
        const existing = countryMap.get(key)!;
        country.carriers?.forEach(carrier => {
          if (!existing.carriers.some(c => c.name === carrier.name)) {
            existing.carriers.push(carrier);
          }
        });
      }
    });
  });

  return countryMap;
}

// Cache the master country list
let cachedMasterList: Map<string, CountryDestination> | null = null;

/**
 * Get the master country list (cached)
 */
export function getMasterCountryList(): Map<string, CountryDestination> {
  if (!cachedMasterList) {
    cachedMasterList = buildMasterCountryList();
  }
  return cachedMasterList;
}

/**
 * Get all countries as an array
 */
export function getAllSupportedCountries(): CountryDestination[] {
  const masterList = getMasterCountryList();
  return Array.from(masterList.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find country by slug
 */
export function findCountryBySlug(slug: string): CountryDestination | null {
  const countryName = slugToCountry(slug);
  const masterList = getMasterCountryList();
  
  // Try exact match first
  const exactMatch = masterList.get(countryName.toLowerCase());
  if (exactMatch) return exactMatch;
  
  // Try finding by slug match
  for (const country of masterList.values()) {
    if (country.slug === slug) {
      return country;
    }
  }
  
  return null;
}

/**
 * Find country by code
 */
export function findCountryByCode(code: string): CountryDestination | null {
  const masterList = getMasterCountryList();
  for (const country of masterList.values()) {
    if (country.code.toLowerCase() === code.toLowerCase()) {
      return country;
    }
  }
  return null;
}

/**
 * Get regional packages that include a specific country
 */
export function getRegionalPackagesForCountry(countryName: string): RegionalPackageInfo[] {
  const packages: RegionalPackageInfo[] = [];
  const searchName = countryName.toLowerCase();

  Object.entries(REGIONAL_PRESETS).forEach(([key, { data, displayName }]) => {
    const hasCountry = data.countries.some(
      c => c.name.toLowerCase() === searchName || c.code.toLowerCase() === searchName
    );
    
    if (hasCountry) {
      packages.push({
        name: key,
        displayName,
        countryCount: data.countries.length,
      });
    }
  });

  // Sort by country count (smallest first for more specific coverage)
  return packages.sort((a, b) => a.countryCount - b.countryCount);
}

/**
 * Check if a country exists in any regional preset
 */
export function isCountrySupported(countryName: string): boolean {
  const masterList = getMasterCountryList();
  return masterList.has(countryName.toLowerCase());
}

/**
 * Get carrier info for a country
 */
export function getCountryCarriers(countryName: string): { name: string; networks: string[] }[] {
  const masterList = getMasterCountryList();
  const country = masterList.get(countryName.toLowerCase());
  return country?.carriers || [];
}

/**
 * Get the best network type available for a country
 */
export function getCountryBestNetwork(countryName: string): string | null {
  const carriers = getCountryCarriers(countryName);
  
  let has5G = false;
  let has4G = false;
  let has3G = false;
  
  carriers.forEach(carrier => {
    carrier.networks?.forEach(network => {
      if (network.includes('5G')) has5G = true;
      if (network.includes('4G') || network.includes('LTE')) has4G = true;
      if (network.includes('3G')) has3G = true;
    });
  });
  
  if (has4G && has5G) return '4G/5G';
  if (has5G) return '5G';
  if (has4G) return '4G';
  if (has3G) return '3G';
  return null;
}

/**
 * Search countries by name (partial match)
 */
export function searchCountries(query: string): CountryDestination[] {
  const searchTerm = query.toLowerCase().trim();
  if (searchTerm.length < 1) return [];
  
  const masterList = getMasterCountryList();
  const results: CountryDestination[] = [];
  
  masterList.forEach(country => {
    if (
      country.name.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase() === searchTerm
    ) {
      results.push(country);
    }
  });
  
  return results.sort((a, b) => {
    // Prioritize exact matches and prefix matches
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Regional slug mapping ──────────────────────────────────────────────
export interface RegionalSlugInfo {
  displayName: string;
  dbPattern: string;
}

const REGIONAL_SLUG_MAP: Record<string, RegionalSlugInfo> = {
  'europe-premium-42-and-stopover': { displayName: 'Europe Premium 42 + Stopover', dbPattern: '%Europe 42%' },
  'europe-extended-41': { displayName: 'Europe Extended 41', dbPattern: '%Europe 41%' },
  'europe-essentials-33': { displayName: 'Europe Essentials 33', dbPattern: '%Europe 33%' },
  // Legacy slugs for backward compatibility
  'europe-42-countries-and-2stopover': { displayName: 'Europe Premium 42 + Stopover', dbPattern: '%Europe 42%' },
  'europe-41-countries': { displayName: 'Europe Extended 41', dbPattern: '%Europe 41%' },
  'europe-33-countries': { displayName: 'Europe Essentials 33', dbPattern: '%Europe 33%' },
  'global-109-countries': { displayName: 'Global 109 Countries', dbPattern: '%Global 109%' },
  'global-151-countries': { displayName: 'Global 151 Countries', dbPattern: '%Global 151%' },
  'hong-kongmacau': { displayName: 'Hong Kong & Macau', dbPattern: '%Hong Kong%Macau%' },
  'hongkongmacau': { displayName: 'Hong Kong & Macau', dbPattern: '%Hong Kong%Macau%' },
  'hong-kong-and-macau': { displayName: 'Hong Kong & Macau', dbPattern: '%Hong Kong%Macau%' },
  'singapore-malaysia-and-thailand': { displayName: 'Singapore, Malaysia & Thailand', dbPattern: '%Singapore, Malaysia%' },
  'australia-and-new-zealand': { displayName: 'Australia & New Zealand', dbPattern: '%Australia%New Zealand%' },
  'asia-13-countries': { displayName: 'Asia 13 Countries', dbPattern: '%Asia 13%' },
  'asia': { displayName: 'Asia 13 Countries', dbPattern: '%Asia 13%' },
  'south-east-asia-3-countries': { displayName: 'South East Asia 3 Countries', dbPattern: '%South East Asia 3%' },
  'south-east-asia-8-countries': { displayName: 'South East Asia 8 Countries', dbPattern: '%South East Asia 8%' },
  'china-hong-kong-and-macau': { displayName: 'China, Hong Kong & Macau', dbPattern: '%China%Hong Kong%Macau%' },
  'china-hongkong-macau': { displayName: 'China, Hong Kong & Macau', dbPattern: '%China%Hong Kong%Macau%' },
  'chinahong-kongmacau': { displayName: 'China, Hong Kong & Macau', dbPattern: '%China%Hong Kong%Macau%' },
  'china-hong-kong-macau': { displayName: 'China, Hong Kong & Macau', dbPattern: '%China%Hong Kong%Macau%' },
  'africa-18-countries': { displayName: 'Africa 18 Countries', dbPattern: '%Africa 18%' },
  'africa-18': { displayName: 'Africa 18 Countries', dbPattern: '%Africa 18%' },
};

/**
 * Look up a regional plan by its URL slug
 */
export function getRegionalBySlug(slug: string): RegionalSlugInfo | null {
  return REGIONAL_SLUG_MAP[slug] || null;
}

/**
 * Convert a regional display name to a URL slug
 */
export function regionalToSlug(displayName: string): string {
  return countryToSlug(displayName);
}

/**
 * Get all regional slug entries (useful for sitemaps, etc.)
 */
export function getAllRegionalSlugs(): { slug: string; info: RegionalSlugInfo }[] {
  return Object.entries(REGIONAL_SLUG_MAP).map(([slug, info]) => ({ slug, info }));
}

/**
 * Map URL slugs directly to database country_name values
 * Handles edge cases where DB names differ from display names
 */
export function getDbCountryName(slug: string): string | null {
  const slugToDbName: Record<string, string> = {
    'guamsaipan': 'Guam/Saipan',
    'guam-saipan': 'Guam/Saipan',
    'guam': 'Guam',
    'saipan': 'Guam/Saipan',
    'turkeyturkiye': 'Turkey(Türkiye)',
    'turkeytrkiye': 'Turkey(Türkiye)',
    'turkey': 'Turkey(Türkiye)',
    'uk': 'UK',
    'united-kingdom': 'UK',
    'usa': 'USA',
    'united-states': 'USA',
    'canada': 'Canada',
    'australia-and-new-zealand': 'Australia & New Zealand',
    'bosnia-and-herzegovina': 'Bosnia & Herzegovina',
    'usacanada': 'USA/Canada',
    'usa-canada': 'USA/Canada',
    'egypt': 'Egypt',
    'chinahong-kongmacau': 'China/Hong Kong/Macau',
    'china-hong-kong-macau': 'China/Hong Kong/Macau',
    'china-hongkong-macau': 'China/Hong Kong/Macau',
  };
  
  return slugToDbName[slug.toLowerCase()] || null;
}
