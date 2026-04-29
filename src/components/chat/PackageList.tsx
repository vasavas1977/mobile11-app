import { useState, useMemo } from 'react';
import { Wifi, Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currencyUtils';
import { navigateWithChatPersistence } from './utils/chatNavigation';
import { ChatPackageConfigurator } from './ChatPackageConfigurator';


interface PackageInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  packageType: string | null;
  validityDays: number;
  dataAmount: string;
  cartUrl: string;
}

interface PackageListProps {
  packages: PackageInfo[];
  configuratorUrl?: string;
  country?: string;
  initialDays?: number;
}

const formatPackageType = (packageType: string | null): string => {
  if (!packageType) return '';
  const typeMap: Record<string, string> = {
    'day_pass': 'Value',
    'max_speed': 'Pay-per-use',
    'limitless': 'Unlimited',
    'standard': 'Value'
  };
  return typeMap[packageType.toLowerCase()] || packageType;
};

const getBadgeClass = (packageType: string | null): string => {
  if (!packageType) return 'bg-gray-100 text-gray-700';
  const type = packageType.toLowerCase();
  if (type === 'limitless') return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
  if (type === 'max_speed') return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
  if (type === 'day_pass') return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
  return 'bg-gray-100 text-gray-700';
};

type FilterType = 'all' | 'limitless' | 'day_pass' | 'max_speed';

export function PackageList({ packages, configuratorUrl, country, initialDays }: PackageListProps) {
  const { language, currency, t, localizeField } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAll, setShowAll] = useState(false);

  // Check if all packages are the same type with multiple durations
  const shouldShowConfigurator = useMemo(() => {
    if (packages.length <= 1) return false;
    
    const packageTypes = new Set(packages.map(p => p.packageType?.toLowerCase() || 'unknown'));
    const isSingleType = packageTypes.size === 1;
    const uniqueDays = new Set(packages.map(p => p.validityDays));
    const hasMultipleDurations = uniqueDays.size > 1;
    
    return isSingleType && hasMultipleDurations;
  }, [packages]);

  // If single type with multiple durations, show interactive configurator
  if (shouldShowConfigurator) {
    return (
      <ChatPackageConfigurator 
        packages={packages} 
        configuratorUrl={configuratorUrl} 
        country={country}
        initialDays={initialDays}
      />
    );
  }

  const filterButtons: { key: FilterType; labelEn: string; labelTh: string; labelJa: string; labelKo: string; labelFr: string; labelDe: string; labelEs: string; labelPt: string; labelAr: string }[] = [
    { key: 'all', labelEn: 'All', labelTh: 'ทั้งหมด', labelJa: 'すべて', labelKo: '전체', labelFr: 'Tous', labelDe: 'Alle', labelEs: 'Todos', labelPt: 'Todos', labelAr: 'الكل' },
    { key: 'limitless', labelEn: 'Unlimited', labelTh: 'ไม่จำกัด', labelJa: '無制限', labelKo: '무제한', labelFr: 'Illimité', labelDe: 'Unbegrenzt', labelEs: 'Ilimitado', labelPt: 'Ilimitado', labelAr: 'غير محدود' },
    { key: 'day_pass', labelEn: 'Value', labelTh: 'คุ้มค่า', labelJa: 'バリュー', labelKo: '가성비', labelFr: 'Économique', labelDe: 'Preiswert', labelEs: 'Económico', labelPt: 'Econômico', labelAr: 'اقتصادي' },
    { key: 'max_speed', labelEn: 'Pay-per-use', labelTh: 'ตามจริง', labelJa: '従量制', labelKo: '종량제', labelFr: 'À la consommation', labelDe: 'Nutzungsbasiert', labelEs: 'Pago por uso', labelPt: 'Pago por uso', labelAr: 'الدفع حسب الاستخدام' }
  ];

  const filteredPackages = packages.filter(pkg => {
    if (filter === 'all') return true;
    return pkg.packageType?.toLowerCase() === filter;
  });

  const displayedPackages = showAll ? filteredPackages : filteredPackages.slice(0, 4);
  const hasMorePackages = filteredPackages.length > 4;

  const handleBuy = (packageId: string, originalCartUrl: string) => {
    if (!packageId) {
      console.error('[PackageList] Buy clicked but packageId is empty');
      return;
    }
    
    // Regenerate cart URL with correct client origin to prevent stale domain issues
    const correctUrl = `${window.location.origin}/cart?items=${encodeURIComponent(`${packageId}:1`)}&lang=${language}&currency=${currency}`;
    
    console.log('[PackageList] Buy clicked, navigating with persistence');
    navigateWithChatPersistence(correctUrl);
  };

  // Format price using the utility function with the current currency
  const displayPrice = (priceUSD: number): string => {
    return formatPrice(priceUSD, currency);
  };

  if (packages.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800">
          {(t('chatbot.packageList.title') as string).replace('{country}', country || '')}
        </h4>
        <p className="text-xs text-gray-500">
          {(t('chatbot.packageList.available') as string).replace('{count}', String(packages.length))}
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-100 overflow-x-auto">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors
              ${filter === btn.key 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
          >
            {localizeField(btn, 'label')}
          </button>
        ))}
      </div>

      {/* Package List */}
      <div className="max-h-64 overflow-y-auto">
        {displayedPackages.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {t('chatbot.packageList.noMatch')}
          </div>
        ) : (
          displayedPackages.map((pkg, index) => (
            <div 
              key={pkg.id || index}
              className="flex items-center justify-between p-2 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {pkg.packageType && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getBadgeClass(pkg.packageType)}`}>
                      {formatPackageType(pkg.packageType)}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 truncate">{pkg.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Wifi className="h-3 w-3 text-blue-500" />
                    {pkg.dataAmount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-green-500" />
                    {pkg.validityDays} {t('chatbot.configurator.days')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm font-bold text-gray-900">
                  {displayPrice(pkg.price)}
                </span>
                <button
                  onClick={() => handleBuy(pkg.id, pkg.cartUrl)}
                  className="px-2 py-1 text-xs font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors whitespace-nowrap"
                >
                  {t('chatbot.configurator.buy')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>


      {/* Show More / View All */}
      <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        {hasMorePackages && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            <ChevronDown className="h-3 w-3" />
             {(t('chatbot.packageList.showMore') as string).replace('{count}', String(filteredPackages.length - 4))}
          </button>
        )}
        {showAll && hasMorePackages && (
          <button
            onClick={() => setShowAll(false)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            {t('chatbot.packageList.showLess')}
          </button>
        )}
        {configuratorUrl && (
          <a
            href={configuratorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 ml-auto"
          >
            <ExternalLink className="h-3 w-3" />
            {t('chatbot.configurator.viewAll')}
          </a>
        )}
      </div>
    </div>
  );
}
