import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Hourglass, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PackageHistoryListProps {
  iccid: string | null;
}

interface PackageData {
  id: string;
  order_id: string;
  created_at: string;
  status: string;
  cached_usage: { 
    validUntil?: string | null; 
    validFrom?: string | null;
    activeTime?: string | null;
    percentageUsed?: number | null;
    remainingDataMb?: number | null;
    remainingData?: string | null;
  } | null;
  esim_packages: {
    data_amount: string;
    validity_days: number;
    name: string;
    package_type: string | null;
    short_name: string | null;
    daily_reset_amount: string | null;
  } | null;
}

type PackageStatus = 'active' | 'queued' | 'inactive_expired' | 'inactive_exhausted';

// Helper to get correct data display based on package type
const getDataDisplay = (esimPkg: PackageData['esim_packages']): string => {
  if (!esimPkg) return '-';
  
  // Day Pass: Use short_name (e.g., "2GB/day") or format daily_reset_amount
  if (esimPkg.package_type === 'day_pass') {
    return esimPkg.short_name || `${esimPkg.daily_reset_amount}/day`;
  }
  
  // Other package types: Use data_amount directly
  return esimPkg.data_amount || '-';
};

// Helper to parse data string to MB
const parseDataToMb = (dataStr: string | null | undefined): number | null => {
  if (!dataStr) return null;
  
  const match = dataStr.match(/^([\d.]+)\s*(GB|MB|TB)/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case 'TB': return value * 1024 * 1024;
    case 'GB': return value * 1024;
    case 'MB': return value;
    default: return null;
  }
};

// Check if package is exhausted (data used up)
const isPackageExhausted = (usage: PackageData['cached_usage']): boolean => {
  if (!usage) return false;
  
  // Check percentageUsed >= 100
  if (typeof usage.percentageUsed === 'number' && usage.percentageUsed >= 100) {
    return true;
  }
  
  // Check remainingDataMb === 0
  if (typeof usage.remainingDataMb === 'number' && usage.remainingDataMb === 0) {
    return true;
  }
  
  // Check remainingData parses to 0
  const remainingMb = parseDataToMb(usage.remainingData);
  if (remainingMb !== null && remainingMb === 0) {
    return true;
  }
  
  return false;
};

// Check if package is expired
const isPackageExpired = (usage: PackageData['cached_usage']): boolean => {
  if (!usage?.validUntil) return false;
  return new Date(usage.validUntil) <= new Date();
};

// Check if package has activation data
const hasActivationData = (usage: PackageData['cached_usage']): boolean => {
  if (!usage) return false;
  return !!(usage.validFrom || usage.activeTime);
};

// Compute all package statuses using FIFO chain logic
export const computePackageStatuses = (packages: PackageData[]): Map<string, PackageStatus> => {
  const statusMap = new Map<string, PackageStatus>();
  
  if (!packages || packages.length === 0) return statusMap;
  
  // Sort by created_at ASC (oldest first) for FIFO processing
  const sortedPackages = [...packages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // First pass: determine if each package is inactive (expired or exhausted)
  const inactiveStatus = new Map<string, 'inactive_expired' | 'inactive_exhausted' | null>();
  
  for (const pkg of sortedPackages) {
    const usage = pkg.cached_usage;
    
    if (isPackageExpired(usage)) {
      inactiveStatus.set(pkg.id, 'inactive_expired');
    } else if (isPackageExhausted(usage)) {
      inactiveStatus.set(pkg.id, 'inactive_exhausted');
    } else {
      inactiveStatus.set(pkg.id, null);
    }
  }
  
  // Second pass: find the first non-inactive package (this is the active one)
  let activePackageId: string | null = null;
  
  // Check if any package has activation data
  const anyHasActivation = sortedPackages.some(p => hasActivationData(p.cached_usage));
  
  if (anyHasActivation) {
    // Use activation-based logic: find packages with activation data
    for (const pkg of sortedPackages) {
      const usage = pkg.cached_usage;
      const inactive = inactiveStatus.get(pkg.id);
      
      if (hasActivationData(usage) && !inactive) {
        // Has activation and is not inactive -> this is active
        activePackageId = pkg.id;
        break;
      }
    }
    
    // If no active found with activation data, check if we have a non-activated, non-inactive package
    if (!activePackageId) {
      for (const pkg of sortedPackages) {
        const inactive = inactiveStatus.get(pkg.id);
        if (!inactive) {
          activePackageId = pkg.id;
          break;
        }
      }
    }
  } else {
    // No activation data anywhere - use pure FIFO, skipping exhausted/expired
    for (const pkg of sortedPackages) {
      const inactive = inactiveStatus.get(pkg.id);
      if (!inactive) {
        activePackageId = pkg.id;
        break;
      }
    }
  }
  
  // Third pass: assign final statuses
  let foundActive = false;
  
  for (const pkg of sortedPackages) {
    const inactive = inactiveStatus.get(pkg.id);
    
    if (inactive) {
      // Already determined as inactive
      statusMap.set(pkg.id, inactive);
    } else if (pkg.id === activePackageId) {
      statusMap.set(pkg.id, 'active');
      foundActive = true;
    } else if (foundActive) {
      // After the active package, everything is queued
      statusMap.set(pkg.id, 'queued');
    } else {
      // Before the active package but not inactive - shouldn't happen, but treat as queued
      statusMap.set(pkg.id, 'queued');
    }
  }
  
  return statusMap;
};

// Find the currently active package from a list
export const findActivePackage = (packages: PackageData[]): PackageData | null => {
  if (!packages || packages.length === 0) return null;
  
  const statusMap = computePackageStatuses(packages);
  
  for (const pkg of packages) {
    if (statusMap.get(pkg.id) === 'active') {
      return pkg;
    }
  }
  
  return null;
};

export function PackageHistoryList({ iccid }: PackageHistoryListProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: packages, isLoading } = useQuery({
    queryKey: ['package-history', iccid],
    queryFn: async () => {
      if (!iccid) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_id,
          created_at,
          status,
          cached_usage,
          esim_packages:package_id (
            data_amount,
            validity_days,
            name,
            package_type,
            short_name,
            daily_reset_amount
          )
        `)
        .eq('iccid', iccid)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PackageData[];
    },
    enabled: !!iccid
  });

  // Compute statuses for all packages
  const statusMap = packages ? computePackageStatuses(packages) : new Map<string, PackageStatus>();

  // Refresh all package usage data
  const handleRefresh = async () => {
    if (!packages || packages.length === 0) return;
    
    setIsRefreshing(true);
    
    try {
      // Refresh each package sequentially to avoid rate limits
      for (const pkg of packages) {
        await supabase.functions.invoke('check-esim-usage', {
          body: { orderId: pkg.id, forceRefresh: true }
        });
      }
      
      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['package-history', iccid] });
      await queryClient.invalidateQueries({ queryKey: ['esim-all-packages', iccid] });
      
      toast.success(t('myEsims.refreshSuccess') || 'Package status refreshed');
    } catch (error) {
      console.error('Error refreshing package status:', error);
      toast.error(t('myEsims.refreshError') || 'Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="text-gray-600 text-sm">
        {t('myEsims.noPackageHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('myEsims.refreshing') || 'Refreshing...' : t('myEsims.refresh') || 'Refresh'}
        </Button>
      </div>
      
      {packages.map((pkg) => {
        const status = statusMap.get(pkg.id) || 'queued';
        const esimPkg = pkg.esim_packages;
        const validityDays = esimPkg?.validity_days || 0;
        const dataDisplay = getDataDisplay(esimPkg);
        const createdDate = new Date(pkg.created_at);
        
        return (
          <div 
            key={pkg.id}
            className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-semibold text-gray-800">
                  {validityDays} {t('myEsims.days')}
                </div>
                <div className="text-gray-600 text-sm">
                  {dataDisplay}
                </div>
              </div>
              
              <div className="text-right space-y-1">
                {status === 'active' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('myEsims.active')}
                  </span>
                )}
                {status === 'queued' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    <Hourglass className="w-3 h-3" />
                    {t('myEsims.queued')}
                  </span>
                )}
                {status === 'inactive_expired' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    <Clock className="w-3 h-3" />
                    {t('myEsims.expired') || t('myEsims.inactive')}
                  </span>
                )}
                {status === 'inactive_exhausted' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    {t('myEsims.exhausted') || t('myEsims.inactive')}
                  </span>
                )}
                <div className="text-gray-500 text-xs">
                  {format(createdDate, 'MMM d, yyyy')}
                </div>
                <div className="text-gray-400 text-xs">
                  {format(createdDate, 'HH:mm')} (GMT)
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
