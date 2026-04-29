import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { PackageTypeSelector } from '@/components/esim/PackageTypeSelector';
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
  initialCarrier?: string;  // Carrier from URL (e.g., "Softbank / KDDI", "DOCOMO")
  initialPackageType?: PackageType;
  initialDays?: number;
  initialOption?: string;
  initialBackupSpeed?: string;
  initialQuantity?: number;
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
}

// Package Details Content Component (extracted outside for stability)
const PackageDetailsContent = ({ pkg, isRegional: isRegionalPkg = false }: PackageDetailsContentProps) => {
  const { t } = useLanguage();
  const regionalData = isRegionalPkg ? getRegionalData(pkg) : null;
  const countryCount = isRegionalPkg ? getCountryCount(pkg) : 0;
  
  return (
    <>
      {/* Regional Package Countries Section */}
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
          
          {/* Static country preview */}
          <div className="text-sm text-muted-foreground">
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
      
      {/* Description */}
          {pkg.package_type && !pkg.is_local_sim && (
            <p className="text-sm md:text-sm lg:text-base text-muted-foreground leading-relaxed">
              {pkg.package_type === 'limitless' && t('planTypes.limitless.description')}
              {pkg.package_type === 'max_speed' && t('planTypes.maxSpeed.description')}
              {pkg.package_type === 'day_pass' && t('planTypes.dayPass.description')}
            </p>
          )}

      {/* Local SIM Package Includes Section */}
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

      {/* Grid Layout for Package Details */}
      <div className="grid grid-cols-2 gap-2 md:gap-2 lg:gap-3">
      {/* Carrier */}
      {pkg.carrier && (
        <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-500">{t('configurator.carrier')}</p>
          <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">
            {(() => { const { reordered } = getBestCarrierFirst(pkg.carrier); return reordered === 'DOCOMO' ? 'NTT DOCOMO' : reordered; })()}
          </p>
          <div className="mt-1">
            <CarrierStarRating rating={getBestCarrierFirst(pkg.carrier).bestRating} size="sm" carrierName={getBestCarrierFirst(pkg.carrier).reordered} />
          </div>
        </div>
      )}

      {/* Network */}
      {(pkg.network_type || isRegionalPkg) && (
        <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-500">{t('configurator.network')}</p>
          <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">
            {isRegionalPkg ? '3G/4G/5G' : pkg.network_type}
          </p>
        </div>
      )}

          {/* Maximum Speed */}
          {(() => {
            // For regional packages, always show 3G/4G/5G
            if (isRegionalPkg) {
              // For limitless regional packages, show unlimited
              if (pkg.package_type === 'limitless') {
                return (
                  <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
                    <p className="text-xs md:text-sm text-gray-500">{t('configurator.maxSpeed')}</p>
                    <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">
                      {t('configurator.unlimited')}
                    </p>
                  </div>
                );
              }
              // For non-limitless regional packages, show 3G/4G/5G
              return (
                <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
                  <p className="text-xs md:text-sm text-gray-500">{t('configurator.maxSpeed')}</p>
                  <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">3G/4G/5G</p>
                </div>
              );
            }
            
            // Get networks from carrier data
            const carrierNetworks = getCountryNetworks(
              pkg.country_name,
              pkg.country_code,
              regionalData
            );
            
            // Determine display value based on package type
            let maxSpeedValue: string | null = null;
            
if (pkg.package_type === 'limitless') {
              // For limitless packages, carrier-specific max speed display
              if (pkg.carrier === 'DOCOMO') {
                // DOCOMO limitless: hardcoded 10 Mbps tier
                maxSpeedValue = `${t('configurator.unlimited')} 10 Mbps`;
              } else {
                // Other carriers (e.g., Softbank/KDDI): just "Unlimited"
                // The qos_speed (5Mbps) is a fair usage fallback, not the normal max
                maxSpeedValue = t('configurator.unlimited');
              }
            } else if (carrierNetworks) {
              // Use carrier networks if available
              maxSpeedValue = carrierNetworks;
            } else if (pkg.package_type === 'day_pass') {
              // Fallback to network_type for day_pass
              maxSpeedValue = pkg.network_type || null;
            } else {
              // Fallback to qos_speed for max_speed
              maxSpeedValue = pkg.qos_speed || null;
            }
            
            return maxSpeedValue ? (
              <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
                <p className="text-xs md:text-sm text-gray-500">{t('configurator.maxSpeed')}</p>
                <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">
                  {maxSpeedValue}
                </p>
              </div>
            ) : null;
          })()}

      {/* Speed After Daily Limit */}
      {pkg.speed_after_limit && (
        <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-500">{t('configurator.afterLimit')}</p>
          <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">{pkg.speed_after_limit}</p>
          {/* Example subtitle for Day Pass packages */}
          {pkg.package_type === 'day_pass' && pkg.daily_reset_amount && (
            <p className="text-xs text-gray-400 mt-1">
              {t('configurator.afterLimitExample').replace('{data}', pkg.daily_reset_amount)}
            </p>
          )}
        </div>
      )}

      {/* Daily Reset */}
      <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
        <p className="text-xs md:text-sm text-gray-500">{t('configurator.dailyReset')}</p>
        <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">
          {pkg.daily_data_reset 
            ? `${pkg.daily_reset_amount || t('configurator.yes')}`
            : t('configurator.no')
          }
        </p>
      </div>

      {/* SIM Type */}
      {pkg.sim_type && (
        <div className="bg-gray-50 rounded-lg p-2 md:p-2.5 lg:p-3 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-500">{t('configurator.simType')}</p>
          <p className="text-sm md:text-sm lg:text-base font-medium text-gray-900">
            {pkg.is_local_sim ? 'Local' : pkg.sim_type}
          </p>
        </div>
      )}
    </div>

    {/* Features */}
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

    {/* Fair Usage Policy - Limitless packages only */}
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

    {/* KYC Requirement Warning */}
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

export function PackageConfigurator({
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
  onStateChange,
}: PackageConfiguratorProps) {
  const { formatPrice, currency, t, language } = useLanguage();
  const { toast } = useToast();
  
  // Helper: Get flag emoji from country code
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // When extending, lock to the original package type
  const [selectedPackageType, setSelectedPackageType] = useState<PackageType | null>(
    isExtending && extendingPackageType ? extendingPackageType : (initialPackageType || null)
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(initialOption || null);
  const [selectedDays, setSelectedDays] = useState<number | null>(initialDays || null);
  const [selectedBackupSpeed, setSelectedBackupSpeed] = useState<string | null>(initialBackupSpeed || null);
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(initialCarrier || null);
  
  // Flow step state - determines which view to show
  const [flowStep, setFlowStep] = useState<FlowStep>(() => {
    // Skip usage style selector if extending or if initial type is provided
    if (isExtending || initialPackageType) return 'configurator';
    return 'usage_style';
  });
  
  // Usage filter state - tracks which usage style was chosen to filter package type badges
  const [usageFilter, setUsageFilter] = useState<UsageFilter>(() => {
    // If initial type is provided, set appropriate filter
    if (initialPackageType === 'limitless') return 'unlimited';
    if (initialPackageType === 'day_pass' || initialPackageType === 'max_speed') return 'pay_per_use';
    return 'all';
  });
  
  // Track if user navigated from usage style selector (to show back button even when usageFilter is 'all')
  const [cameFromUsageStyle, setCameFromUsageStyle] = useState<boolean>(false);
  
  // Get available carriers from packages (using display names to deduplicate)
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

  // Get network types for each carrier (merged by display name)
  const carrierNetworkTypes = useMemo(() => {
    const networkMap: Record<string, Set<string>> = {};
    packages.forEach(pkg => {
      if (pkg.carrier && pkg.network_type) {
        const displayName = getCarrierDisplayName(countryName, pkg.carrier);
        if (!networkMap[displayName]) {
          networkMap[displayName] = new Set<string>();
        }
        // Split by common separators and add each type individually
        const types = pkg.network_type.split(/[\/,\s]+/).map(t => t.replace(/\(.*\)/, '')).filter(t => t.match(/^[345]G$/i));
        types.forEach(type => networkMap[displayName].add(type.toUpperCase()));
      }
    });
    // Convert sets to sorted strings (3G, 4G, 5G order)
    const result: Record<string, string> = {};
    const order = ['3G', '4G', '5G'];
    Object.entries(networkMap).forEach(([carrier, types]) => {
      const sorted = order.filter(t => types.has(t));
      result[carrier] = sorted.length > 0 ? sorted.join('/') : '4G/5G';
    });
    return result;
  }, [packages, countryName]);


  // Filter packages by selected carrier (or use all if only one carrier or none selected)
  const carrierFilteredPackages = useMemo(() => {
    // If only one carrier exists, use all packages
    if (availableCarriers.length <= 1) return packages;
    
    // For non-whitelisted countries, use all packages regardless of carrier variations
    if (!requiresCarrierSelection(countryName)) return packages;
    
    // For whitelisted countries (e.g., Japan), require carrier selection
    if (!selectedCarrier) return [];
    // Use display name → raw name mapping so merged carriers match all underlying packages
    const rawCarriers = getRawCarriersForDisplay(countryName, selectedCarrier);
    return packages.filter(pkg => pkg.carrier && rawCarriers.includes(pkg.carrier));
  }, [packages, selectedCarrier, availableCarriers, countryName]);

  // Detect Local SIM single-package mode (e.g., AIS Thailand)
  const isLocalSimMode = useMemo(() => {
    if (!selectedCarrier) return false;
    const rawCarriers = getRawCarriersForDisplay(countryName, selectedCarrier);
    const carrierPackages = packages.filter(p => p.carrier && rawCarriers.includes(p.carrier));
    // Local SIM mode when there's exactly 1 package AND it's a local SIM
    return carrierPackages.length === 1 && carrierPackages[0].is_local_sim === true;
  }, [packages, selectedCarrier, countryName]);

  // The single local SIM package when in local SIM mode
  const localSimPackage = useMemo(() => {
    if (!isLocalSimMode || !selectedCarrier) return null;
    const rawCarriers = getRawCarriersForDisplay(countryName, selectedCarrier);
    return packages.find(p => p.carrier && rawCarriers.includes(p.carrier) && p.is_local_sim) || null;
  }, [packages, selectedCarrier, isLocalSimMode, countryName]);

  // Auto-select carrier: Match URL params if available, otherwise use cheapest
  useEffect(() => {
    // Skip if already selected from URL or user choice
    if (selectedCarrier) return;
    
    if (availableCarriers.length === 1) {
      // Single carrier - auto-select it
      setSelectedCarrier(availableCarriers[0]);
    } else if (availableCarriers.length > 1 && requiresCarrierSelection(countryName)) {
      // Multi-carrier country - try to find carrier matching URL params first
      
      // If URL params specify type + days + option, find matching carrier
      if (initialPackageType && initialDays && initialOption) {
        const matchingCarrier = packages.find(pkg => {
          if (pkg.package_type !== initialPackageType) return false;
          if (pkg.validity_days !== initialDays) return false;
          
          // Match option field based on package type
          if (initialPackageType === 'limitless') {
            return pkg.qos_speed === initialOption;
          } else if (initialPackageType === 'max_speed') {
            return pkg.data_amount === initialOption;
          } else if (initialPackageType === 'day_pass') {
            return pkg.daily_reset_amount === initialOption;
          }
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
      
      // Try preferred carrier first (e.g., Truemove for Thailand)
      const preferred = getPreferredCarrier(countryName, availableCarriers);
      if (preferred) {
        setSelectedCarrier(preferred);
        return;
      }
      
      // Fallback: get cheapest carrier for the package type (existing logic)
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
  
  // Helper to normalize speed (inline version for effects)
  const normalizeSpeedValue = (speed: string | null | undefined): string | null => {
    if (!speed) return null;
    const normalized = speed.toLowerCase().replace(/\s+/g, '');
    const match = normalized.match(/^(\d+(?:\.\d+)?)(k|m)bps$/);
    if (match) return `${match[1]}${match[2]}bps`;
    return normalized;
  };

  // Auto-select options based on extending eSIM's configuration
  useEffect(() => {
    if (isExtending && extendingPackageType) {
      // Lock package type
      setSelectedPackageType(extendingPackageType);
      
      // For day_pass and limitless: Auto-lock to original data amount (cannot be changed)
      if (extendingPackageType === 'day_pass') {
        // Lock daily data amount to original
        if (extendingDataAmount) {
          setSelectedOption(extendingDataAmount);
        }
        // Lock backup speed to original - use normalized speed
        if (extendingSpeed) {
          const normalizedSpeed = normalizeSpeedValue(extendingSpeed);
          if (normalizedSpeed) {
            setSelectedBackupSpeed(normalizedSpeed);
          }
        }
      } else if (extendingPackageType === 'limitless') {
        // Lock speed tier to original (first available option since they all match)
        if (extendingDataAmount) {
          setSelectedOption(extendingDataAmount);
        }
      }
      // For max_speed: Don't auto-select data amount - let user choose
    }
  }, [isExtending, extendingPackageType, extendingDataAmount, extendingSpeed]);

  // Preferred order: Standard → Unlimited → Low Usage
  const PACKAGE_TYPE_ORDER: PackageType[] = ['day_pass', 'limitless', 'max_speed'];

  // Get available package types (from carrier-filtered packages) - sorted by preferred order
  const availablePackageTypes = useMemo(() => {
    const types = new Set<PackageType>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.package_type && ['day_pass', 'max_speed', 'limitless'].includes(pkg.package_type)) {
        types.add(pkg.package_type as PackageType);
      }
    });
    // Return in preferred order: day_pass → limitless → max_speed
    return PACKAGE_TYPE_ORDER.filter(type => types.has(type));
  }, [carrierFilteredPackages]);

  // Get available types from ALL packages (not filtered by carrier) for flow decision
  const allAvailablePackageTypes = useMemo(() => {
    const types = new Set<PackageType>();
    packages.forEach(pkg => {
      if (pkg.package_type && ['day_pass', 'max_speed', 'limitless'].includes(pkg.package_type)) {
        types.add(pkg.package_type as PackageType);
      }
    });
    return types;
  }, [packages]);

  // Filtered package types based on user's usage style choice
  const filteredPackageTypes = useMemo(() => {
    if (usageFilter === 'unlimited') {
      // Only show Limitless
      return availablePackageTypes.filter(t => t === 'limitless');
    } else if (usageFilter === 'pay_per_use') {
      // Only show Day Pass and Max Speed
      return availablePackageTypes.filter(t => t === 'day_pass' || t === 'max_speed');
    }
    // Show all
    return availablePackageTypes;
  }, [availablePackageTypes, usageFilter]);

  // Computed flags for flow selectors
  const hasLimitless = allAvailablePackageTypes.has('limitless');
  const hasMaxSpeed = allAvailablePackageTypes.has('max_speed');
  const hasDayPass = allAvailablePackageTypes.has('day_pass');
  const hasPayPerUse = hasMaxSpeed || hasDayPass;

  // Handler: User selects Unlimited
  const handleSelectUnlimited = useCallback(() => {
    setUsageFilter('unlimited');
    setCameFromUsageStyle(true);
    // Auto-select cheapest carrier for limitless
    if (availableCarriers.length > 1 && requiresCarrierSelection(countryName)) {
      const cheapest = getCheapestCarrierForType(packages, 'limitless');
      if (cheapest && availableCarriers.includes(cheapest)) {
        setSelectedCarrier(cheapest);
      }
    }
    setFlowStep('configurator');
  }, [availableCarriers, countryName, packages]);

  // Handler: User selects Pay Per Use
  const handleSelectPayPerUse = useCallback(() => {
    setUsageFilter('pay_per_use');
    setCameFromUsageStyle(true);
    setFlowStep('configurator');
  }, []);

  // Handler: User wants to see all options (advanced)
  const handleShowAdvanced = useCallback(() => {
    setUsageFilter('all');
    setCameFromUsageStyle(true);
    setFlowStep('configurator');
  }, []);

  // Handler: Go back from configurator to usage style selector
  const handleBackToUsageStyle = useCallback(() => {
    setUsageFilter('all');
    setFlowStep('usage_style');
    setSelectedPackageType(null);
    setCameFromUsageStyle(false);
  }, []);

  // Skip flow if only one option available
  useEffect(() => {
    if (flowStep !== 'usage_style') return;
    if (isExtending || initialPackageType) return;
    
    // If only one type available, skip directly to configurator
    if (allAvailablePackageTypes.size === 1) {
      const singleType = Array.from(allAvailablePackageTypes)[0];
      setSelectedPackageType(singleType);
      setUsageFilter('all');
      setFlowStep('configurator');
    }
    // If only limitless available, skip to configurator with unlimited filter
    else if (hasLimitless && !hasPayPerUse) {
      setUsageFilter('unlimited');
      setFlowStep('configurator');
    }
    // If only pay-per-use available (no limitless), skip to configurator with pay_per_use filter
    else if (!hasLimitless && hasPayPerUse) {
      setUsageFilter('pay_per_use');
      setFlowStep('configurator');
    }
  }, [flowStep, isExtending, initialPackageType, allAvailablePackageTypes, hasLimitless, hasPayPerUse]);


  // Helper: Normalize backup speed to canonical key (e.g., "256 Kbps" → "256kbps", "1 Mbps" → "1mbps")
  const normalizeBackupSpeed = useCallback((speed: string | null | undefined): string | null => {
    if (!speed) return null;
    const normalized = speed.toLowerCase().replace(/\s+/g, '');
    // Extract number and unit (kbps or mbps)
    const match = normalized.match(/^(\d+(?:\.\d+)?)(k|m)bps$/);
    if (match) {
      return `${match[1]}${match[2]}bps`;
    }
    // Fallback: just return cleaned string
    return normalized;
  }, []);

  // Helper: Format backup speed for display (e.g., "256kbps" → "256 Kbps", "1mbps" → "1 Mbps")
  const formatBackupSpeed = useCallback((speed: string): string => {
    const match = speed.match(/^(\d+(?:\.\d+)?)(k|m)bps$/i);
    if (match) {
      const unit = match[2].toLowerCase() === 'm' ? 'Mbps' : 'Kbps';
      return `${match[1]} ${unit}`;
    }
    return speed;
  }, []);

  // Get available backup speeds for Day Pass (filtered by days and daily data) - now dynamic
  const availableBackupSpeeds = useMemo<string[]>(() => {
    if (selectedPackageType !== 'day_pass') return [];
    
    const speeds = new Set<string>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.package_type === 'day_pass') {
        // Filter by selected days and daily data if set
        if (selectedDays && pkg.validity_days !== selectedDays) return;
        if (selectedOption && pkg.daily_reset_amount !== selectedOption) return;
        
        // Use speed_after_limit field to determine available speeds - normalize for consistency
        const normalizedSpeed = normalizeBackupSpeed(pkg.speed_after_limit);
        if (normalizedSpeed) speeds.add(normalizedSpeed);
      }
    });
    // Sort by numeric value (higher speeds last)
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

  // Get available days based on selected package type (independent of backup speed for day_pass)
  const availableDays = useMemo(() => {
    if (!selectedPackageType) return [];
    
    const days = new Set<number>();
    carrierFilteredPackages.forEach(pkg => {
      if (pkg.package_type === selectedPackageType && pkg.validity_days) {
        days.add(pkg.validity_days);
      }
    });
    
    const result = Array.from(days).sort((a, b) => a - b);
    
    // Debug logging
    console.log('=== AVAILABLE DAYS DEBUG ===');
    console.log('selectedPackageType:', selectedPackageType);
    console.log('selectedCarrier:', selectedCarrier);
    console.log('Total packages received:', carrierFilteredPackages.length);
    console.log('Packages matching type:', carrierFilteredPackages.filter(p => p.package_type === selectedPackageType).length);
    console.log('Available days:', result);
    
    return result;
  }, [carrierFilteredPackages, selectedPackageType, selectedCarrier]);

  // Get options based on selected package type and days (independent of backup speed for day_pass)
  const availableOptions = useMemo(() => {
    if (!selectedPackageType || !selectedDays) return [];
    
    const options = new Set<string>();
    carrierFilteredPackages.forEach(pkg => {
      // Check validity days match first
      if (pkg.validity_days !== selectedDays) return;
      
      if (pkg.package_type === selectedPackageType) {
        if (selectedPackageType === 'day_pass') {
          if (pkg.daily_reset_amount) options.add(pkg.daily_reset_amount);
        } else if (selectedPackageType === 'max_speed') {
          if (pkg.data_amount) options.add(pkg.data_amount);
        } else if (selectedPackageType === 'limitless') {
          if (pkg.qos_speed) options.add(pkg.qos_speed);
        }
      }
    });
    
    return Array.from(options).sort((a, b) => {
      // Convert to MB for proper sorting (500MB, 1GB, 2GB, etc.)
      const toMB = (value: string): number => {
        const num = parseFloat(value);
        if (value.toUpperCase().includes('GB')) {
          return num * 1024;
        } else if (value.toUpperCase().includes('MB')) {
          return num;
        }
        return num;
      };
      
      const mbA = toMB(a);
      const mbB = toMB(b);
      
      if (!isNaN(mbA) && !isNaN(mbB)) {
        return mbA - mbB;
      }
      return a.localeCompare(b);
    });
  }, [carrierFilteredPackages, selectedPackageType, selectedDays]);

  // Find matching package
  const matchedPackage = useMemo(() => {
    // When extending, we need to find a package that matches the selected config
    if (isExtending && extendingPackageType && selectedDays) {
      return carrierFilteredPackages.find(pkg => {
        if (pkg.package_type !== extendingPackageType) return false;
        if (pkg.validity_days !== selectedDays) return false;
        
        if (extendingPackageType === 'day_pass') {
          // Use user-selected data option (not locked)
          if (selectedOption && pkg.daily_reset_amount !== selectedOption) return false;
          // Match backup speed from original package (locked) - use normalized comparison
          if (extendingSpeed) {
            const targetSpeed = normalizeBackupSpeed(extendingSpeed);
            const pkgSpeed = normalizeBackupSpeed(pkg.speed_after_limit);
            if (pkgSpeed !== targetSpeed) return false;
          }
          return true;
        } else if (extendingPackageType === 'max_speed') {
          // Use user-selected data option (not locked)
          if (selectedOption && pkg.data_amount !== selectedOption) return false;
          return true;
        } else if (extendingPackageType === 'limitless') {
          // Limitless packages - just match days
          return true;
        }
        
        return false;
      });
    }
    
    // Normal mode - require all selections
    if (!selectedPackageType || !selectedOption || !selectedDays) return null;
    
    // For day_pass, backup speed selection is REQUIRED
    if (selectedPackageType === 'day_pass' && !selectedBackupSpeed) {
      return null;
    }
    
    return carrierFilteredPackages.find(pkg => {
      // For day_pass packages
      if (selectedPackageType === 'day_pass') {
        if (pkg.package_type !== 'day_pass') return false;
        
        // Match backup speed using speed_after_limit field - use normalized comparison
        const pkgSpeed = normalizeBackupSpeed(pkg.speed_after_limit);
        if (pkgSpeed !== selectedBackupSpeed) return false;
        
        return pkg.daily_reset_amount === selectedOption && pkg.validity_days === selectedDays;
      } else if (pkg.package_type === selectedPackageType) {
        if (!pkg.validity_days || pkg.validity_days !== selectedDays) return false;
        
        if (selectedPackageType === 'max_speed') {
          return pkg.data_amount === selectedOption;
      } else if (selectedPackageType === 'limitless') {
        return pkg.qos_speed === selectedOption;
      }
      }
      
      return false;
    });
  }, [carrierFilteredPackages, selectedPackageType, selectedOption, selectedDays, selectedBackupSpeed, isExtending, extendingPackageType, extendingDataAmount, extendingSpeed]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    // For local SIM mode, use localSimPackage price
    if (isLocalSimMode && localSimPackage) {
      return localSimPackage.price * quantity;
    }
    if (!matchedPackage) return 0;
    return matchedPackage.price * quantity;
  }, [matchedPackage, quantity, isLocalSimMode, localSimPackage]);

  // Calculate minimum price across ALL packages for "From $X" display
  const minPrice = useMemo(() => {
    if (packages.length === 0) return 0;
    return Math.min(...packages.map(pkg => pkg.price));
  }, [packages]);

  // Auto-select package type based on usage filter
  useEffect(() => {
    if (availablePackageTypes.length > 0) {
      // Respect usage filter for default selection
      let priorityOrder: PackageType[];
      if (usageFilter === 'unlimited') {
        priorityOrder = ['limitless'];
      } else if (usageFilter === 'pay_per_use') {
        priorityOrder = ['day_pass', 'max_speed'];
      } else {
        priorityOrder = ['day_pass', 'max_speed', 'limitless'];
      }
      
      // Check if current selection is valid for the usage filter
      const isCurrentSelectionValid = !selectedPackageType || (priorityOrder.includes(selectedPackageType) && availablePackageTypes.includes(selectedPackageType));
      
      // If no selection yet, or current selection doesn't match the filter, auto-select
      if (!selectedPackageType || (usageFilter && !isCurrentSelectionValid)) {
        const defaultType = priorityOrder.find(type => availablePackageTypes.includes(type)) 
                           || availablePackageTypes[0]; // Fallback to first available
        setSelectedPackageType(defaultType);
      }
    }
  }, [availablePackageTypes, selectedPackageType, usageFilter]);

  // Validate selectedBackupSpeed when availableBackupSpeeds changes
  useEffect(() => {
    if (selectedBackupSpeed && availableBackupSpeeds.length > 0 && !availableBackupSpeeds.includes(selectedBackupSpeed)) {
      setSelectedBackupSpeed(null);
    }
  }, [availableBackupSpeeds, selectedBackupSpeed]);

  // Auto-select backup speed for Day Pass (prefer 384kbps if available, else first available)
  useEffect(() => {
    if (
      selectedPackageType === 'day_pass' && 
      availableBackupSpeeds.length > 0 && 
      !selectedBackupSpeed
    ) {
      // Prefer 384kbps (cheaper option) if available, otherwise select first available speed
      const defaultSpeed = availableBackupSpeeds.includes('384kbps') 
        ? '384kbps' 
        : availableBackupSpeeds[0];
      setSelectedBackupSpeed(defaultSpeed);
    }
  }, [availableBackupSpeeds, selectedPackageType, selectedBackupSpeed]);

  // Auto-select 7 days if available, otherwise first available (now comes before option selection)
  useEffect(() => {
    if (availableDays.length > 0 && !selectedDays) {
      const preferredDays = availableDays.includes(7) ? 7 : availableDays[0];
      setSelectedDays(preferredDays);
    }
  }, [availableDays, selectedDays]);

  // Auto-select first option when options become available
  // For limitless, always use first option since selector is hidden
  useEffect(() => {
    if (availableOptions.length > 0 && !selectedOption) {
      setSelectedOption(availableOptions[0]);
    }
    if (selectedPackageType === 'limitless' && availableOptions.length > 0) {
      setSelectedOption(availableOptions[0]);
    }
  }, [availableOptions, selectedOption, selectedPackageType]);

  // Validate selectedDays when availableDays changes
  useEffect(() => {
    if (selectedDays && availableDays.length > 0 && !availableDays.includes(selectedDays)) {
      // Currently selected day is not available for this package type, reset it
      setSelectedDays(null);
    }
  }, [availableDays, selectedDays]);

  // Validate selectedOption when availableOptions changes
  useEffect(() => {
    if (selectedOption && availableOptions.length > 0 && !availableOptions.includes(selectedOption)) {
      // Currently selected option is not available for this days, reset it
      setSelectedOption(null);
    }
  }, [availableOptions, selectedOption]);

  // Notify parent of state changes for URL sync
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

  // Copy link handler
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
    if (!selectedPackageType) return '';
    if (selectedPackageType === 'limitless') return t('configurator.minSpeedGuarantee');
    if (selectedPackageType === 'max_speed') return t('configurator.dataAmount');
    if (selectedPackageType === 'day_pass') return t('configurator.dailyData');
    return t('configurator.option');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-0">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('configurator.back')}
      </Button>

      {/* Extension Mode Banner */}
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

      {/* Two-Column Layout: Configurator + Details */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Configurator (Fixed width on desktop) */}
        <div className="w-full md:w-[360px] lg:w-[480px] md:flex-shrink-0">
          <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isRegional ? <span className="text-2xl md:text-3xl">🌏</span> : <FlagIcon countryCode={countryCode} countryName={countryName} size="lg" className="rounded shadow-sm" />}
              <div>
                <h2 className="text-lg md:text-lg lg:text-xl font-bold text-gray-900">
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
              {/* Copy Link Button */}
                <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                title={t('configurator.copyLink')}
              >
                <Link2 className="h-4 w-4" />
              </button>
              <div className="text-right">
              {flowStep === 'usage_style' ? (
                // Show "From $X" during usage style selection
                <>
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-500">
                    {t('configurator.from')} {formatPrice(minPrice)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">{t(`currency.${currency}`)}</div>
                </>
              ) : selectedPackageType === 'day_pass' && !selectedBackupSpeed ? (
                // Waiting for backup speed selection
                <div className="text-sm md:text-base text-gray-500 italic">
                  {t('configurator.selectBackupSpeed')}
                </div>
              ) : (
                // Show actual total price
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
        {/* Usage Style Selector - Step 1 of guided flow */}
        {flowStep === 'usage_style' && !isExtending && (
          <UsageStyleSelector
            onSelectUnlimited={handleSelectUnlimited}
            onSelectPayPerUse={handleSelectPayPerUse}
            onShowAdvanced={handleShowAdvanced}
            hasLimitless={hasLimitless}
            hasPayPerUse={hasPayPerUse}
          />
        )}


        {/* Main Configurator - Only show when in configurator step */}
        {flowStep === 'configurator' && (
          <>
        {/* Local SIM Mode - Simplified single-package UI */}
        {isLocalSimMode && localSimPackage ? (
          <>
            <LocalSimConfigurator
              pkg={localSimPackage}
              quantity={quantity}
              setQuantity={setQuantity}
              onAddToCart={onAddToCart}
            />
            
            {/* Carrier Selector for Local SIM Mode */}
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
                      // Reset downstream selections when carrier changes
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
        {/* Extending Mode: Show locked plan info */}
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


        {/* Back Button - Show when user came from usage style selector and both options exist */}
        {!isExtending && (usageFilter !== 'all' || cameFromUsageStyle) && hasLimitless && hasPayPerUse && (
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

        {/* Package Type Selector - Uses filtered types based on usage style */}
        {!isExtending && (availableCarriers.length <= 1 || selectedCarrier || !requiresCarrierSelection(countryName)) && filteredPackageTypes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{t('configurator.packageType')}</h3>
            <PackageTypeSelector
              availableTypes={filteredPackageTypes}
              selectedType={selectedPackageType}
              onSelect={(type) => {
                const previousType = selectedPackageType;
                setSelectedPackageType(type);
                
                // Reset backup speed when changing package type
                if (type !== 'day_pass') {
                  setSelectedBackupSpeed(null);
                }
                
                // Only reset selections if switching to a different package type family
                if (previousType !== type) {
                  setSelectedDays(null);
                  setSelectedOption(null);
                }
              }}
            />
          </div>
        )}


        {/* Service Days Selector - Now appears before option selector */}
        {selectedPackageType && availableDays.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{t('configurator.serviceDays')}</h3>
              <div className="grid grid-cols-6 gap-2">
                {availableDays.map(days => (
                  <Button
                    key={days}
                    variant="ghost"
                onClick={() => {
                  setSelectedDays(days);
                }}
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

        {/* Locked Data Amount Display - For Day Pass/Limitless extensions */}
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

        {/* Dynamic Option Selector - Only show for max_speed when extending (day_pass/limitless are locked), hide for limitless since it's shown in FUP */}
        {((!isExtending) || (isExtending && extendingPackageType === 'max_speed')) && selectedPackageType !== 'limitless' && selectedDays && availableOptions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{getOptionLabel()}</h3>
              <div className="grid grid-cols-4 gap-2">
                {availableOptions.map(option => (
                  <Button
                    key={option}
                    variant="ghost"
                onClick={() => {
                  setSelectedOption(option);
                }}
                    className={cn(
                      "rounded-full font-semibold md:text-sm md:h-10 lg:text-base lg:h-11",
                      selectedOption === option
                        ? "bg-orange-500 text-white ring-2 ring-orange-600 hover:bg-orange-600 hover:text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    )}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Total GB highlight for Day Pass */}
        {selectedPackageType === 'day_pass' && selectedOption && selectedDays && (() => {
          const match = selectedOption.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/i);
          if (!match) return null;
          const amount = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          const totalMB = unit === 'GB' ? amount * 1024 * selectedDays : amount * selectedDays;
          const display = totalMB >= 1024
            ? `${Number.isInteger(totalMB / 1024) ? totalMB / 1024 : (totalMB / 1024).toFixed(1)}GB`
            : `${totalMB}MB`;
          return (
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-orange-50 border border-orange-200 rounded-full text-sm w-fit mx-auto">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-orange-700 font-semibold">
                {(t('configurator.totalData') as string).replace('{data}', display)}
              </span>
              <span className="text-orange-500 text-xs">
                {(t('configurator.overDays') as string).replace('{days}', String(selectedDays))}
              </span>
            </div>
          );
        })()}

        {/* Quantity Selector - Hidden in extension mode */}
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {isExtending ? (
              /* Extension mode: Single "Extend eSIM" button */
              <Button
                onClick={() => matchedPackage && onAddToCart(matchedPackage.id, 1)}
                disabled={!matchedPackage}
                className="w-full rounded-full h-11 md:h-12 md:text-base"
              >
                {t('configurator.extendEsim.button')}
              </Button>
            ) : (
              /* Normal mode: Add to Cart button only */
              <Button
                onClick={() => matchedPackage && onAddToCart(matchedPackage.id, quantity)}
                disabled={!matchedPackage}
                className="flex-1 rounded-full h-11 md:h-12 md:text-base"
              >
                {t('configurator.addToCart')}
              </Button>
            )}
          </div>

          {/* Carrier Info Bar with Collapsible Change Option - Only for whitelisted countries */}
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
                    // Reset downstream selections when carrier changes
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

        {/* Right Column - Package Details (Desktop: Always visible, Mobile: Below configurator) */}
        {((matchedPackage && !isLocalSimMode) || localSimPackage) && flowStep === 'configurator' && (
          <>
            {/* Desktop/Tablet: Always visible in right column */}
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

            {/* Mobile: Collapsible below configurator */}
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
      </div>

      {/* No Match Message */}
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
