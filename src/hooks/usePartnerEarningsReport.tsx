import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyEarning {
  date: string;
  amount: number;
  count: number;
}

export interface EarningsStats {
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  weeklyChange: number;
  monthlyChange: number;
}

export interface TierInfo {
  tierName: string;
  tierOrder: number;
  minSales: number;
  maxSales: number | null;
  commissionRate: number;
  badgeColor: string;
}

export interface ProjectedEarnings {
  currentMonthlyRate: number;
  projectedAtNextTier: number;
  nextTierName: string;
  daysUntilNextTier: number | null;
  averageOrderValue: number;
  averageDailyCommission: number;
}

export function usePartnerEarningsReport(affiliateId: string | null, timeRange: number = 30) {
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('starter');
  const [monthlySales, setMonthlySales] = useState<number>(0);
  const [projectedEarnings, setProjectedEarnings] = useState<ProjectedEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (affiliateId) {
      fetchEarningsData();
    }
  }, [affiliateId, timeRange]);

  const fetchEarningsData = async () => {
    if (!affiliateId) return;
    
    setLoading(true);
    try {
      // Fetch affiliate info
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('current_volume_tier, monthly_sales_count, total_earnings')
        .eq('id', affiliateId)
        .single();

      if (affiliateData) {
        setCurrentTier(affiliateData.current_volume_tier || 'starter');
        setMonthlySales(affiliateData.monthly_sales_count || 0);
      }

      // Fetch tier configuration
      const { data: tierData } = await supabase
        .from('affiliate_tier_config')
        .select('*')
        .order('tier_order', { ascending: true });

      if (tierData) {
        setTiers(tierData.map(t => ({
          tierName: t.tier_name,
          tierOrder: t.tier_order,
          minSales: t.min_sales,
          maxSales: t.max_sales,
          commissionRate: Number(t.commission_rate),
          badgeColor: t.badge_color
        })));
      }

      // Fetch conversions for the time period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      
      const { data: conversions } = await supabase
        .from('affiliate_conversions')
        .select('converted_at, commission_amount, order_amount, status')
        .eq('affiliate_id', affiliateId)
        .gte('converted_at', startDate.toISOString())
        .order('converted_at', { ascending: true });

      // Calculate daily earnings
      const dailyMap = new Map<string, { amount: number; count: number }>();
      
      // Initialize all days in range
      for (let i = 0; i < timeRange; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (timeRange - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { amount: 0, count: 0 });
      }

      // Fill in actual data
      conversions?.forEach(conv => {
        const dateStr = conv.converted_at.split('T')[0];
        const existing = dailyMap.get(dateStr) || { amount: 0, count: 0 };
        dailyMap.set(dateStr, {
          amount: existing.amount + Number(conv.commission_amount),
          count: existing.count + 1
        });
      });

      const dailyData: DailyEarning[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count
      }));

      setDailyEarnings(dailyData);

      // Calculate stats
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - 7);
      const thisMonthStart = new Date(now);
      thisMonthStart.setDate(now.getDate() - 30);
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 14);
      const lastMonthStart = new Date(now);
      lastMonthStart.setDate(now.getDate() - 60);

      let thisWeek = 0, lastWeek = 0, thisMonth = 0, lastMonth = 0, allTime = 0;

      conversions?.forEach(conv => {
        const convDate = new Date(conv.converted_at);
        const amount = Number(conv.commission_amount);
        
        allTime += amount;
        
        if (convDate >= thisWeekStart) {
          thisWeek += amount;
        } else if (convDate >= lastWeekStart) {
          lastWeek += amount;
        }
        
        if (convDate >= thisMonthStart) {
          thisMonth += amount;
        } else if (convDate >= lastMonthStart) {
          lastMonth += amount;
        }
      });

      // Get all-time from affiliate data
      const totalAllTime = affiliateData?.total_earnings || allTime;

      setStats({
        thisWeek,
        thisMonth,
        allTime: totalAllTime,
        weeklyChange: lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0,
        monthlyChange: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
      });

      // Calculate projections
      const avgDailyCommission = thisMonth / 30;
      const avgOrderValue = conversions && conversions.length > 0 
        ? conversions.reduce((sum, c) => sum + Number(c.order_amount), 0) / conversions.length 
        : 0;
      
      // Find next tier
      const currentTierInfo = tierData?.find(t => t.tier_name === (affiliateData?.current_volume_tier || 'starter'));
      const nextTierInfo = tierData?.find(t => t.tier_order === (currentTierInfo?.tier_order || 0) + 1);
      
      const salesToNextTier = nextTierInfo 
        ? nextTierInfo.min_sales - (affiliateData?.monthly_sales_count || 0)
        : null;
      
      const avgDailySales = (affiliateData?.monthly_sales_count || 0) / 30;
      const daysUntilNextTier = salesToNextTier && avgDailySales > 0 
        ? Math.ceil(salesToNextTier / avgDailySales)
        : null;

      // Project earnings at next tier
      const nextTierRate = nextTierInfo?.commission_rate || currentTierInfo?.commission_rate || 8;
      const projectedAtNextTier = avgDailyCommission * 30 * (nextTierRate / (currentTierInfo?.commission_rate || 8));

      setProjectedEarnings({
        currentMonthlyRate: avgDailyCommission * 30,
        projectedAtNextTier,
        nextTierName: nextTierInfo?.tier_name || 'Maximum',
        daysUntilNextTier,
        averageOrderValue: avgOrderValue,
        averageDailyCommission: avgDailyCommission
      });

    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    dailyEarnings,
    stats,
    tiers,
    currentTier,
    monthlySales,
    projectedEarnings,
    loading,
    refetch: fetchEarningsData
  };
}
