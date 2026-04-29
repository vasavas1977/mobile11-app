import { FlagIcon } from '@/components/ui/FlagIcon';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Calendar, Globe, Copy, MoreVertical, Check, FileText, Plus, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UsageProgressBar } from './UsageProgressBar';
import { DayPassUsageCard } from './DayPassUsageCard';
import { LocalSimUsageCard } from './LocalSimUsageCard';
import { DesignatedDateInfoCard } from './DesignatedDateInfoCard';
import { OperatorSimCard } from './OperatorSimCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PackageDetailsModal } from './PackageDetailsModal';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { useEsimUsage } from '@/hooks/useEsimUsage';
import { useAdminPreview } from '@/contexts/AdminPreviewContext';
import { getRegionalData, getCountryCount } from '@/lib/regionalPackageUtils';
import { RegionalCountriesDialog } from '@/components/esim/RegionalCountriesDialog';
import { 
  calculateRemainingDays, 
  calculateValidityPercentage, 
  formatExpiryDate,
  calculateDataPercentage,
  isEsimExpired
} from '@/utils/esimValidity';

type PackageTypeValue = 'day_pass' | 'max_speed' | 'limitless';

function normalizePackageType(type?: string | null): PackageTypeValue {
  if (!type) return 'day_pass';
  const normalized = type.toLowerCase().replace(/[\s-]/g, '_');
  if (normalized.includes('day') || normalized === 'day_pass') return 'day_pass';
  if (normalized.includes('max') || normalized === 'max_speed') return 'max_speed';
  if (normalized.includes('limit') || normalized === 'limitless') return 'limitless';
  return 'day_pass';
}

interface EsimDetailCardProps {
  order: {
    id: string;
    order_id: string;
    status: string;
    created_at: string;
    iccid?: string;
    qr_code?: string;
    smdp_address?: string;
    activation_code?: string;
    webhook_data?: unknown;
    service_tier?: string;
    esim_packages?: {
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
      carrier?: string;
      included_countries?: any;
      package_type?: string;
      daily_data_reset?: boolean;
      daily_reset_amount?: string;
      speed_after_limit?: string;
      is_local_sim?: boolean;
    };
  };
  isInstalled?: boolean;
  autoRenewalEnabled?: boolean;
  /** Order ID to fetch usage from (for displaying active top-up package usage) */
  activePackageOrderId?: string;
}

export function EsimDetailCard({ order, isInstalled = false, autoRenewalEnabled = false, activePackageOrderId }: EsimDetailCardProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const { isAdminPreview } = useAdminPreview();
  
  // Determine which order ID to use for fetching usage
  // If activePackageOrderId is provided, use that (for top-up scenarios)
  // Otherwise use the current order's ID
  const usageOrderId = activePackageOrderId || order.id;
  
  // Fetch real usage data from API for all completed eSIMs
  const { data: usage, isLoading: isLoadingUsage } = useEsimUsage(
    usageOrderId, 
    order.status === 'completed' // Fetch for all completed orders
  );
  
  const pkg = order.esim_packages;
  const dataAmount = pkg?.data_amount || '1 GB';
  const validityDays = pkg?.validity_days || 7;
  const countryCode = pkg?.country_code?.toLowerCase() || undefined;
  const countryName = pkg?.country_name || 'Thailand';
  const rawProvider = pkg?.carrier || pkg?.name?.split(' ')[0] || 'Mobile11';
  const iccid = order.iccid || 'Not yet assigned';
  
  // Detect regional packages - carrier string is a long list of countries+carriers
  const isRegionalPackage = (rawProvider.length > 50 && rawProvider.includes(':')) || 
    (Array.isArray(pkg?.included_countries) && pkg.included_countries.length > 1);
  const provider = isRegionalPackage ? 'Multi-carrier' : rawProvider;
  const regionalData = isRegionalPackage ? getRegionalData(pkg) : null;
  const regionalCountryCount = isRegionalPackage ? getCountryCount(pkg) : 0;
  
  // Check if this is a Day Pass plan
  const packageType = pkg?.package_type?.toLowerCase().replace(/[_\s-]/g, '') || '';
  const isDayPass = packageType === 'daypass' || pkg?.daily_data_reset === true;
  
  // Count included countries
  const includedCountries = Array.isArray(pkg?.included_countries) 
    ? pkg.included_countries.length 
    : 1;
  
  // Check if eSIM is not yet activated — but if there's actual usage, it's definitely activated
  const isNotYetActivated = (usage?.usageMb ?? 0) > 0 
    ? false 
    : (usage?.notYetActivated === true || 
       ['NOTACTIVE', 'PENDING', 'CREATED'].includes((usage?.orderState || '').toUpperCase()));
  
  // Normalize TUGE expireTime to validUntil (TUGE API returns expireTime, not validUntil)
  // Don't use these dates if eSIM is not yet activated - they're pre-calculated and misleading
  const normalizedValidUntil = isNotYetActivated 
    ? null 
    : (usage?.validUntil || (usage?.expireTime ? new Date(usage.expireTime).toISOString() : null));
  const normalizedValidFrom = isNotYetActivated 
    ? null 
    : (usage?.validFrom || (usage?.activeTime ? new Date(usage.activeTime).toISOString() : null));
  
  // Calculate real-time values from usage data
  const remainingDays = normalizedValidUntil 
    ? calculateRemainingDays(normalizedValidUntil) 
    : (isNotYetActivated ? null : (usage?.daysRemaining ?? validityDays));
  
  const expired = normalizedValidUntil ? isEsimExpired(normalizedValidUntil) : false;
  
  const validityPercentage = normalizedValidFrom && normalizedValidUntil
    ? calculateValidityPercentage(normalizedValidFrom, normalizedValidUntil)
    : (order.status === 'completed' ? 100 : 100);
  
  const expiryDateFormatted = normalizedValidUntil 
    ? formatExpiryDate(normalizedValidUntil, language, true, true) // Include year and time for detail view
    : null;
  
  // Data usage calculations - use API percentage if available
  const displayData = usage?.remainingData || dataAmount;
  const dataPercentage = usage?.percentageUsed !== null && usage?.percentageUsed !== undefined
    ? (100 - usage.percentageUsed) // Convert from % used to % remaining
    : (order.status === 'completed' ? 100 : 100);
  
  const handleCopyIccid = async () => {
    if (order.iccid) {
      await navigator.clipboard.writeText(order.iccid);
      setCopied(true);
      toast({
        title: t('myEsims.copied'),
        description: t('myEsims.iccidCopied'),
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const normalizedPackageType = normalizePackageType(pkg?.package_type);
  
  // Check if this is a Limitless plan
  const isLimitless = normalizedPackageType === 'limitless';
  
  // Check if this is a local SIM (no API tracking available)
  const isLocalSim = pkg?.is_local_sim === true;

  // Check if this is a top-up/extension order
  const webhook = order.webhook_data && typeof order.webhook_data === 'object' 
    ? (order.webhook_data as Record<string, unknown>) : null;
  const isTopUp = 
    (webhook?.isExtension === true) ||
    (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-'));

  // Extract original order UUID for parent navigation (for top-up orders)
  const originalOrderUuid = webhook?.originalOrderId as string | undefined;
  
  // Get latestActivationTime from webhook for local SIMs
  const latestActivationTime = (webhook?.latestActivationTime as string) || 
    ((webhook?.data as Record<string, unknown>)?.orderInfo as Record<string, unknown>)?.latestActivationTime as string | undefined;

  // Check if this is a designated-date activation order
  const isDesignatedDate = webhook?.designated_activate === true;
  const designatedActivationDate = webhook?.activation_date as string | undefined;
  const designatedEndDate = webhook?.activation_end_date as string | undefined;

  // Generate formatted package name based on type
  const getFormattedPackageName = () => {
    if (!pkg) return countryName;
    
    const days = `${pkg.validity_days} Days`;
    
    switch (normalizedPackageType) {
      case 'day_pass':
        return `${days} • ${pkg.data_amount}/day High-Speed`;
      case 'max_speed':
        return `${days} • ${pkg.data_amount} High-Speed`;
      case 'limitless':
        return `${days} • True Unlimited at Max Speed`;
      default:
        return pkg.name || countryName;
    }
  };

  // Short package name for mobile view
  const getShortPackageName = () => {
    if (!pkg) return countryName;
    
    const days = `${pkg.validity_days}D`;
    
    switch (normalizedPackageType) {
      case 'day_pass':
        return `${days} • ${pkg.data_amount}/day`;
      case 'max_speed':
        return `${days} • ${pkg.data_amount}`;
      case 'limitless':
        return `${days} • Unlimited`;
      default:
        return `${days}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6">
      {/* Header: Flag + Country + Package Type + Menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FlagIcon countryCode={countryCode} countryName={countryName} size="lg" className="rounded-lg" />
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-gray-800 text-xl">{countryName}</h2>
            <PackageTypeBadge packageType={normalizedPackageType} size="sm" showTooltip={false} />
            {order.service_tier === 'economy' ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Economy</span>
            ) : (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Priority</span>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>{t('myEsims.viewQrCode')}</DropdownMenuItem>
            <DropdownMenuItem>{t('myEsims.installationGuide')}</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">{t('myEsims.deleteEsim')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Separator */}
      <div className="border-t border-gray-100 mb-5" />
      
      {/* Provider Info + SIM Card Visual */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-lg mb-2">{provider}</h3>
          {isRegionalPackage && regionalData && (
            <div className="mb-2">
              <RegionalCountriesDialog 
                data={regionalData}
                trigger={
                  <Button variant="outline" size="sm" className="h-auto py-1.5 px-3 text-xs rounded-full">
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    View {regionalCountryCount} countries
                  </Button>
                }
              />
            </div>
          )}
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
            <Globe className="w-4 h-4" />
            {/* Short name for mobile */}
            <span className="text-sm underline md:hidden">
              {getShortPackageName()}
            </span>
            {/* Full name for tablet/desktop */}
            <span className="text-sm underline hidden md:inline">
              {getFormattedPackageName()}
            </span>
          </button>
        </div>
        
        {/* Operator SIM Card Visual */}
        <OperatorSimCard 
          carrier={provider}
          countryName={countryName}
          packageType={normalizedPackageType}
          networkType="5G"
        />
      </div>
      
      {/* ICCID Card - Airalo style with label */}
      <div className="mb-5 bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">ICCID</p>
          <span className="text-gray-800 text-sm font-mono">{iccid}</span>
        </div>
        {order.iccid && (
          <button 
            onClick={handleCopyIccid}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {/* Package Details Button - Small white pill */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 h-auto text-sm rounded-full font-semibold"
          onClick={() => setShowPackageDetails(true)}
        >
          <FileText className="w-4 h-4 mr-2" />
          {t('myEsims.packageDetails')}
        </Button>
      </div>
      
      <PackageDetailsModal
        open={showPackageDetails}
        onOpenChange={setShowPackageDetails}
        purchaseDate={order.created_at}
      />
      
      {/* Designated Date Info - show for designated-date packages */}
      {isDesignatedDate && designatedActivationDate && (
        <DesignatedDateInfoCard
          activationDate={designatedActivationDate}
          activationEndDate={designatedEndDate}
          validityDays={validityDays}
          dataAmount={dataAmount}
        />
      )}

      {/* Package info - show real-time usage for completed eSIMs */}
      {order.status === 'completed' ? (
        isNotYetActivated ? (
          /* Not yet activated - show awaiting activation message */
          <div className="mb-2">
            <p className="text-gray-800 font-semibold text-sm mb-3">{t('myEsims.packageStatus') || 'Package Status'}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-blue-700 font-medium">{t('myEsims.awaitingActivation') || 'Awaiting Activation'}</p>
              <p className="text-blue-600 text-sm mt-1">
                {(t('myEsims.installToStart') || 'Install this eSIM to start your {days}-day plan with {data} data')
                  .replace('{days}', String(validityDays))
                  .replace('{data}', dataAmount)}
              </p>
            </div>
          </div>
        ) : isLocalSim ? (
          /* Local SIM - no API tracking available */
          <LocalSimUsageCard 
            packageData={{
              data_amount: dataAmount,
              validity_days: validityDays,
              speed_after_limit: pkg?.speed_after_limit,
              package_type: pkg?.package_type
            }}
            latestActivationTime={latestActivationTime}
            carrier={provider}
          />
        ) : isDayPass && usage ? (
          /* Day Pass specific UI */
          <div className="mb-2">
            <p className="text-gray-800 font-semibold text-sm mb-3">{t('myEsims.remainingPackage')}</p>
            <DayPassUsageCard 
              usage={usage} 
              packageData={{
                package_type: pkg?.package_type,
                daily_reset_amount: pkg?.daily_reset_amount,
                speed_after_limit: pkg?.speed_after_limit,
                validity_days: validityDays
              }}
            />
          </div>
        ) : isLimitless ? (
          /* Limitless plans - show usage + unlimited indicator */
          <div className="mb-2">
            <p className="text-gray-800 font-semibold text-sm mb-3">{t('myEsims.remainingPackage')}</p>
            <div className="flex gap-3">
              {/* Data Used + Unlimited indicator */}
              <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpDown className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 font-semibold text-sm">
                    {usage?.dataUsed || '0 MB'}
                  </span>
                </div>
                <p className="text-green-600 text-xs">
                  {t('myEsims.used')} · {t('myEsims.unlimitedData')}
                </p>
              </div>
              {/* Validity box */}
              <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <UsageProgressBar
                  icon={<Calendar className="w-4 h-4" />}
                  value={expired 
                    ? t('myEsims.expired') 
                    : `${remainingDays ?? validityDays} ${t('myEsims.days')}`
                  }
                  subtitle={expiryDateFormatted 
                    ? `${expired ? t('myEsims.expiredOn') : t('myEsims.expiresOn')}: ${expiryDateFormatted}` 
                    : undefined
                  }
                  percentage={validityPercentage}
                  isLoading={isLoadingUsage}
                  isExpired={expired}
                  showPercentage={true}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Standard usage display for Max Speed plans - Show USED data */
          <div className="mb-2">
            <p className="text-gray-800 font-semibold text-sm mb-3">{t('myEsims.remainingPackage')}</p>
            
            <div className="flex gap-3">
              {/* Data USED box - Primary metric */}
              <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <UsageProgressBar
                  icon={<ArrowUpDown className="w-4 h-4" />}
                  value={usage?.dataUsed || '0 MB'}
                  subtitle={usage?.totalData ? (t('myEsims.ofTotal') || 'of {total}').replace('{total}', usage.totalData) : undefined}
                  percentage={usage?.percentageUsed ?? 0}
                  isLoading={isLoadingUsage}
                  isExpired={expired}
                  showUsed={true}
                  showPercentage={true}
                />
              </div>
              {/* Validity box */}
              <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <UsageProgressBar
                  icon={<Calendar className="w-4 h-4" />}
                  value={expired 
                    ? t('myEsims.expired') 
                    : `${remainingDays ?? validityDays} ${t('myEsims.days')}`
                  }
                  subtitle={expiryDateFormatted 
                    ? `${expired ? t('myEsims.expiredOn') : t('myEsims.expiresOn')}: ${expiryDateFormatted}` 
                    : undefined
                  }
                  percentage={validityPercentage}
                  isLoading={isLoadingUsage}
                  isExpired={expired}
                  showPercentage={true}
                />
              </div>
            </div>
            
            {/* Max Speed packages: data stops when quota exhausted */}
            {normalizedPackageType === 'max_speed' && (
              <p className="text-xs text-gray-400 mt-2">
                {t('myEsims.dataStopsWhenExhausted') || 'Data stops when quota is exhausted. Top up to continue.'}
              </p>
            )}
          </div>
        )
      ) : (
        /* Static package info for pending eSIMs */
        <div className="mb-2">
          <p className="text-gray-800 font-semibold text-sm mb-3">{t('myEsims.package')}</p>
          
          <div className="flex gap-3">
            {/* Data box */}
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">{t('myEsims.data')}</p>
                <p className="text-gray-800 font-semibold text-sm">{dataAmount}</p>
              </div>
            </div>
            {/* Validity box */}
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">{t('myEsims.validity')}</p>
                <p className="text-gray-800 font-semibold text-sm">{validityDays} {t('myEsims.days')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Up Button - Show for activated eSIMs when auto-renewal is OFF, hide for top-ups, local SIMs, and TUGE/DOCOMO */}
      {isInstalled && !autoRenewalEnabled && !expired && !isTopUp && !isLocalSim && pkg?.carrier !== 'DOCOMO' && (
        <Button
          onClick={() => navigate(`/packages?country=${encodeURIComponent(countryName)}&extend=${order.id}&type=${pkg?.package_type || ''}&data=${encodeURIComponent(pkg?.data_amount || '')}&speed=${encodeURIComponent(pkg?.speed_after_limit || '')}`)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl mt-4 disabled:opacity-50"
          disabled={isAdminPreview}
          title={isAdminPreview ? 'Actions disabled in preview mode' : undefined}
        >
          {t('myEsims.topUp')}
        </Button>
      )}
      
      {/* View Parent eSIM link for top-up orders */}
      {isTopUp && originalOrderUuid && (
        <button
          onClick={() => navigate(`/my-esims/${originalOrderUuid}`)}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 hover:underline mt-4"
        >
          {t('myEsims.viewParentEsim')}
        </button>
      )}
    </div>
  );
}
