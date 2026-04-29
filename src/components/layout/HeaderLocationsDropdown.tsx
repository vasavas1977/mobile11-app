import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { POPULAR_DESTINATIONS } from '@/lib/popularDestinations';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { regionalToSlug, countryToSlug } from '@/lib/countryDestinations';

interface HeaderLocationsDropdownProps {
  onClose: () => void;
}

// Regional and global eSIM options matching actual Mobile11 packages
const regionalOptions = [
  { id: 'Asia 13 Countries', nameEn: 'Asia 13 Countries', nameTh: 'เอเชีย 13 ประเทศ', nameJa: 'アジア13カ国', nameKo: '아시아 13개국', nameFr: 'Asie 13 pays', nameDe: 'Asien 13 Länder', nameEs: 'Asia 13 Países', namePt: 'Ásia 13 Países', nameAr: 'آسيا 13 دولة' },
  { id: 'South East Asia 8 Countries', nameEn: 'Southeast Asia 8', nameTh: 'เอเชียตะวันออกเฉียงใต้ 8', nameJa: '東南アジア8カ国', nameKo: '동남아시아 8개국', nameFr: 'Asie du Sud-Est 8', nameDe: 'Südostasien 8', nameEs: 'Sudeste Asiático 8', namePt: 'Sudeste Asiático 8', nameAr: 'جنوب شرق آسيا 8' },
  { id: 'Europe Essentials 33', nameEn: 'Europe Essentials 33', nameTh: 'ยุโรปเอสเซนเชียล 33', nameJa: 'ヨーロッパ エッセンシャル33', nameKo: '유럽 에센셜 33', nameFr: 'Europe Essentiels 33', nameDe: 'Europa Essentials 33', nameEs: 'Europa Esenciales 33', namePt: 'Europa Essenciais 33', nameAr: 'أوروبا الأساسية 33' },
  { id: 'Europe Extended 41', nameEn: 'Europe Extended 41', nameTh: 'ยุโรปเอ็กซ์เทนเด็ด 41', nameJa: 'ヨーロッパ エクステンデッド41', nameKo: '유럽 확장 41', nameFr: 'Europe Étendu 41', nameDe: 'Europa Erweitert 41', nameEs: 'Europa Extendido 41', namePt: 'Europa Estendido 41', nameAr: 'أوروبا الموسعة 41' },
  { id: 'Europe Premium 42 + Stopover', nameEn: 'Europe Premium 42 + Stopover', nameTh: 'ยุโรปพรีเมียม 42 + สต็อปโอเวอร์', nameJa: 'ヨーロッパ プレミアム42+ストップオーバー', nameKo: '유럽 프리미엄 42 + 스톱오버', nameFr: 'Europe Premium 42 + Escale', nameDe: 'Europa Premium 42 + Zwischenstopp', nameEs: 'Europa Premium 42 + Escala', namePt: 'Europa Premium 42 + Escala', nameAr: 'أوروبا بريميوم 42 + توقف' },
  { id: 'Hongkong/Macau', nameEn: 'Hong Kong & Macau', nameTh: 'ฮ่องกง & มาเก๊า', nameJa: '香港 & マカオ', nameKo: '홍콩 & 마카오', nameFr: 'Hong Kong & Macao', nameDe: 'Hongkong & Macau', nameEs: 'Hong Kong y Macao', namePt: 'Hong Kong e Macau', nameAr: 'هونغ كونغ وماكاو' },
  { id: 'USA/Canada', nameEn: 'USA & Canada', nameTh: 'สหรัฐฯ & แคนาดา', nameJa: 'アメリカ & カナダ', nameKo: '미국 & 캐나다', nameFr: 'États-Unis & Canada', nameDe: 'USA & Kanada', nameEs: 'EE.UU. y Canadá', namePt: 'EUA e Canadá', nameAr: 'الولايات المتحدة وكندا' },
  { id: 'Global 109 Countries', nameEn: 'Global 109 Countries', nameTh: 'ทั่วโลก 109 ประเทศ', nameJa: 'グローバル109カ国', nameKo: '글로벌 109개국', nameFr: 'Mondial 109 pays', nameDe: 'Global 109 Länder', nameEs: 'Global 109 Países', namePt: 'Global 109 Países', nameAr: 'عالمي 109 دولة' },
  { id: 'Global 151 Countries', nameEn: 'Global 151 Countries', nameTh: 'ทั่วโลก 151 ประเทศ', nameJa: 'グローバル151カ国', nameKo: '글로벌 151개국', nameFr: 'Mondial 151 pays', nameDe: 'Global 151 Länder', nameEs: 'Global 151 Países', namePt: 'Global 151 Países', nameAr: 'عالمي 151 دولة' },
];

export function HeaderLocationsDropdown({ onClose }: HeaderLocationsDropdownProps) {
  const { t, language, localizeField } = useLanguage();
  
  // Filter out view-all and get popular destinations
  const popularLocations = POPULAR_DESTINATIONS.filter(d => d.id !== 'view-all');

  const getDestinationUrl = (destination: typeof POPULAR_DESTINATIONS[0]) => {
    if (destination.filterType === 'regional') {
      const slug = regionalToSlug(destination.filterValue || '');
      return `/esim/${slug}`;
    }
    const slug = countryToSlug(destination.filterValue || '');
    return `/esim/${slug}`;
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden max-h-[80vh] overflow-y-auto">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          {/* Popular Locations */}
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
              {t('header.popularLocations') || 'Popular locations'}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:gap-x-8 md:gap-y-3">
              {popularLocations.map((location) => (
                <Link
                  key={location.id}
                  to={getDestinationUrl(location)}
                  onClick={onClose}
                  className="flex items-center gap-3 text-gray-700 hover:text-primary transition-colors py-1.5"
                >
                  <FlagIcon destinationId={location.id} size="md" className="md:w-12 md:h-9" />
                  <span className="text-sm font-medium">
                    {localizeField(location, 'name')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Regional and Global */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
              {t('header.regionalGlobal') || 'Regional and global eSIMs'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {regionalOptions.map((region) => (
                <Link
                  key={region.id}
                  to={`/esim/${regionalToSlug(region.id)}`}
                  onClick={onClose}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors py-1.5"
                >
                  <FlagIcon regionalId={region.id} size="sm" className="md:w-10 md:h-7" />
                  <span className="text-xs md:text-sm">{localizeField(region, 'name')}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Explore Button */}
        <div className="mt-4 md:mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/packages"
            onClick={onClose}
            className="inline-flex items-center px-5 md:px-6 py-2 md:py-2.5 border-2 border-gray-900 text-gray-900 rounded-full text-sm md:text-base font-medium hover:bg-gray-900 hover:text-white transition-colors"
          >
            {t('header.exploreStore') || 'Explore eSIM Store'}
          </Link>
        </div>
      </div>
    </div>
  );
}
