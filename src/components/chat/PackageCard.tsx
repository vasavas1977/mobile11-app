import { ShoppingCart, Calendar, Zap, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { navigateWithChatPersistence } from './utils/chatNavigation';

interface PackageInfo {
  id: string;
  name: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  package_type: string | null;
  cartUrl: string;
}

interface PackageCardProps {
  pkg: PackageInfo;
  compact?: boolean;
}

// Format package type for display
function formatPackageType(packageType: string | null): string {
  if (!packageType) return 'Standard';
  
  const typeMap: Record<string, string> = {
    'day_pass': 'Value',
    'daypass': 'Value',
    'max_speed': 'Pay-per-use',
    'maxspeed': 'Pay-per-use',
    'limitless': 'Unlimited',
    'unlimited': 'Unlimited',
    'real_unlimited': 'Real Unlimited',
    'standard': 'Value'
  };
  
  return typeMap[packageType.toLowerCase()] || packageType;
}

// Get badge color based on package type
function getBadgeClass(packageType: string | null): string {
  if (!packageType) return 'bg-gray-100 text-gray-700';
  
  const type = packageType.toLowerCase();
  if (type.includes('limitless') || type.includes('unlimited')) {
    return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
  }
  if (type.includes('max') || type.includes('speed')) {
    return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
  }
  if (type.includes('day')) {
    return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
  }
  return 'bg-gray-100 text-gray-700';
}

export function PackageCard({ pkg, compact = false }: PackageCardProps) {
  const { formatPrice, language, t } = useLanguage();
  
  const handleBuyClick = () => {
    navigateWithChatPersistence(pkg.cartUrl);
  };

  const displayType = formatPackageType(pkg.package_type);
  const badgeClass = getBadgeClass(pkg.package_type);

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeClass}`}>
                {displayType}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-900 truncate">{pkg.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
              <span className="flex items-center gap-0.5">
                <Wifi className="h-2.5 w-2.5" />
                {pkg.data_amount}
              </span>
              <span className="flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                {pkg.validity_days}d
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-orange-600">
              {pkg.currency === 'THB' ? `฿${pkg.price}` : `$${pkg.price}`}
            </p>
            <Button
              size="sm"
              onClick={handleBuyClick}
              className="h-6 px-2 text-[10px] bg-orange-500 hover:bg-orange-600 text-white mt-1"
            >
              <ShoppingCart className="h-2.5 w-2.5 mr-1" />
              {t('packageCard.buy')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      {/* Header with badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}>
          {displayType}
        </span>
        <span className="text-xs text-gray-500">{pkg.country_name}</span>
      </div>

      {/* Package name */}
      <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
        {pkg.name}
      </h4>

      {/* Package details */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Wifi className="h-3.5 w-3.5 text-orange-500" />
          <span>{pkg.data_amount}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-orange-500" />
          <span>{pkg.validity_days} {t('packageCard.days')}</span>
        </div>
        {pkg.package_type?.toLowerCase().includes('limitless') && (
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-orange-500" />
            <span>{t('packageCard.unlimited')}</span>
          </div>
        )}
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-lg font-bold text-orange-600">
            {pkg.currency === 'THB' ? `฿${pkg.price.toFixed(0)}` : `$${pkg.price.toFixed(2)}`}
          </p>
        </div>
        <Button
          onClick={handleBuyClick}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {t('packageCard.buyNow')}
        </Button>
      </div>
    </div>
  );
}
