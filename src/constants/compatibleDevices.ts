// eSIM Compatible Devices Database
// Source of truth for all device compatibility checks across the app
// Updated: February 2026

export interface DeviceBrand {
  name: string;
  devices: string[];
  category?: 'phone' | 'laptop';
  hasWarning?: boolean;
  warningMessages?: {
    en: string;
    th: string;
  }[];
}

export type DeviceBrandKey = 
  // iOS
  | 'apple'
  // Android phones & tablets
  | 'abctech'
  | 'alcatel'
  | 'asus'
  | 'balmuda'
  | 'bq'
  | 'ciber'
  | 'covia'
  | 'doogee'
  | 'dtab'
  | 'energizer'
  | 'evolveo'
  | 'fairphone'
  | 'fcnt'
  | 'fossil'
  | 'gigaset'
  | 'google'
  | 'hamic'
  | 'hammer'
  | 'honeywell'
  | 'honor'
  | 'hoozo'
  | 'huawei'
  | 'isafemobile'
  | 'kddi'
  | 'kyocera'
  | 'lenovoPhone'
  | 'logic'
  | 'mitac'
  | 'mobvoi'
  | 'montblanc'
  | 'motorola'
  | 'motorolaSolutions'
  | 'myphone'
  | 'nokia'
  | 'nothing'
  | 'onePlus'
  | 'oppo'
  | 'premier'
  | 'rakuten'
  | 'razer'
  | 'realme'
  | 'samsung'
  | 'sg'
  | 'sgin'
  | 'sharp'
  | 'sony'
  | 'surface'
  | 'tagTech'
  | 'tcl'
  | 'teclast'
  | 'tone'
  | 'vikusha'
  | 'vivo'
  | 'vsmart'
  | 'xiaomi'
  | 'zebra'
  | 'zonko'
  | 'zte'
  // Windows Laptops
  | 'acer'
  | 'asusLaptop'
  | 'dell'
  | 'hp'
  | 'lenovo'
  | 'surfaceLaptop';

export const COMPATIBLE_DEVICES: Record<DeviceBrandKey, DeviceBrand> = {
  // ==================== iOS ====================

  apple: {
    name: 'Apple',
    category: 'phone',
    devices: [
      // iPhone 17 Series
      'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max',
      // iPhone Air
      'iPhone Air',
      // iPhone 16 Series
      'iPhone 16', 'iPhone 16e', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
      // iPhone 15 Series
      'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
      // iPhone 14 Series
      'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
      // iPhone 13 Series
      'iPhone 13', 'iPhone 13 Mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
      // iPhone 12 Series
      'iPhone 12', 'iPhone 12 Mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
      // iPhone 11 Series
      'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
      // iPhone X Series
      'iPhone XS', 'iPhone XS Max', 'iPhone XS Max Global', 'iPhone XR',
      // iPhone SE
      'iPhone SE 2nd Gen', 'iPhone SE 3rd Gen',
      // iPad
      'iPad 10th Gen',
      'iPad 8th Gen (WiFi+Cellular)',
      'iPad Air 3rd Gen',
      'iPad Air 4th Gen (WiFi+Cellular)',
      'iPad Air 5th Gen (WiFi+Cellular)',
      'iPad Mini 5th Gen',
      'iPad Pro 11 inch 3rd Gen',
      'iPad Pro 11 inch 3rd Gen (1TB, WiFi+Cellular)',
      'iPad Pro 11 inch 3rd Gen (WiFi+Cellular)',
      'iPad Pro 11 inch 4th Gen',
      'iPad Pro 11 inch 4th Gen (WiFi+Cellular)',
      'iPad Pro 12.9 inch 3rd Gen (1TB, WiFi+Cellular)',
      'iPad Pro 12.9 inch 3rd Gen (WiFi+Cellular)',
      'iPad Pro 12.9 inch 4th Gen (WiFi+Cellular)',
      'iPad Pro 12.9 inch 5th Gen',
      'iPad Pro 12.9 inch 6th Gen',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'iPhone devices from Mainland China DO NOT have eSIM capability.',
        th: 'iPhone จากจีนแผ่นดินใหญ่ ไม่รองรับ eSIM'
      },
      {
        en: 'iPhone devices from Hong Kong and Macao DO NOT have eSIM (except iPhone 13 Mini, iPhone 12 Mini, iPhone SE 2020, and iPhone XS).',
        th: 'iPhone จากฮ่องกงและมาเก๊า ไม่รองรับ eSIM (ยกเว้น iPhone 13 Mini, 12 Mini, SE 2020, และ XS)'
      },
      {
        en: 'Only iPad devices with Wi-Fi + Cellular features are supported.',
        th: 'รองรับเฉพาะ iPad รุ่น Wi-Fi + Cellular เท่านั้น'
      }
    ]
  },

  // ==================== ANDROID SMARTPHONES & TABLETS ====================

  abctech: {
    name: 'ABCTECH',
    category: 'phone',
    devices: ['X20']
  },

  alcatel: {
    name: 'Alcatel',
    category: 'phone',
    devices: ['V3 Ultra']
  },

  asus: {
    name: 'ASUS',
    category: 'phone',
    devices: [
      'ZenFone Max Pro M1 (ZB602KL) (WW) / Max Pro M1 (ZB601KL) (IN)',
      'ZenFone Max Pro M2 (ZB631KL) (WW) / Max Pro M2 (ZB630KL) (IN)',
    ]
  },

  balmuda: {
    name: 'BALMUDA',
    category: 'phone',
    devices: ['BALMUDA Phone']
  },

  bq: {
    name: 'bq',
    category: 'phone',
    devices: ['Aquaris X2', 'Aquaris X2 PRO']
  },

  ciber: {
    name: 'CIBER',
    category: 'phone',
    devices: ['B610A115']
  },

  covia: {
    name: 'Covia',
    category: 'phone',
    devices: ['CP-G3']
  },

  doogee: {
    name: 'DOOGEE',
    category: 'phone',
    devices: ['V30']
  },

  dtab: {
    name: 'dtab',
    category: 'phone',
    devices: ['dtab d-51C']
  },

  energizer: {
    name: 'Energizer',
    category: 'phone',
    devices: ['Hardcase H620S']
  },

  evolveo: {
    name: 'Evolveo',
    category: 'phone',
    devices: ['EVOLVEO StrongPhone G9']
  },

  fairphone: {
    name: 'Fairphone',
    category: 'phone',
    devices: ['Fairphone4']
  },

  fcnt: {
    name: 'FCNT',
    category: 'phone',
    devices: ['arrows BZ03', 'arrows N F-51C', 'arrows We A101FC']
  },

  fossil: {
    name: 'Fossil',
    category: 'phone',
    devices: ['Fossil Gen 5 LTE']
  },

  gigaset: {
    name: 'Gigaset',
    category: 'phone',
    devices: ['Gigaset GX4 PRO']
  },

  google: {
    name: 'Google Pixel',
    category: 'phone',
    devices: [
      'Pixel 2', 'Pixel 2 XL',
      'Pixel 3', 'Pixel 3 XL', 'Pixel 3a', 'Pixel 3a XL',
      'Pixel 4', 'Pixel 4 XL', 'Pixel 4a', 'Pixel 4a (5G)',
      'Pixel 5', 'Pixel 5a 5G',
      'Pixel 6', 'Pixel 6 Pro', 'Pixel 6a',
      'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a',
      'Pixel 8', 'Pixel 8 Pro',
      'Pixel Fold',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'Pixel 3 models from Australia, Taiwan, and Japan DO NOT have eSIM. Pixel 3 from US/Canadian carriers (except Sprint and Google Fi) also DO NOT have eSIM.',
        th: 'Pixel 3 จากออสเตรเลีย ไต้หวัน และญี่ปุ่น ไม่รองรับ eSIM รวมถึง Pixel 3 จากค่ายมือถือสหรัฐ/แคนาดา (ยกเว้น Sprint และ Google Fi)'
      },
      {
        en: 'Pixel 3a models purchased in South East Asia and with Verizon service DO NOT have eSIM.',
        th: 'Pixel 3a ที่ซื้อจากเอเชียตะวันออกเฉียงใต้และใช้บริการ Verizon ไม่รองรับ eSIM'
      }
    ]
  },

  hamic: {
    name: 'Hamic',
    category: 'phone',
    devices: ['MIELS']
  },

  hammer: {
    name: 'Hammer',
    category: 'phone',
    devices: [
      'Hammer Blade 5G',
      'Hammer Construction',
    ]
  },

  honeywell: {
    name: 'Honeywell',
    category: 'phone',
    devices: ['CT30XP', 'CT45 XP', 'CT47', 'EDA52', 'EDA5S']
  },

  honor: {
    name: 'Honor',
    category: 'phone',
    devices: [
      'Honor 90',
      'Honor Magic4 Pro',
      'Magic8 Pro Air',
      'FRI',
      'HONOR Magic4 Pro',
      'HONOR Magic5 Pro',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'eSIM support is only available in certain regions. Please contact your carrier or device manufacturer to confirm.',
        th: 'eSIM รองรับเฉพาะบางภูมิภาค กรุณาติดต่อค่ายมือถือหรือผู้ผลิตเพื่อยืนยัน'
      }
    ]
  },

  hoozo: {
    name: 'Hoozo',
    category: 'phone',
    devices: ['HZ0010J']
  },

  huawei: {
    name: 'Huawei',
    category: 'phone',
    devices: ['Mate 40 Pro', 'P40', 'P40 Pro'],
    hasWarning: true,
    warningMessages: [
      {
        en: 'Huawei P40 Pro+ does NOT have eSIM capability.',
        th: 'Huawei P40 Pro+ ไม่รองรับ eSIM'
      },
      {
        en: 'All Huawei devices purchased in China are NOT eSIM capable.',
        th: 'Huawei ทุกรุ่นที่ซื้อจากจีน ไม่รองรับ eSIM'
      }
    ]
  },

  isafemobile: {
    name: 'isafemobile',
    category: 'phone',
    devices: ['IS540']
  },

  kddi: {
    name: 'KDDI',
    category: 'phone',
    devices: ['AQUOS sense6s', 'AQUOS sense7', 'AQUOS wish2']
  },

  kyocera: {
    name: 'KYOCERA',
    category: 'phone',
    devices: [
      'Android One S10', 'Android One S9',
      'DIGNO SANGA edition', 'DIGNO SX2', 'DIGNO SX3',
      'かんたんスマホ２', 'かんたんスマホ2+', 'かんたんスマホ3',
    ]
  },

  lenovoPhone: {
    name: 'Lenovo',
    category: 'phone',
    devices: ['d-42A', 'd-52C']
  },

  logic: {
    name: 'LOGIC',
    category: 'phone',
    devices: ['LOGIC MV01', 'LOGIC MV02']
  },

  mitac: {
    name: 'MiTAC',
    category: 'phone',
    devices: ['N630', 'N672']
  },

  mobvoi: {
    name: 'Mobvoi',
    category: 'phone',
    devices: ['TicWatch Pro 3 Cellular/LTE']
  },

  montblanc: {
    name: 'Montblanc',
    category: 'phone',
    devices: ['Summit 2+']
  },

  motorola: {
    name: 'Motorola',
    category: 'phone',
    devices: [
      'moto g52j 5G', 'moto g53y 5G',
      'Edge 40', 'Edge 40 Neo', 'Edge 40 Pro', 'Edge+ Plus', 'Edge+ Plus (2022)',
      'Moto G53', 'Moto G53 5G', 'Moto G54',
      'motorola razr', 'motorola razr 5G', 'motorola razr 2022',
      'Razr 2022', 'Razr 40 Ultra',
      'Signature',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'eSIM support is only available in certain regions. Please contact your carrier or device manufacturer to confirm.',
        th: 'eSIM รองรับเฉพาะบางภูมิภาค กรุณาติดต่อค่ายมือถือหรือผู้ผลิตเพื่อยืนยัน'
      }
    ]
  },

  motorolaSolutions: {
    name: 'Motorola Solutions',
    category: 'phone',
    devices: ['MOTOTRBO ION']
  },

  myphone: {
    name: 'MyPhone',
    category: 'phone',
    devices: [
      'Hammer Blade 3',
      'Hammer Explorer Pro',
      'myPhone Now eSIM',
      'Hammer_Explorer',
    ]
  },

  nokia: {
    name: 'Nokia',
    category: 'phone',
    devices: ['Nokia G60 5G', 'Nokia X30 5G', 'XR21']
  },

  nothing: {
    name: 'Nothing',
    category: 'phone',
    devices: ['Phone (3)', 'Phone Pro']
  },

  onePlus: {
    name: 'OnePlus',
    category: 'phone',
    devices: [
      '13R', '13T',
      'OnePlus 11 5G', 'OnePlus 12',
    ]
  },

  oppo: {
    name: 'Oppo',
    category: 'phone',
    devices: [
      'Find N5', 'Find X3 Pro',
      'OPPO Watch',
      'Reno14', 'Reno14 Pro',
      'Reno15', 'Reno15 FS', 'Reno15 Pro Max',
      'A5', 'A55s 5G', 'A77',
      'CPH2247',
      'Find N2 Flip', 'Find X5', 'Find X5 Pro',
      'OPPO Reno5 A', 'OPPO Reno7 A',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'eSIM support is only available in certain regions. Please contact your carrier or device manufacturer to confirm.',
        th: 'eSIM รองรับเฉพาะบางภูมิภาค กรุณาติดต่อค่ายมือถือหรือผู้ผลิตเพื่อยืนยัน'
      }
    ]
  },

  premier: {
    name: 'Premier',
    category: 'phone',
    devices: ['TAB-7304-16G3GS']
  },

  rakuten: {
    name: 'Rakuten',
    category: 'phone',
    devices: [
      'C330',
      'Rakuten BIG s',
      'Rakuten Hand',
      'Rakuten Hand5G',
      'AQUOS sense6',
    ]
  },

  razer: {
    name: 'Razer',
    category: 'phone',
    devices: ['Razer Edge 5G']
  },

  realme: {
    name: 'RealMe',
    category: 'phone',
    devices: ['14 Pro+', 'GT 7', 'RMX5070']
  },

  samsung: {
    name: 'Samsung',
    category: 'phone',
    devices: [
      // Galaxy A Series
      'Galaxy A23 5G',
      'A35', 'A36',
      'Galaxy A54 5G', 'Galaxy A55', 'Galaxy A56',
      // Galaxy S20 Series
      'Galaxy S20 5G', 'Galaxy S20 Ultra 5G', 'Galaxy S20+ 5G',
      // Galaxy S21 Series
      'Galaxy S21 5G', 'Galaxy S21 Ultra 5G', 'Galaxy S21+ 5G',
      // Galaxy S22 Series
      'Galaxy S22', 'Galaxy S22 5G', 'Galaxy S22+', 'Galaxy S22+ 5G', 'Galaxy S22 Ultra', 'Galaxy S22 Ultra 5G',
      // Galaxy S23 Series
      'Galaxy S23', 'Galaxy S23 FE', 'Galaxy S23 Ultra', 'Galaxy S23+',
      // Galaxy S24 Series
      'Galaxy S24', 'Galaxy 24 FE', 'Galaxy S24 Ultra', 'Galaxy S24+',
      // Galaxy S25 Series
      'Galaxy S25', 'Galaxy S25 Edge', 'Galaxy S25 Ultra', 'Galaxy S25+',
      // Galaxy Note Series
      'Galaxy Note20', 'Galaxy Note20 5G', 'Galaxy Note20 Ultra', 'Galaxy Note20 Ultra 5G',
      // Galaxy Z Flip Series
      'Galaxy Z Flip', 'Galaxy Z Flip 5G', 'Galaxy Z Flip3 5G', 'Galaxy Z Flip4',
      'Galaxy Flip 5', 'Galaxy Flip7', 'Galaxy Z Flip7 FE',
      // Galaxy Z Fold Series
      'Galaxy Z Fold', 'Galaxy Z Fold2', 'Galaxy Z Fold3', 'Galaxy Z Fold4',
      'Galaxy Fold 5', 'Galaxy Z Fold7',
      // Galaxy XCover
      'Galaxy XCover7 Pro',
      // Galaxy Watch
      'Galaxy Watch4', 'Galaxy Watch4 Classic',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'All Galaxy devices originating from China, Hong Kong, and Taiwan DO NOT have eSIM capability.',
        th: 'Samsung Galaxy จากจีน ฮ่องกง และไต้หวัน ไม่รองรับ eSIM'
      },
      {
        en: 'USA models of the Galaxy S20, S21, and Note 20 Ultra DO NOT have eSIM.',
        th: 'Galaxy S20, S21, และ Note 20 Ultra รุ่นสหรัฐฯ ไม่รองรับ eSIM'
      },
      {
        en: 'Most Samsung Galaxy devices purchased in South Korea do not support eSIMs.',
        th: 'Samsung ที่ซื้อจากเกาหลีใต้ส่วนใหญ่ไม่รองรับ eSIM'
      }
    ]
  },

  sg: {
    name: 'SG',
    category: 'phone',
    devices: [
      'AQUOS R6', 'AQUOS R7', 'AQUOS sense7 plus',
      'Leitz Phone 2', 'シンプルスマホ６',
    ]
  },

  sgin: {
    name: 'SGIN',
    category: 'phone',
    devices: ['SGIN_E10M']
  },

  sharp: {
    name: 'Sharp',
    category: 'phone',
    devices: [
      'AQUOS sense4 lite SH-RM15',
      'Aquos Sense6',
      'Aquos wish5', 'Aquos Wish6',
      'Aquos Zero6',
      'SH-51F',
      'AQUOS wish', 'AQUOS zero6',
    ]
  },

  sony: {
    name: 'Sony',
    category: 'phone',
    devices: [
      'Xperia 1 IV', 'Xperia 1 V', 'Xperia 1 VII',
      'Xperia 5 IV',
      'Xperia 10 III Lite', 'Xperia 10 IV',
      'Xperia Ace III',
    ]
  },

  surface: {
    name: 'Surface',
    category: 'phone',
    devices: ['Surface Duo', 'Surface Duo 2', 'Surface Pro 9']
  },

  tagTech: {
    name: 'TAG-TECH',
    category: 'phone',
    devices: ['TAG-TAB-III']
  },

  tcl: {
    name: 'TCL',
    category: 'phone',
    devices: ['60 XE NxtPaper', 'NxtPaper 70 Pro']
  },

  teclast: {
    name: 'Teclast',
    category: 'phone',
    devices: ['X_EEA']
  },

  tone: {
    name: 'TONE',
    category: 'phone',
    devices: ['TONE_e22']
  },

  vikusha: {
    name: 'VIKUSHA',
    category: 'phone',
    devices: ['V-Z40']
  },

  vivo: {
    name: 'Vivo',
    category: 'phone',
    devices: [
      'V29', 'V29 Lite 5G', 'V40', 'V50',
      'X90 Pro', 'X100 Pro', 'X200', 'X200 Pro', 'X200s', 'X200T',
    ]
  },

  vsmart: {
    name: 'Vsmart',
    category: 'phone',
    devices: ['Active 1']
  },

  xiaomi: {
    name: 'Xiaomi',
    category: 'phone',
    devices: [
      '15 Ultra',
      'Redmi Note 11 Pro 5G',
      'Redmi Note 13 Pro', 'Redmi Note 13 Pro+',
      'Redmi Note 14 Pro', 'Redmi Note 14 Pro 5G', 'Redmi Note 14 Pro+', 'Redmi Note 14 Pro+ 5G',
      'Xiaomi 12T Pro',
      'Xiaomi 13', 'Xiaomi 13 Lite', 'Xiaomi 13 Pro', 'Xiaomi 13T', 'Xiaomi 13T Pro',
      'Xiaomi 14', 'Xiaomi 14 Pro', 'Xiaomi 14T', 'Xiaomi 14T Pro',
      'Xiaomi 15',
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'eSIM availability may vary depending on country/region and carrier.',
        th: 'eSIM อาจรองรับต่างกันตามประเทศ/ภูมิภาคและค่ายมือถือ'
      }
    ]
  },

  zebra: {
    name: 'Zebra',
    category: 'phone',
    devices: [
      'EC55', 'ET56', 'TC26', 'TC57', 'TC58', 'TC77',
      'Zebra Technologies L10', 'Zebra Technologies MC2700', 'Zebra Technologies TC57x',
    ]
  },

  zonko: {
    name: 'ZONKO',
    category: 'phone',
    devices: ['K105_EEA']
  },

  zte: {
    name: 'ZTE',
    category: 'phone',
    devices: ['A103ZT', 'A202ZT', 'RAKUTEN BIG', 'ZR01']
  },

  // ==================== WINDOWS LAPTOPS ====================

  acer: {
    name: 'Acer',
    category: 'laptop',
    devices: [
      'Acer Swift 3', 'Acer Swift 7',
      'Acer TravelMate P2', 'Acer TravelMate Spin P4', 'Acer TravelMate P6'
    ]
  },

  asusLaptop: {
    name: 'ASUS',
    category: 'laptop',
    devices: [
      'ASUS Mini Transformer T103HAF',
      'ASUS NovaGo TP370QL',
      'ASUS Vivobook Flip 14 TP401NA'
    ]
  },

  dell: {
    name: 'Dell',
    category: 'laptop',
    devices: [
      'Dell Latitude 7440', 'Dell Latitude 7210 2-in-1', 'Dell Latitude 9410',
      'Dell Latitude 7310', 'Dell Latitude 7410', 'Dell Latitude 9510',
      'Dell Latitude 5410', 'Dell Latitude 5411', 'Dell Latitude 5511'
    ]
  },

  hp: {
    name: 'HP',
    category: 'laptop',
    devices: [
      'HP Elitebook G5', 'HP Probook G5', 'HP Zbook G5', 'HP Spectre Folio 13'
    ]
  },

  lenovo: {
    name: 'Lenovo',
    category: 'laptop',
    devices: [
      'ThinkPad X1 Titanium Yoga 2-in-1', 'ThinkPad X1 Carbon Gen 9',
      'ThinkPad X1 Fold', 'ThinkPad X1 Nano', 'ThinkPad X12 Detachable',
      'Lenovo Flex 5G', 'Lenovo Yoga C630', 'Lenovo Miix 630',
      'Lenovo Yoga 520', 'Lenovo Yoga 720 (2-in-1 models)'
    ]
  },

  surfaceLaptop: {
    name: 'Microsoft Surface',
    category: 'laptop',
    devices: [
      'Surface Pro 9', 'Surface Go 3', 'Surface Pro X', 'Surface Duo 2', 'Surface Duo'
    ],
    hasWarning: true,
    warningMessages: [
      {
        en: 'AT&T-locked Surface devices will not support eSIMs.',
        th: 'Surface ที่ล็อคกับ AT&T จะไม่รองรับ eSIM'
      }
    ]
  }
};

// Helper function to get phone brands only
export function getPhoneBrands(): [DeviceBrandKey, DeviceBrand][] {
  return Object.entries(COMPATIBLE_DEVICES).filter(
    ([, brand]) => brand.category !== 'laptop'
  ) as [DeviceBrandKey, DeviceBrand][];
}

// Helper function to get laptop brands only
export function getLaptopBrands(): [DeviceBrandKey, DeviceBrand][] {
  return Object.entries(COMPATIBLE_DEVICES).filter(
    ([, brand]) => brand.category === 'laptop'
  ) as [DeviceBrandKey, DeviceBrand][];
}

// Get all devices as a flat array for search
export function getAllCompatibleDevices(): { brand: string; device: string; brandKey: DeviceBrandKey; category?: 'phone' | 'laptop' }[] {
  const allDevices: { brand: string; device: string; brandKey: DeviceBrandKey; category?: 'phone' | 'laptop' }[] = [];
  
  Object.entries(COMPATIBLE_DEVICES).forEach(([key, brand]) => {
    brand.devices.forEach(device => {
      allDevices.push({
        brand: brand.name,
        device,
        brandKey: key as DeviceBrandKey,
        category: brand.category
      });
    });
  });
  
  return allDevices;
}

// Search devices by query
export function searchCompatibleDevices(query: string): { brand: string; device: string; brandKey: DeviceBrandKey }[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const allDevices = getAllCompatibleDevices();
  
  return allDevices.filter(({ brand, device }) => 
    device.toLowerCase().includes(normalizedQuery) ||
    brand.toLowerCase().includes(normalizedQuery)
  );
}

// Check if a specific device model is compatible
export function isDeviceCompatible(deviceName: string): { compatible: boolean; brand?: string; exactMatch?: string } {
  const normalizedName = deviceName.toLowerCase().trim();
  const allDevices = getAllCompatibleDevices();
  
  const exactMatch = allDevices.find(d => 
    d.device.toLowerCase() === normalizedName
  );
  
  if (exactMatch) {
    return { compatible: true, brand: exactMatch.brand, exactMatch: exactMatch.device };
  }
  
  const partialMatch = allDevices.find(d => 
    d.device.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(d.device.toLowerCase())
  );
  
  if (partialMatch) {
    return { compatible: true, brand: partialMatch.brand, exactMatch: partialMatch.device };
  }
  
  return { compatible: false };
}

// Get brand info including warnings
export function getBrandInfo(brandKey: DeviceBrandKey): DeviceBrand | undefined {
  return COMPATIBLE_DEVICES[brandKey];
}

// Map common brand aliases to brand keys
export function getBrandKeyFromName(brandName: string): DeviceBrandKey | undefined {
  const normalizedName = brandName.toLowerCase().trim();
  
  const aliases: Record<string, DeviceBrandKey> = {
    // iOS
    'apple': 'apple',
    'iphone': 'apple',
    'ipad': 'apple',
    // Android
    'abctech': 'abctech',
    'alcatel': 'alcatel',
    'asus': 'asus',
    'zenfone': 'asus',
    'balmuda': 'balmuda',
    'bq': 'bq',
    'ciber': 'ciber',
    'covia': 'covia',
    'doogee': 'doogee',
    'dtab': 'dtab',
    'energizer': 'energizer',
    'evolveo': 'evolveo',
    'fairphone': 'fairphone',
    'fcnt': 'fcnt',
    'arrows': 'fcnt',
    'fossil': 'fossil',
    'gigaset': 'gigaset',
    'google': 'google',
    'pixel': 'google',
    'hamic': 'hamic',
    'hammer': 'hammer',
    'honeywell': 'honeywell',
    'honor': 'honor',
    'magic': 'honor',
    'hoozo': 'hoozo',
    'huawei': 'huawei',
    'isafemobile': 'isafemobile',
    'kddi': 'kddi',
    'kyocera': 'kyocera',
    'digno': 'kyocera',
    'logic': 'logic',
    'mitac': 'mitac',
    'mobvoi': 'mobvoi',
    'ticwatch': 'mobvoi',
    'montblanc': 'montblanc',
    'motorola': 'motorola',
    'moto': 'motorola',
    'razr': 'motorola',
    'myphone': 'myphone',
    'nokia': 'nokia',
    'nothing': 'nothing',
    'oneplus': 'onePlus',
    'one plus': 'onePlus',
    'oppo': 'oppo',
    'reno': 'oppo',
    'premier': 'premier',
    'rakuten': 'rakuten',
    'razer': 'razer',
    'realme': 'realme',
    'samsung': 'samsung',
    'galaxy': 'samsung',
    'sharp': 'sharp',
    'aquos': 'sharp',
    'sgin': 'sgin',
    'sony': 'sony',
    'xperia': 'sony',
    'surface': 'surface',
    'microsoft': 'surface',
    'tcl': 'tcl',
    'nxtpaper': 'tcl',
    'teclast': 'teclast',
    'tone': 'tone',
    'vikusha': 'vikusha',
    'vivo': 'vivo',
    'vsmart': 'vsmart',
    'xiaomi': 'xiaomi',
    'mi': 'xiaomi',
    'redmi': 'xiaomi',
    'poco': 'xiaomi',
    'zebra': 'zebra',
    'zonko': 'zonko',
    'zte': 'zte',
    'nubia': 'zte',
    // Laptop brands
    'acer': 'acer',
    'swift': 'acer',
    'travelmate': 'acer',
    'dell': 'dell',
    'latitude': 'dell',
    'hp': 'hp',
    'elitebook': 'hp',
    'probook': 'hp',
    'zbook': 'hp',
    'spectre': 'hp',
    'lenovo': 'lenovo',
    'thinkpad': 'lenovo',
    'yoga': 'lenovo',
    'miix': 'lenovo',
  };
  
  return aliases[normalizedName];
}
