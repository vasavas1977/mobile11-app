/**
 * TUGE Excel File Parser for price comparison
 * Handles flexible Excel formats with debug mode and manual column mapping
 */

import { normalizePackageType, calculateCostPerGb } from './carrierMatcher';

export interface TugePackage {
  optionId: string;
  country: string;
  carrier: string;
  packageType: 'day_pass' | 'max_speed' | 'limitless';
  dataAmount: string;
  validityDays: number;
  qosSpeed: string | null;
  b2bPrice: number;
  normalPrice: number;
  minSellPrice: number;
  networkType: string | null;
  costPerGb: number | null;
  rawRow: Record<string, any>;
}

export interface SkippedRowDetail {
  rowIndex: number;
  reason: 'missing_country' | 'missing_price' | 'empty_row' | 'parse_error';
  rawData: any[];
  country?: string;
  price?: string;
  dataField?: string;
}

export interface ParseResult {
  packages: TugePackage[];
  sheetName: string;
  totalRows: number;
  parsedRows: number;
  errors: string[];
  // Debug info for UI
  rawData?: any[][];
  headerRowIndex?: number;
  columnMap?: Record<string, number>;
  availableSheets?: string[];
  // Skipped row tracking
  skippedRows?: {
    total: number;
    missingCountry: number;
    missingPrice: number;
    emptyRow: number;
    parseError: number;
    details: SkippedRowDetail[];
  };
}

// Comprehensive header variations for flexible matching
const HEADER_MAPPINGS: Record<string, string[]> = {
  optionId: [
    'option id', 'option id (for api)', 'option_id', 'optionid',
    'api call', 'package id', 'code', 'option', 'api code', 
    'product code', 'sku', 'product id', 'package code',
    'option id（for api）', 'api id', 'plan id', 'plan code',
    'item code', 'item id', 'reference', 'ref', 'id',
    'api product code (auto activate)', 'auto activate'
  ],
  // Secondary optionId for TUGE files with separate "Designated Date Activate" column
  optionIdAlt: [
    'api product code (designated date activate)', 'designated date activate',
    'designated activate', 'scheduled activate', 'future activate'
  ],
  country: [
    'country', 'destination', 'country/region', 'country & region',
    'coverage', 'location', 'country name', 'plan name', 'package name',
    'countries', 'market', 'country/area', 'destination country', 'target country'
    // NOTE: 'region', 'area', 'zone', 'plan' REMOVED - they're too generic and cause wrong column mapping
  ],
  region: [
    'region', 'continent', 'area', 'zone', 'coverage area', 'territory'
  ],
  carrier: [
    'operator', 'carrier', 'network', 'provider', 'mno', 
    'operator name', 'network operator', 'local operator', 'carriers',
    'network name', 'telco', 'service provider', 'mobile network',
    'mobile operator', 'local network', 'partner'
  ],
  data: [
    'data', 'data amount', 'volume', 'quota', 'data (gb)', 'data(gb)', 
    'gb', 'data volume', 'package size', 'allowance', 'data size',
    'data allowance', 'data cap', 'traffic', 'data traffic',
    'data quota', 'total data', 'data limit', 'capacity'
  ],
  validity: [
    'day', 'days', 'validity', 'valid', 'duration', 'period', 
    'validity (days)', 'valid days', 'effective days', 'expiry',
    'valid period', 'validity period', 'life', 'active days',
    'package days', 'duration (days)', 'expire'
  ],
  b2bPrice: [
    'b2b', 'b2b price', 'cost', 'wholesale', 'cost price', 
    'b2b (usd)', 'b2b price (usd)', 'wholesale price', 'dealer price',
    'usd', 'price (usd)', 'unit price', 'your price', 'buy price',
    'purchase price', 'net price', 'partner price', 'reseller price',
    'b2b usd', 'cost (usd)', 'buying price', 'acquisition cost'
  ],
  normalPrice: [
    'normal', 'normal price', 'retail', 'rrp', 'price', 
    'suggested price', 'msrp', 'retail price', 'regular price', 'sell price',
    'selling price', 'list price', 'recommended price', 'srp',
    'public price', 'consumer price', 'end user price'
  ],
  minSellPrice: [
    'min sell', 'min selling', 'minimum', 'msrp', 'min sell price', 
    'floor price', 'minimum price', 'min price', 'min selling price',
    'minimum selling', 'price floor', 'lowest price', 'base price'
  ],
  qosSpeed: [
    'qos', 'speed', 'qos speed', 'bandwidth', 'mbps', 
    'max speed', 'network speed', 'speed limit', 'data speed',
    'speed cap', 'throttle', 'rate', 'download speed', 'dl speed'
  ],
  networkType: [
    'network type', '3g/4g/5g', 'type', 'tech', 'network', 'lte', '4g/5g',
    'technology', 'network tech', 'generation', 'access type', 'rat'
  ],
};

/**
 * Normalize header text for matching - handles multi-line headers and special chars
 */
function normalizeHeader(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[\n\r]+/g, ' ')  // Replace newlines with spaces
    .replace(/[（）]/g, (m) => m === '（' ? '(' : ')')  // Normalize Chinese parentheses
    .replace(/\s+/g, ' ')      // Normalize multiple spaces
    .replace(/[^\w\s\/&()-]/g, '') // Remove special chars except common ones
    .trim();
}

/**
 * Find the header row index by looking for key columns
 */
export function findHeaderRow(data: any[][]): number {
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const rowStr = row.map(c => normalizeHeader(c)).join(' ');
    
    // Check if this row contains multiple expected headers
    let matchCount = 0;
    const matchedFields: string[] = [];
    
    // Check each field type
    for (const [field, variations] of Object.entries(HEADER_MAPPINGS)) {
      for (const variation of variations) {
        if (rowStr.includes(variation)) {
          matchCount++;
          matchedFields.push(field);
          break;
        }
      }
    }
    
    // Need at least 3 matches for confidence
    if (matchCount >= 3) {
      console.log(`✅ Found header at row ${i} with ${matchCount} matches:`, matchedFields);
      return i;
    }
  }
  
  // Fallback: look for row with "id" or "option" or "country" as first non-empty cell concept
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const firstCells = row.slice(0, 5).map(c => normalizeHeader(c)).filter(Boolean);
    if (firstCells.some(c => /\b(option|country|region|plan|id|code)\b/.test(c))) {
      console.log(`🔍 Fallback header detection at row ${i}`);
      return i;
    }
  }
  
  console.log('❌ No header row found in first 30 rows');
  return -1;
}

/**
 * Map column indices to field names based on header row
 */
export function mapColumns(headerRow: any[]): Record<string, number> {
  const columnMap: Record<string, number> = {};

  headerRow.forEach((cell, index) => {
    const cellStr = normalizeHeader(cell);
    // Ignore empty header cells
    if (!cellStr) return;

    for (const [field, variations] of Object.entries(HEADER_MAPPINGS)) {
      // Check for exact match first, then partial match
      const exactMatch = variations.some(v => cellStr === v);
      const partialMatch = variations.some(v => cellStr.includes(v) || v.includes(cellStr));
      
      if (exactMatch || partialMatch) {
        // Only map if not already mapped (prefer earlier columns for same field)
        if (columnMap[field] === undefined) {
          columnMap[field] = index;
          console.log(`  📍 Mapped "${field}" to column ${index} ("${cellStr}")${exactMatch ? ' [exact]' : ' [partial]'}`);
        }
      }
    }
  });

  // Debug: Log critical mappings for verification
  console.log('📊 Column mapping result:', {
    country: columnMap.country !== undefined ? `col ${columnMap.country}` : 'NOT FOUND',
    region: columnMap.region !== undefined ? `col ${columnMap.region}` : 'NOT FOUND',
    optionId: columnMap.optionId !== undefined ? `col ${columnMap.optionId}` : 'NOT FOUND',
    optionIdAlt: columnMap.optionIdAlt !== undefined ? `col ${columnMap.optionIdAlt}` : 'NOT FOUND',
    data: columnMap.data !== undefined ? `col ${columnMap.data}` : 'NOT FOUND',
    b2bPrice: columnMap.b2bPrice !== undefined ? `col ${columnMap.b2bPrice}` : 'NOT FOUND',
  });

  return columnMap;
}

/**
 * Word-to-number mapping for human language parsing
 */
const WORD_NUMBERS: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20,
  'thirty': 30, 'sixty': 60, 'ninety': 90
};

/**
 * Parse validity days from human-readable text
 * Handles: "3 Days", "Three days", "1 Week", "2 Months", etc.
 */
function parseValidityDays(value: string): number {
  if (!value) return 1;
  const str = value.toString().toLowerCase().trim();
  
  // Try numeric extraction first: "3 Days" → 3
  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    // Check for weeks/months multiplier
    if (str.includes('week')) return num * 7;
    if (str.includes('month')) return num * 30;
    if (str.includes('year')) return num * 365;
    return num;
  }
  
  // Try word numbers: "Three days" → 3
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    if (str.includes(word)) {
      // Check for weeks/months multiplier
      if (str.includes('week')) return num * 7;
      if (str.includes('month')) return num * 30;
      if (str.includes('year')) return num * 365;
      return num;
    }
  }
  
  return 1; // Default fallback
}

/**
 * Parsed result from combined data/validity field
 */
export interface ParsedCombinedField {
  dataAmount: string | null;       // "50GB" or "500MB" or "Unlimited"
  dataAmountGb: number | null;     // 50 or 0.488 or null
  validityDays: number | null;     // 10 or null (use column value)
  qosSpeed: string | null;         // "256kbps" or "5Mbps" or null (no throttle = expires)
  isDaily: boolean;                // true if "per day" pattern
  packageTypeHint: 'max_speed' | 'day_pass' | 'limitless' | null;
}

/**
 * Parse a combined data/validity/qos field
 * Handles formats like:
 * - "50GB  /10 Days" → data=50GB, validity=10, qos=null, type=max_speed
 * - "500M high-speed data per day, down to 256kbps" → data=500MB, qos=256kbps, type=day_pass
 * - "Unlimited at 5Mbps" → data=Unlimited, qos=5Mbps, type=limitless
 * - "2GB for 7 days" → data=2GB, validity=7, qos=null, type=max_speed
 */
export function parseCombinedField(text: string): ParsedCombinedField {
  const result: ParsedCombinedField = {
    dataAmount: null,
    dataAmountGb: null,
    validityDays: null,
    qosSpeed: null,
    isDaily: false,
    packageTypeHint: null,
  };
  
  if (!text) return result;
  
  const str = text.toString().trim();
  const lower = str.toLowerCase();
  
  // ========== Extract QoS/throttle speed ==========
  // Patterns: "down to 256kbps", "throttle to 384kbps", "then 1Mbps", "at 5Mbps"
  const throttlePatterns = [
    /(?:down|throttle|reduced|limit|then|after)\s*(?:to|at)?\s*(\d+)\s*(kbps|mbps)/i,
    /,\s*(\d+)\s*(kbps|mbps)\s*(?:after|unlimited|speed)/i,
    /(\d+)\s*(kbps|mbps)\s*(?:after|then|unlimited)/i,
  ];
  
  for (const pattern of throttlePatterns) {
    const qosMatch = lower.match(pattern);
    if (qosMatch) {
      const speed = parseInt(qosMatch[1]);
      const unit = qosMatch[2].toLowerCase();
      result.qosSpeed = `${speed}${unit}`;
      break;
    }
  }
  
  // Check for fixed speed unlimited: "Unlimited at 5Mbps" or "@10Mbps"
  const fixedSpeedMatch = lower.match(/(?:unlimited|limitless|∞).*?(?:at|@)\s*(\d+)\s*(kbps|mbps)/i);
  if (fixedSpeedMatch) {
    const speed = parseInt(fixedSpeedMatch[1]);
    const unit = fixedSpeedMatch[2].toLowerCase();
    result.qosSpeed = `${speed}${unit}`;
    result.dataAmount = 'Unlimited';
    result.dataAmountGb = null;
    result.packageTypeHint = 'limitless';
    return result;
  }
  
  // ========== Check if daily pattern ==========
  // STRICT: Only match explicit per-day patterns, NOT "7 Days" or "30 Days" validity strings
  const isDailyPattern = /(?:\/day|per\s+day|every\s+day|each\s+day|daily\s+data)\b/i;
  result.isDaily = isDailyPattern.test(lower);
  
  // ========== Extract data amount and validity ==========
  
  // Pattern 1: "50GB /10 Days" or "50GB/10Days" (slash separator)
  const slashPattern = /(\d+(?:\.\d+)?)\s*(g|gb|m|mb|t|tb)\s*\/\s*(\d+)\s*days?/i;
  const slashMatch = str.match(slashPattern);
  if (slashMatch) {
    const dataValue = parseFloat(slashMatch[1]);
    const dataUnit = slashMatch[2].toUpperCase();
    result.validityDays = parseInt(slashMatch[3]);
    
    // Normalize unit display
    const normalizedUnit = dataUnit === 'G' ? 'GB' : dataUnit === 'M' ? 'MB' : dataUnit === 'T' ? 'TB' : dataUnit;
    result.dataAmount = `${dataValue}${normalizedUnit}`;
    result.dataAmountGb = normalizeDataToGb(dataValue, dataUnit);
    
    // No QoS mentioned in combined format = max_speed (expires when data used)
    if (!result.qosSpeed) {
      result.packageTypeHint = 'max_speed';
    }
    return result;
  }
  
  // Pattern 1b: "7Days / 1GB" or "30Days/2GB" (VALIDITY / DATA - reversed order)
  const reversedSlashPattern = /(\d+)\s*days?\s*\/\s*(\d+(?:\.\d+)?)\s*(g|gb|m|mb|t|tb)/i;
  const reversedSlashMatch = str.match(reversedSlashPattern);
  if (reversedSlashMatch) {
    result.validityDays = parseInt(reversedSlashMatch[1]);
    const dataValue = parseFloat(reversedSlashMatch[2]);
    const dataUnit = reversedSlashMatch[3].toUpperCase();
    
    const normalizedUnit = dataUnit === 'G' ? 'GB' : dataUnit === 'M' ? 'MB' : dataUnit === 'T' ? 'TB' : dataUnit;
    result.dataAmount = `${dataValue}${normalizedUnit}`;
    result.dataAmountGb = normalizeDataToGb(dataValue, dataUnit);
    
    // No QoS mentioned = max_speed
    if (!result.qosSpeed) {
      result.packageTypeHint = 'max_speed';
    }
    return result;
  }
  
  // Pattern 2: "2GB for 7 days" or "1GB valid 30 days"
  const forPattern = /(\d+(?:\.\d+)?)\s*(g|gb|m|mb|t|tb)\s*(?:for|valid|validity)\s*(\d+)\s*days?/i;
  const forMatch = str.match(forPattern);
  if (forMatch) {
    const dataValue = parseFloat(forMatch[1]);
    const dataUnit = forMatch[2].toUpperCase();
    result.validityDays = parseInt(forMatch[3]);
    
    const normalizedUnit = dataUnit === 'G' ? 'GB' : dataUnit === 'M' ? 'MB' : dataUnit === 'T' ? 'TB' : dataUnit;
    result.dataAmount = `${dataValue}${normalizedUnit}`;
    result.dataAmountGb = normalizeDataToGb(dataValue, dataUnit);
    
    if (!result.qosSpeed) {
      result.packageTypeHint = 'max_speed';
    }
    return result;
  }
  
  // Pattern 3: "1GB (30 days)" with parentheses
  const parenPattern = /(\d+(?:\.\d+)?)\s*(g|gb|m|mb|t|tb)\s*\(\s*(\d+)\s*days?\s*\)/i;
  const parenMatch = str.match(parenPattern);
  if (parenMatch) {
    const dataValue = parseFloat(parenMatch[1]);
    const dataUnit = parenMatch[2].toUpperCase();
    result.validityDays = parseInt(parenMatch[3]);
    
    const normalizedUnit = dataUnit === 'G' ? 'GB' : dataUnit === 'M' ? 'MB' : dataUnit === 'T' ? 'TB' : dataUnit;
    result.dataAmount = `${dataValue}${normalizedUnit}`;
    result.dataAmountGb = normalizeDataToGb(dataValue, dataUnit);
    
    if (!result.qosSpeed) {
      result.packageTypeHint = 'max_speed';
    }
    return result;
  }
  
  // ========== Extract just data amount (no combined validity) ==========
  // Handles: "500M", "2GB", "1.5G", "500MB per day, down to 256kbps"
  const dataOnlyPattern = /(\d+(?:\.\d+)?)\s*(g|gb|m|mb|t|tb)\b/i;
  const dataOnlyMatch = str.match(dataOnlyPattern);
  if (dataOnlyMatch) {
    const dataValue = parseFloat(dataOnlyMatch[1]);
    const dataUnit = dataOnlyMatch[2].toUpperCase();
    
    const normalizedUnit = dataUnit === 'G' ? 'GB' : dataUnit === 'M' ? 'MB' : dataUnit === 'T' ? 'TB' : dataUnit;
    result.dataAmount = `${dataValue}${normalizedUnit}`;
    result.dataAmountGb = normalizeDataToGb(dataValue, dataUnit);
    
    // Determine package type based on patterns found
    if (result.isDaily && result.qosSpeed) {
      result.packageTypeHint = 'day_pass';
    } else if (result.isDaily && !result.qosSpeed) {
      // Daily without QoS - could be day_pass that just expires, or needs more context
      result.packageTypeHint = 'day_pass';
    }
    
    return result;
  }
  
  // Check for unlimited without specific speed extraction done above
  if (lower.includes('unlimited') || lower.includes('limitless') || lower.includes('∞') || lower.includes('无限')) {
    result.dataAmount = 'Unlimited';
    result.dataAmountGb = null;
    result.packageTypeHint = 'limitless';
  }
  
  return result;
}

/**
 * Helper to convert data amount to GB
 */
function normalizeDataToGb(value: number, unit: string): number {
  const u = unit.toUpperCase();
  if (u === 'M' || u === 'MB') return value / 1024;
  if (u === 'T' || u === 'TB') return value * 1024;
  return value; // GB or G
}

/**
 * Parse a single row into a TugePackage
 */
function parseRow(row: any[], columnMap: Record<string, number>, rowIndex: number): TugePackage | null {
  const getValue = (field: string): string => {
    const index = columnMap[field];
    if (index === undefined) return '';
    return String(row[index] ?? '').trim();
  };
  
  const getNumber = (field: string): number => {
    const value = getValue(field);
    // Remove currency symbols, text, and commas - keep numbers and decimals
    const cleaned = value
      .replace(/[USD|EUR|CNY|THB|¥|$|€|฿]/gi, '')
      .replace(/[,，]/g, '')  // Handle commas (both types)
      .trim();
    const num = parseFloat(cleaned.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };
  
  // Get optionId from primary column, fall back to designated date activate column
  // If both are missing, generate a fallback ID (optionId is NOT required for price comparison)
  const optionIdPrimary = getValue('optionId');
  const optionIdAlt = getValue('optionIdAlt');
  const optionId = optionIdPrimary || optionIdAlt || `row_${rowIndex}`;
  
  // Prefer 'country' column, fall back to 'region' if country is empty
  const countryValue = getValue('country');
  const regionValue = getValue('region');
  const country = countryValue || regionValue;
  const carrier = getValue('carrier');
  const rawDataAmount = getValue('data');
  const rawValidity = getValue('validity');
  const rawQosSpeed = getValue('qosSpeed');
  const b2bPrice = getNumber('b2bPrice');
  const normalPrice = getNumber('normalPrice');
  const minSellPrice = getNumber('minSellPrice');
  const networkType = getValue('networkType');
  
  // Skip if missing essential fields: country and b2bPrice > 0
  // Note: optionId is now optional with fallback generation
  if (!country || b2bPrice <= 0) {
    return null;
  }
  
  // Parse combined field for embedded data/validity/qos
  const parsed = parseCombinedField(rawDataAmount);
  
  // Debug log for Indonesia rows to verify combined field parsing
  if (country.toLowerCase().includes('indonesia')) {
    console.log('🔍 Indonesia combined field parsed:', {
      rawDataAmount,
      parsedData: parsed.dataAmount,
      parsedValidity: parsed.validityDays,
      parsedType: parsed.packageTypeHint
    });
  }
  
  // Use parsed data amount if available, otherwise use raw
  const dataAmount = parsed.dataAmount || rawDataAmount;
  
  // Smart validity: if validity is embedded in the data field (e.g. "7Days / 1GB"), prefer that.
  // Otherwise, fall back to the explicit validity column.
  const explicitValidity = parseValidityDays(rawValidity);
  const validityDays = parsed.validityDays ?? explicitValidity;
  
  // Use explicit QoS column if available, otherwise use extracted from combined field
  // Note: null QoS for max_speed packages means "expires when data is used" (no throttle)
  const qosSpeed = rawQosSpeed || parsed.qosSpeed;
  
  // Determine package type: use hint from parsing if available, otherwise use standard logic
  const packageType = parsed.packageTypeHint || normalizePackageType(optionId, dataAmount, qosSpeed);
  
  // Calculate cost per GB
  const costPerGb = calculateCostPerGb(packageType, b2bPrice, dataAmount, validityDays);
  
  // Create raw row data for debugging
  const rawRow: Record<string, any> = {};
  row.forEach((cell, i) => {
    rawRow[`col_${i}`] = cell;
  });
  
  return {
    optionId,
    country,
    carrier: carrier || 'Unknown',
    packageType,
    dataAmount,
    validityDays,
    qosSpeed: qosSpeed || null,
    b2bPrice,
    normalPrice,
    minSellPrice,
    networkType: networkType || null,
    costPerGb,
    rawRow,
  };
}

export interface ParseOptions {
  customColumnMap?: Record<string, number>;
  customHeaderRow?: number;
  sheetName?: string;
}

/**
 * Parse Excel file with optional custom mapping
 */
export async function parseTugeExcel(file: File, options: ParseOptions = {}): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // DEBUG: Log available sheets
        console.log('📋 Available sheets:', workbook.SheetNames);
        
        // Select sheet - prefer specified, then "Global", then first
        let sheetName = options.sheetName || workbook.SheetNames[0];
        if (!options.sheetName) {
          for (const name of workbook.SheetNames) {
            if (name.toLowerCase().includes('global')) {
              sheetName = name;
              break;
            }
          }
        }
        console.log('📄 Using sheet:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // DEBUG: Log first 15 rows
        console.log('📊 First 15 rows:', rawData.slice(0, 15));
        
        // Find header row (use custom if provided)
        const headerRowIndex = options.customHeaderRow ?? findHeaderRow(rawData);
        console.log('🔍 Header row index:', headerRowIndex);
        
        if (headerRowIndex === -1) {
          console.log('❌ Header detection failed. Returning raw data for manual mapping.');
          resolve({
            packages: [],
            sheetName,
            totalRows: rawData.length,
            parsedRows: 0,
            errors: ['Could not detect header row. Please use manual column mapping.'],
            rawData: rawData.slice(0, 20),
            headerRowIndex: -1,
            columnMap: {},
            availableSheets: workbook.SheetNames,
          });
          return;
        }
        
        // DEBUG: Log header row content
        console.log('📝 Header row content:', rawData[headerRowIndex]);
        
        // Map columns (use custom if provided)
        console.log('🗺️ Mapping columns...');
        const columnMap = options.customColumnMap ?? mapColumns(rawData[headerRowIndex]);
        console.log('🗺️ Final column mapping:', columnMap);
        
        // Check which required columns are missing (optionId is now optional)
        const requiredFields = ['country', 'b2bPrice'];
        const missingColumns = requiredFields.filter(f => columnMap[f] === undefined);
        
        if (missingColumns.length > 0 && !options.customColumnMap) {
          console.log('⚠️ Missing columns:', missingColumns);
          resolve({
            packages: [],
            sheetName,
            totalRows: rawData.length,
            parsedRows: 0,
            errors: [`Missing required columns: ${missingColumns.join(', ')}. Please use manual mapping.`],
            rawData: rawData.slice(0, 20),
            headerRowIndex,
            columnMap,
            availableSheets: workbook.SheetNames,
          });
          return;
        }
        
        // Parse data rows with skip tracking
        const packages: TugePackage[] = [];
        const errors: string[] = [];
        const MAX_SKIPPED_DETAILS = 100; // Limit to avoid memory issues
        const skippedRows: ParseResult['skippedRows'] = {
          total: 0,
          missingCountry: 0,
          missingPrice: 0,
          emptyRow: 0,
          parseError: 0,
          details: [],
        };
        
        const addSkippedDetail = (
          rowIndex: number, 
          reason: SkippedRowDetail['reason'], 
          row: any[],
          country?: string,
          price?: string,
          dataField?: string
        ) => {
          if (skippedRows.details.length < MAX_SKIPPED_DETAILS) {
            skippedRows.details.push({
              rowIndex,
              reason,
              rawData: row.slice(0, 10), // Only keep first 10 cells to avoid memory bloat
              country,
              price,
              dataField,
            });
          }
        };
        
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.every(cell => !cell)) {
            skippedRows.emptyRow++;
            skippedRows.total++;
            addSkippedDetail(i + 1, 'empty_row', row || []);
            continue;
          }
          
          try {
            const pkg = parseRow(row, columnMap, i);
            if (pkg) {
              packages.push(pkg);
            } else {
              // Track why row was skipped
              const countryIdx = columnMap.country ?? columnMap.region;
              const priceIdx = columnMap.b2bPrice;
              const dataIdx = columnMap.data;
              const country = countryIdx !== undefined ? String(row[countryIdx] ?? '').trim() : '';
              const priceStr = priceIdx !== undefined ? String(row[priceIdx] ?? '') : '';
              const dataField = dataIdx !== undefined ? String(row[dataIdx] ?? '').trim() : '';
              const price = parseFloat(priceStr.replace(/[^0-9.-]/g, '')) || 0;
              
              if (!country) {
                skippedRows.missingCountry++;
                addSkippedDetail(i + 1, 'missing_country', row, '', priceStr, dataField);
              } else if (price <= 0) {
                skippedRows.missingPrice++;
                addSkippedDetail(i + 1, 'missing_price', row, country, priceStr, dataField);
              }
              skippedRows.total++;
            }
          } catch (err) {
            errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
            skippedRows.parseError++;
            skippedRows.total++;
            
            const countryIdx = columnMap.country ?? columnMap.region;
            const priceIdx = columnMap.b2bPrice;
            const dataIdx = columnMap.data;
            addSkippedDetail(
              i + 1, 
              'parse_error', 
              row,
              countryIdx !== undefined ? String(row[countryIdx] ?? '').trim() : '',
              priceIdx !== undefined ? String(row[priceIdx] ?? '') : '',
              dataIdx !== undefined ? String(row[dataIdx] ?? '').trim() : ''
            );
          }
        }
        
        console.log('📊 Parse complete:', {
          total: rawData.length - headerRowIndex - 1,
          parsed: packages.length,
          skipped: skippedRows
        });
        
        resolve({
          packages,
          sheetName,
          totalRows: rawData.length - headerRowIndex - 1,
          parsedRows: packages.length,
          errors,
          rawData: rawData.slice(0, 20),
          headerRowIndex,
          columnMap,
          availableSheets: workbook.SheetNames,
          skippedRows,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Re-parse with custom column mapping
 */
export async function reparseWithMapping(
  file: File, 
  columnMap: Record<string, number>, 
  headerRowIndex: number,
  sheetName?: string
): Promise<ParseResult> {
  return parseTugeExcel(file, {
    customColumnMap: columnMap,
    customHeaderRow: headerRowIndex,
    sheetName,
  });
}

/**
 * Get unique countries from parsed packages
 */
export function getUniqueCountries(packages: TugePackage[]): string[] {
  return [...new Set(packages.map(p => p.country))].sort();
}

/**
 * Get unique carriers from parsed packages
 */
export function getUniqueCarriers(packages: TugePackage[]): string[] {
  return [...new Set(packages.map(p => p.carrier))].filter(c => c !== 'Unknown').sort();
}

/**
 * Get unique package types from parsed packages
 */
export function getUniquePackageTypes(packages: TugePackage[]): string[] {
  return [...new Set(packages.map(p => p.packageType))].sort();
}
