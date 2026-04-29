/**
 * Country name to ISO code mapping for TUGE package imports
 * Used to convert human-readable country names to 2-letter ISO codes
 */

const COUNTRY_CODE_MAP: Record<string, string> = {
  // Asia
  'japan': 'JP',
  'korea': 'KR',
  'south korea': 'KR',
  'north korea': 'KP',
  'thailand': 'TH',
  'vietnam': 'VN',
  'viet nam': 'VN',
  'singapore': 'SG',
  'malaysia': 'MY',
  'indonesia': 'ID',
  'philippines': 'PH',
  'cambodia': 'KH',
  'laos': 'LA',
  'myanmar': 'MM',
  'brunei': 'BN',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'macau': 'MO',
  'macao': 'MO',
  'china': 'CN',
  'mainland china': 'CN',
  'mongolia': 'MN',
  'india': 'IN',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'sri lanka': 'LK',
  'nepal': 'NP',
  'bhutan': 'BT',
  'maldives': 'MV',
  
  // Middle East
  'united arab emirates': 'AE',
  'uae': 'AE',
  'dubai': 'AE',
  'saudi arabia': 'SA',
  'qatar': 'QA',
  'kuwait': 'KW',
  'bahrain': 'BH',
  'oman': 'OM',
  'israel': 'IL',
  'jordan': 'JO',
  'lebanon': 'LB',
  'turkey': 'TR',
  'iran': 'IR',
  'iraq': 'IQ',
  
  // Europe
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'spain': 'ES',
  'portugal': 'PT',
  'netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'ireland': 'IE',
  'poland': 'PL',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'hungary': 'HU',
  'greece': 'GR',
  'romania': 'RO',
  'croatia': 'HR',
  'bulgaria': 'BG',
  'slovenia': 'SI',
  'slovakia': 'SK',
  'estonia': 'EE',
  'latvia': 'LV',
  'lithuania': 'LT',
  'luxembourg': 'LU',
  'malta': 'MT',
  'cyprus': 'CY',
  'iceland': 'IS',
  'russia': 'RU',
  'ukraine': 'UA',
  
  // Americas
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'canada': 'CA',
  'mexico': 'MX',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'bolivia': 'BO',
  'paraguay': 'PY',
  'uruguay': 'UY',
  'panama': 'PA',
  'costa rica': 'CR',
  'guatemala': 'GT',
  'honduras': 'HN',
  'el salvador': 'SV',
  'nicaragua': 'NI',
  'puerto rico': 'PR',
  'jamaica': 'JM',
  'bahamas': 'BS',
  'dominican republic': 'DO',
  'cuba': 'CU',
  'haiti': 'HT',
  'trinidad and tobago': 'TT',
  
  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',
  'fiji': 'FJ',
  'papua new guinea': 'PG',
  'guam': 'GU',
  
  // Africa
  'south africa': 'ZA',
  'egypt': 'EG',
  'morocco': 'MA',
  'kenya': 'KE',
  'nigeria': 'NG',
  'ghana': 'GH',
  'tanzania': 'TZ',
  'ethiopia': 'ET',
  'uganda': 'UG',
  'algeria': 'DZ',
  'tunisia': 'TN',
  'libya': 'LY',
  'zimbabwe': 'ZW',
  'senegal': 'SN',
  'ivory coast': 'CI',
  'cote d\'ivoire': 'CI',
  'cameroon': 'CM',
  'namibia': 'NA',
  'botswana': 'BW',
  'mauritius': 'MU',
  'zambia': 'ZM',
  'rwanda': 'RW',
  
  // Central Asia
  'kazakhstan': 'KZ',
  'uzbekistan': 'UZ',
  'turkmenistan': 'TM',
  'tajikistan': 'TJ',
  'kyrgyzstan': 'KG',
  'afghanistan': 'AF',
  
  // Regional packages - use first country or special codes
  'asia': 'ASIA',
  'europe': 'EU',
  'america': 'AM',
  'north america': 'NA',
  'south america': 'SA',
  'global': 'GLOBAL',
  'worldwide': 'GLOBAL',
  'global 109 countries': 'GLOBAL109',
  'golbal 109 countries': 'GLOBAL109',  // Handle typo in USIMSA spreadsheet
};

/**
 * Get ISO country code from country name
 * @param countryName Human-readable country name (e.g., "Japan", "South Korea")
 * @returns 2-letter ISO code or 'XX' if unknown
 */
export function getCountryCode(countryName: string): string {
  if (!countryName) return 'XX';
  const normalized = countryName.toLowerCase().trim();
  return COUNTRY_CODE_MAP[normalized] || 'XX';
}

/**
 * Get country name from ISO code (reverse lookup)
 * @param countryCode 2-letter ISO code
 * @returns Country name or the code itself if not found
 */
export function getCountryName(countryCode: string): string {
  const code = countryCode.toUpperCase();
  for (const [name, mappedCode] of Object.entries(COUNTRY_CODE_MAP)) {
    if (mappedCode === code) {
      // Capitalize first letter of each word
      return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return countryCode;
}

/**
 * Check if a country code is valid (exists in our mapping)
 */
export function isValidCountryCode(countryCode: string): boolean {
  const values = Object.values(COUNTRY_CODE_MAP);
  return values.includes(countryCode.toUpperCase());
}
