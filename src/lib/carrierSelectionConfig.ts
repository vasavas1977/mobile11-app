/**
 * Countries that require explicit carrier selection.
 * Only add countries where the carrier choice represents
 * genuinely different products (different providers, networks, pricing).
 * 
 * Do NOT add countries where carrier variations are just
 * formatting differences from imports.
 */
export const CARRIER_SELECTION_COUNTRIES = new Set([
  'China',
  'Japan',
  'Thailand',
  'Russia',
  'Croatia',
  'Iceland',
  'Hungary',
  'Poland',
  'Belgium',
  'Czech Republic',
  
  // TUGE expansion destinations with multiple carriers
  'Indonesia',
  'Philippines',
  'Taiwan',
  
  'Turkey(Türkiye)',
  'Cambodia',
  'Saudi Arabia',
  'Laos',
  'Albania',
  'Bosnia & Herzegovina',
  'Bulgaria',
  'Cyprus',
  'Estonia',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Montenegro',
  'Romania',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Ukraine',
  'Australia',
  'USA',
  'Hong Kong',
  'Macau',
]);

export function requiresCarrierSelection(countryName: string): boolean {
  return CARRIER_SELECTION_COUNTRIES.has(countryName);
}

/**
 * Preferred default carrier per country.
 * When set, this carrier is selected by default instead of cheapest.
 */
export const PREFERRED_DEFAULT_CARRIER: Record<string, string> = {
  'Thailand': 'Real Future (Truemove)',
  'Russia': 'MTS',
};

/**
 * Countries where packages should be grouped by country_name instead of carrier.
 * Used for multi-destination bundles (e.g., Hong Kong + Hong Kong/Macau + China/Hong Kong/Macau).
 */
export const COUNTRY_NAME_GROUPED: Set<string> = new Set(['Hong Kong', 'Macau']);

/**
 * Display name overrides for country_name grouping.
 * Maps raw DB country_name → user-friendly display label.
 */
export const COUNTRY_NAME_DISPLAY: Record<string, string> = {
  'Hong Kong': 'Hong Kong',
  'Macau': 'Macau',
  'Hong Kong/Macau': 'Hong Kong & Macau',
  'China/Hong Kong/Macau': 'China, Hong Kong & Macau',
};

export function isCountryNameGrouped(countryName: string): boolean {
  return COUNTRY_NAME_GROUPED.has(countryName);
}

/**
 * Local carrier names for country-name-grouped destinations.
 * Maps the page's country → actual local carrier (from country_carriers DB).
 * Used instead of provider brand (e.g., "CTExcel") which is not a carrier.
 */
const LOCAL_CARRIER_FOR_COUNTRY: Record<string, string> = {
  'Hong Kong': 'CMHK',
  'Macau': 'CTM',
};

/**
 * For country-name-grouped destinations, returns the local carrier name
 * instead of the provider brand from the package data.
 */
export function getLocalCarrierForGrouped(countryName: string): string | undefined {
  return LOCAL_CARRIER_FOR_COUNTRY[countryName];
}

export function getCountryNameDisplayLabel(countryName: string): string {
  return COUNTRY_NAME_DISPLAY[countryName] || countryName;
}

/**
 * Get the preferred carrier for a country if configured.
 * Returns the matching carrier from availableCarriers, or null if no preference.
 */
export function getPreferredCarrier(
  countryName: string,
  availableCarriers: string[]
): string | null {
  const preferred = PREFERRED_DEFAULT_CARRIER[countryName];
  if (!preferred) return null;
  
  // Exact match first
  if (availableCarriers.includes(preferred)) {
    return preferred;
  }
  
  // Partial match (e.g., "Truemove" matches "Real Future (Truemove)")
  const match = availableCarriers.find(c => 
    c.toLowerCase().includes(preferred.toLowerCase()) ||
    preferred.toLowerCase().includes(c.toLowerCase())
  );
  
  return match || null;
}

/**
 * Find the cheapest carrier across ALL package types.
 * Used for initial auto-selection before user picks a type.
 * This breaks the deadlock where carrier selection waits for package type.
 */
/**
 * Display name overrides for carriers with inconsistent naming across package types.
 * Maps raw DB carrier names → unified display names, keyed by country.
 */
export const CARRIER_DISPLAY_OVERRIDES: Record<string, Record<string, string>> = {
  'Hong Kong': {
    // Not used for carrier field — HK uses country_name-based grouping
  },
  'Macau': {
    // Not used for carrier field — Macau uses country_name-based grouping
  },
  'Iceland': {
    'Fjarskipti/Nova': 'Nova + Vodafone/Sýn',
  },
  'Australia': {
    'Optus': 'Optus/Vodafone',
    'Optus/Vodafone': 'Optus/Vodafone',
    'Vodafone': 'Optus/Vodafone',
  },
  'Indonesia': {
    'XL (Excelcom) / Indosat / Telkomsel': 'XL/Indosat/Telkomsel',
    'XL(Excelcom)/Telkomsel': 'XL/Indosat/Telkomsel',
    'Telkomsel/XL': 'XL/Indosat/Telkomsel',
  },
  'Philippines': {
    'Smart': 'Smart/Globe',
    'Smart / Globe': 'Smart/Globe',
    'Globe/Smart': 'Smart/Globe',
  },
  'USA': {
    'T-Mobile/AT&T': 'AT&T / T-Mobile',
    'T-Mobile': 'AT&T / T-Mobile',
    'AT&T': 'AT&T / T-Mobile',
    'AT&T / T-Mobile': 'AT&T / T-Mobile',
  },
};

/**
 * Get the display name for a carrier, applying overrides if configured.
 */
export function getCarrierDisplayName(country: string, carrier: string): string {
  return CARRIER_DISPLAY_OVERRIDES[country]?.[carrier] || carrier;
}

/**
 * Get all raw DB carrier names that map to a given display name.
 * Used when filtering packages by the selected (display) carrier.
 */
export function getRawCarriersForDisplay(country: string, displayName: string): string[] {
  const overrides = CARRIER_DISPLAY_OVERRIDES[country];
  if (!overrides) return [displayName];
  const rawNames = Object.entries(overrides)
    .filter(([_, display]) => display === displayName)
    .map(([raw]) => raw);
  return rawNames.length > 0 ? rawNames : [displayName];
}

export function getCheapestCarrierOverall(
  packages: Array<{ carrier?: string; price: number }>
): string | null {
  const carrierMinPrices: Record<string, number> = {};
  
  packages.forEach(pkg => {
    if (pkg.carrier && pkg.price > 0) {
      if (!carrierMinPrices[pkg.carrier] || pkg.price < carrierMinPrices[pkg.carrier]) {
        carrierMinPrices[pkg.carrier] = pkg.price;
      }
    }
  });
  
  let cheapestCarrier: string | null = null;
  let lowestPrice = Infinity;
  
  for (const [carrier, minPrice] of Object.entries(carrierMinPrices)) {
    if (minPrice < lowestPrice) {
      lowestPrice = minPrice;
      cheapestCarrier = carrier;
    }
  }
  
  return cheapestCarrier;
}

/**
 * Find the cheapest carrier for a specific package type.
 * Compares prices ONLY within the same plan type (e.g., comparing
 * Limitless packages across carriers, not Limitless vs Max Speed).
 */
export function getCheapestCarrierForType(
  packages: Array<{ carrier?: string; price: number; package_type?: string | null }>,
  packageType: string
): string | null {
  // Filter to only packages of this type
  const typePackages = packages.filter(pkg => pkg.package_type === packageType);
  
  const carrierMinPrices: Record<string, number> = {};
  
  typePackages.forEach(pkg => {
    if (pkg.carrier && pkg.price > 0) {
      if (!carrierMinPrices[pkg.carrier] || pkg.price < carrierMinPrices[pkg.carrier]) {
        carrierMinPrices[pkg.carrier] = pkg.price;
      }
    }
  });
  
  // Find carrier with lowest min price for this type
  let cheapestCarrier: string | null = null;
  let lowestPrice = Infinity;
  
  for (const [carrier, minPrice] of Object.entries(carrierMinPrices)) {
    if (minPrice < lowestPrice) {
      lowestPrice = minPrice;
      cheapestCarrier = carrier;
    }
  }
  
  return cheapestCarrier;
}

/**
 * Countries where specific providers should be hidden from the storefront.
 * Used to avoid confusing duplicate packages from multiple providers.
 */
export const EXCLUDED_PROVIDERS_BY_COUNTRY: Record<string, Set<string>> = {
  'South Korea': new Set(['usimsa']),
};

export function getExcludedProviders(countryName: string): Set<string> {
  return EXCLUDED_PROVIDERS_BY_COUNTRY[countryName] || new Set();
}
