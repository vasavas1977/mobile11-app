import { EXCHANGE_RATES } from '@/lib/currencyUtils';

/** Normalize an amount to USD based on order currency */
const toUsd = (amount: number, currency: string): number => {
  if (currency === 'THB') return amount / EXCHANGE_RATES.THB;
  return amount;
};

export interface DashboardData {
  totalRevenue: number;
  netProfit: number;
  activeOrders: number;
  completionRate: number;
  avgOrderValue: number;
  newCustomers: number;
  revenueChange: number;
  profitChange: number;
  activeOrdersChange: number;
  completionRateChange: number;
  avgOrderChange: number;
  newCustomersChange: number;
  revenueData: Array<{ date: string; revenue: number; orders: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  topPackages: Array<{ name: string; sales: number; revenue: number }>;
  revenueByCountry: Array<{ country: string; revenue: number; flag: string }>;
  recentActivity: Array<any>;
}

export const getDateRange = (timeRange: string) => {
  const now = new Date();
  let startDate = new Date();
  let prevStartDate = new Date();
  let prevEndDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(now.getDate() - 14);
      prevEndDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      prevStartDate.setDate(now.getDate() - 60);
      prevEndDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      prevStartDate.setDate(now.getDate() - 180);
      prevEndDate.setDate(now.getDate() - 90);
      break;
    default: // 'all'
      startDate = new Date(0);
      prevStartDate = new Date(0);
      prevEndDate = new Date(0);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    prevStartDate: prevStartDate.toISOString(),
    prevEndDate: prevEndDate.toISOString(),
  };
};

export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const processOrdersData = (orders: any[], normalizeCurrency = false): DashboardData['revenueData'] => {
  const dailyData = new Map<string, { revenue: number; orders: number }>();

  orders.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = dailyData.get(date) || { revenue: 0, orders: 0 };
    const amt = Number(order.total_amount);
    dailyData.set(date, {
      revenue: existing.revenue + (normalizeCurrency ? toUsd(amt, order.currency) : amt),
      orders: existing.orders + 1,
    });
  });

  return Array.from(dailyData.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
};

export const getOrderStatusData = (orders: any[]) => {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return [
    { name: 'Completed', value: statusCounts.completed || 0, color: 'hsl(142 76% 36%)' },
    { name: 'Pending', value: statusCounts.pending || 0, color: 'hsl(48 96% 53%)' },
    { name: 'Failed', value: statusCounts.failed || 0, color: 'hsl(0 84% 60%)' },
    { name: 'Cancelled', value: statusCounts.cancelled || 0, color: 'hsl(220 10% 46%)' },
  ].filter(item => item.value > 0);
};

export const getTopPackages = (orders: any[], normalizeCurrency = false) => {
  const completedOrders = orders.filter(o => o.status === 'completed');
  const packageStats = new Map<string, { name: string; sales: number; revenue: number }>();

  completedOrders.forEach(order => {
    if (order.esim_packages) {
      const pkg = order.esim_packages;
      const existing = packageStats.get(pkg.id) || { name: pkg.name, sales: 0, revenue: 0 };
      const amt = Number(order.total_amount);
      packageStats.set(pkg.id, {
        name: pkg.name,
        sales: existing.sales + 1,
        revenue: existing.revenue + (normalizeCurrency ? toUsd(amt, order.currency) : amt),
      });
    }
  });

  return Array.from(packageStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
};

export const getRevenueByCountry = (orders: any[], normalizeCurrency = false) => {
  const completedOrders = orders.filter(o => o.status === 'completed');
  const countryRevenue = new Map<string, number>();

  completedOrders.forEach(order => {
    if (order.esim_packages?.country_code) {
      const country = order.esim_packages.country_code;
      const existing = countryRevenue.get(country) || 0;
      const amt = Number(order.total_amount);
      countryRevenue.set(country, existing + (normalizeCurrency ? toUsd(amt, order.currency) : amt));
    }
  });

  return Array.from(countryRevenue.entries())
    .map(([country, revenue]) => ({
      country,
      revenue,
      flag: country,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
};
