import { useState, useMemo } from 'react';
import { Wifi, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currencyUtils';
import { getDateLocale } from '@/lib/dateLocale';
import { navigateWithChatPersistence } from './utils/chatNavigation';
import { cn } from '@/lib/utils';

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

interface ChatPackageConfiguratorProps {
  packages: PackageInfo[];
  configuratorUrl?: string;
  country?: string;
  packageTypeName?: string;
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

export function ChatPackageConfigurator({ 
  packages, 
  configuratorUrl, 
  country,
  packageTypeName,
  initialDays
}: ChatPackageConfiguratorProps) {
  const { language, currency, t } = useLanguage();

  // Extract unique validity days and sort them
  const availableDays = useMemo(() => {
    const days = [...new Set(packages.map(pkg => pkg.validityDays))].sort((a, b) => a - b);
    return days;
  }, [packages]);

  // Use initialDays if provided and valid, otherwise default to smallest
  const [selectedDays, setSelectedDays] = useState<number>(() => {
    if (initialDays && availableDays.includes(initialDays)) {
      return initialDays;
    }
    return availableDays[0] || 7;
  });

  // Find the package matching selected days
  const selectedPackage = useMemo(() => {
    return packages.find(pkg => pkg.validityDays === selectedDays) || packages[0];
  }, [packages, selectedDays]);

  const handleBuy = () => {
    if (!selectedPackage?.id) {
      console.error('[ChatPackageConfigurator] No package selected');
      return;
    }
    
    const correctUrl = `${window.location.origin}/cart?items=${encodeURIComponent(`${selectedPackage.id}:1`)}&lang=${language}&currency=${currency}`;
    
    console.log('[ChatPackageConfigurator] Buy clicked, navigating with persistence');
    navigateWithChatPersistence(correctUrl);
  };

  const displayPrice = (priceUSD: number): string => {
    return formatPrice(priceUSD, currency);
  };

  if (packages.length === 0) return null;

  const packageType = selectedPackage?.packageType || packages[0]?.packageType;
  const displayTypeName = packageTypeName || formatPackageType(packageType);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800">
          📦 {(t('chatbot.configurator.packagesFor') as string).replace('{type}', displayTypeName).replace('{country}', country || '')}
        </h4>
        <p className="text-xs text-gray-500">
          {t('chatbot.configurator.selectDuration')}
        </p>
      </div>

      {/* Days Selector */}
      <div className="p-3 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {availableDays.map((days) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                selectedDays === days
                  ? "bg-gray-900 text-white ring-2 ring-orange-500"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
              )}
            >
              {days} {t('chatbot.configurator.days')}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Package Details */}
      {selectedPackage && (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {packageType && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getBadgeClass(packageType)}`}>
                    {formatPackageType(packageType)}
                  </span>
                )}
                <span className="text-xs text-gray-500 truncate">{selectedPackage.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-blue-500" />
                  {selectedPackage.dataAmount}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-green-500" />
                  {selectedPackage.validityDays} {t('chatbot.configurator.days')}
                </span>
                {packageType?.toLowerCase() === 'day_pass' && (() => {
                  const match = selectedPackage.dataAmount.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)/i);
                  if (!match) return null;
                  const amount = parseFloat(match[1]);
                  const unit = match[2].toUpperCase();
                  const totalMB = unit === 'GB' ? amount * 1024 * selectedPackage.validityDays : amount * selectedPackage.validityDays;
                  const display = totalMB >= 1024
                    ? `${Number.isInteger(totalMB / 1024) ? totalMB / 1024 : (totalMB / 1024).toFixed(1)}GB`
                    : `${totalMB}MB`;
                  return (
                    <span className="flex items-center gap-1 text-orange-600 font-medium">
                      <Sparkles className="h-3 w-3 text-orange-500" />
                      {(t('chatbot.configurator.total') as string).replace('{amount}', display)}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center gap-3 ml-3">
              <span className="text-lg font-bold text-gray-900">
                {displayPrice(selectedPackage.price)}
              </span>
              <button
                onClick={handleBuy}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
              >
                {t('chatbot.configurator.buy')}
              </button>
            </div>
          </div>
          
        </div>
      )}

      {/* View All Link */}
      {configuratorUrl && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-end">
          <a
            href={configuratorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600"
          >
            <ExternalLink className="h-3 w-3" />
            {t('chatbot.configurator.viewAll')}
          </a>
        </div>
      )}
    </div>
  );
}
