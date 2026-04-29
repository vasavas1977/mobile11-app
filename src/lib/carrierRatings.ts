// Comprehensive carrier ratings based on real-world coverage rankings per country
// 5 stars = #1 carrier (widest coverage), 4 stars = #2, 3 stars = #3 or smaller/newer

const CARRIER_RATINGS: Record<string, number> = {
  // Albania
  'Vodafone/One': 5,
  'ALBtelecom': 3,
  // Australia
  'Optus': 4,
  // Australia & NZ (combined)
  'Australia: Optus/Vodafone, New Zealand: Vodafone/Spark': 5,
  'Optus/Vodafone': 4,
  // Austria
  'T-mobile / Orange(H3G)': 4,
  // Belgium
  'Proximus/Orange/Base': 5,
  'Telenet/Orange': 4,
  // Bosnia
  'BH Telecom/m:tel': 5,
  // Brazil
  'Vivo': 5,
  // Bulgaria
  'Vivacom/A1': 5,
  'A1/Telenor': 4,
  // Cambodia
  'Smart/Cellcard': 5,
  'CamGSM': 4,
  // Canada
  'Bell / Telus / Sasktel': 5,
  // China
  'CMCC': 5,
  'China Mobile': 5,
  'China Unicom': 4,
  'China Telecom': 4,
  // Croatia
  'T-Mobile/A1/Telemach': 5,
  'Tele2/Hrvatski': 4,
  // Cyprus
  'Cyta/Epic': 5,
  'PrimeTel': 3,
  // Czech Republic
  'Vodafone/T-Mobile': 5,
  'T-Mobile/O2': 5,
  // Denmark
  'TDC / Telia': 5,
  // Egypt
  'Vodafone / Etisalat / Orange': 5,
  // Estonia
  'Telia/Elisa': 5,
  // Finland
  'Elisa/DNA': 5,
  // France
  'SFR / Orange': 5,
  // Germany
  'Vodafone / Telefonica O2': 4,
  // Greece
  'Wind/Cosmote/Vodafone': 5,
  // Guam
  'Docomo Pacific': 5,
  // Hong Kong
  'CMHK': 4,
  'CSL': 5,
  'PCCW': 4,
  '3HK': 4,
  // Hungary
  'Telenor/Vodafone': 5,
  'T-Mobile/Telenor': 4,
  // Iceland
  'Siminn/Vodafone': 5,
  'Fjarskipti/Nova': 4,
  'Nova + Vodafone/Sýn': 4,
  // India
  'Reliance Jio/Bharti Airtel': 5,
  // Indonesia
  'Telkomsel/XL': 5,
  'XL (Excelcom) / Indosat / Telkomsel': 5,
  'XL(Excelcom)/Telkomsel': 5,
  'Indosat/Tri': 4,
  // Ireland
  'Meteor': 4,
  // Italy
  'Vodafone / TIM': 5,
  // Japan
  'DOCOMO': 5,
  'NTT Docomo': 5,
  'Softbank / KDDI': 4,
  'SoftBank': 4,
  'KDDI': 4,
  'au (KDDI)': 4,
  // South Korea
  'KT/SKT': 5,
  'KT': 5,
  'SKT': 5,
  'SK Telecom': 5,
  'LG U+/KT': 4,
  'LG U+': 4,
  // Laos
  'Unitel/LaoTel': 5,
  // Latvia
  'LMT/Tele2': 5,
  'Bite': 3,
  // Lithuania
  'Telia/Bite': 5,
  // Luxembourg
  'POST/Tango': 5,
  // Macau
  'CTM': 5,
  // Malaysia
  'Maxis / Celcom': 5,
  'Maxis / Celcom / Digi': 5,
  // Malta
  'GO/Vodafone': 5,
  'Melita': 3,
  // Montenegro
  'Crnogorski/Telenor': 5,
  'M:Tel': 3,
  // Netherlands
  'Vodafone / KPN': 5,
  // New Zealand
  'Vodafone/Spark': 5,
  // Norway
  'Telia/Telenor': 5,
  // Philippines
  'Smart / Globe': 5,
  'Globe/Smart': 5,
  'Smart': 4,
  'DITO/Globe': 4,
  // Poland
  'Polkomtel/Orange/T-Mobile': 5,
  'Polkomtel': 4,
  // Portugal
  'TMN (MEO) / Optimus (NOS) / Vodafone': 5,
  // Romania
  'Vodafone/Orange': 5,
  'Digi/Orange': 5,
  // Russia
  'MTS': 5,
  'Tele2/Beeline': 4,
  'Tele2': 4,
  'Beeline': 4,
  // Saudi Arabia
  'STC/Mobily/Zain': 5,
  // Serbia
  'Telekom/A1': 5,
  'Yettel': 4,
  // Singapore
  'Singtel': 5,
  'Singtel/StarHub': 5,
  'StarHub': 4,
  'M1': 4,
  // Slovakia
  'Orange/T-Mobile': 5,
  'O2/Swan': 4,
  // Slovenia (Telekom/A1 already defined under Serbia - same rating)
  'Telemach': 4,
  // South Africa
  'Cell C/Vodacom': 5,
  // Spain
  'Orange / Telefonica / Vodafone': 5,
  // Sweden
  'Telenor / TeliaSonera / Tele2': 5,
  // Switzerland
  'Sunrise / Orange': 4,
  // Taiwan
  'Chunghwa': 5,
  'Chunghwa/FarEasTone': 5,
  'FarEasTone': 4,
  'Taiwan Mobile': 4,
  'Taiwan Mobile/APT': 4,
  // Thailand
  'AIS': 5,
  'Real Future (Truemove)': 4,
  'Truemove': 4,
  'True': 4,
  'DTAC': 4,
  // Turkey
  'Turkcell': 5,
  'Turk Telekom': 4,
  'Vodafone/Turkcell': 5,
  // UAE
  'Etisalat / DU': 5,
  // UK
  'Vodafone / EE / O2': 5,
  // Ukraine
  'Kyivstar/Vodafone': 5,
  'lifecell': 3,
  // USA
  'AT&T / T-Mobile': 5,
  'AT&T': 4,
  'T-Mobile': 5,
  'Verizon': 5,
  // Vietnam
  'Vinaphone / Mobifone / Viettel': 5,
  // Generic/common
  'Vodafone': 4,
  'Orange': 4,
  'Telefonica': 4,
  'Deutsche Telekom': 5,
  'Spark': 5,
  // Individual carriers (for split matching)
  'Telkomsel': 5,
  'XL': 4,
  'XL (Excelcom)': 4,
  'Indosat': 4,
  'Tri': 3,
  'Proximus': 5,
  'Base': 3,
  'One': 4,
  'Bell': 5,
  'Telus': 5,
  'Sasktel': 4,
  'BH Telecom': 5,
  'm:tel': 4,
  'Vivacom': 5,
  'A1': 4,
  'Cellcard': 5,
  'Reliance Jio': 5,
  'Bharti Airtel': 5,
  'Epic': 4,
  'Cyta': 5,
  'O2': 4,
  'Cosmote': 5,
  'Wind': 4,
  'Siminn': 5,
  'EE': 5,
  'KPN': 5,
  'Mobily': 4,
  'Zain': 4,
  'STC': 5,
  'Vodacom': 5,
  'Cell C': 4,
  'DU': 4,
  'Etisalat': 5,
  'Telia': 5,
  'TeliaSonera': 5,
  'Telenor': 4,
  'Sunrise': 4,
  'TDC': 5,
  'Elisa': 5,
  'DNA': 4,
  'SFR': 5,
  'Telefonica O2': 4,
  'TIM': 5,
  'TMN (MEO)': 5,
  'Optimus (NOS)': 5,
  'POST': 5,
  'Tango': 4,
  'GO': 5,
  'Crnogorski': 5,
  'LMT': 5,
  'Kyivstar': 5,
  'Hrvatski': 4,
  'Vinaphone': 5,
  'Mobifone': 5,
  'Viettel': 5,
  'Digi': 4,
  'Swan': 3,
  'LGU+': 4,
  'Celcom': 5,
  'Maxis': 5,
};

export function getCarrierRating(carrier: string): number {
  // Check for exact match
  if (CARRIER_RATINGS[carrier] !== undefined) {
    return CARRIER_RATINGS[carrier];
  }
  
  // Check for partial match (e.g., "DOCOMO" in "NTT DOCOMO")
  const normalizedCarrier = carrier.toUpperCase();
  for (const [key, rating] of Object.entries(CARRIER_RATINGS)) {
    if (normalizedCarrier.includes(key.toUpperCase())) {
      return rating;
    }
  }
  
  // Default rating for unknown carriers
  return 4;
}

export function getBestCarrierFirst(carrier: string): { reordered: string; bestRating: number } {
  // Detect delimiter style
  const hasSpacedSlash = carrier.includes(' / ');
  const delimiter = hasSpacedSlash ? ' / ' : '/';
  const parts = carrier.split(delimiter).map(s => s.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return { reordered: carrier, bestRating: getCarrierRating(carrier) };
  }

  // Check full string rating as a floor
  const fullStringRating = getCarrierRating(carrier);

  // Rate each part individually and sort descending
  const rated = parts.map(p => ({ name: p, rating: getCarrierRating(p) }));
  rated.sort((a, b) => b.rating - a.rating);

  // Use the higher of full-string rating or best individual rating
  const bestRating = Math.max(fullStringRating, rated[0].rating);

  return {
    reordered: rated.map(r => r.name).join(delimiter),
    bestRating,
  };
}

export function getCarrierRatingDescription(rating: number): {
  titleEn: string;
  titleTh: string;
  titleJa: string;
  titleKo: string;
  titleFr: string;
  titleDe: string;
  pointsEn: string[];
  pointsTh: string[];
  pointsJa: string[];
  pointsKo: string[];
  pointsFr: string[];
  pointsDe: string[];
  icon: string;
} {
  if (rating >= 5) {
    return {
      icon: '🏆',
      titleEn: '#1 Carrier — Best Coverage',
      titleTh: 'อันดับ 1 — ครอบคลุมดีที่สุด',
      titleJa: '#1 キャリア — 最高のカバレッジ',
      titleKo: '#1 통신사 — 최고의 커버리지',
      titleFr: 'Opérateur n°1 — Meilleure couverture',
      titleDe: 'Anbieter Nr. 1 — Beste Abdeckung',
      pointsEn: [
        'Ranked #1 for widest network coverage in this country',
        'Strongest signal in rural and remote areas',
        'Most reliable data speeds across the network',
      ],
      pointsTh: [
        'เครือข่ายอันดับ 1 ที่มีพื้นที่ครอบคลุมกว้างที่สุดในประเทศ',
        'สัญญาณแรงที่สุดในพื้นที่ชนบทและพื้นที่ห่างไกล',
        'ความเร็วข้อมูลเสถียรที่สุดทั่วทั้งเครือข่าย',
      ],
      pointsJa: [
        'この国で最も広いネットワークカバレッジを持つ第1位のキャリア',
        '地方・遠隔地でも最も強い電波',
        'ネットワーク全体で最も安定したデータ速度',
      ],
      pointsKo: [
        '이 나라에서 가장 넓은 네트워크 커버리지를 가진 1위 통신사',
        '농촌 및 외진 지역에서도 가장 강한 신호',
        '네트워크 전체에서 가장 안정적인 데이터 속도',
      ],
      pointsFr: [
        'Opérateur n°1 avec la couverture réseau la plus étendue du pays',
        'Signal le plus puissant dans les zones rurales et isolées',
        'Débits de données les plus fiables sur l\'ensemble du réseau',
      ],
      pointsDe: [
        'Anbieter Nr. 1 mit der größten Netzabdeckung im Land',
        'Stärkstes Signal in ländlichen und abgelegenen Gebieten',
        'Zuverlässigste Datengeschwindigkeiten im gesamten Netz',
      ],
    };
  }
  if (rating >= 4) {
    return {
      icon: '⭐',
      titleEn: '#2 Carrier — Strong Coverage',
      titleTh: 'อันดับ 2 — ครอบคลุมดี',
      titleJa: '#2 キャリア — 良好なカバレッジ',
      titleKo: '#2 통신사 — 우수한 커버리지',
      titleFr: 'Opérateur n°2 — Bonne couverture',
      titleDe: 'Anbieter Nr. 2 — Gute Abdeckung',
      pointsEn: [
        'Major carrier with strong nationwide coverage',
        'Excellent performance in cities and urban areas',
        'Good alternative with competitive data speeds',
      ],
      pointsTh: [
        'เครือข่ายหลักที่มีพื้นที่ครอบคลุมทั่วประเทศ',
        'ประสิทธิภาพดีเยี่ยมในเมืองและพื้นที่เขตเมือง',
        'ทางเลือกที่ดีด้วยความเร็วข้อมูลที่แข่งขันได้',
      ],
      pointsJa: [
        '全国的に強力なカバレッジを持つ主要キャリア',
        '都市部で優れたパフォーマンス',
        '競争力のあるデータ速度を持つ良い選択肢',
      ],
      pointsKo: [
        '전국적으로 강력한 커버리지를 가진 주요 통신사',
        '도시 및 도심 지역에서 우수한 성능',
        '경쟁력 있는 데이터 속도를 가진 좋은 대안',
      ],
      pointsFr: [
        'Opérateur majeur avec une forte couverture nationale',
        'Excellentes performances dans les villes et zones urbaines',
        'Bonne alternative avec des débits de données compétitifs',
      ],
      pointsDe: [
        'Großer Anbieter mit starker landesweiter Abdeckung',
        'Hervorragende Leistung in Städten und Ballungsgebieten',
        'Gute Alternative mit wettbewerbsfähigen Datengeschwindigkeiten',
      ],
    };
  }
  return {
    icon: '📶',
    titleEn: 'Regional Carrier — Growing Network',
    titleTh: 'เครือข่ายภูมิภาค — กำลังขยาย',
    titleJa: '地域キャリア — 拡大中のネットワーク',
    titleKo: '지역 통신사 — 성장 중인 네트워크',
    titleFr: 'Opérateur régional — Réseau en expansion',
    titleDe: 'Regionaler Anbieter — Wachsendes Netz',
    pointsEn: [
      'Newer or regional carrier with expanding coverage',
      'May have limited signal in remote areas',
      'Often offers competitive pricing for urban usage',
    ],
    pointsTh: [
      'เครือข่ายใหม่หรือระดับภูมิภาคที่กำลังขยายพื้นที่',
      'อาจมีสัญญาณจำกัดในพื้นที่ห่างไกล',
      'มักมีราคาแข่งขันได้สำหรับการใช้งานในเมือง',
    ],
    pointsJa: [
      'カバレッジを拡大中の新しい地域キャリア',
      '遠隔地では電波が限られる場合があります',
      '都市部での利用に競争力のある価格を提供することが多い',
    ],
    pointsKo: [
      '커버리지를 확장 중인 신규 또는 지역 통신사',
      '외진 지역에서는 신호가 제한될 수 있습니다',
      '도시 이용에 경쟁력 있는 가격을 제공하는 경우가 많습니다',
    ],
    pointsFr: [
      'Opérateur nouveau ou régional avec une couverture en expansion',
      'Le signal peut être limité dans les zones isolées',
      'Propose souvent des tarifs compétitifs pour un usage urbain',
    ],
    pointsDe: [
      'Neuer oder regionaler Anbieter mit wachsender Abdeckung',
      'Signal kann in abgelegenen Gebieten eingeschränkt sein',
      'Bietet oft wettbewerbsfähige Preise für städtische Nutzung',
    ],
  };
}
