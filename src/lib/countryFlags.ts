// Country name to ISO 3166-1 alpha-2 code mapping
const countryNameToCode: Record<string, string> = {
  'thailand': 'TH',
  'malaysia': 'MY',
  'singapore': 'SG',
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'china': 'CN',
  'hong kong': 'HK',
  'taiwan': 'TW',
  'vietnam': 'VN',
  'indonesia': 'ID',
  'philippines': 'PH',
  'india': 'IN',
  'australia': 'AU',
  'new zealand': 'NZ',
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'canada': 'CA',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'spain': 'ES',
  'netherlands': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'portugal': 'PT',
  'greece': 'GR',
  'turkey': 'TR',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'saudi arabia': 'SA',
  'qatar': 'QA',
  'kuwait': 'KW',
  'bahrain': 'BH',
  'oman': 'OM',
  'egypt': 'EG',
  'south africa': 'ZA',
  'mexico': 'MX',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'russia': 'RU',
  'poland': 'PL',
  'czech republic': 'CZ',
  'hungary': 'HU',
  'romania': 'RO',
  'croatia': 'HR',
  'ireland': 'IE',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'iceland': 'IS',
  'cambodia': 'KH',
  'laos': 'LA',
  'myanmar': 'MM',
  'brunei': 'BN',
  'maldives': 'MV',
  'sri lanka': 'LK',
  'bangladesh': 'BD',
  'pakistan': 'PK',
  'nepal': 'NP',
  'bhutan': 'BT',
  'mongolia': 'MN',
  'macau': 'MO',
  'macao': 'MO',
  'asia 13 countries': '🌏',
  'europe': '🇪🇺',
  'global': '🌍',
  'world': '🌍',
};

/**
 * Converts a country code or name to a flag emoji
 * @param countryCode - Two-letter country code (e.g., "US", "TH", "GB") or country name
 * @param countryName - Optional country name for fallback lookup
 * @returns Flag emoji or fallback emoji
 */
export function getCountryFlag(countryCode: string | null | undefined, countryName?: string | null | undefined): string {
  // Try country code first
  if (countryCode && countryCode.trim()) {
    const code = countryCode.toUpperCase().trim();
    
    // Special cases
    if (code === 'GLOBAL' || code === 'WORLD') return '🌍';
    
    // Check if it's already an emoji
    if (code.startsWith('🌏') || code.startsWith('🌍') || code.startsWith('🇪🇺')) return code;
    
    if (code.length === 2) {
      // Convert country code to flag emoji
      // Flag emojis are made of regional indicator symbols
      // A = U+1F1E6, B = U+1F1E7, etc.
      const codePoints = [...code].map(char => {
        const charCode = char.charCodeAt(0);
        // Only convert A-Z
        if (charCode >= 65 && charCode <= 90) {
          return 0x1F1E6 + (charCode - 65);
        }
        return null;
      }).filter(Boolean) as number[];
      
      if (codePoints.length === 2) {
        return String.fromCodePoint(...codePoints);
      }
    }
  }
  
  // Fallback to country name lookup
  if (countryName && countryName.trim()) {
    const normalizedName = countryName.toLowerCase().trim();
    const mappedCode = countryNameToCode[normalizedName];
    
    if (mappedCode) {
      // If it's already an emoji, return it
      if (mappedCode.startsWith('🌏') || mappedCode.startsWith('🌍') || mappedCode.startsWith('🇪🇺')) {
        return mappedCode;
      }
      
      // Convert mapped code to flag emoji
      if (mappedCode.length === 2) {
        const codePoints = [...mappedCode].map(char => {
          const charCode = char.charCodeAt(0);
          if (charCode >= 65 && charCode <= 90) {
            return 0x1F1E6 + (charCode - 65);
          }
          return null;
        }).filter(Boolean) as number[];
        
        if (codePoints.length === 2) {
          return String.fromCodePoint(...codePoints);
        }
      }
    }
  }
  
  return '🏳️';
}
