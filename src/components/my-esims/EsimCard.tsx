import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { th, ja, ko, fr, de } from 'date-fns/locale';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Calendar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UsageProgressBar } from './UsageProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { InstallEsimDialog } from './InstallEsimDialog';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { useAdminPreview } from '@/contexts/AdminPreviewContext';
import {
  calculateRemainingDays, 
  calculateValidityPercentage, 
  formatExpiryDate,
  isEsimExpired
} from '@/utils/esimValidity';

type PackageType = 'day_pass' | 'max_speed' | 'limitless';

function normalizePackageType(type?: string | null): PackageType {
  if (!type) return 'day_pass';
  const normalized = type.toLowerCase().replace(/[\s-]/g, '_');
  if (normalized.includes('day') || normalized === 'day_pass') return 'day_pass';
  if (normalized.includes('max') || normalized === 'max_speed') return 'max_speed';
  if (normalized.includes('limit') || normalized === 'limitless') return 'limitless';
  return 'day_pass';
}

// Cached usage type from database
interface CachedUsage {
  // USIMSA fields
  validFrom?: string | null;
  validUntil?: string | null;
  remainingData?: string | null;
  dataUsed?: string | null;
  totalData?: string | null;
  percentageUsed?: number | null;
  remainingDataMb?: number | null;
  usageMb?: number;
  notYetActivated?: boolean;
  // Day Pass fields
  isDayPass?: boolean;
  todayUsedMb?: number;
  todayRemainingMb?: number;
  currentDay?: number;
  totalDays?: number;
  // TUGE-specific fields
  dataUsedMB?: number;
  dataTotalMB?: number;
  percentUsed?: number;
  orderState?: string;
  expireTime?: string;
}

interface EsimCardProps {
  order: {
    id: string;
    order_id: string;
    status: string;
    created_at?: string;
    iccid?: string;
    qr_code?: string;
    smdp_address?: string;
    activation_code?: string;
    download_link?: string;
    cached_usage?: CachedUsage | unknown;
    usage_cached_at?: string | null;
    cached_installation?: Record<string, unknown> | unknown;
    installation_cached_at?: string | null;
    auto_renewal_enabled?: boolean;
    parent_order_id?: string | null;
    webhook_data?: unknown;
    service_tier?: string;
    esim_packages?: {
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
      carrier?: string;
      package_type?: string;
      qos_speed?: string;
      speed_after_limit?: string;
    };
  };
  onClick: () => void;
}

export function EsimCard({ order, onClick }: EsimCardProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const { isAdminPreview } = useAdminPreview();
  const pkg = order.esim_packages;
  const autoRenewalEnabled = order.auto_renewal_enabled ?? false;
  
  // Use cached usage data from database - NO API CALL
  // Cast from Json to CachedUsage type
  const usage = order.cached_usage as CachedUsage | null | undefined;
  
  // Package info
  const dataAmount = pkg?.data_amount || '1 GB';
  const validityDays = pkg?.validity_days || 7;
  const countryCode = pkg?.country_code?.toLowerCase() || undefined;
  const countryName = pkg?.country_name || 'Thailand';
  const provider = pkg?.carrier || pkg?.name?.split(' ')[0] || 'Mobile11';
  
  // Normalize expiry: prefer validUntil, fall back to TUGE's expireTime
  const effectiveValidUntil = usage?.validUntil || usage?.expireTime || null;
  
  // Calculate real-time values from cached usage data
  const remainingDays = effectiveValidUntil 
    ? calculateRemainingDays(effectiveValidUntil) 
    : validityDays;
  
  const expired = effectiveValidUntil ? isEsimExpired(effectiveValidUntil) : false;
  
  const validityPercentage = usage?.validFrom && effectiveValidUntil
    ? calculateValidityPercentage(usage.validFrom, effectiveValidUntil)
    : (order.status === 'completed' ? 100 : 100);
  
  const expiryDateFormatted = effectiveValidUntil 
    ? formatExpiryDate(effectiveValidUntil, language, false, true) // Include time
    : null;
  
  // Data usage calculations - normalize between USIMSA and TUGE cache formats
  // USIMSA uses: dataUsed, totalData, percentageUsed
  // TUGE uses: dataUsedMB, dataTotalMB, percentUsed (also now writes UI-friendly fields)
  const displayDataUsed = usage?.dataUsed 
    || (usage?.dataUsedMB !== undefined ? `${usage.dataUsedMB >= 1024 ? (usage.dataUsedMB / 1024).toFixed(2) + ' GB' : Math.round(usage.dataUsedMB) + ' MB'}` : '0 MB');
  const displayDataTotal = usage?.totalData 
    || (usage?.dataTotalMB !== undefined && usage.dataTotalMB > 0 ? `${usage.dataTotalMB >= 1024 ? (usage.dataTotalMB / 1024).toFixed(2) + ' GB' : Math.round(usage.dataTotalMB) + ' MB'}` : dataAmount);
  const dataPercentageUsed = usage?.percentageUsed ?? usage?.percentUsed ?? 0;
  
  // Determine renewal status (placeholder - would come from order data)
  // Use autoRenewalEnabled from line 76 instead of hardcoded value
  
  // Check if eSIM is newly purchased (not yet activated/installed)
  // "Install/share" should HIDE only when eSIM is ACTIVE (being used)
  // Handles both USIMSA and TUGE provider data formats
  const isNewEsim = (() => {
    // INSTALLATION DATA FALLBACK - if installation check confirmed device is installed
    // This handles cases where cached_usage is null but cached_installation shows the eSIM is on a device
    const installation = order.cached_installation as Record<string, unknown> | null | undefined;
    const installDevice = installation?.device as Record<string, unknown> | null | undefined;
    if (installDevice?.installTime) return false;
    if (installation?.esimState === 'Enable') return false;
    
    // EXPLICIT NOT ACTIVATED FLAG - from either provider (USIMSA or TUGE)
    // This flag is now set by check-esim-usage for TUGE orders with orderState=NOTACTIVE/PENDING
    if (usage?.notYetActivated === true) return true;
    
    // TUGE: Check orderState for NOTACTIVE/PENDING - this takes precedence over expiry dates
    // TUGE pre-calculates expiry dates even for non-activated eSIMs, so we must check orderState first
    if (usage?.orderState && ['NOTACTIVE', 'PENDING', 'CREATED'].includes(usage.orderState.toUpperCase())) return true;
    
    // ACTIVE SIGNALS - if any of these are true, the eSIM is ACTIVE (not new)
    
    // 1. USIMSA: If explicitly not activated = false, it's activated
    if (usage?.notYetActivated === false) return false;
    
    // 2. USIMSA: If there's a validFrom date, it's been activated
    if (usage?.validFrom) return false;
    
    // 3. Data has been used (any provider)
    if (usage?.usageMb && usage.usageMb > 0) return false;
    if (usage?.dataUsedMB && usage.dataUsedMB > 0) return false;
    
    // 4. TUGE: If percentUsed > 0, data has been consumed
    if ((usage?.percentUsed ?? 0) > 0) return false;
    if ((usage?.percentageUsed ?? 0) > 0) return false;
    
    // 5. Expiry is set (means package has started) - but only if orderState check didn't catch it
    if (usage?.expireTime) return false;
    if (usage?.validUntil) return false;
    
    // Default: treat as new (show Install/share button)
    return true;
  })();
  
  // Detect installed-but-not-activated state (3rd state between new and active)
  const isAwaitingActivation = !isNewEsim && (() => {
    const inst = order.cached_installation as Record<string, unknown> | null | undefined;
    const dev = inst?.device as Record<string, unknown> | null | undefined;
    const isInstalled = !!(dev?.installTime) || inst?.esimState === 'Enable';
    if (!isInstalled) return false;

    // If there's actual usage, the eSIM is definitely activated
    if (!usage) return true;
    if ((usage.usageMb ?? 0) > 0) return false;
    if (usage.notYetActivated === true) return true;
    if (usage.orderState && ['NOTACTIVE', 'PENDING', 'CREATED'].includes(usage.orderState.toUpperCase())) return true;
    return false;
  })();

  const packageType = normalizePackageType(pkg?.package_type);

  // Check if this is a top-up/extension order
  const webhook = order.webhook_data && typeof order.webhook_data === 'object' 
    ? (order.webhook_data as Record<string, unknown>) : null;
  const isTopUp = 
    (webhook?.isExtension === true) ||
    (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-'));


  // Generate short package name for list view
  const getShortPackageName = () => {
    if (!pkg) return null;
    const validity = `${pkg.validity_days}D`;
    switch (packageType) {
      case 'day_pass':
        return `${pkg.data_amount}/day • ${validity}`;
      case 'max_speed':
        return `${pkg.data_amount} • ${validity}`;
      case 'limitless':
        return `Unlimited • ${validity}`;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 flex flex-col h-full">
      {/* Header: Flag + Country + Provider */}
      <div className="flex items-center gap-3 mb-2">
        <FlagIcon countryCode={countryCode} countryName={countryName} size="lg" className="rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-base truncate">{countryName}</h3>
            {order.service_tier === 'economy' && (
              <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">
                Economy
              </span>
            )}
            {isTopUp && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full shrink-0">
                {t('myEsims.topUpBadge')}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm truncate">{provider}</p>
          {getShortPackageName() && (
            <p className="text-gray-400 text-xs truncate">{getShortPackageName()}</p>
          )}
          {order.created_at && (
            <p className="text-gray-400 text-xs mt-0.5">
              {(() => {
                const localeMap: Record<string, typeof th> = { th, ja, ko, fr, de };
                const d = new Date(order.created_at);
                return format(d, 'MMM d, yyyy', { locale: localeMap[language] });
              })()}
            </p>
          )}
        </div>
      </div>
      
      {/* Package Type Badge - Full width row */}
      <div className="mb-4">
        <PackageTypeBadge packageType={packageType} size="sm" showTooltip={false} />
      </div>
      
      {/* Separator */}
      <div className="border-t border-gray-100 mb-4" />
      
      {/* Package Info Section */}
      <div className="mb-4">
        <p className="text-gray-700 font-semibold text-sm mb-3">
          {(isNewEsim || isAwaitingActivation) ? t('myEsims.package') : t('myEsims.remainingPackage')}
        </p>
        
        {isAwaitingActivation && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-700 text-xs font-medium">
              {t('myEsims.awaitingActivation')}
            </span>
          </div>
        )}
        
        {(isNewEsim || isAwaitingActivation) ? (
          /* New or awaiting activation eSIM: Show static package info without progress bars */
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{t('myEsims.data')}</span>
              </div>
              <p className="text-gray-800 font-semibold">{dataAmount}</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('myEsims.validity')}</span>
              </div>
              <p className="text-gray-800 font-semibold">{validityDays} {t('myEsims.days')}</p>
            </div>
          </div>
        ) : (
          /* Activated eSIM: Show usage progress bars using cached data */
          <div className="flex gap-4">
            {/* For Limitless packages - simplified display matching UsageProgressBar structure */}
            {packageType === 'limitless' ? (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-500"><ArrowUpDown className="w-4 h-4" /></span>
                  <span className="font-semibold text-sm text-green-700">{t('myEsims.unlimited')}</span>
                </div>
                <div className="h-1.5 bg-green-100 rounded-full overflow-hidden max-w-[120px]">
                  <div className="h-full rounded-full bg-green-500 w-full" />
                </div>
              </div>
            ) : (
              <UsageProgressBar
                icon={<ArrowUpDown className="w-4 h-4" />}
                value={displayDataUsed}
                subtitle={`of ${displayDataTotal}`}
                percentage={dataPercentageUsed}
                isLoading={false}
                isExpired={expired}
                showUsed={true}
              />
            )}
            <UsageProgressBar
              icon={<Calendar className="w-4 h-4" />}
              value={expired 
                ? t('myEsims.expired') 
                : `${remainingDays ?? validityDays} ${t('myEsims.daysLeft')}`
              }
              percentage={validityPercentage}
              isLoading={false}
              isExpired={expired}
            />
          </div>
        )}
      </div>
      
      {/* Renewals Row - Hide for top-up orders */}
      {!isTopUp && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700 text-sm">{t('myEsims.renewals')}</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${autoRenewalEnabled ? 'bg-orange-500' : 'bg-gray-300'}`} />
            <span className="text-gray-600 text-sm">{autoRenewalEnabled ? t('myEsims.on') : t('myEsims.off')}</span>
          </div>
        </div>
      )}
      
      {/* Buttons */}
      {isTopUp ? (
        /* Top-up order: View details only */
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onClick}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
          >
            {t('myEsims.viewDetails')}
          </Button>
        </div>
      ) : isAwaitingActivation ? (
        /* Installed but not activated: View details only */
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onClick}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
          >
            {t('myEsims.viewDetails')}
          </Button>
        </div>
      ) : isNewEsim ? (
        /* New eSIM: Show View details + Install or share buttons */
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onClick}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
          >
            {t('myEsims.viewDetails')}
          </Button>
          <Button 
            onClick={() => setInstallDialogOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            disabled={isAdminPreview}
            title={isAdminPreview ? 'Actions disabled in preview mode' : undefined}
          >
            {t('myEsims.installOrShare')}
          </Button>
        </div>
      ) : (
        /* Activated eSIM: Show View details + Top up (if auto-renewal off) */
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onClick}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
          >
            {t('myEsims.viewDetails')}
          </Button>
          {!autoRenewalEnabled && !expired && pkg?.carrier !== 'DOCOMO' && (
            <Button 
              onClick={() => navigate(`/packages?country=${encodeURIComponent(pkg?.country_name || '')}&extend=${order.id}&type=${pkg?.package_type || ''}&data=${encodeURIComponent(pkg?.data_amount || '')}&speed=${encodeURIComponent((pkg as any)?.qos_speed || (pkg as any)?.speed_after_limit || '')}`)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              disabled={isAdminPreview}
              title={isAdminPreview ? 'Actions disabled in preview mode' : undefined}
            >
              {t('myEsims.topUp')}
            </Button>
          )}
        </div>
      )}

      {/* Install eSIM Dialog */}
      <InstallEsimDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        order={order}
      />
    </div>
  );
}
