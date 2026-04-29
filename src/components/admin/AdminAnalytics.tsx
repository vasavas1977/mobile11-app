import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Target, 
  Percent,
  Repeat,
  MapPin,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MetricCard } from './analytics/MetricCard';
import { ProfitChart } from './analytics/ProfitChart';
import { OrderFunnel } from './analytics/OrderFunnel';
import { PackagePerformanceTable } from './analytics/PackagePerformanceTable';
import { CustomerInsights } from './analytics/CustomerInsights';
import { PromoCodePerformance } from './analytics/PromoCodePerformance';
import { RevenueByCountry } from './analytics/RevenueByCountry';
import DestinationAnalytics from './analytics/DestinationAnalytics';
import { AdminAffiliateAnalytics } from './AdminAffiliateAnalytics';
import { AdminJourneyAnalytics } from './AdminJourneyAnalytics';

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    netProfit: number;
    profitMargin: number;
    completedOrders: number;
    conversionRate: number;
    avgOrderValue: number;
    customerRetention: number;
    previousRevenue: number;
    previousOrders: number;
  };
  profitData: Array<{ date: string; revenue: number; profit: number }>;
  orderFunnel: {
    completed: { count: number; revenue: number };
    processing: { count: number; revenue: number };
    failed: { count: number; revenue: number };
    cancelled: { count: number; revenue: number };
  };
  packagePerformance: Array<{
    name: string;
    orders: number;
    revenue: number;
    profit: number;
    profitMargin: number;
    avgPrice: number;
  }>;
  customerInsights: {
    data: Array<{ date: string; newCustomers: number; returningCustomers: number }>;
    stats: {
      totalCustomers: number;
      repeatCustomers: number;
      avgOrdersPerCustomer: number;
      retentionRate: number;
    };
  };
  promoPerformance: Array<{
    code: string;
    uses: number;
    revenue: number;
    discountGiven: number;
    netRevenue: number;
    roi: number;
  }>;
  revenueByCountry: Array<{
    country: string;
    revenue: number;
    orders: number;
    profitMargin: number;
  }>;
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      const prevStartDate = new Date();
      const prevEndDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          prevStartDate.setDate(endDate.getDate() - 14);
          prevEndDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          prevStartDate.setDate(endDate.getDate() - 60);
          prevEndDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          prevStartDate.setDate(endDate.getDate() - 180);
          prevEndDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          prevStartDate.setFullYear(endDate.getFullYear() - 2);
          prevEndDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch current period orders with packages
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages (name, country_name, cost_price),
          promo_codes (code)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Fetch previous period for comparison
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

      const processedData = processAnalyticsData(orders || [], prevOrders || []);
      setAnalytics(processedData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (orders: any[], prevOrders: any[]): AnalyticsData => {
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const totalCost = orders.reduce((sum, o) => {
      const costPrice = parseFloat(o.esim_packages?.cost_price || 0);
      return sum + costPrice;
    }, 0);
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const allOrders = orders.length;
    const failedOrders = orders.filter(o => o.status === 'failed').length;
    const conversionRate = allOrders > 0 ? (completedOrders / (completedOrders + failedOrders)) * 100 : 0;
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Previous period comparison
    const previousRevenue = prevOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const previousCompletedOrders = prevOrders.filter(o => o.status === 'completed').length;

    // Customer insights
    const customerOrdersMap = new Map<string, number>();
    orders.forEach(o => {
      const count = customerOrdersMap.get(o.user_id) || 0;
      customerOrdersMap.set(o.user_id, count + 1);
    });
    const totalCustomers = customerOrdersMap.size;
    const repeatCustomers = Array.from(customerOrdersMap.values()).filter(count => count > 1).length;
    const avgOrdersPerCustomer = totalCustomers > 0 ? allOrders / totalCustomers : 0;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Daily profit data for chart
    const dailyData: Array<{ date: string; revenue: number; profit: number }> = [];
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 30 : 12;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(o => o.created_at.split('T')[0] === dateStr);
      const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const dayCost = dayOrders.reduce((sum, o) => sum + parseFloat(o.esim_packages?.cost_price || 0), 0);
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        profit: dayRevenue - dayCost
      });
    }

    // Order funnel
    const orderFunnel = {
      completed: {
        count: orders.filter(o => o.status === 'completed').length,
        revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      },
      processing: {
        count: orders.filter(o => o.status === 'processing' || o.status === 'pending').length,
        revenue: orders.filter(o => o.status === 'processing' || o.status === 'pending').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      },
      failed: {
        count: orders.filter(o => o.status === 'failed').length,
        revenue: orders.filter(o => o.status === 'failed').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      },
      cancelled: {
        count: orders.filter(o => o.status === 'cancelled').length,
        revenue: orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      }
    };

    // Package performance
    const packageMap = new Map<string, any>();
    orders.forEach(o => {
      if (o.esim_packages?.name) {
        const pkg = packageMap.get(o.esim_packages.name) || {
          name: o.esim_packages.name,
          orders: 0,
          revenue: 0,
          cost: 0
        };
        pkg.orders++;
        pkg.revenue += parseFloat(o.total_amount || 0);
        pkg.cost += parseFloat(o.esim_packages.cost_price || 0);
        packageMap.set(o.esim_packages.name, pkg);
      }
    });

    const packagePerformance = Array.from(packageMap.values())
      .map(pkg => ({
        name: pkg.name,
        orders: pkg.orders,
        revenue: pkg.revenue,
        profit: pkg.revenue - pkg.cost,
        profitMargin: pkg.revenue > 0 ? ((pkg.revenue - pkg.cost) / pkg.revenue) * 100 : 0,
        avgPrice: pkg.orders > 0 ? pkg.revenue / pkg.orders : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Customer acquisition by day
    const customerAcquisition = dailyData.map(day => {
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return orderDate === day.date;
      });
      
      const dayCustomers = new Set(dayOrders.map(o => o.user_id));
      const newCustomers = Array.from(dayCustomers).filter(userId => {
        const userOrders = orders.filter(o => o.user_id === userId);
        const firstOrder = userOrders.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0];
        return firstOrder && new Date(firstOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day.date;
      }).length;
      
      return {
        date: day.date,
        newCustomers,
        returningCustomers: dayCustomers.size - newCustomers
      };
    });

    // Promo code performance
    const promoMap = new Map<string, any>();
    orders.forEach(o => {
      if (o.promo_codes?.code) {
        const promo = promoMap.get(o.promo_codes.code) || {
          code: o.promo_codes.code,
          uses: 0,
          revenue: 0,
          discountGiven: 0
        };
        promo.uses++;
        promo.revenue += parseFloat(o.total_amount || 0);
        promo.discountGiven += parseFloat(o.discount_amount || 0);
        promoMap.set(o.promo_codes.code, promo);
      }
    });

    const promoPerformance = Array.from(promoMap.values())
      .map(promo => ({
        code: promo.code,
        uses: promo.uses,
        revenue: promo.revenue,
        discountGiven: promo.discountGiven,
        netRevenue: promo.revenue - promo.discountGiven,
        roi: promo.discountGiven > 0 ? ((promo.revenue - promo.discountGiven) / promo.discountGiven) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by country
    const countryMap = new Map<string, any>();
    orders.forEach(o => {
      if (o.esim_packages?.country_name) {
        const country = countryMap.get(o.esim_packages.country_name) || {
          country: o.esim_packages.country_name,
          revenue: 0,
          cost: 0,
          orders: 0
        };
        country.revenue += parseFloat(o.total_amount || 0);
        country.cost += parseFloat(o.esim_packages.cost_price || 0);
        country.orders++;
        countryMap.set(o.esim_packages.country_name, country);
      }
    });

    const revenueByCountry = Array.from(countryMap.values())
      .map(c => ({
        country: c.country,
        revenue: c.revenue,
        orders: c.orders,
        profitMargin: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      metrics: {
        totalRevenue,
        netProfit,
        profitMargin,
        completedOrders,
        conversionRate,
        avgOrderValue,
        customerRetention: retentionRate,
        previousRevenue,
        previousOrders: previousCompletedOrders
      },
      profitData: dailyData,
      orderFunnel,
      packagePerformance,
      customerInsights: {
        data: customerAcquisition,
        stats: {
          totalCustomers,
          repeatCustomers,
          avgOrdersPerCustomer,
          retentionRate
        }
      },
      promoPerformance,
      revenueByCountry
    };
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 bg-muted rounded animate-pulse"></div>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const revenueChange = analytics.metrics.previousRevenue > 0 
    ? ((analytics.metrics.totalRevenue - analytics.metrics.previousRevenue) / analytics.metrics.previousRevenue) * 100 
    : 0;
  
  const ordersChange = analytics.metrics.previousOrders > 0 
    ? ((analytics.metrics.completedOrders - analytics.metrics.previousOrders) / analytics.metrics.previousOrders) * 100 
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your business performance and insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="gap-2">
            <Users className="h-4 w-4" />
            Affiliates
          </TabsTrigger>
          <TabsTrigger value="destinations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Destinations
          </TabsTrigger>
          <TabsTrigger value="journey" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Customer Journey
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Enhanced KPI Metrics */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              title="Total Revenue"
              value={`$${analytics.metrics.totalRevenue.toFixed(2)}`}
              change={revenueChange}
              changeLabel="vs previous period"
              icon={DollarSign}
              iconColor="text-primary"
            />
            <MetricCard
              title="Net Profit"
              value={`$${analytics.metrics.netProfit.toFixed(2)}`}
              icon={TrendingUp}
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              title="Profit Margin"
              value={`${analytics.metrics.profitMargin.toFixed(1)}%`}
              icon={Percent}
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              title="Completed Orders"
              value={analytics.metrics.completedOrders}
              change={ordersChange}
              changeLabel="vs previous period"
              icon={ShoppingBag}
              iconColor="text-primary"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${analytics.metrics.conversionRate.toFixed(1)}%`}
              icon={Target}
              iconColor="text-accent"
            />
            <MetricCard
              title="Customer Retention"
              value={`${analytics.metrics.customerRetention.toFixed(1)}%`}
              icon={Repeat}
              iconColor="text-accent"
            />
          </div>

          {/* Revenue & Profitability */}
          <div className="grid gap-6 md:grid-cols-2">
            <ProfitChart data={analytics.profitData} />
            <OrderFunnel data={analytics.orderFunnel} />
          </div>

          {/* Customer Insights */}
          <CustomerInsights 
            data={analytics.customerInsights.data}
            stats={analytics.customerInsights.stats}
          />

          {/* Geographic Performance */}
          <RevenueByCountry data={analytics.revenueByCountry} />

          {/* Package Performance */}
          <PackagePerformanceTable data={analytics.packagePerformance} />

          {/* Promo Code Performance */}
          {analytics.promoPerformance.length > 0 && (
            <PromoCodePerformance data={analytics.promoPerformance} />
          )}
        </TabsContent>

        <TabsContent value="affiliates">
          <AdminAffiliateAnalytics />
        </TabsContent>

        <TabsContent value="destinations">
          <DestinationAnalytics />
        </TabsContent>

        <TabsContent value="journey">
          <AdminJourneyAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}