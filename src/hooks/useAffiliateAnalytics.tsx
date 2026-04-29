import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateMetrics {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  approvedCommissions: number;
}

interface TierDistribution {
  tier: string;
  count: number;
  color: string;
}

interface TopPerformer {
  id: string;
  affiliateCode: string;
  companyName: string | null;
  tier: string;
  monthlySales: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  commissions: number;
}

interface CommissionBreakdown {
  pending: number;
  approved: number;
  paid: number;
}

export function useAffiliateAnalytics(timeRange: number = 30) {
  const [metrics, setMetrics] = useState<AffiliateMetrics | null>(null);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState<CommissionBreakdown>({ pending: 0, approved: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  const tierColors: Record<string, string> = {
    starter: '#6B7280',
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      // Fetch all affiliates
      const { data: affiliates } = await supabase
        .from('affiliates')
        .select('*');

      // Fetch clicks in time range
      const { data: clicks } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .gte('clicked_at', startDate.toISOString());

      // Fetch conversions in time range
      const { data: conversions } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .gte('converted_at', startDate.toISOString());

      // Fetch payouts
      const { data: payouts } = await supabase
        .from('affiliate_payouts')
        .select('*');

      // Calculate metrics
      const totalAffiliates = affiliates?.length || 0;
      const activeAffiliates = affiliates?.filter(a => a.status === 'active').length || 0;
      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      
      const paidConversions = conversions?.filter(c => c.status === 'paid') || [];
      const approvedConversions = conversions?.filter(c => c.status === 'approved') || [];
      const pendingConversions = conversions?.filter(c => c.status === 'pending') || [];

      const totalCommissionsPaid = paidConversions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const pendingCommissions = pendingConversions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const approvedCommissions = approvedConversions.reduce((sum, c) => sum + Number(c.commission_amount), 0);

      setMetrics({
        totalAffiliates,
        activeAffiliates,
        totalClicks,
        totalConversions,
        conversionRate,
        totalCommissionsPaid,
        pendingCommissions,
        approvedCommissions,
      });

      // Calculate tier distribution
      const tierCounts: Record<string, number> = {};
      affiliates?.forEach(a => {
        const tier = a.current_volume_tier || 'starter';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      });

      setTierDistribution(
        Object.entries(tierCounts).map(([tier, count]) => ({
          tier: tier.charAt(0).toUpperCase() + tier.slice(1),
          count,
          color: tierColors[tier] || '#6B7280',
        }))
      );

      // Calculate top performers
      const performerMap: Record<string, TopPerformer> = {};
      affiliates?.forEach(a => {
        performerMap[a.id] = {
          id: a.id,
          affiliateCode: a.affiliate_code,
          companyName: a.company_name,
          tier: a.current_volume_tier || 'starter',
          monthlySales: a.monthly_sales_count || 0,
          totalRevenue: 0,
          totalCommission: Number(a.total_earnings) || 0,
          conversionRate: 0,
        };
      });

      conversions?.forEach(c => {
        if (performerMap[c.affiliate_id]) {
          performerMap[c.affiliate_id].totalRevenue += Number(c.order_amount);
        }
      });

      // Calculate conversion rates per affiliate
      const clicksByAffiliate: Record<string, number> = {};
      const conversionsByAffiliate: Record<string, number> = {};
      
      clicks?.forEach(c => {
        clicksByAffiliate[c.affiliate_id] = (clicksByAffiliate[c.affiliate_id] || 0) + 1;
      });
      
      conversions?.forEach(c => {
        conversionsByAffiliate[c.affiliate_id] = (conversionsByAffiliate[c.affiliate_id] || 0) + 1;
      });

      Object.keys(performerMap).forEach(id => {
        const clickCount = clicksByAffiliate[id] || 0;
        const convCount = conversionsByAffiliate[id] || 0;
        performerMap[id].conversionRate = clickCount > 0 ? (convCount / clickCount) * 100 : 0;
      });

      const sortedPerformers = Object.values(performerMap)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      setTopPerformers(sortedPerformers);

      // Calculate revenue trends by date
      const trendMap: Record<string, { revenue: number; commissions: number }> = {};
      
      for (let i = 0; i < timeRange; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (timeRange - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        trendMap[dateStr] = { revenue: 0, commissions: 0 };
      }

      conversions?.forEach(c => {
        const dateStr = c.converted_at.split('T')[0];
        if (trendMap[dateStr]) {
          trendMap[dateStr].revenue += Number(c.order_amount);
          trendMap[dateStr].commissions += Number(c.commission_amount);
        }
      });

      setRevenueTrends(
        Object.entries(trendMap).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          commissions: data.commissions,
        }))
      );

      // Commission breakdown
      setCommissionBreakdown({
        pending: pendingCommissions,
        approved: approvedCommissions,
        paid: totalCommissionsPaid,
      });

    } catch (error) {
      console.error('Error fetching affiliate analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    tierDistribution,
    topPerformers,
    revenueTrends,
    commissionBreakdown,
    loading,
    refetch: fetchAnalytics,
  };
}
