import { getCachedAvailableDestinations } from './destinationAvailability';
import { getCountryFlag } from './countryFlags';

// Destination images - served from Supabase Storage (not bundled)
const STORAGE_BASE = 'https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/destinations';

const thailandImg = `${STORAGE_BASE}/thailand.png`;
const europeImg = `${STORAGE_BASE}/europe.png`;
const japanImg = `${STORAGE_BASE}/japan.png`;
const chinaImg = `${STORAGE_BASE}/china.png`;
const hongkongMacauImg = `${STORAGE_BASE}/hongkong-macau.png`;
const koreaImg = `${STORAGE_BASE}/korea.png`;
const vietnamImg = `${STORAGE_BASE}/vietnam.png`;
const taiwanImg = `${STORAGE_BASE}/taiwan.png`;
const singaporeImg = `${STORAGE_BASE}/singapore.png`;
const malaysiaImg = `${STORAGE_BASE}/malaysia.png`;
const usaImg = `${STORAGE_BASE}/usa.png`;
const australiaImg = `${STORAGE_BASE}/australia.png`;

export interface Destination {
  id: string;
  nameEn: string;
  nameTh: string;
  nameJa?: string;
  flag: string;
  image: string;
  filterType: 'country' | 'regional' | 'all';
  filterValue: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Curated list of popular destinations for all users
 * Order can be dynamically adjusted based on user location
 */
export const POPULAR_DESTINATIONS: Destination[] = [
  { id: 'thailand', nameEn: 'Thailand', nameTh: 'ไทย', nameJa: 'タイ', nameKo: '태국', nameFr: 'Thaïlande', nameDe: 'Thailand', nameZh: '泰国', nameEs: 'Tailandia', namePt: 'Tailândia', nameAr: 'تايلاند', flag: '🇹🇭', image: thailandImg, filterType: 'country', filterValue: 'Thailand' },
  { id: 'europe', nameEn: 'Europe', nameTh: 'ยุโรป', nameJa: 'ヨーロッパ', nameKo: '유럽', nameFr: 'Europe', nameDe: 'Europa', nameZh: '欧洲', nameEs: 'Europa', namePt: 'Europa', nameAr: 'أوروبا', flag: '🇪🇺', image: europeImg, filterType: 'regional', filterValue: 'Europe Premium 42 + Stopover' },
  { id: 'japan', nameEn: 'Japan', nameTh: 'ญี่ปุ่น', nameJa: '日本', nameKo: '일본', nameFr: 'Japon', nameDe: 'Japan', nameZh: '日本', nameEs: 'Japón', namePt: 'Japão', nameAr: 'اليابان', flag: '🇯🇵', image: japanImg, filterType: 'country', filterValue: 'Japan' },
  { id: 'china', nameEn: 'China', nameTh: 'จีน', nameJa: '中国', nameKo: '중국', nameFr: 'Chine', nameDe: 'China', nameZh: '中国', nameEs: 'China', namePt: 'China', nameAr: 'الصين', flag: '🇨🇳', image: chinaImg, filterType: 'country', filterValue: 'China' },
  { id: 'hongkong-macau', nameEn: 'Hong Kong/Macau', nameTh: 'ฮ่องกง/มาเก๊า', nameJa: '香港/マカオ', nameKo: '홍콩/마카오', nameFr: 'Hong Kong/Macao', nameDe: 'Hongkong/Macau', nameZh: '香港/澳门', nameEs: 'Hong Kong/Macao', namePt: 'Hong Kong/Macau', nameAr: 'هونغ كونغ/ماكاو', flag: '🇭🇰', image: hongkongMacauImg, filterType: 'regional', filterValue: 'Hong Kong/Macau' },
  { id: 'korea', nameEn: 'South Korea', nameTh: 'เกาหลีใต้', nameJa: '韓国', nameKo: '한국', nameFr: 'Corée du Sud', nameDe: 'Südkorea', nameZh: '韩国', nameEs: 'Corea del Sur', namePt: 'Coreia do Sul', nameAr: 'كوريا الجنوبية', flag: '🇰🇷', image: koreaImg, filterType: 'country', filterValue: 'South Korea' },
  { id: 'vietnam', nameEn: 'Vietnam', nameTh: 'เวียดนาม', nameJa: 'ベトナム', nameKo: '베트남', nameFr: 'Viêt Nam', nameDe: 'Vietnam', nameZh: '越南', nameEs: 'Vietnam', namePt: 'Vietnã', nameAr: 'فيتنام', flag: '🇻🇳', image: vietnamImg, filterType: 'country', filterValue: 'Vietnam' },
  { id: 'taiwan', nameEn: 'Taiwan', nameTh: 'ไต้หวัน', nameJa: '台湾', nameKo: '대만', nameFr: 'Taïwan', nameDe: 'Taiwan', nameZh: '台湾', nameEs: 'Taiwán', namePt: 'Taiwan', nameAr: 'تايوان', flag: '🇹🇼', image: taiwanImg, filterType: 'country', filterValue: 'Taiwan' },
  { id: 'singapore', nameEn: 'Singapore', nameTh: 'สิงคโปร์', nameJa: 'シンガポール', nameKo: '싱가포르', nameFr: 'Singapour', nameDe: 'Singapur', nameZh: '新加坡', nameEs: 'Singapur', namePt: 'Singapura', nameAr: 'سنغافورة', flag: '🇸🇬', image: singaporeImg, filterType: 'country', filterValue: 'Singapore' },
  { id: 'malaysia', nameEn: 'Malaysia', nameTh: 'มาเลเซีย', nameJa: 'マレーシア', nameKo: '말레이시아', nameFr: 'Malaisie', nameDe: 'Malaysia', nameZh: '马来西亚', nameEs: 'Malasia', namePt: 'Malásia', nameAr: 'ماليزيا', flag: '🇲🇾', image: malaysiaImg, filterType: 'country', filterValue: 'Malaysia' },
  { id: 'usa', nameEn: 'USA', nameTh: 'อเมริกา', nameJa: 'アメリカ', nameKo: '미국', nameFr: 'États-Unis', nameDe: 'USA', nameZh: '美国', nameEs: 'EE.UU.', namePt: 'EUA', nameAr: 'الولايات المتحدة', flag: '🇺🇸', image: usaImg, filterType: 'country', filterValue: 'USA' },
  { id: 'australia', nameEn: 'Australia', nameTh: 'ออสเตรเลีย', nameJa: 'オーストラリア', nameKo: '호주', nameFr: 'Australie', nameDe: 'Australien', nameZh: '澳大利亚', nameEs: 'Australia', namePt: 'Austrália', nameAr: 'أستراليا', flag: '🇦🇺', image: australiaImg, filterType: 'country', filterValue: 'Australia' },
  { id: 'singapore-malaysia-thailand', nameEn: 'SG/MY/TH', nameTh: 'สิงคโปร์/มาเลเซีย/ไทย', nameJa: 'SG/MY/TH', nameKo: 'SG/MY/TH', nameFr: 'SG/MY/TH', nameDe: 'SG/MY/TH', nameZh: '新/马/泰', nameEs: 'SG/MY/TH', namePt: 'SG/MY/TH', nameAr: 'SG/MY/TH', flag: '🇸🇬', image: '', filterType: 'regional', filterValue: 'Singapore, Malaysia & Thailand' },
  { id: 'australia-new-zealand', nameEn: 'Australia/NZ', nameTh: 'ออสเตรเลีย/นิวซีแลนด์', nameJa: 'オーストラリア/NZ', nameKo: '호주/뉴질랜드', nameFr: 'Australie/NZ', nameDe: 'Australien/NZ', nameZh: '澳大利亚/新西兰', nameEs: 'Australia/NZ', namePt: 'Austrália/NZ', nameAr: 'أستراليا/نيوزيلندا', flag: '🇦🇺', image: '', filterType: 'regional', filterValue: 'Australia & New Zealand' },
  { id: 'view-all', nameEn: 'View All', nameTh: 'ดูทั้งหมด', nameJa: 'すべて見る', nameKo: '전체 보기', nameFr: 'Tout voir', nameDe: 'Alle anzeigen', nameZh: '查看全部', nameEs: 'Ver Todo', namePt: 'Ver Tudo', nameAr: 'عرض الكل', flag: '➕', image: '', filterType: 'all', filterValue: null }
];

/**
 * User location preferences - defines which destinations to prioritize
 * based on the user's detected country
 */
const LOCATION_PREFERENCES: Record<string, string[]> = {
  // Thai users - ranked by actual outbound travel volume
  TH: ['japan', 'china', 'korea', 'singapore', 'vietnam', 'hongkong-macau', 'europe', 'malaysia', 'taiwan', 'usa'],
  
  // US users - prioritize Western destinations
  US: ['usa', 'europe', 'japan', 'korea'],
  
  // Chinese users - prioritize Asia destinations
  CN: ['china', 'japan', 'korea', 'hongkong-macau', 'taiwan', 'singapore', 'malaysia'],
  
  // UK/European users - prioritize Europe
  GB: ['europe', 'usa', 'japan'],
  DE: ['europe', 'usa', 'japan'],
  FR: ['europe', 'usa', 'japan'],
  
  // Japanese users
  JP: ['japan', 'usa', 'korea', 'taiwan'],
  
  // Australian users
  AU: ['australia', 'japan', 'singapore', 'malaysia', 'usa'],
  
  // Korean users
  KR: ['korea', 'japan', 'china', 'usa']
};

/**
 * Language-based destination ordering preferences
 * Used as fallback when country-specific preferences don't exist
 */
const LANGUAGE_PREFERENCES: Record<string, { first: string; order: string[] }> = {
  ja: { first: 'japan', order: ['korea', 'taiwan', 'thailand', 'vietnam', 'china', 'hongkong-macau', 'singapore', 'usa', 'europe', 'australia'] },
  ko: { first: 'korea', order: ['japan', 'vietnam', 'thailand', 'taiwan', 'china', 'usa', 'hongkong-macau', 'singapore', 'europe', 'australia', 'malaysia'] },
  fr: { first: 'europe', order: ['usa', 'thailand', 'vietnam', 'japan', 'korea', 'australia', 'china', 'singapore', 'hongkong-macau', 'malaysia'] },
  de: { first: 'europe', order: ['usa', 'thailand', 'japan', 'korea', 'australia', 'vietnam', 'china', 'singapore', 'hongkong-macau', 'malaysia'] },
  es: { first: 'europe', order: ['usa', 'thailand', 'japan', 'korea', 'australia', 'vietnam', 'china', 'singapore', 'malaysia', 'hongkong-macau'] },
  pt: { first: 'europe', order: ['usa', 'japan', 'thailand', 'korea', 'australia', 'vietnam', 'china', 'singapore', 'malaysia', 'hongkong-macau'] },
  ar: { first: 'europe', order: ['usa', 'thailand', 'japan', 'korea', 'australia', 'vietnam', 'china', 'singapore', 'malaysia', 'taiwan'] },
};

/**
 * Get popular destinations for a user based on their location
 * Reorders destinations to show most relevant ones first based on user's country
 */
export const getPopularDestinationsForUser = (
  userCountry: string,
  language: string
): Destination[] => {
  const viewAll = POPULAR_DESTINATIONS.find(d => d.id === 'view-all');
  const langPref = LANGUAGE_PREFERENCES[language];
  const countryPref = LOCATION_PREFERENCES[userCountry];

  // Determine which destination goes first based on language
  const isThaiOrEnglish = !language || language === 'en' || language === 'th';
  const firstId = isThaiOrEnglish ? 'thailand' : langPref?.first || 'thailand';

  const firstDest = POPULAR_DESTINATIONS.find(d => d.id === firstId);
  const otherDestinations = POPULAR_DESTINATIONS.filter(d => d.id !== firstId && d.id !== 'view-all');

  // Choose preference order: country-specific > language-based > none
  const prefOrder = countryPref || langPref?.order;

  if (!prefOrder) {
    return [firstDest, ...otherDestinations, viewAll].filter(Boolean) as Destination[];
  }

  // Reorder other destinations based on preferences
  const prioritized: Destination[] = [];
  const remaining: Destination[] = [];

  otherDestinations.forEach(dest => {
    if (prefOrder.includes(dest.id)) {
      prioritized.push(dest);
    } else {
      remaining.push(dest);
    }
  });

  prioritized.sort((a, b) => prefOrder.indexOf(a.id) - prefOrder.indexOf(b.id));

  return [firstDest, ...prioritized, ...remaining, viewAll].filter(Boolean) as Destination[];
};
