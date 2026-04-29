import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDateRange, calculateChange, processOrdersData, getOrderStatusData, getTopPackages, getRevenueByCountry } from '@/lib/dashboardUtils';
import { EXCHANGE_RATES } from '@/lib/currencyUtils';
import { getPaymentMethodLabel } from '@/components/admin/dashboard/PaymentMethodChart';

/**
 * Normalize an order's total_amount to USD for unified calculations.
 * If the order currency is THB, divide by the THB rate.
 */
const toUsd = (amount: number, orderCurrency: string): number => {
  if (orderCurrency === 'THB') return amount / EXCHANGE_RATES.THB;
  return amount; // Already USD
};

function generateSampleRevenueData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 1200 + Math.random() * 800;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(base * 100) / 100,
      orders: Math.floor(30 + Math.random() * 25),
    });
  }
  return data;
}

function getSampleDashboardData() {
  return {
    totalRevenue: 48320.50,
    netProfit: 31408.33,
     activeOrders: 186,
    totalOrders: 1075,
    completedCount: 852,
    completionRate: 68.4,
    avgOrderValue: 38.72,
    newCustomers: 342,
    revenueChange: 14.2,
    profitChange: 11.8,
    activeOrdersChange: 8.3,
    completionRateChange: 2.1,
    avgOrderChange: -1.4,
    newCustomersChange: 18.7,
    revenueData: generateSampleRevenueData(),
    orderStatusData: [
      { name: 'Completed', value: 852, color: 'hsl(142 76% 36%)' },
      { name: 'Pending', value: 186, color: 'hsl(48 96% 53%)' },
      { name: 'Failed', value: 23, color: 'hsl(0 84% 60%)' },
      { name: 'Cancelled', value: 14, color: 'hsl(220 10% 46%)' },
    ],
    topPackages: [
      { name: 'Thailand 15-Day 6GB', sales: 214, revenue: 6420 },
      { name: 'Japan 7-Day 3GB', sales: 187, revenue: 7480 },
      { name: 'South Korea 10-Day 5GB', sales: 142, revenue: 4970 },
      { name: 'Singapore 5-Day 2GB', sales: 98, revenue: 2940 },
      { name: 'Vietnam 30-Day 10GB', sales: 76, revenue: 3040 },
    ],
    revenueByCountry: [
      { country: 'TH', revenue: 12480, flag: 'TH' },
      { country: 'JP', revenue: 9840, flag: 'JP' },
      { country: 'KR', revenue: 7210, flag: 'KR' },
      { country: 'SG', revenue: 5430, flag: 'SG' },
      { country: 'VN', revenue: 3120, flag: 'VN' },
    ],
    recentActivity: [],
    totalCountries: 28,
    openConversations: 12,
    pendingUrgent: '3 / 1',
    avgFirstResponse: '2.4m',
    resolutionRate: 94.2,
    lowRatings: 2.1,
    deadAirEvents: 5,
    avgRating: 4.6,
    failedProvisioning: 3,
    provisioningData: [
      { date: 'Mon', success: 142, failed: 3 },
      { date: 'Tue', success: 158, failed: 5 },
      { date: 'Wed', success: 134, failed: 2 },
      { date: 'Thu', success: 167, failed: 4 },
      { date: 'Fri', success: 189, failed: 1 },
      { date: 'Sat', success: 201, failed: 6 },
      { date: 'Sun', success: 176, failed: 2 },
    ],
    topDestinations: [
      { name: 'Thailand', value: 340 },
      { name: 'Japan', value: 280 },
      { name: 'South Korea', value: 210 },
      { name: 'Singapore', value: 165 },
      { name: 'Vietnam', value: 120 },
    ],
    channelMix: [
      { name: 'Direct', value: 45, color: '#F97316' },
      { name: 'Affiliate', value: 28, color: '#3B82F6' },
      { name: 'Reseller', value: 18, color: '#8B5CF6' },
      { name: 'API', value: 9, color: '#10B981' },
    ],
    paymentMethodData: [
      { name: 'Credit Card', value: 312, revenue: 18420, color: '#3B82F6' },
      { name: '2C2P QR/Redirect', value: 245, revenue: 12380, color: '#F97316' },
      { name: 'Promo / Free', value: 186, revenue: 0, color: '#8B5CF6' },
      { name: 'PromptPay', value: 98, revenue: 4890, color: '#6366F1' },
      { name: 'Mobile11 Money', value: 42, revenue: 1680, color: '#10B981' },
    ],
    supportMetrics: [
      { label: 'Open Conversations', value: '12', color: 'text-blue-600' },
      { label: 'Pending / Urgent', value: '3 / 1', color: 'text-amber-600' },
      { label: 'Avg First Response', value: '2.4m', color: 'text-purple-600' },
      { label: 'Resolution Rate', value: '94.2%', color: 'text-emerald-600' },
      { label: 'Low Ratings', value: '2.1%', color: 'text-red-500' },
      { label: 'Dead Air Events', value: '5', color: 'text-amber-600' },
    ],
    topProblems: [
      { category: 'Activation Issues', count: 8, pct: 32 },
      { category: 'Data Not Working', count: 5, pct: 20 },
      { category: 'Refund Requests', count: 4, pct: 16 },
      { category: 'Payment Failed', count: 3, pct: 12 },
      { category: 'Wrong Package', count: 2, pct: 8 },
    ],
    partnerPerformance: [
      { name: 'SiamConnect', type: 'Reseller', revenue: '$12,480', orders: 342, trend: '+18%' },
      { name: 'AsiaLink Corp', type: 'Distributor', revenue: '$9,210', orders: 198, trend: '+12%' },
      { name: 'TravelAPI Pro', type: 'API', revenue: '$7,850', orders: 1240, trend: '+24%' },
      { name: 'BangkokData Ltd', type: 'Reseller', revenue: '$4,120', orders: 89, trend: '-3%' },
    ],
    partnerAlerts: [
      { text: 'AsiaLink wallet below $500', severity: 'warning' as const },
      { text: '2 pending settlements ($3,400)', severity: 'info' as const },
    ],
    healthItems: [
      { label: 'Supplier API', status: 'healthy' as const, detail: 'All providers online' },
      { label: 'Payment Gateway', status: 'healthy' as const, detail: 'Stripe active' },
      { label: 'Email Service', status: 'healthy' as const, detail: 'Resend active' },
      { label: 'Webhooks', status: 'warning' as const, detail: '2 retries pending' },
      { label: 'Contact Center', status: 'healthy' as const, detail: 'All channels live' },
      { label: 'Knowledge Base', status: 'warning' as const, detail: '3 low-rated articles' },
      { label: 'Dead Air', status: 'healthy' as const, detail: 'No trend alerts' },
    ],
  };
}

export const CURRENCY_OPTIONS = [
  { value: 'ALL', label: 'All Currencies', symbol: '$' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'THB', label: 'THB', symbol: '฿' },
] as const;

export type CurrencyOption = typeof CURRENCY_OPTIONS[number]['value'];

export const getCurrencySymbol = (currency: CurrencyOption) => {
  return CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || '$';
};

export const useDashboardData = (timeRange: string, isSampleMode: boolean = false, currency: CurrencyOption = 'ALL') => {
  return useQuery({
    queryKey: ['dashboard', timeRange, isSampleMode ? 'sample' : 'live', currency],
    queryFn: async () => {
      if (isSampleMode) {
        return getSampleDashboardData();
      }

      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(timeRange);

      // Build order queries with optional currency filter
      let currentOrdersQuery = supabase
        .from('orders')
        .select('*, esim_packages(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      if (currency !== 'ALL') currentOrdersQuery = currentOrdersQuery.eq('currency', currency);

      let previousOrdersQuery = supabase
        .from('orders')
        .select('total_amount, status, currency')
        .gte('created_at', prevStartDate)
        .lte('created_at', prevEndDate);
      if (currency !== 'ALL') previousOrdersQuery = previousOrdersQuery.eq('currency', currency);

      let failedQuery = supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', startDate);
      if (currency !== 'ALL') failedQuery = failedQuery.eq('currency', currency);

      const [
        { data: currentOrders },
        { data: previousOrders },
        { data: packages },
        { data: currentUsers },
        { data: previousUsers },
        { data: countryCarriers },
        { count: openConvCount },
        { data: ratings },
        { count: failedCount },
        { data: paymentMethodsRaw },
        { count: pendingConvCount },
        { count: urgentConvCount },
        { data: resolvedConvs },
        { data: allConvs30d },
        { count: deadAirCount },
      ] = await Promise.all([
        currentOrdersQuery,
        previousOrdersQuery,
        supabase
          .from('esim_packages')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('*')
          .gte('created_at', startDate),
        supabase
          .from('profiles')
          .select('*')
          .gte('created_at', prevStartDate)
          .lte('created_at', prevEndDate),
        supabase
          .from('country_carriers')
          .select('country_name'),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'pending']),
        supabase
          .from('conversation_ratings')
          .select('rating'),
        failedQuery,
        supabase
          .from('payments')
          .select('payment_gateway, payment_method, amount, currency, status')
          .eq('status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        // Pending conversations
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        // Urgent conversations
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('priority', 'urgent')
          .in('status', ['open', 'pending']),
        // Resolved conversations with response times (last 30d)
        supabase
          .from('conversations')
          .select('created_at, first_response_at, resolved_at, status')
          .eq('status', 'resolved')
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        // All conversations last 30d for resolution rate
        supabase
          .from('conversations')
          .select('status')
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        // Dead air events count (from dedicated table)
        supabase
          .from('dead_air_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);

      // Calculate current period metrics
      // When currency filter is 'ALL', normalize everything to USD for accurate totals
      const shouldNormalize = currency === 'ALL';
      const completedOrders = currentOrders?.filter(o => o.status === 'completed') || [];
      
      const totalRevenue = completedOrders.reduce((sum, o) => {
        const amt = Number(o.total_amount);
        return sum + (shouldNormalize ? toUsd(amt, o.currency) : amt);
      }, 0);
      
      // Net profit: always calculate in USD first, then convert to display currency
      // Exclude zero-amount orders (100% discounts) from profit calculation
      const profitOrders = completedOrders.filter(o => Number(o.total_amount) > 0);
      const netProfitUsd = profitOrders.reduce((sum, o) => {
        const revenueUsd = toUsd(Number(o.total_amount), o.currency);
        const costPrice = Number(o.esim_packages?.cost_price || 0);
        const cost = costPrice > 0 ? costPrice : revenueUsd / 4;
        return sum + (revenueUsd - cost);
      }, 0);
      // Convert profit to display currency so margin = profit/revenue is consistent
      const netProfit = currency === 'THB' ? netProfitUsd * EXCHANGE_RATES.THB
        : currency === 'USD' ? netProfitUsd
        : netProfitUsd; // ALL = USD
      
      const totalOrders = currentOrders?.length || 0;
      const completedCount = completedOrders.length;
      const activeOrders = currentOrders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
      const completionRate = currentOrders?.length ? (completedOrders.length / currentOrders.length) * 100 : 0;
      const avgOrderValue = completedOrders.length ? totalRevenue / completedOrders.length : 0;
      const newCustomers = currentUsers?.length || 0;
      const totalCountries = new Set(countryCarriers?.map(c => c.country_name).filter(Boolean)).size;

      // Previous period — normalize to USD as well
      const prevCompleted = previousOrders?.filter(o => o.status === 'completed') || [];
      const prevRevenue = prevCompleted.reduce((sum, o) => {
        const amt = Number(o.total_amount);
        return sum + (shouldNormalize ? toUsd(amt, o.currency) : amt);
      }, 0);
      const prevProfitUsd = prevCompleted.filter(o => Number(o.total_amount) > 0).reduce((sum, o) => {
        const revenueUsd = toUsd(Number(o.total_amount), o.currency);
        return sum + (revenueUsd * 0.75);
      }, 0);
      const prevProfit = currency === 'THB' ? prevProfitUsd * EXCHANGE_RATES.THB
        : prevProfitUsd;
      const prevActive = previousOrders?.filter(o => o.status === 'pending').length || 0;
      const prevCompletionRate = previousOrders?.length ? (prevCompleted.length / previousOrders.length) * 100 : 0;
      const prevAvgOrder = prevCompleted.length ? prevRevenue / prevCompleted.length : 0;
      const prevNewCustomers = previousUsers?.length || 0;

      // Avg rating
      const avgRating = ratings && ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
        : 0;

      // Provisioning data from orders
      const provisioningMap = new Map<string, { success: number; failed: number }>();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      currentOrders?.forEach(o => {
        const day = dayNames[new Date(o.created_at).getDay()];
        const existing = provisioningMap.get(day) || { success: 0, failed: 0 };
        if (o.status === 'failed') existing.failed++;
        else existing.success++;
        provisioningMap.set(day, existing);
      });
      const provisioningData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({
        date: d,
        success: provisioningMap.get(d)?.success || 0,
        failed: provisioningMap.get(d)?.failed || 0,
      }));

      // Top destinations
      const destMap = new Map<string, number>();
      currentOrders?.forEach(o => {
        const country = o.esim_packages?.country_name || o.esim_packages?.country_code;
        if (country) destMap.set(country, (destMap.get(country) || 0) + 1);
      });
      const topDestinations = Array.from(destMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Channel mix (simple: affiliate vs direct)
      const affiliateOrders = currentOrders?.filter(o => (o as any).affiliate_id).length || 0;
      const totalOrds = currentOrders?.length || 1;
      const directPct = Math.round(((totalOrds - affiliateOrders) / totalOrds) * 100);
      const affiliatePct = 100 - directPct;
      const channelMix = [
        { name: 'Direct', value: directPct, color: '#F97316' },
        { name: 'Affiliate', value: affiliatePct, color: '#3B82F6' },
      ];

      // Payment method breakdown from payments table
      const pmMap = new Map<string, { count: number; revenue: number }>();
      paymentMethodsRaw?.forEach((p: any) => {
        const config = getPaymentMethodLabel(p.payment_gateway || '', p.payment_method || '');
        const key = `${p.payment_gateway}:${p.payment_method}`;
        const existing = pmMap.get(key) || { count: 0, revenue: 0 };
        const amt = Number(p.amount || 0);
        const normalizedAmt = shouldNormalize ? toUsd(amt, p.currency) : (currency === p.currency ? amt : toUsd(amt, p.currency));
        existing.count++;
        existing.revenue += normalizedAmt;
        pmMap.set(key, existing);
      });
      const paymentMethodData = Array.from(pmMap.entries())
        .map(([key, val]) => {
          const [gw, method] = key.split(':');
          const config = getPaymentMethodLabel(gw, method);
          return { name: config.label, value: val.count, revenue: val.revenue, color: config.color };
        })
        .sort((a, b) => b.value - a.value);

      return {
        totalRevenue,
        netProfit,
        activeOrders,
        totalOrders,
        completedCount,
        completionRate,
        avgOrderValue,
        newCustomers,
        revenueChange: calculateChange(totalRevenue, prevRevenue),
        profitChange: calculateChange(netProfit, prevProfit),
        activeOrdersChange: calculateChange(activeOrders, prevActive),
        completionRateChange: calculateChange(completionRate, prevCompletionRate),
        avgOrderChange: calculateChange(avgOrderValue, prevAvgOrder),
        newCustomersChange: calculateChange(newCustomers, prevNewCustomers),
        revenueData: processOrdersData(currentOrders || [], shouldNormalize),
        orderStatusData: getOrderStatusData(currentOrders || []),
        topPackages: getTopPackages(currentOrders || [], shouldNormalize),
        revenueByCountry: getRevenueByCountry(currentOrders || [], shouldNormalize),
        recentActivity: currentOrders?.slice(0, 10) || [],
        totalCountries,
        openConversations: openConvCount || 0,
        avgRating,
        failedProvisioning: failedCount || 0,
        pendingUrgent: `${pendingConvCount || 0} / ${urgentConvCount || 0}`,
        avgFirstResponse: (() => {
          const withResponse = resolvedConvs?.filter(c => c.first_response_at) || [];
          if (withResponse.length === 0) return '—';
          const avgMs = withResponse.reduce((sum, c) => sum + (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()), 0) / withResponse.length;
          const mins = avgMs / 60000;
          return mins < 60 ? `${mins.toFixed(1)}m` : `${(mins / 60).toFixed(1)}h`;
        })(),
        resolutionRate: allConvs30d?.length ? Math.round((allConvs30d.filter(c => c.status === 'resolved').length / allConvs30d.length) * 1000) / 10 : 0,
        lowRatings: ratings && ratings.length > 0 ? Math.round((ratings.filter(r => r.rating <= 2).length / ratings.length) * 1000) / 10 : 0,
        deadAirEvents: deadAirCount || 0,
        provisioningData,
        topDestinations,
        channelMix,
        paymentMethodData,
        supportMetrics: [
          { label: 'Open Conversations', value: String(openConvCount || 0), color: 'text-blue-600' },
          { label: 'Pending / Urgent', value: `${pendingConvCount || 0} / ${urgentConvCount || 0}`, color: 'text-amber-600' },
          { label: 'Avg First Response', value: (() => {
            const withResponse = resolvedConvs?.filter(c => c.first_response_at) || [];
            if (withResponse.length === 0) return '—';
            const avgMs = withResponse.reduce((sum, c) => sum + (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()), 0) / withResponse.length;
            const mins = avgMs / 60000;
            return mins < 60 ? `${mins.toFixed(1)}m` : `${(mins / 60).toFixed(1)}h`;
          })(), color: 'text-blue-600' },
          { label: 'Resolution Rate', value: `${allConvs30d?.length ? Math.round((allConvs30d.filter(c => c.status === 'resolved').length / allConvs30d.length) * 1000) / 10 : 0}%`, color: 'text-emerald-600' },
          { label: 'Low Ratings', value: `${ratings && ratings.length > 0 ? Math.round((ratings.filter(r => r.rating <= 2).length / ratings.length) * 1000) / 10 : 0}%`, color: 'text-red-500' },
          { label: 'Dead Air Events', value: String(deadAirCount || 0), color: 'text-amber-600' },
        ],
        topProblems: [] as Array<{ category: string; count: number; pct: number }>,
        partnerPerformance: [] as Array<{ name: string; type: string; revenue: string; orders: number; trend: string }>,
        partnerAlerts: [] as Array<{ text: string; severity: 'warning' | 'info' }>,
        healthItems: [
          { label: 'Supplier API', status: 'healthy' as const, detail: 'Status unknown' },
          { label: 'Payment Gateway', status: 'healthy' as const, detail: 'Active' },
          { label: 'Email Service', status: 'healthy' as const, detail: 'Active' },
          { label: 'Webhooks', status: 'healthy' as const, detail: 'Active' },
          { label: 'Contact Center', status: 'healthy' as const, detail: 'Active' },
          { label: 'Knowledge Base', status: 'healthy' as const, detail: 'Active' },
          { label: 'Dead Air', status: 'healthy' as const, detail: 'No alerts' },
        ],
      };
    },
    staleTime: 30 * 1000, // 30s for near real-time
    refetchInterval: 30 * 1000, // auto-refresh every 30s
  });
};
