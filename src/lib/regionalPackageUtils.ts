import { CarrierInfo, IncludedCountry, RegionalPackageData } from './excelRegionalParser';
import { getRegionPresetForName, ASIA_13, ASIA_3, ASIA_8, EUROPE_42, GLOBAL_109, HONGKONG_MACAU, CHINA_HONGKONG_MACAU } from './regionPresets';

/**
 * Country aliases map for common abbreviations and alternative names
 */
const COUNTRY_ALIASES: Record<string, { names: string[]; codes: string[] }> = {
  uk: { names: ['united kingdom', 'great britain', 'britain'], codes: ['gb', 'uk'] },
  england: { names: ['united kingdom'], codes: ['gb'] },
  usa: { names: ['united states', 'america', 'united states of america'], codes: ['us', 'usa'] },
  us: { names: ['united states', 'america', 'united states of america'], codes: ['us', 'usa'] },
  uae: { names: ['united arab emirates'], codes: ['ae', 'uae'] },
  korea: { names: ['south korea', 'republic of korea'], codes: ['kr'] },
  china: { names: ['china', 'peoples republic of china'], codes: ['cn'] },
  thailand: { names: ['thailand'], codes: ['th'] },
  vietnam: { names: ['vietnam', 'viet nam'], codes: ['vn'] },
  japan: { names: ['japan'], codes: ['jp'] },
  singapore: { names: ['singapore'], codes: ['sg'] },
  malaysia: { names: ['malaysia'], codes: ['my'] },
};

/**
 * Normalize country query term to check against names and codes
 */
function normalizeCountryQuery(term: string): { names: Set<string>; codes: Set<string> } {
  // Decode URI component first, then normalize hyphens to spaces
  let t = term;
  try {
    t = decodeURIComponent(t);
  } catch {
    // Already decoded or invalid encoding, continue with original
  }
  
  // Normalize: hyphens to spaces, collapse multiple spaces, lowercase, trim
  t = t
    .replace(/-/g, ' ')  // new-zealand → new zealand
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
  
  const names = new Set<string>([t]);
  const codes = new Set<string>();
  
  if (COUNTRY_ALIASES[t]) {
    COUNTRY_ALIASES[t].names.forEach(n => names.add(n));
    COUNTRY_ALIASES[t].codes.forEach(c => codes.add(c));
  }
  
  // If it looks like a code (2-3 letters), include it as a code
  if (t.length >= 2 && t.length <= 3) {
    codes.add(t);
  }
  
  return { names, codes };
}

/**
 * Parse included_countries JSONB data from database
 * Handles both object and stringified JSON formats
 */
export function parseIncludedCountries(jsonData: any): RegionalPackageData | null {
  if (!jsonData) return null;
  
  let obj = jsonData;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  
  return obj?.countries?.length ? obj as RegionalPackageData : null;
}

/**
 * Get regional data from package, with fallback to presets
 * Prioritizes curated presets over database data for known regional packages
 */
export function getRegionalData(pkg: any): RegionalPackageData | null {
  // First check for curated presets (prefer curated data for known packages)
  const preset = getRegionPresetForName(pkg?.country_name || pkg?.name || '');
  if (preset) return preset;  // Use preset if available
  
  // Fall back to database data (for custom regional packages)
  const parsed = parseIncludedCountries(pkg?.included_countries);
  if (parsed) return parsed;
  
  return null;
}

/**
 * Format countries list for display
 */
export function formatCountriesList(countries: IncludedCountry[], limit?: number): string {
  if (!countries || countries.length === 0) return '';
  
  const displayCountries = limit ? countries.slice(0, limit) : countries;
  const names = displayCountries.map(c => c.name).join(', ');
  
  if (limit && countries.length > limit) {
    return `${names}, +${countries.length - limit} more`;
  }
  
  return names;
}

/**
 * Search within regional package included countries
 * Uses getRegionalData to support both DB and preset data
 */
export function searchInRegionalPackage(pkg: any, searchTerm: string): boolean {
  const data = getRegionalData(pkg);
  if (!data) return false;
  
  const term = searchTerm.toLowerCase();
  return data.countries.some(country =>
    country.name.toLowerCase().includes(term) ||
    country.code.toLowerCase() === term ||
    country.carriers?.some(carrier => 
      carrier.name.toLowerCase().includes(term)
    )
  );
}

/**
 * Get all unique countries from regional packages
 */
export function getAllCountriesFromRegionalPackages(packages: any[]): Set<string> {
  const countries = new Set<string>();
  
  packages.forEach(pkg => {
    const data = getRegionalData(pkg);
    if (data) {
      data.countries.forEach(country => {
        countries.add(country.name);
      });
    }
  });
  
  return countries;
}

/**
 * Format network types for display
 */
export function formatNetworks(networks: string[]): string {
  if (!networks || networks.length === 0) return '';
  return networks.join(' • ');
}

/**
 * Check if package has regional data
 * Now uses getRegionalData to support both DB and preset data
 */
export function isRegionalPackage(pkg: any): boolean {
  const data = getRegionalData(pkg);
  return !!(data?.countries?.length && data.countries.length > 1);
}

/**
 * Get country count from regional package
 * Now uses getRegionalData to support both DB and preset data
 */
export function getCountryCount(pkg: any): number {
  const data = getRegionalData(pkg);
  return data?.countries?.length || 0;
}

/**
 * Check if a package includes a specific country by name, code, or alias
 */
export function includesCountry(pkg: any, country: string): boolean {
  const data = getRegionalData(pkg);
  if (!data) return false;
  
  const { names, codes } = normalizeCountryQuery(country);
  
  return data.countries.some(c => {
    const countryName = c.name.toLowerCase();
    const countryCode = c.code.toLowerCase();
    return names.has(countryName) || codes.has(countryCode);
  });
}

/**
 * Get all unique network types available in a country from carrier data
 * Searches through regional presets to find carrier network information
 */
export function getCountryNetworks(
  countryName: string, 
  countryCode?: string,
  regionalData?: RegionalPackageData | null
): string | null {
  // First check provided regional data
  if (regionalData) {
    const country = regionalData.countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase() ||
      c.code.toLowerCase() === countryCode?.toLowerCase()
    );
    if (country && country.carriers.length > 0) {
      const networks = new Set<string>();
      country.carriers.forEach(carrier => {
        carrier.networks.forEach(net => networks.add(net));
      });
      if (networks.size > 0) {
        return Array.from(networks).sort().join(' / ');
      }
    }
  }
  
  // Search through all regional presets
  const allPresets = [ASIA_13, ASIA_3, ASIA_8, EUROPE_42, GLOBAL_109, HONGKONG_MACAU, CHINA_HONGKONG_MACAU];
  for (const preset of allPresets) {
    const country = preset.countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase() ||
      c.code.toLowerCase() === countryCode?.toLowerCase()
    );
    if (country && country.carriers.length > 0) {
      const networks = new Set<string>();
      country.carriers.forEach(carrier => {
        carrier.networks.forEach(net => networks.add(net));
      });
      if (networks.size > 0) {
        return Array.from(networks).sort().join(' / ');
      }
    }
  }
  
  return null;
}
