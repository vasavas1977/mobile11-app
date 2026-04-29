// PackageConfiguratorV2 - Identical to PackageConfigurator but with V2 labels:
// Limitless → "Unlimited" (Heavy user)
// Day Pass → "Day Pass" (Balanced user)  
// Max Speed → "Standard" (Light user)
//
// Only the imports for PackageTypeBadge and PackageTypeSelector differ.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageTypeBadgeV2 as PackageTypeBadge } from '@/components/esim/PackageTypeBadgeV2';
import { PackageTypeSelectorV2 as PackageTypeSelector } from '@/components/esim/PackageTypeSelectorV2';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Minus, Plus, Wifi, MessageSquare, Phone, Signal, ChevronDown, Globe, RefreshCw, Link2, Scale, ShieldAlert, Sparkles, ArrowUpDown } from 'lucide-react';
import { getRegionalData, formatCountriesList, getCountryCount, getCountryNetworks } from '@/lib/regionalPackageUtils';
import { RegionalCountriesDialog } from './RegionalCountriesDialog';
import { RegionalCountriesPopover } from './RegionalCountriesPopover';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateConfiguratorUrl, copyToClipboard } from '@/lib/configuratorUrlUtils';
import { useToast } from '@/hooks/use-toast';
import { CarrierSelector } from './CarrierSelector';
import { CarrierStarRating } from './CarrierStarRating';
import { getCarrierRating, getBestCarrierFirst } from '@/lib/carrierRatings';
import { requiresCarrierSelection, getCheapestCarrierForType, getCheapestCarrierOverall, getPreferredCarrier, getCarrierDisplayName, getRawCarriersForDisplay } from '@/lib/carrierSelectionConfig';
import { UsageStyleSelector } from './UsageStyleSelector';
import { LocalSimConfigurator } from './LocalSimConfigurator';
import { ProviderIndicator } from './ProviderIndicator';
import { useAdminCheck } from '@/hooks/useAdminCheck';

// --- Everything below is identical to PackageConfigurator.tsx ---
// --- Only the component export name differs ---

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  description?: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  qos_speed?: string;
  carrier?: string;
  network_type?: string;
  sim_type?: string;
  package_type?: string | null;
  speed_after_limit?: string | null;
  daily_data_reset?: boolean | null;
  daily_reset_amount?: string | null;
  support_data?: boolean;
  support_sms?: boolean;
  support_voice?: boolean;
  hot_spot?: boolean;
  kyc?: boolean;
  is_local_sim?: boolean;
  provider_code?: string;
}

interface PackageConfiguratorProps {
  countryCode: string;
  countryName: string;
  packages: EsimPackage[];
  onAddToCart: (packageId: string, quantity: number) => void;
  onBack: () => void;
  isRegional?: boolean;
  isExtending?: boolean;
  extendingPackageName?: string;
  extendingPackageType?: 'day_pass' | 'max_speed' | 'limitless';
  extendingDataAmount?: string;
  extendingSpeed?: string;
  initialCarrier?: string;
  initialPackageType?: PackageType;
  initialDays?: number;
  initialOption?: string;
  initialBackupSpeed?: string;
  initialQuantity?: number;
  skipUsageStyle?: boolean;
  onStateChange?: (state: {
    type: PackageType | null;
    days: number | null;
    option: string | null;
    speed: string | null;
    carrier: string | null;
    quantity: number;
  }) => void;
}

type PackageType = 'limitless' | 'max_speed' | 'day_pass';
type FlowStep = 'usage_style' | 'configurator';
type UsageFilter = 'all' | 'unlimited' | 'pay_per_use';

interface PackageDetailsContentProps {
  pkg: EsimPackage;
  isRegional?: boolean;
  compact?: boolean;
}

// Package Details Content Component
const PackageDetailsContent = ({ pkg, isRegional: isRegionalPkg = false, compact = false }: PackageDetailsContentProps) => {
  const { t } = useLanguage();
  const { isAdmin } = useAdminCheck();
  const regionalData = isRegionalPkg ? getRegionalData(pkg) : null;
  const countryCount = isRegionalPkg ? getCountryCount(pkg) : 0;
  
  return (
    <>
      {isRegionalPkg && regionalData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <RegionalCountriesPopover 
              data={regionalData}
              trigger={
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                  <Globe className="h-3 w-3 mr-1" />
                  {countryCount} {countryCount === 1 ? t('configurator.country') : t('configurator.countries')}
                </Badge>
              }
            />
            <RegionalCountriesDialog 
              data={regionalData}
              trigger={
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-xs hover:underline"
                type="button"
              >
                {t('configurator.viewAllCountries')}
              </Button>
              }
            />
          </div>
          <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
            {regionalData.countries.slice(0, 10).map((c, idx) => (
              <span key={c.code}>
                {c.name}
                {idx < Math.min(9, regionalData.countries.length - 1) && ' • '}
              </span>
            ))}
            {regionalData.countries.length > 10 && (
              <span className="font-medium"> {t('configurator.moreCountries').replace('{count}', String(regionalData.countries.length - 10))}</span>
            )}
          </div>
        </div>
      )}
      
      {pkg.package_type && !pkg.is_local_sim && (
        <p className={cn("text-muted-foreground leading-relaxed", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
          {pkg.package_type === 'limitless' && t('planTypes.limitless.description')}
          {pkg.package_type === 'max_speed' && t('planTypes.maxSpeed.description')}
          {pkg.package_type === 'day_pass' && t('planTypes.dayPass.description')}
        </p>
      )}

      {pkg.is_local_sim && pkg.carrier === 'AIS' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <p className="text-emerald-700 font-semibold text-sm">
              {t('myEsims.packageIncludes')}
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-emerald-800">
            <li className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
              {pkg.data_amount?.includes('50') 
                ? `5G Data: ${pkg.data_amount} then unlimited ${pkg.speed_after_limit || '384Kbps'}`
                : t('myEsims.aisData')}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              {pkg.data_amount?.includes('50')
                ? 'Call: 100 THB credit (local calls only)'
                : t('myEsims.aisCall')}
            </li>
            {!pkg.data_amount?.includes('50') && (
              <li className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                {t('myEsims.aisWifi')}
              </li>
            )}
          </ul>
        </div>
      )}

      <div className={cn("grid grid-cols-2 gap-2", compact ? "" : "md:gap-2 lg:gap-3")}>
      {pkg.carrier && (
        <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
          <p className="text-xs text-gray-500">{t('configurator.carrier')}</p>
          <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
            {(() => { const { reordered } = getBestCarrierFirst(pkg.carrier); return reordered === 'DOCOMO' ? 'NTT DOCOMO' : reordered; })()}
          </p>
          <div className="mt-1">
            <CarrierStarRating rating={getBestCarrierFirst(pkg.carrier).bestRating} size="sm" carrierName={getBestCarrierFirst(pkg.carrier).reordered} />
          </div>
        </div>
      )}

      {(pkg.network_type || isRegionalPkg) && (
        <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
          <p className="text-xs text-gray-500">{t('configurator.network')}</p>
          <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
            {isRegionalPkg ? '3G/4G/5G' : pkg.network_type}
          </p>
        </div>
      )}

          {(() => {
            if (isRegionalPkg) {
              if (pkg.package_type === 'limitless') {
                return (
                  <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
                    <p className="text-xs text-gray-500">{t('configurator.maxSpeed')}</p>
                    <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
                      {t('configurator.unlimited')}
                    </p>
                  </div>
                );
              }
              return (
                <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
                  <p className="text-xs text-gray-500">{t('configurator.maxSpeed')}</p>
                  <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>3G/4G/5G</p>
                </div>
              );
            }
            
            const carrierNetworks = getCountryNetworks(
              pkg.country_name,
              pkg.country_code,
              regionalData
            );
            
            let maxSpeedValue: string | null = null;
            
            if (pkg.package_type === 'limitless') {
              if (pkg.carrier === 'DOCOMO') {
                maxSpeedValue = `${t('configurator.unlimited')} 10 Mbps`;
              } else {
                maxSpeedValue = t('configurator.unlimited');
              }
            } else if (carrierNetworks) {
              maxSpeedValue = carrierNetworks;
            } else if (pkg.package_type === 'day_pass') {
              maxSpeedValue = pkg.network_type || null;
            } else {
              maxSpeedValue = pkg.qos_speed || null;
            }
            
            return maxSpeedValue ? (
              <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
                <p className="text-xs text-gray-500">{t('configurator.maxSpeed')}</p>
                <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
                  {maxSpeedValue}
                </p>
              </div>
            ) : null;
          })()}

      {pkg.speed_after_limit && (
        <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
          <p className="text-xs text-gray-500">{t('configurator.afterLimit')}</p>
          <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>{pkg.speed_after_limit}</p>
          {pkg.package_type === 'day_pass' && pkg.daily_reset_amount && (
            <p className="text-xs text-gray-400 mt-1">
              {t('configurator.afterLimitExample').replace('{data}', pkg.daily_reset_amount)}
            </p>
          )}
        </div>
      )}

      <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
        <p className="text-xs text-gray-500">{t('configurator.dailyReset')}</p>
        <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
          {pkg.daily_data_reset 
            ? `${pkg.daily_reset_amount || t('configurator.yes')}`
            : t('configurator.no')
          }
        </p>
      </div>

      {pkg.sim_type && (
        <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
          <p className="text-xs text-gray-500">{t('configurator.simType')}</p>
          <p className={cn("font-medium text-gray-900", compact ? "text-xs" : "text-sm md:text-sm lg:text-base")}>
            {pkg.is_local_sim ? 'Local' : pkg.sim_type}
          </p>
        </div>
      )}

      {isAdmin && pkg.provider_code && (
        <div className={cn("bg-gray-50 rounded-lg border border-gray-200", compact ? "p-1.5" : "p-2 md:p-2.5 lg:p-3")}>
          <p className="text-xs text-gray-500">Provider</p>
          <div className="mt-0.5">
            <ProviderIndicator providerCode={pkg.provider_code} />
          </div>
        </div>
      )}
    </div>

    <div>
      <p className="text-xs md:text-sm font-semibold text-gray-600 mb-2">{t('configurator.features')}</p>
      <div className="flex flex-wrap gap-1.5">
        {pkg.support_data && (
          <Badge variant="secondary" className="gap-1 text-xs md:text-sm">
            <Wifi className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {t('configurator.data')}
          </Badge>
        )}
        {pkg.support_sms && (
          <Badge variant="secondary" className="gap-1 text-xs md:text-sm">
            <MessageSquare className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {t('configurator.sms')}
          </Badge>
        )}
        {pkg.support_voice && (
          <Badge variant="secondary" className="gap-1 text-xs md:text-sm">
            <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {t('configurator.voice')}
          </Badge>
        )}
        {pkg.hot_spot && (
          <Badge variant="secondary" className="gap-1 text-xs md:text-sm">
            <Signal className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {t('configurator.hotspot')}
          </Badge>
        )}
      </div>
    </div>

    {pkg.package_type === 'limitless' && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-start gap-1.5">
          <Scale className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-medium">{t('configurator.fairUsagePolicy')}:</span>{' '}
            {pkg.carrier?.toUpperCase().includes('DOCOMO') 
              ? t('configurator.fupDescriptionDocomo')
              : t('configurator.fupDescription')}
          </span>
        </p>
      </div>
    )}

    {pkg.kyc && (() => {
      const isCmlink = pkg.carrier && (pkg.carrier.toUpperCase().includes('CMHK') || pkg.carrier.toUpperCase().includes('CTM') || pkg.carrier.toUpperCase().includes('CMCC'));
      const kycTitle = isCmlink
        ? (t('configurator.cmlinkRequired') || 'Real-Name Registration Required')
        : (t('configurator.kycRequired') || 'KYC Verification Required');
      const kycDesc = isCmlink
        ? (t('configurator.cmlinkDescription') || 'After purchase, add the eSIM to your device and use the ICCID to register at CMLink. Register before traveling to avoid issues.')
        : (t('configurator.kycDescription') || 'This package requires identity verification after purchase.');
      const kycUrl = isCmlink ? 'https://global.cmlink.com/en/real-name' : 'https://kyc.cloud.ais.th';
      const kycLinkText = isCmlink
        ? (t('configurator.cmlinkLinkText') || 'Register at CMLink →')
        : (t('configurator.completeKyc') || 'Complete KYC here →');
      
      return (
        <div className="mt-4 pt-3 border-t border-orange-200 bg-orange-50 -mx-4 px-4 py-3 rounded-b-xl">
          <p className="text-xs text-orange-700 flex items-start gap-1.5">
            <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-semibold">{kycTitle}:</span>{' '}
              {kycDesc}{' '}
              <a 
                href={kycUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 underline hover:text-orange-800 font-medium"
              >
                {kycLinkText}
              </a>
            </span>
          </p>
        </div>
      );
    })()}
  </>
  );
};

export function PackageConfiguratorV2({
  countryCode,
  countryName,
  packages,
  onAddToCart,
  onBack,
  isRegional = false,
  isExtending = false,
  extendingPackageName,
  extendingPackageType,
  extendingDataAmount,
  extendingSpeed,
  initialCarrier,
  initialPackageType,
  initialDays,
  initialOption,
  initialBackupSpeed,
  initialQuantity,
  skipUsageStyle,
  onStateChange,
}: PackageConfiguratorProps) {
  const { formatPrice, currency, t, language } = useLanguage();
  const { toast } = useToast();
  
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const [selectedPackageType, setSelectedPackageType] = useState<PackageType | null>(
    isExtending && extendingPackageType ? extendingPackageType : (initialPackageType || null)
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(initialOption || null);
  const [selectedDays, setSelectedDays] = useState<number | null>(initialDays || null);
  const [selectedBackupSpeed, setSelectedBackupSpeed] = useState<string | null>(initialBackupSpeed || null);
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(skipUsageStyle || false);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(initialCarrier || null);
  
  const [flowStep, setFlowStep] = useState<FlowStep>(() => {
    if (isExtending || initialPackageType || skipUsageStyle) return 'configurator';
    return 'usage_style';
  });
  
  const [usageFilter, setUsageFilter] = useState<UsageFilter>(() => {
    if (skipUsageStyle) return 'all';
    if (initialPackageType === 'limitless') return 'unlimited';
    if (initialPackageType === 'day_pass' || initialPackageType === 'max_speed') return 'pay_per_use';
    return 'all';
  });
  
  const [cameFromUsageStyle, setCameFromUsageStyle] = useState<boolean>(false);
  
  const availableCarriers = useMemo(() => {
    const displayMinPrice: Record<string, number> = {};
    // First pass: only max_speed + limitless (Standard & Unlimited)
    packages.forEach(pkg => {
      if (pkg.carrier && (pkg.package_type === 'max_speed' || pkg.package_type === 'limitless')) {
        const display = getCarrierDisplayName(countryName, pkg.carrier);
        if (!displayMinPrice[display] || pkg.price < displayMinPrice[display]) {
          displayMinPrice[display] = pkg.price;
        }
      }
    });
    // Second pass: fill in carriers that only have day_pass
    packages.forEach(pkg => {
      if (pkg.carrier) {
        const display = getCarrierDisplayName(countryName, pkg.carrier);
        if (!displayMinPrice[display]) {
          displayMinPrice[display] = pkg.price;
        }
      }
    });
    return Object.keys(displayMinPrice).sort((a, b) => displayMinPrice[a] - displayMinPrice[b]);
  }, [packages, countryName]);

  const carrierNetworkTypes = useMemo(() => {
    const networkMap: Record<string, Set<string>> = {};
    packages.forEach(pkg => {
      if (pkg.carrier && pkg.network_type) {
        const displayName = getCarrierDisplayName(countryName, pkg.carrier);
        if (!networkMap[displayName]) {
          networkMap[displayName] = new Set<string>();
        }
        const types = pkg.network_type.split(/[\/,\s]+/).map(t => t.replace(/\(.*\)/, '')).filter(t => t.match(/^[345]G$/i));
        types.forEach(type => networkMap[displayName].add(type.toUpperCase()));
      }
    });
    const result: Record<string, string> = {};
    const order = ['3G', '4G', '5G'];
    Object.entries(networkMap).forEach(([carrier, types]) => {
      const sorted = order.filter(t => types.has(t));
      result[carrier] = sorted.length > 0 ? sorted.join('/') : '4G/5G';
    });
    return result;
  }, [packages, countryName]);

  const carrierFilteredPackages = useMemo(() => {
    if (availableCarriers.length <= 1) return packages;
    if (!requiresCarrierSelection(countryName)) return packages;
    if (!selectedCarrier) return [];
    const rawCarriers = getRawCarriersForDisplay(countryName, selectedCarrier);
    return packages.filter(pkg => pkg.carrier && rawCarriers.includes(pkg.carrier));
  }, [packages, selectedCarrier, availableCarriers, countryName]);

  const isLocalSimMode = useMemo(() => {
    if (!selectedCarrier) return false;
    const rawCarriers = getRawCarriersForDisplay(countryName, selectedCarrier);
    const carrierPackages = packages.filter(p => p.carrier && rawCarriers.includes(p.carrier));
    return carrierPackages.length === 1 && carrierPackages[0].is_local_sim === true;
  }, [packages, selectedCarrier, countryName]);

  const localSimPackage = useMemo(() => {
    if (!isLocalSimMode || !selectedCarrier) return null;
    const rawCarriers = getRawCarriersForDisplay(countryName, selectedCarrier);
    return packages.find(p => p.carrier && rawCarriers.includes(p.carrier) && p.is_local_sim) || null;
  }, [packages, selectedCarrier, isLocalSimMode, countryName]);

  useEffect(() => {
    if (selectedCarrier) return;
    
    if (availableCarriers.length === 1) {
      setSelectedCarrier(availableCarriers[0]);
    } else if (availableCarriers.length > 1 && requiresCarrierSelection(countryName)) {
      if (initialPackageType && initialDays && initialOption) {
        const matchingCarrier = packages.find(pkg => {
          if (pkg.package_type !== initialPackageType) return false;
          if (pkg.validity_days !== initialDays) return false;
          if (initialPackageType === 'limitless') return pkg.qos_speed === initialOption;
          if (initialPackageType === 'max_speed') return pkg.data_amount === initialOption;
          if (initialPackageType === 'day_pass') return pkg.daily_reset_amount === initialOption;
          return false;
        })?.carrier;
        
        if (matchingCarrier) {
          const matchingDisplayName = getCarrierDisplayName(countryName, matchingCarrier);
          if (availableCarriers.includes(matchingDisplayName)) {
            setSelectedCarrier(matchingDisplayName);
            return;
          }
        }
      }
      
      const preferred = getPreferredCarrier(countryName, availableCarriers);
      if (preferred) {
        setSelectedCarrier(preferred);
        return;
      }
      
      if (selectedPackageType) {
        const cheapestRaw = getCheapestCarrierForType(packages, selectedPackageType);
        const cheapest = cheapestRaw ? getCarrierDisplayName(countryName, cheapestRaw) : null;
        if (cheapest && availableCarriers.includes(cheapest)) {
          setSelectedCarrier(cheapest);
        } else {
          setSelectedCarrier(availableCarriers[0]);
        }
      } else {
        const cheapestRaw = getCheapestCarrierOverall(packages);
        const cheapest = cheapestRaw ? getCarrierDisplayName(countryName, cheapestRaw) : null;
        if (cheapest && availableCarriers.includes(cheapest)) {
          setSelectedCarrier(cheapest);
        } else {
          setSelectedCarrier(availableCarriers[0]);
        }
      }
    }
  }, [availableCarriers, selectedCarrier, countryName, packages, selectedPackageType, initialPackageType, initialDays, initialOption]);
  
  const normalizeSpeedValue = (speed: string | null | undefined): string | null => {
    if (!speed) return null;
    const normalized = speed.toLowerCase().replace(/\s+/g, '');
    const match = normalized.match(/^(\d+(?:\.\d+)?)(k|m)bps$/);
    if (match) return `${match[1]}${match[2]}bps`;
    return normalized;
  };

  useEffect(() => {
    if (isExtending && extendingPackageType) {
      setSelectedPackageType(extendingPackageType);
      if (extendingPackageType === 'day_pass') {
        if (extendingDataAmount) setSelectedOption(extendingDataAmount);
        if (extendingSpeed) {
          const normalizedSpeed = normalizeSpeedValue(extendingSpeed);
          if (normalizedSpeed) setSelectedBackupSpeed(normalizedSpeed);
        }
      } else if (extendingPackageType === 'limitless') {
        if (extendingDataAmount) setSelectedOption(extendingDataAmount);
      }
    }
  }, [isExtending, extendingPackageType, extendingDataAmount, extendingSpeed]);

  const PACKAGE_TYPE_ORDER: PackageType[] = ['day_pass', 'limitless', 'max_speed'];

  const availablePackageTypes = useMemo(() => {
    const types = new Set<PackageType>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.package_type && ['day_pass', 'max_speed', 'limitless'].includes(pkg.package_type)) {
        types.add(pkg.package_type as PackageType);
      }
    });
    return PACKAGE_TYPE_ORDER.filter(type => types.has(type));
  }, [carrierFilteredPackages]);

  const allAvailablePackageTypes = useMemo(() => {
    const types = new Set<PackageType>();
    packages.forEach(pkg => {
      if (pkg.package_type && ['day_pass', 'max_speed', 'limitless'].includes(pkg.package_type)) {
        types.add(pkg.package_type as PackageType);
      }
    });
    return types;
  }, [packages]);

  const filteredPackageTypes = useMemo(() => {
    if (usageFilter === 'unlimited') return availablePackageTypes.filter(t => t === 'limitless');
    if (usageFilter === 'pay_per_use') return availablePackageTypes.filter(t => t === 'day_pass' || t === 'max_speed');
    if (skipUsageStyle) {
      const FULL_COMPARE_ORDER: PackageType[] = ['max_speed', 'day_pass', 'limitless'];
      return FULL_COMPARE_ORDER.filter(type => availablePackageTypes.includes(type));
    }
    return availablePackageTypes;
  }, [availablePackageTypes, usageFilter, skipUsageStyle]);

  const hasLimitless = allAvailablePackageTypes.has('limitless');
  const hasMaxSpeed = allAvailablePackageTypes.has('max_speed');
  const hasDayPass = allAvailablePackageTypes.has('day_pass');
  const hasPayPerUse = hasMaxSpeed || hasDayPass;

  const handleSelectUnlimited = useCallback(() => {
    setUsageFilter('unlimited');
    setCameFromUsageStyle(true);
    if (availableCarriers.length > 1 && requiresCarrierSelection(countryName)) {
      const cheapest = getCheapestCarrierForType(packages, 'limitless');
      if (cheapest && availableCarriers.includes(cheapest)) setSelectedCarrier(cheapest);
    }
    setFlowStep('configurator');
  }, [availableCarriers, countryName, packages]);

  const handleSelectPayPerUse = useCallback(() => {
    setUsageFilter('pay_per_use');
    setCameFromUsageStyle(true);
    setFlowStep('configurator');
  }, []);

  const handleShowAdvanced = useCallback(() => {
    setUsageFilter('all');
    setCameFromUsageStyle(true);
    setFlowStep('configurator');
  }, []);

  const handleBackToUsageStyle = useCallback(() => {
    setUsageFilter('all');
    setFlowStep('usage_style');
    setSelectedPackageType(null);
    setCameFromUsageStyle(false);
  }, []);

  useEffect(() => {
    if (flowStep !== 'usage_style') return;
    if (isExtending || initialPackageType) return;
    if (allAvailablePackageTypes.size === 1) {
      const singleType = Array.from(allAvailablePackageTypes)[0];
      setSelectedPackageType(singleType);
      setUsageFilter('all');
      setFlowStep('configurator');
    } else if (hasLimitless && !hasPayPerUse) {
      setUsageFilter('unlimited');
      setFlowStep('configurator');
    } else if (!hasLimitless && hasPayPerUse) {
      setUsageFilter('pay_per_use');
      setFlowStep('configurator');
    }
  }, [flowStep, isExtending, initialPackageType, allAvailablePackageTypes, hasLimitless, hasPayPerUse]);

  const normalizeBackupSpeed = useCallback((speed: string | null | undefined): string | null => {
    if (!speed) return null;
    const normalized = speed.toLowerCase().replace(/\s+/g, '');
    const match = normalized.match(/^(\d+(?:\.\d+)?)(k|m)bps$/);
    if (match) return `${match[1]}${match[2]}bps`;
    return normalized;
  }, []);

  const formatBackupSpeed = useCallback((speed: string): string => {
    const match = speed.match(/^(\d+(?:\.\d+)?)(k|m)bps$/i);
    if (match) {
      const unit = match[2].toLowerCase() === 'm' ? 'Mbps' : 'Kbps';
      return `${match[1]} ${unit}`;
    }
    return speed;
  }, []);

  const availableBackupSpeeds = useMemo<string[]>(() => {
    if (selectedPackageType !== 'day_pass') return [];
    const speeds = new Set<string>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.package_type === 'day_pass') {
        if (selectedDays && pkg.validity_days !== selectedDays) return;
        if (selectedOption && pkg.daily_reset_amount !== selectedOption) return;
        const normalizedSpeed = normalizeBackupSpeed(pkg.speed_after_limit);
        if (normalizedSpeed) speeds.add(normalizedSpeed);
      }
    });
    return Array.from(speeds).sort((a, b) => {
      const getNumericValue = (s: string): number => {
        const match = s.match(/^(\d+(?:\.\d+)?)(k|m)bps$/i);
        if (!match) return 0;
        const num = parseFloat(match[1]);
        return match[2].toLowerCase() === 'm' ? num * 1000 : num;
      };
      return getNumericValue(a) - getNumericValue(b);
    });
  }, [carrierFilteredPackages, selectedPackageType, selectedDays, selectedOption, normalizeBackupSpeed]);

  const ALLOWED_DAYS_LIMITLESS = [3, 5, 7, 10, 15, 30];
  const ALLOWED_DAYS_DAY_PASS = [3, 5, 7, 10, 15, 30];
  const ALLOWED_DATA_MAX_SPEED = [5, 10, 15, 20];

  const availableDays = useMemo(() => {
    if (!selectedPackageType) return [];
    const days = new Set<number>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.package_type !== selectedPackageType || !pkg.validity_days) return;
      if (!skipUsageStyle) {
        if (selectedPackageType === 'limitless' && !ALLOWED_DAYS_LIMITLESS.includes(pkg.validity_days)) return;
        if (selectedPackageType === 'day_pass' && !ALLOWED_DAYS_DAY_PASS.includes(pkg.validity_days)) return;
      }
      days.add(pkg.validity_days);
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [carrierFilteredPackages, selectedPackageType, skipUsageStyle]);

  const availableOptions = useMemo(() => {
    if (!selectedPackageType || !selectedDays) return [];
    const options = new Set<string>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.validity_days !== selectedDays) return;
        if (pkg.package_type === selectedPackageType) {
        if (selectedPackageType === 'day_pass') {
          if (pkg.daily_reset_amount) options.add(pkg.daily_reset_amount);
        } else if (selectedPackageType === 'max_speed') {
          if (pkg.data_amount) {
            if (skipUsageStyle) {
              options.add(pkg.data_amount);
            } else {
              const match = pkg.data_amount.match(/^(\d+)\s*GB$/i);
              if (match && ALLOWED_DATA_MAX_SPEED.includes(parseInt(match[1]))) {
                options.add(pkg.data_amount);
              }
            }
          }
        } else if (selectedPackageType === 'limitless') {
          if (pkg.qos_speed) options.add(pkg.qos_speed);
        }
      }
    });
    // For day_pass (Normal), force 3GB/day only (skip when showing all options)
    if (selectedPackageType === 'day_pass' && !skipUsageStyle) {
      const filtered = Array.from(options).filter(o => o.toUpperCase().includes('3GB'));
      if (filtered.length > 0) return filtered;
    }
    return Array.from(options).sort((a, b) => {
      const toMB = (value: string): number => {
        const num = parseFloat(value);
        if (value.toUpperCase().includes('GB')) return num * 1024;
        if (value.toUpperCase().includes('MB')) return num;
        return num;
      };
      const mbA = toMB(a);
      const mbB = toMB(b);
      if (!isNaN(mbA) && !isNaN(mbB)) return mbA - mbB;
      return a.localeCompare(b);
    });
  }, [carrierFilteredPackages, selectedPackageType, selectedDays, skipUsageStyle]);

  const matchedPackage = useMemo(() => {
    if (isExtending && extendingPackageType && selectedDays) {
      return carrierFilteredPackages.find(pkg => {
        if (pkg.package_type !== extendingPackageType) return false;
        if (pkg.validity_days !== selectedDays) return false;
        if (extendingPackageType === 'day_pass') {
          if (extendingDataAmount && pkg.daily_reset_amount !== extendingDataAmount) return false;
          if (extendingSpeed) {
            const normalizedPkgSpeed = normalizeBackupSpeed(pkg.speed_after_limit);
            const normalizedExtSpeed = normalizeBackupSpeed(extendingSpeed);
            if (normalizedPkgSpeed !== normalizedExtSpeed) return false;
          }
          return true;
        }
        if (extendingPackageType === 'limitless') {
          if (extendingDataAmount && pkg.qos_speed !== extendingDataAmount) return false;
          return true;
        }
        if (extendingPackageType === 'max_speed') {
          if (selectedOption && pkg.data_amount !== selectedOption) return false;
          return true;
        }
        return false;
      });
    }

    if (!selectedPackageType || !selectedOption || !selectedDays) return null;
    
    return carrierFilteredPackages.find(pkg => {
      if (pkg.package_type !== selectedPackageType) return false;
      if (pkg.validity_days !== selectedDays) return false;
      
      if (selectedPackageType === 'day_pass') {
        if (pkg.daily_reset_amount !== selectedOption) return false;
        if (selectedBackupSpeed) {
          const normalizedPkgSpeed = normalizeBackupSpeed(pkg.speed_after_limit);
          if (normalizedPkgSpeed !== selectedBackupSpeed) return false;
        }
        return true;
      }
      
      if (selectedPackageType === 'max_speed') return pkg.data_amount === selectedOption;
      if (selectedPackageType === 'limitless') return pkg.qos_speed === selectedOption;
      return false;
    });
  }, [carrierFilteredPackages, selectedPackageType, selectedOption, selectedDays, selectedBackupSpeed, isExtending, extendingPackageType, extendingDataAmount, extendingSpeed]);

  const totalPrice = useMemo(() => {
    if (isLocalSimMode && localSimPackage) return localSimPackage.price * quantity;
    if (!matchedPackage) return 0;
    return matchedPackage.price * quantity;
  }, [matchedPackage, quantity, isLocalSimMode, localSimPackage]);

  const minPrice = useMemo(() => {
    if (packages.length === 0) return 0;
    return Math.min(...packages.map(pkg => pkg.price));
  }, [packages]);

  useEffect(() => {
    if (availablePackageTypes.length > 0) {
      let priorityOrder: PackageType[];
      if (usageFilter === 'unlimited') priorityOrder = ['limitless'];
      else if (usageFilter === 'pay_per_use') priorityOrder = ['day_pass', 'max_speed'];
      else priorityOrder = ['day_pass', 'max_speed', 'limitless'];
      
      const isCurrentSelectionValid = !selectedPackageType || (priorityOrder.includes(selectedPackageType) && availablePackageTypes.includes(selectedPackageType));
      
      if (!selectedPackageType || (usageFilter && !isCurrentSelectionValid)) {
        const defaultType = priorityOrder.find(type => availablePackageTypes.includes(type)) || availablePackageTypes[0];
        setSelectedPackageType(defaultType);
      }
    }
  }, [availablePackageTypes, selectedPackageType, usageFilter]);

  useEffect(() => {
    if (selectedBackupSpeed && availableBackupSpeeds.length > 0 && !availableBackupSpeeds.includes(selectedBackupSpeed)) {
      setSelectedBackupSpeed(null);
    }
  }, [availableBackupSpeeds, selectedBackupSpeed]);

  useEffect(() => {
    if (selectedPackageType === 'day_pass' && availableBackupSpeeds.length > 0 && !selectedBackupSpeed) {
      const defaultSpeed = availableBackupSpeeds.includes('384kbps') ? '384kbps' : availableBackupSpeeds[0];
      setSelectedBackupSpeed(defaultSpeed);
    }
  }, [availableBackupSpeeds, selectedPackageType, selectedBackupSpeed]);

  useEffect(() => {
    if (availableDays.length > 0 && !selectedDays) {
      const preferredDays = availableDays.includes(7) ? 7 : availableDays[0];
      setSelectedDays(preferredDays);
    }
  }, [availableDays, selectedDays]);

  useEffect(() => {
    if (availableOptions.length > 0 && !selectedOption) setSelectedOption(availableOptions[0]);
    if (selectedPackageType === 'limitless' && availableOptions.length > 0) setSelectedOption(availableOptions[0]);
  }, [availableOptions, selectedOption, selectedPackageType]);

  useEffect(() => {
    if (selectedDays && availableDays.length > 0 && !availableDays.includes(selectedDays)) setSelectedDays(null);
  }, [availableDays, selectedDays]);

  useEffect(() => {
    if (selectedOption && availableOptions.length > 0 && !availableOptions.includes(selectedOption)) setSelectedOption(null);
  }, [availableOptions, selectedOption]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        type: selectedPackageType,
        days: selectedDays,
        option: selectedOption,
        speed: selectedBackupSpeed,
        carrier: selectedCarrier,
        quantity
      });
    }
  }, [selectedPackageType, selectedDays, selectedOption, selectedBackupSpeed, selectedCarrier, quantity, onStateChange]);

  const handleCopyLink = useCallback(async () => {
    const url = generateConfiguratorUrl({
      country: countryName,
      isRegional: isRegional,
      carrier: selectedCarrier || undefined,
      type: selectedPackageType || undefined,
      days: selectedDays || undefined,
      option: selectedOption || undefined,
      speed: selectedBackupSpeed || undefined,
      qty: quantity,
      view: 'full'
    });
    const success = await copyToClipboard(url);
    if (success) {
      toast({
        title: t('configurator.linkCopied'),
        description: t('configurator.linkCopiedDesc'),
      });
    }
  }, [countryName, isRegional, selectedCarrier, selectedPackageType, selectedDays, selectedOption, selectedBackupSpeed, quantity, toast, t]);

  const getOptionLabel = () => {
    return t('configurator.dataAmount');
  };

  // Display transform: show total GB for day_pass, "Unlimited" for limitless
  const getOptionDisplayText = (option: string) => {
    if (selectedPackageType === 'limitless') return 'Unlimited';
    if (selectedPackageType === 'day_pass' && selectedDays) {
      const match = option.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        const totalMB = unit === 'GB' ? amount * 1024 * selectedDays : amount * selectedDays;
        if (totalMB >= 1024) {
          const totalGB = totalMB / 1024;
          return `${Number.isInteger(totalGB) ? totalGB : totalGB.toFixed(1)}GB`;
        }
        return `${totalMB}MB`;
      }
    }
    return option;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-0">
      {!skipUsageStyle && (
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('configurator.back')}
        </Button>
      )}

      {isExtending && extendingPackageName && (
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                {t('configurator.extendEsim.extendingLabel')}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {extendingPackageType && (
                  <PackageTypeBadge packageType={extendingPackageType} size="sm" />
                )}
                <span className="font-semibold text-foreground">
                  {extendingPackageName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("flex", skipUsageStyle ? "gap-4 flex-col md:grid md:grid-cols-2" : "gap-6 flex-col md:flex-row")}>
        <div className="w-full">
          <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isRegional ? <span className="text-2xl md:text-3xl">🌏</span> : <FlagIcon countryCode={countryCode} countryName={countryName} size="lg" className="rounded shadow-sm" />}
              <div>
                <h2 className={cn("font-bold text-gray-900", skipUsageStyle ? "text-base" : "text-lg md:text-lg lg:text-xl")}>
                  {isRegional ? `${countryName} Regional eSIM` : `${countryName}`}
                </h2>
                {isRegional && (
                  <p className="text-xs text-gray-500">
                    {t('configurator.oneEsimMultiple')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                title={t('configurator.copyLink')}
              >
                <Link2 className="h-4 w-4" />
              </button>
              <div className="text-right">
              {flowStep === 'usage_style' ? (
                <>
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-500">
                    {t('configurator.from')} {formatPrice(minPrice)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">{t(`currency.${currency}`)}</div>
                </>
              ) : selectedPackageType === 'day_pass' && !selectedBackupSpeed ? (
                <div className="text-sm md:text-base text-gray-500 italic">
                  {t('configurator.selectBackupSpeed')}
                </div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-500">
                    {formatPrice(totalPrice)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">{t(`currency.${currency}`)}</div>
                </>
              )}
              </div>
            </div>
          </div>
        </CardHeader>

      <CardContent className="space-y-3 md:space-y-3 lg:space-y-4 px-3 md:px-6">
        {flowStep === 'usage_style' && !isExtending && (
          <UsageStyleSelector
            onSelectUnlimited={handleSelectUnlimited}
            onSelectPayPerUse={handleSelectPayPerUse}
            onShowAdvanced={handleShowAdvanced}
            hasLimitless={hasLimitless}
            hasPayPerUse={hasPayPerUse}
          />
        )}

        {flowStep === 'configurator' && (
          <>
        {isLocalSimMode && localSimPackage ? (
          <>
            <LocalSimConfigurator
              pkg={localSimPackage}
              quantity={quantity}
              setQuantity={setQuantity}
              onAddToCart={onAddToCart}
            />
            
            {availableCarriers.length > 1 && requiresCarrierSelection(countryName) && selectedCarrier && (
              <Collapsible>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Signal className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{t('configurator.carrier')}:</span>
                    <span className="font-medium text-gray-900">{selectedCarrier}</span>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                      {t('configurator.change')}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="pt-3">
                  <CarrierSelector
                    carriers={availableCarriers}
                    selectedCarrier={selectedCarrier}
                    onSelect={(carrier) => {
                      setSelectedCarrier(carrier);
                      setSelectedDays(null);
                      setSelectedOption(null);
                      setSelectedBackupSpeed(null);
                    }}
                    networkTypes={carrierNetworkTypes}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        ) : (
          <>
        {isExtending && extendingPackageType && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              {t('configurator.packageType')}
              <span className="text-xs text-orange-500 font-normal">({t('configurator.locked')})</span>
            </h3>
            <div className="flex justify-center">
              <PackageTypeBadge 
                packageType={extendingPackageType}
                size="sm"
                showIcon={true}
                isSelected={true}
                interactive={false}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {t('configurator.extendSamePlanTypeOnly')}
            </p>
          </div>
        )}

        {!isExtending && !skipUsageStyle && (usageFilter !== 'all' || cameFromUsageStyle) && hasLimitless && hasPayPerUse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToUsageStyle}
            className="text-muted-foreground hover:text-foreground -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('payPerUseType.back')}
          </Button>
        )}

        {!isExtending && (availableCarriers.length <= 1 || selectedCarrier || !requiresCarrierSelection(countryName)) && filteredPackageTypes.length > 0 && (
          skipUsageStyle ? (
            <div className="bg-[#ede8e3] rounded-xl p-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${filteredPackageTypes.length}, 1fr)` }}>
              {filteredPackageTypes.map((type) => {
                const typeLabelKeys: Record<string, string> = {
                  limitless: 'packageSelector.unlimited',
                  day_pass: 'packageSelector.value',
                  max_speed: 'packageSelector.payPerUse',
                };
                const label = t(typeLabelKeys[type] || type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      const previousType = selectedPackageType;
                      setSelectedPackageType(type);
                      if (type !== 'day_pass') setSelectedBackupSpeed(null);
                      if (previousType !== type) {
                        setSelectedDays(null);
                        setSelectedOption(null);
                      }
                    }}
                    className={cn(
                      "rounded-lg py-2 text-sm font-semibold transition-colors",
                      selectedPackageType === type
                        ? "bg-gray-900 text-white shadow-none"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{t('configurator.packageType')}</h3>
              <PackageTypeSelector
                availableTypes={filteredPackageTypes}
                selectedType={selectedPackageType}
                onSelect={(type) => {
                  const previousType = selectedPackageType;
                  setSelectedPackageType(type);
                  if (type !== 'day_pass') setSelectedBackupSpeed(null);
                  if (previousType !== type) {
                    setSelectedDays(null);
                    setSelectedOption(null);
                  }
                }}
              />
            </div>
          )
        )}

        {selectedPackageType && availableDays.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{t('configurator.serviceDays')}</h3>
              <div className="grid grid-cols-6 gap-2">
                {availableDays.map(days => (
                  <Button
                    key={days}
                    variant="ghost"
                onClick={() => setSelectedDays(days)}
                    className={cn(
                      "rounded-full aspect-square font-bold md:text-sm md:h-11 lg:text-base lg:h-12",
                      selectedDays === days
                        ? "bg-orange-500 text-white ring-2 ring-orange-600 hover:bg-orange-600 hover:text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    )}
                  >
                    {days}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {isExtending && (extendingPackageType === 'day_pass' || extendingPackageType === 'limitless') && extendingDataAmount && selectedDays && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-2">
              {extendingPackageType === 'day_pass' ? t('configurator.dailyData') : t('configurator.minSpeedGuarantee')}
              <span className="text-xs text-orange-500 font-normal">({t('configurator.locked')})</span>
            </h3>
            <div className="p-3 bg-gray-100 rounded-lg text-center font-semibold text-gray-700">
              {extendingDataAmount}
            </div>
            <p className="text-xs text-gray-500 text-center">
              {t('configurator.dataAmountLockedForExtension')}
            </p>
          </div>
        )}

        {((!isExtending) || (isExtending && extendingPackageType === 'max_speed')) && selectedDays && availableOptions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{getOptionLabel()}</h3>
              <div className="grid grid-cols-4 gap-2">
                {availableOptions.map(option => (
                  <Button
                    key={option}
                    variant="ghost"
                onClick={() => setSelectedOption(option)}
                    className={cn(
                      "rounded-full font-semibold md:text-sm md:h-10 lg:text-base lg:h-11",
                      selectedOption === option
                        ? "bg-orange-500 text-white ring-2 ring-orange-600 hover:bg-orange-600 hover:text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    )}
                  >
                    {getOptionDisplayText(option)}
                  </Button>
                ))}
              </div>
              {selectedPackageType === 'day_pass' && selectedOption && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {selectedOption}/{t('configurator.perDay')}
                </p>
              )}
            </div>
          )}

        {!isExtending && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{t('configurator.quantity')}</h3>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="rounded-full w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                >
                  <Minus className="h-4 w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5" />
                </Button>
                <span className="text-xl md:text-xl lg:text-2xl font-bold min-w-[50px] text-center text-gray-900">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-full w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                >
                  <Plus className="h-4 w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5" />
                </Button>
              </div>
            </div>
        )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {isExtending ? (
              <Button
                onClick={() => matchedPackage && onAddToCart(matchedPackage.id, 1)}
                disabled={!matchedPackage}
                className="w-full rounded-full h-11 md:h-12 md:text-base"
              >
                {t('configurator.extendEsim.button')}
              </Button>
            ) : (
              <Button
                onClick={() => matchedPackage && onAddToCart(matchedPackage.id, quantity)}
                disabled={!matchedPackage}
                className="flex-1 rounded-full h-11 md:h-12 md:text-base"
              >
                {t('configurator.addToCart')}
              </Button>
            )}
          </div>

          {!isExtending && availableCarriers.length > 1 && requiresCarrierSelection(countryName) && selectedCarrier && (
            <Collapsible>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Signal className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{t('configurator.carrier')}:</span>
                  <span className="font-medium text-gray-900">{selectedCarrier}</span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                    {t('configurator.change')}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="pt-3">
                <CarrierSelector
                  carriers={availableCarriers}
                  selectedCarrier={selectedCarrier}
                  onSelect={(carrier) => {
                    setSelectedCarrier(carrier);
                    setSelectedDays(null);
                    setSelectedOption(null);
                    setSelectedBackupSpeed(null);
                  }}
                  networkTypes={carrierNetworkTypes}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
          </>
        )}
          </>
        )}
        </CardContent>
          </Card>
        </div>

        {((matchedPackage && !isLocalSimMode) || localSimPackage) && flowStep === 'configurator' && (
          <>
            {skipUsageStyle ? (
              <div className="w-full md:sticky md:top-4 md:self-start">
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">{t('configurator.packageDetails')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <PackageDetailsContent pkg={isLocalSimMode && localSimPackage ? localSimPackage : matchedPackage!} isRegional={isRegional} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="hidden md:block flex-1">
                  <Card className="bg-white border-gray-200 shadow-sm h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base md:text-base lg:text-lg font-semibold text-gray-900">{t('configurator.packageDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-3 lg:space-y-4">
                      <PackageDetailsContent pkg={isLocalSimMode && localSimPackage ? localSimPackage : matchedPackage!} isRegional={isRegional} />
                    </CardContent>
                  </Card>
                </div>

                <div className="md:hidden w-full">
                  <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                            <CardTitle className="text-base font-semibold text-gray-900">{t('configurator.packageDetails')}</CardTitle>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform",
                              isDetailsOpen && "rotate-180"
                            )} />
                          </Button>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="space-y-3 pt-0">
                          <PackageDetailsContent pkg={isLocalSimMode && localSimPackage ? localSimPackage : matchedPackage!} isRegional={isRegional} />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {selectedPackageType && selectedOption && selectedDays && !matchedPackage && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('configurator.combinationNotAvailable')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
