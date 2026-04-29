export interface CarrierInfo {
  name: string;
  networks: string[];
}

export interface IncludedCountry {
  name: string;
  code: string;
  carriers: CarrierInfo[];
}

export interface RegionalPackageData {
  countries: IncludedCountry[];
}

// Mapping of country names to ISO codes
const COUNTRY_CODE_MAP: Record<string, string> = {
  // Europe
  'Austria': 'AT', 'Belgium': 'BE', 'Bulgaria': 'BG', 'Croatia': 'HR', 'Cyprus': 'CY',
  'Czech Republic': 'CZ', 'Denmark': 'DK', 'Estonia': 'EE', 'Finland': 'FI', 'France': 'FR',
  'Germany': 'DE', 'Greece': 'GR', 'Hungary': 'HU', 'Iceland': 'IS', 'Ireland': 'IE',
  'Italy': 'IT', 'Latvia': 'LV', 'Liechtenstein': 'LI', 'Lithuania': 'LT', 'Luxembourg': 'LU',
  'Malta': 'MT', 'Netherlands': 'NL', 'Norway': 'NO', 'Poland': 'PL', 'Portugal': 'PT',
  'Romania': 'RO', 'Slovakia': 'SK', 'Slovenia': 'SI', 'Spain': 'ES', 'Sweden': 'SE',
  'Switzerland': 'CH', 'United Kingdom': 'GB', 'UK': 'GB', 'Albania': 'AL', 'Serbia': 'RS',
  'Ukraine': 'UA', 'Turkey': 'TR', 'Monaco': 'MC', 'Vatican City': 'VA', 'San Marino': 'SM',
  'Andorra': 'AD', 'Jersey': 'JE', 'Guernsey': 'GG', 'Isle of Man': 'IM',
  // Asia
  'Thailand': 'TH', 'Singapore': 'SG', 'Japan': 'JP', 'South Korea': 'KR', 'Malaysia': 'MY',
  'Hong Kong': 'HK', 'Taiwan': 'TW', 'Philippines': 'PH', 'Vietnam': 'VN', 'Cambodia': 'KH',
  'Indonesia': 'ID', 'India': 'IN', 'China': 'CN', 'Laos': 'LA', 'Myanmar': 'MM',
  'Brunei': 'BN', 'Macao': 'MO', 'Macau': 'MO', 'Bangladesh': 'BD', 'Pakistan': 'PK',
  'Sri Lanka': 'LK', 'Nepal': 'NP', 'Maldives': 'MV',
};

function getCountryCode(countryName: string): string {
  return COUNTRY_CODE_MAP[countryName] || countryName.substring(0, 2).toUpperCase();
}

function parseNetworkTypes(networkStr: string): string[] {
  if (!networkStr) return [];
  const networks: string[] = [];
  if (networkStr.includes('3G')) networks.push('3G');
  if (networkStr.includes('4G') || networkStr.includes('LTE')) networks.push('4G');
  if (networkStr.includes('5G')) networks.push('5G');
  return networks;
}

/**
 * Parse the Europe 42 Countries sheet (Page 7)
 */
function parseEurope42Sheet(worksheet: any, XLSX: any): IncludedCountry[] {
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const countries: IncludedCountry[] = [];
  
  // Find header row (contains "Country" or similar)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.some((cell: any) => 
      typeof cell === 'string' && cell.toLowerCase().includes('country')
    )) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return countries;
  
  // Parse data rows
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const countryName = row[0]?.toString().trim();
    const carrierName = row[1]?.toString().trim();
    const networkType = row[2]?.toString() || '';
    
    if (!countryName || !carrierName) continue;
    
    // Find or create country entry
    let country = countries.find(c => c.name === countryName);
    if (!country) {
      country = {
        name: countryName,
        code: getCountryCode(countryName),
        carriers: []
      };
      countries.push(country);
    }
    
    // Add carrier if not already present
    if (!country.carriers.find(c => c.name === carrierName)) {
      country.carriers.push({
        name: carrierName,
        networks: parseNetworkTypes(networkType)
      });
    }
  }
  
  return countries;
}

/**
 * Parse the Asia 13 Countries sheet (Page 5)
 */
function parseAsia13Sheet(worksheet: any, XLSX: any): IncludedCountry[] {
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const countries: IncludedCountry[] = [];
  
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.some((cell: any) => 
      typeof cell === 'string' && cell.toLowerCase().includes('country')
    )) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return countries;
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const countryName = row[0]?.toString().trim();
    const carrierName = row[1]?.toString().trim();
    const networkType = row[2]?.toString() || '';
    
    if (!countryName || !carrierName) continue;
    
    let country = countries.find(c => c.name === countryName);
    if (!country) {
      country = {
        name: countryName,
        code: getCountryCode(countryName),
        carriers: []
      };
      countries.push(country);
    }
    
    if (!country.carriers.find(c => c.name === carrierName)) {
      country.carriers.push({
        name: carrierName,
        networks: parseNetworkTypes(networkType)
      });
    }
  }
  
  return countries;
}

/**
 * Parse the South East Asia sheets (Page 6)
 * This page contains both 3 Countries and 8 Countries sections
 */
function parseSouthEastAsiaSheet(worksheet: any, XLSX: any): { 
  asia3: IncludedCountry[], 
  asia8: IncludedCountry[] 
} {
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const asia3: IncludedCountry[] = [];
  const asia8: IncludedCountry[] = [];
  
  // Find sections by looking for headers
  let section3Start = -1;
  let section8Start = -1;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const rowStr = row.join(' ').toLowerCase();
    if (rowStr.includes('3') && rowStr.includes('countries')) {
      section3Start = i;
    } else if (rowStr.includes('8') && rowStr.includes('countries')) {
      section8Start = i;
    }
  }
  
  // Parse Section 1: 3 Countries
  if (section3Start !== -1) {
    const endIndex = section8Start !== -1 ? section8Start : data.length;
    for (let i = section3Start + 1; i < endIndex; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;
      
      const countryName = row[0]?.toString().trim();
      const carrierName = row[1]?.toString().trim();
      const networkType = row[2]?.toString() || '';
      
      if (!countryName || !carrierName) continue;
      
      let country = asia3.find(c => c.name === countryName);
      if (!country) {
        country = {
          name: countryName,
          code: getCountryCode(countryName),
          carriers: []
        };
        asia3.push(country);
      }
      
      if (!country.carriers.find(c => c.name === carrierName)) {
        country.carriers.push({
          name: carrierName,
          networks: parseNetworkTypes(networkType)
        });
      }
    }
  }
  
  // Parse Section 2: 8 Countries
  if (section8Start !== -1) {
    for (let i = section8Start + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;
      
      const countryName = row[0]?.toString().trim();
      const carrierName = row[1]?.toString().trim();
      const networkType = row[2]?.toString() || '';
      
      if (!countryName || !carrierName) continue;
      
      let country = asia8.find(c => c.name === countryName);
      if (!country) {
        country = {
          name: countryName,
          code: getCountryCode(countryName),
          carriers: []
        };
        asia8.push(country);
      }
      
      if (!country.carriers.find(c => c.name === carrierName)) {
        country.carriers.push({
          name: carrierName,
          networks: parseNetworkTypes(networkType)
        });
      }
    }
  }
  
  return { asia3, asia8 };
}

/**
 * Main function to parse regional package data from Excel file
 */
export async function parseRegionalPackagesFromExcel(file: File, XLSX: any): Promise<{
  europe42: RegionalPackageData;
  asia13: RegionalPackageData;
  asia3: RegionalPackageData;
  asia8: RegionalPackageData;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get worksheets by name or index
        const page5 = workbook.Sheets[workbook.SheetNames[4]]; // Asia 13
        const page6 = workbook.Sheets[workbook.SheetNames[5]]; // SEA 3 & 8
        const page7 = workbook.Sheets[workbook.SheetNames[6]]; // Europe 42
        
        const europe42Countries = page7 ? parseEurope42Sheet(page7, XLSX) : [];
        const asia13Countries = page5 ? parseAsia13Sheet(page5, XLSX) : [];
        const { asia3: asia3Countries, asia8: asia8Countries } = page6 ? parseSouthEastAsiaSheet(page6, XLSX) : { asia3: [], asia8: [] };
        
        resolve({
          europe42: { countries: europe42Countries },
          asia13: { countries: asia13Countries },
          asia3: { countries: asia3Countries },
          asia8: { countries: asia8Countries }
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
 * Helper to match package name to regional data
 */
export function matchPackageToRegionalData(
  packageName: string,
  regionalData: {
    europe42: RegionalPackageData;
    asia13: RegionalPackageData;
    asia3: RegionalPackageData;
    asia8: RegionalPackageData;
  }
): RegionalPackageData | null {
  const nameLower = packageName.toLowerCase();
  
  if (nameLower.includes('europe') && nameLower.includes('42')) {
    return regionalData.europe42;
  }
  if (nameLower.includes('asia') && nameLower.includes('13')) {
    return regionalData.asia13;
  }
  if (nameLower.includes('south east asia') || nameLower.includes('southeast asia')) {
    if (nameLower.includes('3')) {
      return regionalData.asia3;
    }
    if (nameLower.includes('8')) {
      return regionalData.asia8;
    }
  }
  
  return null;
}
