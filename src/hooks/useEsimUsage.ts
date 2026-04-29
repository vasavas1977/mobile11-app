import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EsimUsage {
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  remainingData: string | null;
  dataUsed: string | null;
  totalData: string | null;
  percentageUsed: number | null;
  remainingDataMb: number | null;
  usageMb?: number;
  // Not yet activated flag (TUGE: orderState=NOTACTIVE/PENDING, USIMSA: notYetActivated)
  notYetActivated?: boolean;
  // Day Pass specific fields
  isDayPass?: boolean;
  dailyAllowance?: string;
  dailyAllowanceMb?: number;
  todayUsedMb?: number;
  todayRemainingMb?: number;
  currentDay?: number;
  totalDays?: number;
  nextResetTime?: string | null;
  secondsUntilReset?: number;
  speedStatus?: 'high-speed' | 'throttled';
  fallbackSpeed?: string;
  // TUGE-specific fields (for backward compat / fallback)
  expireTime?: string | null;
  activeTime?: string | null;
  daysRemaining?: number | null;
  orderState?: string | null;
}

export function useEsimUsage(orderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['esim-usage', orderId],
    queryFn: async (): Promise<EsimUsage | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase.functions.invoke('check-esim-usage', {
        body: { orderId }
      });

      if (error) {
        console.error('Error fetching eSIM usage:', error);
        return null;
      }

      return data?.usage || null;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - shorter to pick up cron updates
    gcTime: 30 * 60 * 1000, // Keep in garbage collection cache for 30 minutes
    refetchOnWindowFocus: true, // Refetch when tab regains focus to get fresh data
    refetchOnMount: 'always', // Always check if stale on mount
    refetchOnReconnect: false, // Don't refetch on network reconnect
    enabled: !!orderId && enabled,
    retry: 1,
  });
}
