import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FileText, ShoppingCart, Check, ChevronRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProviderIndicator, getProviderBorderClass } from './ProviderIndicator';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { trackCTAClick } from '@/lib/journeyTrackingUtils';
import { PackageDetailsModal } from '@/components/my-esims/PackageDetailsModal';

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
  is_local_sim?: boolean | null;
  hot_spot?: boolean | null;
  country_code?: string;
  country_name?: string;
  is_popular?: boolean | null;
  description?: string | null;
}

interface AiraloStyleSelectorV4Props {
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

export function AiraloStyleSelectorV4({
  packages,
  countryCode,
  countryName,
  isRegional = false,
  onSelectPackage,
  selectedPackageId,
  onViewFullConfigurator,
  onAddToCart,
}: AiraloStyleSelectorV4Props) {
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

  const [showPackageDetails, setShowPackageDetails] = useState(false);

  const carrierPackages = packages;

  // Compute the most cost-effective package per package type (highest GB per dollar)
  const mostPopularByType = useMemo(() => {
    const MAX_POPULAR_PRICE_USD = 57.14; // ≈ ฿2,000 THB cap
    const bestByType: Record<string, { id: string; score: number }> = {};

    carrierPackages.forEach(pkg => {
      let effectiveGb = 0;
      if (pkg.package_type === 'day_pass') {
        const dailyGb = parseDailyAmount(pkg.daily_reset_amount);
        effectiveGb = dailyGb * pkg.validity_days;
      } else if (pkg.package_type === 'limitless') {
        effectiveGb = 5 * pkg.validity_days;
      } else if (pkg.package_type === 'max_speed') {
        const match = pkg.data_amount?.match(/([\d.]+)\s*(GB|MB)/i);
        if (match) {
          effectiveGb = match[2].toUpperCase() === 'MB' ? parseFloat(match[1]) / 1024 : parseFloat(match[1]);
        }
      }
      const MAX_POPULAR_DAYS = 10;
      if (pkg.price > 0 && pkg.price <= MAX_POPULAR_PRICE_USD && pkg.validity_days <= MAX_POPULAR_DAYS && effectiveGb > 0) {
        const score = effectiveGb / pkg.price;
        const current = bestByType[pkg.package_type];
        if (!current || score > current.score) {
          bestByType[pkg.package_type] = { id: pkg.id, score };
        }
      }
    });

    const result: Record<string, string> = {};
    for (const [type, best] of Object.entries(bestByType)) {
      result[type] = best.id;
    }
    return result;
  }, [carrierPackages]);

  const isLocalSimGroup = carrierPackages.length > 0 && carrierPackages.every(p => p.is_local_sim === true);
  const isSingleLocalSim = isLocalSimGroup && carrierPackages.length === 1;

  const hasLimitless = carrierPackages.some(p => p.package_type === 'limitless');
  const hasDayPass = carrierPackages.some(p => p.package_type === 'day_pass');
  const hasMaxSpeed = carrierPackages.some(p => p.package_type === 'max_speed');

  // No hardcoded day filtering — all durations from the database are shown
  const PREFERRED_DAILY = countryCode === 'US' ? [3, 5, 2, 1] : [5, 3, 2, 1];
  const availableDailyAmounts = [...new Set(
    carrierPackages
      .filter(p => p.package_type === 'day_pass')
      .map(p => parseDailyAmount(p.daily_reset_amount))
      .filter(v => v > 0)
  )].sort((a, b) => b - a);
  const visibleDailyTiers = useMemo(() => {
    if (availableDailyAmounts.includes(5)) {
      return [5, 3, 1].filter(d => availableDailyAmounts.includes(d));
    }
    if (availableDailyAmounts.includes(3)) {
      return [3, 1].filter(d => availableDailyAmounts.includes(d));
    }
    if (availableDailyAmounts.includes(2)) {
      return [2, 1].filter(d => availableDailyAmounts.includes(d));
    }
    return availableDailyAmounts.slice(0, 1);
  }, [availableDailyAmounts]);

  const hasVisibleStandard = useMemo(() => {
    if (!hasDayPass) return false;
    return carrierPackages.some(p =>
      p.package_type === 'day_pass' &&
      parseDailyAmount(p.daily_reset_amount) > 0
    );
  }, [carrierPackages, hasDayPass]);

  const hasVisibleUnlimited = useMemo(() => {
    if (!hasLimitless) return false;
    return carrierPackages.some(p => p.package_type === 'limitless');
  }, [carrierPackages, hasLimitless]);

  const hasVisibleLite = useMemo(() => {
    if (!hasMaxSpeed) return false;
    return carrierPackages.some(p => p.package_type === 'max_speed');
  }, [carrierPackages, hasMaxSpeed]);

  const tabs = useMemo<TabCategory[]>(() => {
    const unlimitedLabel = t('packageSelector.unlimited');
    const standardLabel = t('packageSelector.value');
    const liteLabel = t('packageSelector.payPerUse');

    const result: TabCategory[] = [];

    if (hasVisibleLite && hasVisibleStandard && hasVisibleUnlimited) {
      result.push({ key: 'standard', label: standardLabel, packageType: 'day_pass' });
      result.push({ key: 'unlimited', label: unlimitedLabel, packageType: 'limitless' });
    } else {
      if (hasVisibleLite) result.push({ key: 'light', label: liteLabel, packageType: 'max_speed' });
      if (hasVisibleStandard) result.push({ key: 'standard', label: standardLabel, packageType: 'day_pass' });
      if (hasVisibleUnlimited) result.push({ key: 'unlimited', label: unlimitedLabel, packageType: 'limitless' });
    }

    return result;
  }, [hasVisibleStandard, hasVisibleUnlimited, hasVisibleLite, t]);

  const defaultTab = useMemo(() => {
    // Prefer the tab containing a most popular package (pick first match)
    for (const tab of tabs) {
      const popularId = mostPopularByType[tab.packageType];
      if (popularId) return tab.key;
      // Also check manual is_popular
      const manualPopular = carrierPackages.find(p => p.is_popular && p.package_type === tab.packageType);
      if (manualPopular) return tab.key;
    }
    const tabKeys = tabs.map(t => t.key);
    if (tabKeys.includes('light')) return 'light';
    if (tabKeys.includes('standard')) return 'standard';
    return 'unlimited';
  }, [tabs, carrierPackages, mostPopularByType]);
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Lifted day selection state — persists across tab switches
  const allAvailableDays = useMemo(() => {
    const days = new Set<number>();
    carrierPackages.forEach(p => days.add(p.validity_days));
    return [...days].sort((a, b) => a - b);
  }, [carrierPackages]);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    // Default to the day of the most popular package for the default tab's type
    const defaultType = tabs.find(t => t.key === defaultTab)?.packageType;
    if (defaultType) {
      const popularId = mostPopularByType[defaultType];
      if (popularId) {
        const popularPkg = carrierPackages.find(p => p.id === popularId);
        if (popularPkg) return popularPkg.validity_days;
      }
      // Check manual is_popular for that type
      const manualPkg = carrierPackages.find(p => p.is_popular && p.package_type === defaultType);
      if (manualPkg) return manualPkg.validity_days;
    }
    return allAvailableDays[0] ?? 7;
  });

  const activePackageType = tabs.find(t => t.key === activeTab)?.packageType || tabs[0]?.packageType;

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

    if (packageType === 'day_pass') {
      filtered = filtered.filter(p =>
        visibleDailyTiers.includes(parseDailyAmount(p.daily_reset_amount))
      );
    }

    const grouped = groupByDays(filtered);
    if (packageType === 'day_pass') {
      grouped.forEach(g => {
        // Deduplicate by daily_reset_amount — keep only the cheapest variant per tier
        const best = new Map<number, EsimPackage>();
        g.packages.forEach(pkg => {
          const daily = parseDailyAmount(pkg.daily_reset_amount);
          if (!best.has(daily) || pkg.price < best.get(daily)!.price) {
            best.set(daily, pkg);
          }
        });
        g.packages = Array.from(best.values())
          .sort((a, b) => parseDailyAmount(b.daily_reset_amount) - parseDailyAmount(a.daily_reset_amount));
      });
    }
    if (packageType === 'limitless') {
      // Deduplicate limitless packages per duration — keep only the cheapest
      grouped.forEach(g => {
        if (g.packages.length > 1) {
          g.packages = [g.packages.reduce((best, pkg) => pkg.price < best.price ? pkg : best)];
        }
      });
    }
    return grouped;
  };

  const renderRow = (pkg: EsimPackage) => {
    const isSelected = selectedPackageId === pkg.id;
    const isDayPass = pkg.package_type === 'day_pass';
    const isLimitless = pkg.package_type === 'limitless';
    const isThailandAisUnlimitedLocalSim =
      isLimitless &&
      pkg.is_local_sim &&
      pkg.validity_days === 10 &&
      /AIS/i.test(pkg.name) &&
      (
        pkg.country_code === 'TH' ||
        countryCode === 'TH' ||
        /thailand/i.test(pkg.country_name ?? countryName)
      );
    const localizedCustomDescription = isThailandAisUnlimitedLocalSim
      ? ((t('packageSelector.aisThailandUnlimitedDescription') as string) || pkg.description || '')
      : (pkg.description || '');

    let labelBold = '';
    let labelLight = 'GB';
    let expandDetail = '';
    let tagline = '';

    if (isDayPass) {
      const dailyGb = parseDailyAmount(pkg.daily_reset_amount);
      const totalGb = dailyGb * pkg.validity_days;
      labelBold = formatDataAmount(totalGb).replace(' GB', '').replace(' MB', '');
      labelLight = totalGb < 1 ? 'MB' : 'GB';
      const dailyDisplay = pkg.daily_reset_amount || `${dailyGb} GB`;
      const hotspotStr = pkg.hot_spot ? t('packageSelector.hotspotSupported') : '';
      expandDetail = (t('packageSelector.dailySpeedReduced384') as string).replace('{daily}', dailyDisplay) + hotspotStr;
      tagline = (t('packageSelector.dailyForDays') as string).replace('{daily}', dailyDisplay).replace('{days}', String(pkg.validity_days));
    } else if (isLimitless) {
      labelBold = t('packageSelector.unlimited');
      labelLight = 'GB';
      const hotspotStr = pkg.hot_spot ? ' · ' + t('packageSelector.hotspotSupported').toString().replace(', ', '') : '';
      expandDetail = localizedCustomDescription || (t('packageSelector.unlimitedMaxSpeed') + hotspotStr);
      tagline = (t('packageSelector.fastUnlimitedDays') as string).replace('{days}', String(pkg.validity_days));
    } else {
      const match = pkg.data_amount?.match(/([\d.]+)\s*(GB|MB)/i);
      labelBold = match ? match[1] : pkg.data_amount;
      labelLight = match ? match[2].toUpperCase() : '';
      expandDetail = (t('packageSelector.serviceStopsAfterData') as string).replace('{data}', pkg.data_amount);
      const totalGb = match ? parseFloat(match[1]) : 0;
      const dailyAvg = pkg.validity_days > 0 ? totalGb / pkg.validity_days : totalGb;

      if (dailyAvg >= 4) {
        tagline = t('packageSelector.highDataTagline') as string;
      } else if (dailyAvg >= 2) {
        tagline = t('packageSelector.solidDataTagline') as string;
      } else {
        tagline = t('packageSelector.budgetTagline') as string;
      }
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
          <span className="flex items-center gap-2 text-gray-900">
            <span>
              <span className="font-bold text-lg">{labelBold}</span>
              {labelLight && <span className="font-normal text-base text-gray-500 ml-1">{labelLight}</span>}
            </span>
            {(pkg.id === mostPopularByType[pkg.package_type] || pkg.is_popular) && (
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 rounded-full text-[10px] px-1.5 py-0.5">
                <Zap className="h-3 w-3 mr-0.5" />
                {t('planTypes.mostPopular')}
              </Badge>
            )}
          </span>
          <span className="flex items-center gap-2">
            <ProviderIndicator providerCode={pkg.provider_code} />
            <span className="font-bold text-lg text-gray-900 whitespace-nowrap">
              {formatPrice(pkg.price)}
            </span>
          </span>
        </div>
        {tagline && (
          <p className="text-sm text-gray-400 mt-0.5">{tagline}</p>
        )}
        {isSelected && (
          <div className="w-full mt-3 pt-2 text-sm text-gray-600 animate-in fade-in slide-in-from-top-1 duration-150">
            {!isDayPass && !isLimitless && pkg.speed_after_limit ? (
              <div className="flex flex-col gap-0.5">
                <span>Data: {pkg.data_amount} {t('packageSelector.serviceStops')}</span>
                {pkg.support_voice && <span>{t('packageSelector.call30mins')}</span>}
                <span>{(t('packageSelector.wifiDays') as string).replace('{days}', String(pkg.validity_days))}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span>{expandDetail}</span>
                {isDayPass && (() => {
                  const dailyGb = parseDailyAmount(pkg.daily_reset_amount);
                  const hintsKey = dailyGb >= 5 ? 'hints5gbPlus' : dailyGb >= 3 ? 'hints3gb' : dailyGb >= 2 ? 'hints2gb' : 'hints1gb';
                  const hints = t(`packageSelector.${hintsKey}`) as string[];
                  return (
                    <div className="mt-1.5">
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                        {(Array.isArray(hints) ? hints : []).map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {t('packageSelector.hintsDisclaimer')}
                      </p>
                    </div>
                  );
                })()}
              </div>
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

  const selectedPackage = selectedPackageId
    ? carrierPackages.find(p => p.id === selectedPackageId) ?? null
    : null;

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
        <h3 className="text-lg font-semibold text-gray-900 text-center tracking-wide">
          {(() => {
            if (isLocalSimGroup) {
              const hasVoice = carrierPackages.some(p => p.support_voice);
              const hasSms = carrierPackages.some(p => p.support_sms);
              if (hasVoice && hasSms) return t('packageSelector.dataCallsTexts');
              if (hasVoice) return t('packageSelector.dataCalls');
              return t('packageSelector.data');
            }
            const voiceCount = carrierPackages.filter(p => p.support_voice).length;
            const majorityHasVoice = voiceCount > carrierPackages.length / 2;
            const smsCount = carrierPackages.filter(p => p.support_sms).length;
            const majorityHasSms = smsCount > carrierPackages.length / 2;
            if (majorityHasVoice && majorityHasSms) return t('packageSelector.dataCallsTexts');
            if (majorityHasVoice) return t('packageSelector.dataCalls');
            return t('packageSelector.data');
          })()}
        </h3>
      </div>

      {showTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "w-full grid h-12 bg-[#ede8e3] rounded-xl p-1",
            tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"
          )}>
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-lg text-base font-semibold data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none text-gray-600"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4">
              <PackageListV4
                groupedByDays={getPackagesForType(tab.packageType)}
                renderRow={renderRow}
                language={language}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <PackageListV4
          groupedByDays={getPackagesForType(tabs[0]?.packageType || '')}
          renderRow={renderRow}
          language={language}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {/* More options note */}
      {!isSingleLocalSim && (
        <button
          onClick={onViewFullConfigurator}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium px-1 pt-2 transition-colors"
        >
          {t('packageSelector.cantFind')}
        </button>
      )}

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

      {/* Package Details Modal */}
      <PackageDetailsModal
        open={showPackageDetails}
        onOpenChange={setShowPackageDetails}
        purchaseDate={new Date().toISOString()}
      />
    </div>
  );
}

const ALL_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 30];

function findClosestDay(target: number, availableDays: number[]): number {
  if (availableDays.length === 0) return target;
  return availableDays.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

// V4 PackageList: day selector pills + filtered view
function PackageListV4({
  groupedByDays,
  renderRow,
  language,
  selectedDay,
  onSelectDay,
}: {
  groupedByDays: { days: number; packages: EsimPackage[] }[];
  renderRow: (pkg: EsimPackage) => React.ReactNode;
  language: string;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}) {
  const { t } = useLanguage();
  const availableDays = useMemo(() => groupedByDays.map(g => g.days).sort((a, b) => a - b), [groupedByDays]);
  const displayDays = useMemo(() => Array.from(new Set([...ALL_DAY_OPTIONS, ...availableDays])).sort((a, b) => a - b), [availableDays]);

  const resolvedDay = useMemo(() => {
    if (availableDays.includes(selectedDay)) return selectedDay;
    return findClosestDay(selectedDay, availableDays);
  }, [selectedDay, availableDays]);

  const filteredPackages = useMemo(() => {
    const group = groupedByDays.find(g => g.days === resolvedDay);
    return group?.packages ?? [];
  }, [groupedByDays, resolvedDay]);

  if (groupedByDays.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        {t('packageSelector.noPackages')}
      </p>
    );
  }

  // When 3 or fewer day groups, show a flat list without the day selector
  if (groupedByDays.length <= 3) {
    return (
      <div className="space-y-4">
        {groupedByDays.map(group => (
          <div key={group.days}>
            <p className="text-sm font-semibold text-muted-foreground px-1 mb-2">
              {group.days} {t('packageSelector.days')}
            </p>
            <div className="space-y-2">
              {group.packages.map(pkg => renderRow(pkg))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-base font-bold text-gray-900 px-1">
        {t('packageSelector.chooseDuration')}
      </p>

      {/* Day selector pills */}
      <div className="grid grid-cols-7 gap-1 pb-1 px-1 items-center">
        {displayDays.map(day => {
          const isAvailable = availableDays.includes(day);
          const isActive = day === selectedDay;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={cn(
                'shrink-0 w-11 h-11 flex items-center justify-center text-base rounded-full transition-colors',
                isActive
                  ? 'bg-gray-900 text-white font-bold'
                  : isAvailable
                    ? 'text-gray-700 font-semibold hover:bg-gray-100'
                    : 'text-gray-300'
              )}
            >
              {day}
            </button>
          );
        })}
        <span className="shrink-0 self-center text-base text-gray-400 pl-0.5">
          {t('packageSelector.days')}
        </span>
      </div>

      {/* Closest-match notice */}
      {selectedDay !== resolvedDay && (
        <p className="text-xs text-gray-400 px-1">
          {(t('packageSelector.noXDayPackages') as string)
            .replace('{days}', String(selectedDay))
            .replace('{closest}', String(resolvedDay))}
        </p>
      )}

      {/* Package cards */}
      <div className="space-y-2">
        {filteredPackages.map(pkg => renderRow(pkg))}
      </div>
    </div>
  );
}
