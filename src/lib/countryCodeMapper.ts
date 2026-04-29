// Map country names to ISO 2-letter country codes
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'afghanistan': 'af',
  'albania': 'al',
  'algeria': 'dz',
  'argentina': 'ar',
  'armenia': 'am',
  'australia': 'au',
  'austria': 'at',
  'azerbaijan': 'az',
  'bahrain': 'bh',
  'bangladesh': 'bd',
  'belgium': 'be',
  'bolivia': 'bo',
  'bosnia and herzegovina': 'ba',
  'brazil': 'br',
  'brunei': 'bn',
  'bulgaria': 'bg',
  'cambodia': 'kh',
  'canada': 'ca',
  'chile': 'cl',
  'china': 'cn',
  'mainland china': 'cn',
  'colombia': 'co',
  'costa rica': 'cr',
  'croatia': 'hr',
  'cyprus': 'cy',
  'czech republic': 'cz',
  'czechia': 'cz',
  'denmark': 'dk',
  'dominican republic': 'do',
  'ecuador': 'ec',
  'egypt': 'eg',
  'el salvador': 'sv',
  'estonia': 'ee',
  'fiji': 'fj',
  'finland': 'fi',
  'france': 'fr',
  'georgia': 'ge',
  'germany': 'de',
  'ghana': 'gh',
  'greece': 'gr',
  'guatemala': 'gt',
  'hong kong': 'hk',
  'hongkong': 'hk',
  'hk': 'hk',
  'hungary': 'hu',
  'iceland': 'is',
  'india': 'in',
  'indonesia': 'id',
  'ireland': 'ie',
  'israel': 'il',
  'italy': 'it',
  'japan': 'jp',
  'jordan': 'jo',
  'kazakhstan': 'kz',
  'kenya': 'ke',
  'korea': 'kr',
  'south korea': 'kr',
  'kuwait': 'kw',
  'kyrgyzstan': 'kg',
  'laos': 'la',
  'latvia': 'lv',
  'liechtenstein': 'li',
  'lithuania': 'lt',
  'luxembourg': 'lu',
  'macau': 'mo',
  'macao': 'mo',
  'macedonia': 'mk',
  'north macedonia': 'mk',
  'malaysia': 'my',
  'maldives': 'mv',
  'malta': 'mt',
  'mauritius': 'mu',
  'mexico': 'mx',
  'moldova': 'md',
  'monaco': 'mc',
  'mongolia': 'mn',
  'montenegro': 'me',
  'morocco': 'ma',
  'myanmar': 'mm',
  'nepal': 'np',
  'netherlands': 'nl',
  'new zealand': 'nz',
  'nicaragua': 'ni',
  'nigeria': 'ng',
  'norway': 'no',
  'oman': 'om',
  'pakistan': 'pk',
  'panama': 'pa',
  'paraguay': 'py',
  'peru': 'pe',
  'philippines': 'ph',
  'poland': 'pl',
  'portugal': 'pt',
  'puerto rico': 'pr',
  'qatar': 'qa',
  'romania': 'ro',
  'russia': 'ru',
  'saudi arabia': 'sa',
  'serbia': 'rs',
  'singapore': 'sg',
  'slovakia': 'sk',
  'slovenia': 'si',
  'south africa': 'za',
  'spain': 'es',
  'sri lanka': 'lk',
  'sweden': 'se',
  'switzerland': 'ch',
  'taiwan': 'tw',
  'tajikistan': 'tj',
  'tanzania': 'tz',
  'thailand': 'th',
  'trinidad and tobago': 'tt',
  'tunisia': 'tn',
  'turkey': 'tr',
  'turkmenistan': 'tm',
  'ukraine': 'ua',
  'united arab emirates': 'ae',
  'uae': 'ae',
  'united kingdom': 'gb',
  'uk': 'gb',
  'united states': 'us',
  'usa': 'us',
  'uruguay': 'uy',
  'uzbekistan': 'uz',
  'venezuela': 've',
  'vietnam': 'vn',
  'viet nam': 'vn',
};

// Regional package patterns
const REGIONAL_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /europe/i, code: 'eu' },
  { pattern: /global/i, code: 'global' },
  { pattern: /asia/i, code: 'asia' },
  { pattern: /south\s*east\s*asia|sea/i, code: 'sea' },
  { pattern: /hong\s*kong.*macau|macau.*hong\s*kong/i, code: 'hk' },
  { pattern: /usa\s*[\/&]\s*canada/i, code: 'global' },
  { pattern: /singapore.*malaysia.*thailand/i, code: 'global' },
  { pattern: /australia.*new\s*zealand/i, code: 'global' },
];

/**
 * Normalize country name for lookup - handles variations
 */
function normalizeForLookup(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, '');
}

/**
 * Get ISO 2-letter country code from country name
 */
export function getCountryCodeFromName(countryName: string): string | null {
  if (!countryName) return null;
  
  const normalized = normalizeForLookup(countryName);
  
  // Direct lookup
  if (COUNTRY_NAME_TO_CODE[normalized]) {
    return COUNTRY_NAME_TO_CODE[normalized];
  }
  
  // Try without common prefixes/suffixes
  const withoutPrefix = normalized
    .replace(/^(mainland|republic of|the)\s+/i, '')
    .replace(/\s+(sar|special administrative region)$/i, '');
  
  if (COUNTRY_NAME_TO_CODE[withoutPrefix]) {
    return COUNTRY_NAME_TO_CODE[withoutPrefix];
  }
  
  // Try without parenthetical content e.g. "Turkey(Türkiye)" -> "turkey"
  const withoutParens = normalized.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (withoutParens !== normalized && COUNTRY_NAME_TO_CODE[withoutParens]) {
    return COUNTRY_NAME_TO_CODE[withoutParens];
  }
  
  return null;
}

/**
 * Extract primary country from multi-country name like "Hong Kong/Macau"
 * Returns the country code of the first/primary country
 */
export function extractPrimaryCountryCode(countryName: string): string | null {
  if (!countryName) return null;
  
  // First try direct lookup
  const direct = getCountryCodeFromName(countryName);
  if (direct) return direct;
  
  // Handle multi-country names by splitting on common delimiters
  const delimiters = /[\/,&+]|\s+and\s+/i;
  const parts = countryName.split(delimiters).map(s => s.trim()).filter(Boolean);
  
  if (parts.length > 0) {
    // Try to find the first resolvable country
    for (const part of parts) {
      const code = getCountryCodeFromName(part);
      if (code) return code;
    }
  }
  
  // Check for regional patterns and return first country if applicable
  for (const { pattern, code } of REGIONAL_PATTERNS) {
    if (pattern.test(countryName)) {
      return code;
    }
  }
  
  return null;
}

/**
 * Check if a country name represents a regional/multi-country package
 */
export function isRegionalPackage(countryName: string): boolean {
  if (!countryName) return false;
  return /\d+\s*countries/i.test(countryName) || 
         REGIONAL_PATTERNS.some(r => r.pattern.test(countryName));
}

/**
 * Get the appropriate code for a regional package
 */
export function getRegionalCode(countryName: string): string | null {
  if (!countryName) return null;
  
  for (const { pattern, code } of REGIONAL_PATTERNS) {
    if (pattern.test(countryName)) {
      return code;
    }
  }
  
  return null;
}
