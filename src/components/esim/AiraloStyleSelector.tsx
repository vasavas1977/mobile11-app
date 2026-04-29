import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ExternalLink, ShoppingCart, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProviderIndicator, getProviderBorderClass } from './ProviderIndicator';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { trackCTAClick } from '@/lib/journeyTrackingUtils';

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  carrier?: string;
  package_type?: string | null;
  daily_reset_amount?: string | null;
  daily_data_reset?: boolean | null;
  qos_speed?: string | null;
  network_type?: string | null;
  support_voice?: boolean | null;
  support_sms?: boolean | null;
  speed_after_limit?: string | null;
  provider_code?: string;
  provider_name?: string;
}

interface AiraloStyleSelectorProps {
  packages: EsimPackage[];
  countryCode: string;
  countryName: string;
  isRegional?: boolean;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string | null;
  onViewFullConfigurator: () => void;
  onAddToCart: (packageId: string, quantity: number) => void;
}

// Parse daily amount string like "1GB" or "0.5GB" to number
function parseDailyAmount(amount: string | null | undefined): number {
  if (!amount) return 0;
  const match = amount.match(/([\d.]+)\s*(GB|MB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  if (match[2].toUpperCase() === 'MB') return value / 1024;
  return value;
}

// Format GB for display
function formatDataAmount(gb: number): string {
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  if (Number.isInteger(gb)) return `${gb} GB`;
  return `${gb.toFixed(1)} GB`;
}

type TabCategory = {
  key: string;
  label: string;
  packageType: string;
};

export function AiraloStyleSelector({
  packages,
  countryCode,
  countryName,
  isRegional = false,
  onSelectPackage,
  selectedPackageId,
  onViewFullConfigurator,
  onAddToCart,
}: AiraloStyleSelectorProps) {
  const { formatPrice, t, language } = useLanguage();
  const { isAdmin } = useAdminCheck();
  const { items: cartItems } = useCart();
  const navigate = useNavigate();
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleAddToCartInline = useCallback((pkgId: string) => {
    trackCTAClick('Add to Cart - Package');
    onAddToCart(pkgId, 1);
    setJustAddedId(pkgId);
  }, [onAddToCart]);

  useEffect(() => {
    if (!justAddedId) return;
    const timer = setTimeout(() => {
      setJustAddedId(null);
      onSelectPackage('');
    }, 1200);
    return () => clearTimeout(timer);
  }, [justAddedId, onSelectPackage]);

  // Packages are now pre-filtered by carrier at the page level
  const carrierPackages = packages;

  // Categorize available package types
  const hasLimitless = carrierPackages.some(p => p.package_type === 'limitless');
  const hasDayPass = carrierPackages.some(p => p.package_type === 'day_pass');
  const hasMaxSpeed = carrierPackages.some(p => p.package_type === 'max_speed');

  

  // Pre-compute whether each type has visible packages after filtering
  const hasVisibleStandard = useMemo(() => {
    if (!hasDayPass) return false;
    const filtered = carrierPackages.filter(p =>
      p.package_type === 'day_pass' &&
      ALLOWED_DAYS_DAYPASS.includes(p.validity_days) &&
      parseDailyAmount(p.daily_reset_amount) > 0
    );
    return filtered.length > 0;
  }, [carrierPackages, hasDayPass]);

  const hasVisibleUnlimited = useMemo(() => {
    if (!hasLimitless) return false;
    const filtered = carrierPackages.filter(p =>
      p.package_type === 'limitless' &&
      ALLOWED_DAYS_UNLIMITED.includes(p.validity_days)
    );
    return filtered.length > 0;
  }, [carrierPackages, hasLimitless]);

  const hasVisibleLite = useMemo(() => {
    if (!hasMaxSpeed) return false;
    return carrierPackages.some(p => p.package_type === 'max_speed');
  }, [carrierPackages, hasMaxSpeed]);

  // Tab order: Lite | Standard | Unlimited
  const tabs = useMemo<TabCategory[]>(() => {
    const unlimitedLabel = t('packageSelector.unlimited');
    const standardLabel = t('packageSelector.value');
    const liteLabel = t('packageSelector.payPerUse');

    const result: TabCategory[] = [];

    if (hasVisibleLite && hasVisibleStandard && hasVisibleUnlimited) {
      // All 3 available: show only Standard + Unlimited
      result.push({ key: 'standard', label: standardLabel, packageType: 'day_pass' });
      result.push({ key: 'unlimited', label: unlimitedLabel, packageType: 'limitless' });
    } else {
      // 1 or 2 types: show all available, ordered Lite > Standard > Unlimited
      if (hasVisibleLite) result.push({ key: 'light', label: liteLabel, packageType: 'max_speed' });
      if (hasVisibleStandard) result.push({ key: 'standard', label: standardLabel, packageType: 'day_pass' });
      if (hasVisibleUnlimited) result.push({ key: 'unlimited', label: unlimitedLabel, packageType: 'limitless' });
    }

    return result;
  }, [hasVisibleStandard, hasVisibleUnlimited, hasVisibleLite, t]);

  // Default active tab priority: Lite > Standard > Unlimited (applied to visible tabs only)
  const defaultTab = useMemo(() => {
    const tabKeys = tabs.map(t => t.key);
    if (tabKeys.includes('light')) return 'light';
    if (tabKeys.includes('standard')) return 'standard';
    return 'unlimited';
  }, [tabs]);
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Get packages for the active tab
  const activePackageType = tabs.find(t => t.key === activeTab)?.packageType || tabs[0]?.packageType;

  const ALLOWED_DAYS_UNLIMITED = [3, 5, 7, 10, 15, 20, 30];
  const ALLOWED_DAYS_DAYPASS = [3, 5, 7, 10, 15, 20, 30];
  const PREFERRED_DAILY = [5, 3, 2, 1];
  const availableDailyAmounts = [...new Set(
    carrierPackages
      .filter(p => p.package_type === 'day_pass')
      .map(p => parseDailyAmount(p.daily_reset_amount))
      .filter(v => v > 0)
  )].sort((a, b) => b - a);
  const DEFAULT_DAILY_GB = PREFERRED_DAILY.find(d => availableDailyAmounts.includes(d))
    ?? availableDailyAmounts[0]
    ?? 3;
  const EXTRA_DAILY_GB = availableDailyAmounts.filter(d => d !== DEFAULT_DAILY_GB && d < DEFAULT_DAILY_GB);

  const groupByDays = (filtered: EsimPackage[]) => {
    const groups: Record<number, EsimPackage[]> = {};
    filtered.forEach(pkg => {
      if (!groups[pkg.validity_days]) groups[pkg.validity_days] = [];
      groups[pkg.validity_days].push(pkg);
    });
    Object.values(groups).forEach(group => group.sort((a, b) => a.price - b.price));
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([days, pkgs]) => ({ days: Number(days), packages: pkgs }));
  };

  const getPackagesForType = (packageType: string) => {
    let filtered = carrierPackages.filter(p => p.package_type === packageType);

    if (packageType === 'limitless') {
      filtered = filtered.filter(p => ALLOWED_DAYS_UNLIMITED.includes(p.validity_days));
    } else if (packageType === 'day_pass') {
      filtered = filtered.filter(p =>
        ALLOWED_DAYS_DAYPASS.includes(p.validity_days) &&
        parseDailyAmount(p.daily_reset_amount) === DEFAULT_DAILY_GB
      );
    } else if (packageType === 'max_speed') {
      const ALLOWED_DATA_GB = [5, 10, 15, 20];
      filtered = filtered.filter(p => {
        const match = p.data_amount?.match(/^(\d+)\s*GB$/i);
        return match && ALLOWED_DATA_GB.includes(parseInt(match[1]));
      });
    }

    return groupByDays(filtered);
  };

  const getExtraDayPassPackages = () => {
    const filtered = carrierPackages.filter(p =>
      p.package_type === 'day_pass' &&
      ALLOWED_DAYS_DAYPASS.includes(p.validity_days) &&
      EXTRA_DAILY_GB.includes(parseDailyAmount(p.daily_reset_amount))
    );
    return groupByDays(filtered);
  };

  // Render a package row
  const renderRow = (pkg: EsimPackage) => {
    const isSelected = selectedPackageId === pkg.id;
    const isDayPass = pkg.package_type === 'day_pass';
    const isLimitless = pkg.package_type === 'limitless';

    // Bold part + light suffix for the label
    let labelBold = '';
    let labelLight = 'GB';
    let expandDetail = '';

    if (isDayPass) {
      const dailyGb = parseDailyAmount(pkg.daily_reset_amount);
      const totalGb = dailyGb * pkg.validity_days;
      labelBold = formatDataAmount(totalGb).replace(' GB', '').replace(' MB', '');
      labelLight = totalGb < 1 ? 'MB' : 'GB';
      const dailyDisplay = pkg.daily_reset_amount || `${dailyGb} GB`;
      expandDetail = (t('packageSelector.dailySpeedReduced') as string).replace('{daily}', dailyDisplay);
    } else if (isLimitless) {
      labelBold = 'Unlimited';
      labelLight = 'GB';
      expandDetail = t('packageSelector.unlimitedData');
    } else {
      // Max Speed
      const match = pkg.data_amount?.match(/([\d.]+)\s*(GB|MB)/i);
      labelBold = match ? match[1] : pkg.data_amount;
      labelLight = match ? match[2].toUpperCase() : '';
      expandDetail = (t('packageSelector.serviceStopsAfterData') as string).replace('{data}', pkg.data_amount);
    }

    return (
      <button
        key={pkg.id}
        onClick={() => onSelectPackage(pkg.id)}
        className={cn(
          'w-full flex flex-col px-4 py-4 rounded-2xl border transition-all text-left bg-white shadow-sm',
          isSelected
            ? 'border-orange-500 ring-2 ring-orange-500/20'
            : 'border-transparent hover:border-orange-200',
          getProviderBorderClass(pkg.provider_code, isAdmin)
        )}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-gray-900">
            <span className="font-bold text-base">{labelBold}</span>
            {labelLight && <span className="font-normal text-sm text-gray-500 ml-1">{labelLight}</span>}
          </span>
          <span className="flex items-center gap-2">
            <ProviderIndicator providerCode={pkg.provider_code} />
            <span className="font-bold text-base text-gray-900 whitespace-nowrap">
              {formatPrice(pkg.price)}
            </span>
          </span>
        </div>
        {isSelected && (
          <div className="w-full mt-3 pt-2 text-sm text-gray-600 animate-in fade-in slide-in-from-top-1 duration-150">
            {!isDayPass && !isLimitless && pkg.speed_after_limit ? (
              <div className="flex flex-col gap-0.5">
                <span>Data: {pkg.data_amount} {t('packageSelector.serviceStops')}</span>
                {pkg.support_voice && <span>{t('packageSelector.call30mins')}</span>}
                <span>{(t('packageSelector.wifiDays') as string).replace('{days}', String(pkg.validity_days))}</span>
              </div>
            ) : (
              expandDetail
            )}
            {/* Inline Add to Cart */}
            <button
              onClick={(e) => { e.stopPropagation(); handleAddToCartInline(pkg.id); }}
              disabled={justAddedId === pkg.id}
              className={cn(
                "mt-3 ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                justAddedId === pkg.id
                  ? "bg-orange-600 border-orange-600 text-white"
                  : "bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
              )}
            >
              {justAddedId === pkg.id ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
              {justAddedId === pkg.id
                ? t('packageSelector.added')
                : t('packageSelector.addToCart')}
            </button>
          </div>
        )}
      </button>
    );
  };

  if (tabs.length === 0) return null;

  const showTabs = tabs.length > 1;

  // Find selected package for sticky bar
  const selectedPackage = selectedPackageId
    ? carrierPackages.find(p => p.id === selectedPackageId) ?? null
    : null;

  // Build a human-readable summary for the sticky bar
  const getPackageSummary = (pkg: EsimPackage): string => {
    if (pkg.package_type === 'limitless') {
      return (t('packageSelector.limitlessSummary') as string).replace('{days}', String(pkg.validity_days));
    }
    if (pkg.package_type === 'day_pass') {
      const dailyGb = parseDailyAmount(pkg.daily_reset_amount);
      const totalGb = dailyGb * pkg.validity_days;
      return (t('packageSelector.dayPassSummary') as string)
        .replace('{data}', formatDataAmount(totalGb))
        .replace('{days}', String(pkg.validity_days))
        .replace('{daily}', pkg.daily_reset_amount || '');
    }
    return (t('packageSelector.maxSpeedSummary') as string)
      .replace('{data}', pkg.data_amount)
      .replace('{days}', String(pkg.validity_days));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={cn('space-y-4', cartItems.length > 0 && 'pb-28')}>
      {/* Section header */}
      <div className="pb-3 border-b-2 border-gray-900">
        <h3 className="text-base font-semibold text-gray-900 text-center tracking-wide">
          {(() => {
            const hasVoice = carrierPackages.some(p => p.support_voice);
            const hasSms = carrierPackages.some(p => p.support_sms);
            if (hasVoice && hasSms) return t('packageSelector.dataCallsTexts');
            if (hasVoice) return t('packageSelector.dataCalls');
            return t('packageSelector.data');
          })()}
        </h3>
      </div>

      {showTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12 bg-[#ede8e3] rounded-xl p-1">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-lg text-sm font-semibold data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none text-gray-600"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4">
              <PackageList
                groupedByDays={getPackagesForType(tab.packageType)}
                extraGroupedByDays={tab.packageType === 'day_pass' ? getExtraDayPassPackages() : []}
                renderRow={renderRow}
                language={language}
                selectedPackageId={selectedPackageId}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <PackageList
          groupedByDays={getPackagesForType(tabs[0]?.packageType || '')}
          extraGroupedByDays={tabs[0]?.packageType === 'day_pass' ? getExtraDayPassPackages() : []}
          renderRow={renderRow}
          language={language}
          selectedPackageId={selectedPackageId}
        />
      )}


      {/* More options note */}
      <button
        onClick={onViewFullConfigurator}
        className="text-xs text-gray-400 hover:text-gray-600 px-1 pt-2 transition-colors"
      >
        {t('packageSelector.cantFind')}
      </button>

      {/* Compare all options link */}
      <button
        onClick={onViewFullConfigurator}
        className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium px-1 pt-2 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {t('packageSelector.compareAll')}
      </button>

      {/* Sticky cart bar — appears when cart has items */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 safe-area-pb animate-in slide-in-from-bottom-4 duration-200">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4 max-w-3xl">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-700">
                {cartItems.length} {t('packageSelector.items')}
              </span>
              <p className="text-lg font-bold text-gray-900">{formatPrice(cartTotal)}</p>
            </div>
            <Button
              onClick={() => navigate('/cart')}
              className="font-semibold px-6 rounded-full flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {t('packageSelector.viewCart')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: grouped package list by validity days
const DEFAULT_VISIBLE_DAYS_V2 = [3, 7, 10, 15];

function PackageList({
  groupedByDays,
  extraGroupedByDays = [],
  renderRow,
  language,
  selectedPackageId,
}: {
  groupedByDays: { days: number; packages: EsimPackage[] }[];
  extraGroupedByDays?: { days: number; packages: EsimPackage[] }[];
  renderRow: (pkg: EsimPackage) => React.ReactNode;
  language: string;
  selectedPackageId?: string | null;
}) {
  const { t } = useLanguage();
  const allGroups = [...groupedByDays, ...extraGroupedByDays];
  // Merge default visible days with actual available days from data
  const effectiveVisibleDays = useMemo(() => Array.from(new Set([...DEFAULT_VISIBLE_DAYS_V2, ...allGroups.map(g => g.days)])), [allGroups]);
  const selectedInHidden = selectedPackageId
    ? allGroups.some(g => !effectiveVisibleDays.includes(g.days) && g.packages.some(p => p.id === selectedPackageId))
    : false;
  const [showAllDays, setShowAllDays] = useState(selectedInHidden);

  const visibleMainGroups = showAllDays
    ? groupedByDays
    : groupedByDays.filter(g => effectiveVisibleDays.includes(g.days));
  const visibleExtraGroups = showAllDays ? extraGroupedByDays : extraGroupedByDays.filter(g => effectiveVisibleDays.includes(g.days));
  const hiddenGroups = allGroups.filter(g => !DEFAULT_VISIBLE_DAYS_V2.includes(g.days));

  if (groupedByDays.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        {t('packageSelector.noPackages')}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xl font-bold text-gray-900 px-1">
        {t('packageSelector.chooseDuration')}
      </p>
      {visibleMainGroups.map(({ days, packages }) => (
        <div key={days} className="space-y-2">
          <h4 className="text-base font-bold text-gray-900 px-1">
            {days} {t('packageSelector.days')}
          </h4>
          <div className="space-y-2">
            {packages.map(pkg => renderRow(pkg))}
          </div>
        </div>
      ))}
      {visibleExtraGroups.length > 0 && visibleExtraGroups.map(({ days, packages }) => (
        <div key={`extra-${days}`} className="space-y-2">
          <h4 className="text-base font-bold text-gray-900 px-1">
            {days} {t('packageSelector.days')}
          </h4>
          <div className="space-y-2">
            {packages.map(pkg => renderRow(pkg))}
          </div>
        </div>
      ))}
      {!showAllDays && hiddenGroups.length > 0 && (
        <button
          onClick={() => setShowAllDays(true)}
          className="text-xs text-gray-400 hover:text-orange-500 font-medium px-1 pt-1 transition-colors"
        >
          {(t('packageSelector.seeLongerPlans') as string).replace('{days}', hiddenGroups.map(g => g.days).join(', '))}
        </button>
      )}
    </div>
  );
}
