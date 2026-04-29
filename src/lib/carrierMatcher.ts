/**
 * Carrier/Operator matching utilities for comparing packages across providers
 */

/**
 * Normalize a carrier name into searchable tokens
 * "Softbank / KDDI" -> ["softbank", "kddi"]
 * "Real Future (Truemove)" -> ["real", "future", "truemove"]
 * "XL (Excelcom) / Indosat / Telkomsel" -> ["xl", "excelcom", "indosat", "telkomsel"]
 */
export function normalizeCarrier(carrier: string): string[] {
  if (!carrier) return [];
  
  return carrier
    .toLowerCase()
    .replace(/[()]/g, ' ')  // Replace parentheses with spaces
    .replace(/[-_]/g, ' ')  // Replace dashes/underscores with spaces
    .split(/[\/,\s]+/)      // Split by slash, comma, or whitespace
    .map(s => s.trim())
    .filter(s => s.length > 1);  // Filter out single characters
}

/**
 * Calculate match score between two carrier strings (0-1)
 */
export function getCarrierMatchScore(carrier1: string, carrier2: string): number {
  const tokens1 = normalizeCarrier(carrier1);
  const tokens2 = normalizeCarrier(carrier2);
  
  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }
  
  // Count matching tokens (with fuzzy matching for partial matches)
  let matches = 0;
  for (const t1 of tokens1) {
    for (const t2 of tokens2) {
      if (t1 === t2) {
        matches += 1;
        break;
      }
      // Partial match (one contains the other)
      if (t1.includes(t2) || t2.includes(t1)) {
        matches += 0.7;
        break;
      }
    }
  }
  
  const total = Math.max(tokens1.length, tokens2.length);
  return Math.min(matches / total, 1);
}

/**
 * Regional package aliases for fuzzy matching
 */
const REGIONAL_ALIASES: Record<string, string[]> = {
  'asia': ['asia 13 countries', 'asia pacific', 'apac', 'asia 8 countries'],
  'europe': ['europe 42 countries', 'europe 39 countries', 'eu', 'european union', 'europe 42 countries + 2stopover'],
  'global': ['global 109 countries', 'global 151 countries', 'worldwide', 'global 84 countries'],
  'southeast asia': ['south east asia 3 countries', 'south east asia 8 countries', 'sea', 'asean'],
  'middle east': ['middle east 6 countries', 'gcc'],
  'africa': ['africa 15 countries', 'africa 18 countries', 'africa 20 countries'],
  'latin america': ['latam', 'south america', 'central america'],
  'north america': ['usa canada mexico', 'usa and canada'],
};

/**
 * Normalize country name for comparison
 */
export function normalizeCountry(country: string): string {
  if (!country) return '';
  
  return country
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Handle common variations
    .replace('south korea', 'korea')
    .replace('korea, south', 'korea')
    .replace('united states', 'usa')
    .replace('united kingdom', 'uk')
    .replace('hong kong sar', 'hong kong')
    .replace('hong kong, china', 'hong kong')
    .replace('macau', 'macao')
    .replace('taiwan, china', 'taiwan');
}

/**
 * Calculate match score between two country names (0-1)
 * Handles regional packages like "Asia" vs "Asia 13 Countries"
 */
export function getCountryMatchScore(country1: string, country2: string): number {
  const norm1 = normalizeCountry(country1);
  const norm2 = normalizeCountry(country2);
  
  // Exact match
  if (norm1 === norm2) return 1;
  
  // Check regional aliases
  for (const [base, aliases] of Object.entries(REGIONAL_ALIASES)) {
    const allVariants = [base, ...aliases];
    const match1 = allVariants.find(v => norm1.includes(v) || v.includes(norm1));
    const match2 = allVariants.find(v => norm2.includes(v) || v.includes(norm2));
    if (match1 && match2) {
      return 0.9; // High score for same regional group
    }
  }
  
  // One contains the other (e.g., "asia" is contained in "asia 13 countries")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length < norm2.length ? norm2 : norm1;
    // Give higher score for significant overlap
    const ratio = shorter.length / longer.length;
    return Math.max(0.5, ratio);
  }
  
  // Token-based matching for multi-word regions
  const tokens1 = norm1.split(' ').filter(t => t.length > 2 && !['and', 'the', 'countries'].includes(t));
  const tokens2 = norm2.split(' ').filter(t => t.length > 2 && !['and', 'the', 'countries'].includes(t));
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  let matches = 0;
  for (const t1 of tokens1) {
    if (tokens2.some(t2 => t1.includes(t2) || t2.includes(t1))) {
      matches++;
    }
  }
  
  return matches > 0 ? (matches / Math.max(tokens1.length, tokens2.length)) * 0.8 : 0;
}

/**
 * Normalize data amount to GB for comparison
 * Handles human-readable formats:
 * "2GB" -> 2, "500MB" -> 0.5, "Unlimited" -> null
 * "1GB for 3 days" -> 1, "500MB per day" -> 0.5
 * "No limit" -> null, "无限" -> null
 */
export function normalizeDataAmount(dataAmount: string): number | null {
  if (!dataAmount) return null;
  
  const str = dataAmount.toString().toLowerCase().trim();
  
  // Handle unlimited (extended patterns)
  if (str.includes('unlimited') || str.includes('∞') || 
      str.includes('no limit') || str.includes('nolimit') ||
      str.includes('无限') || str.includes('limitless') ||
      str.includes('infinity') || str === 'ulmt') {
    return null;
  }
  
  // Handle daily data patterns: "1GB/Day", "500MB per day", "2 GB / day"
  const dailyMatch = str.match(/(\d+(?:\.\d+)?)\s*(gb|mb)\s*(?:\/|\s+per\s+|\s*every\s*)?\s*day/i);
  if (dailyMatch) {
    let value = parseFloat(dailyMatch[1]);
    if (dailyMatch[2].toLowerCase() === 'mb') {
      value = value / 1024;
    }
    return value;
  }
  
  // Handle combined format with shorthand units: "50GB /10 Days", "500M", "2G for 7 days"
  // Supports: GB, G, MB, M, TB, T
  const combinedMatch = str.match(/(\d+(?:\.\d+)?)\s*(g|gb|m|mb|t|tb)\b/i);
  if (combinedMatch) {
    let value = parseFloat(combinedMatch[1]);
    const unit = combinedMatch[2].toLowerCase();
    // Normalize shorthand units: M=MB, G=GB, T=TB
    if (unit === 'm' || unit === 'mb') value = value / 1024;
    if (unit === 't' || unit === 'tb') value = value * 1024;
    // 'g' and 'gb' stay as-is (already in GB)
    return value;
  }
  
  // Handle plain number with implicit GB (e.g., "5" in a "Data (GB)" column)
  const plainNumber = str.match(/^(\d+(?:\.\d+)?)$/);
  if (plainNumber) {
    return parseFloat(plainNumber[1]);
  }
  
  return null;
}

/**
 * Normalize package type to standard format
 * STRICT: Only detect day_pass from explicit patterns, NOT from "day" appearing in validity strings like "7DAY"
 */
export function normalizePackageType(packageType: string, dataAmount?: string, qosSpeed?: string): 'day_pass' | 'max_speed' | 'limitless' {
  const lower = (packageType || '').toLowerCase().trim();
  const dataLower = (dataAmount || '').toLowerCase().trim();
  
  // Check for unlimited/limitless first (highest priority)
  if (lower.includes('unlimited') || lower.includes('limitless') || 
      dataLower.includes('unlimited') || dataLower.includes('∞') ||
      lower === 'daily_pack' || lower.includes('daily_pack - unlimited')) {
    return 'limitless';
  }
  
  // Check for daily data packages - STRICT patterns only
  // Must be explicit "day_pass", "per day", "/day", or "daily" as a standalone word
  const dayPassPatterns = [
    'day_pass',
    'daypass', 
    'per day',
    '/day',
    'every day',
    'each day',
  ];
  
  // Check packageType for explicit day_pass patterns
  for (const pattern of dayPassPatterns) {
    if (lower.includes(pattern)) {
      return 'day_pass';
    }
  }
  
  // Check dataAmount for per-day patterns (e.g., "500MB/day", "1GB per day")
  if (dataLower.includes('/day') || dataLower.includes('per day') || 
      dataLower.includes('every day') || dataLower.includes('each day')) {
    return 'day_pass';
  }
  
  // "daily" only counts if it's about data reset, not just a word in validity
  // e.g., "daily data" or "daily reset" = day_pass, but "7 daily" in optionId = not day_pass
  if (/\bdaily\s*(data|reset|pack|plan|limit)\b/i.test(lower) || 
      /\bdaily\s*(data|reset|pack|plan|limit)\b/i.test(dataLower)) {
    return 'day_pass';
  }
  
  // Default to max_speed for fixed data packages
  return 'max_speed';
}

/**
 * Calculate cost per GB for a package
 */
export function calculateCostPerGb(
  packageType: 'day_pass' | 'max_speed' | 'limitless',
  costPrice: number,
  dataAmount: string,
  validityDays: number
): number | null {
  if (!costPrice || costPrice <= 0) return null;
  
  const dataGb = normalizeDataAmount(dataAmount);
  
  if (dataGb === null) {
    // Unlimited packages - cannot calculate $/GB
    return null;
  }
  
  if (packageType === 'day_pass') {
    // Day pass: cost / (data_per_day * days)
    const totalData = dataGb * validityDays;
    return totalData > 0 ? costPrice / totalData : null;
  }
  
  // Max speed: cost / total_data
  return dataGb > 0 ? costPrice / dataGb : null;
}

export interface MatchResult {
  matchType: 'exact' | 'carrier_fuzzy' | 'country_only' | 'no_match';
  score: number;
  carrierScore: number;
}

/**
 * Calculate match quality between two packages
 * IMPORTANT: Validity days must match exactly for accurate price comparison
 */
export function calculateMatchQuality(
  country1: string,
  carrier1: string,
  packageType1: string,
  dataAmount1: string,
  validity1: number,
  country2: string,
  carrier2: string,
  packageType2: string,
  dataAmount2: string,
  validity2: number
): MatchResult {
  // Check country match first
  if (normalizeCountry(country1) !== normalizeCountry(country2)) {
    return { matchType: 'no_match', score: 0, carrierScore: 0 };
  }
  
  // STRICT: Validity days must match exactly for meaningful price comparison
  // A 3-day package cannot be compared to a 1-day or 30-day package
  if (validity1 !== validity2) {
    return { matchType: 'no_match', score: 0, carrierScore: 0 };
  }
  
  // Data amount must match for fair comparison
  const data1 = normalizeDataAmount(dataAmount1);
  const data2 = normalizeDataAmount(dataAmount2);
  const dataMatch = (data1 === null && data2 === null) || 
                    (data1 !== null && data2 !== null && Math.abs(data1 - data2) < 0.1);
  
  if (!dataMatch) {
    return { matchType: 'no_match', score: 0, carrierScore: 0 };
  }
  
  // STRICT: Package type must match exactly
  // max_speed can only compare to max_speed, day_pass to day_pass, limitless to limitless
  const type1 = normalizePackageType(packageType1, dataAmount1);
  const type2 = normalizePackageType(packageType2, dataAmount2);
  if (type1 !== type2) {
    return { matchType: 'no_match', score: 0, carrierScore: 0 };
  }
  
  // Calculate carrier score
  const carrierScore = getCarrierMatchScore(carrier1, carrier2);
  
  // Score based on carrier match - type, validity, and data are hard requirements now
  const totalScore = 0.5 + (carrierScore * 0.5);
  
  let matchType: 'exact' | 'carrier_fuzzy' | 'country_only';
  if (carrierScore >= 0.8) {
    matchType = 'exact';
  } else if (carrierScore >= 0.3) {
    matchType = 'carrier_fuzzy';
  } else {
    matchType = 'country_only';
  }
  
  return { matchType, score: totalScore, carrierScore };
}
