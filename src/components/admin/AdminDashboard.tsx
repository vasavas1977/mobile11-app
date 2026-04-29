import { useState } from "react";
import { MetricCard } from "./analytics/MetricCard";
import { OperationalHealth } from "./dashboard/OperationalHealth";
import { SalesCharts } from "./dashboard/SalesCharts";
import { SupportQuality } from "./dashboard/SupportQuality";
import { PartnerPerformance } from "./dashboard/PartnerPerformance";
import { ActionCenter } from "./dashboard/ActionCenter";
import { TopPackagesTable } from "./dashboard/TopPackagesTable";
import { LivePaymentFeed } from "./dashboard/LivePaymentFeed";
import { PaymentMethodChart } from "./dashboard/PaymentMethodChart";
import { AdminActivityLogs } from "./AdminActivityLogs";
import { useDashboardData, CURRENCY_OPTIONS, getCurrencySymbol, CurrencyOption } from "@/hooks/useDashboardData";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { PartnerDataModeToggle } from "@/components/admin/partners/PartnerDataModeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Smartphone,
  Users,
  BarChart3,
  MessageSquare,
  Star,
  AlertTriangle,
  Percent,
  Globe,
} from "lucide-react";

export function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [currency, setCurrency] = useState<CurrencyOption>('ALL');
  const { isSampleMode } = usePartnerDataMode();
  const { data, isLoading } = useDashboardData(timeRange, isSampleMode, currency);
  const sym = getCurrencySymbol(currency);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const grossMargin = data.totalRevenue > 0 
    ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
            Command Center
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-0.5">
            Executive overview — eSIM operations, support & partnerships
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PartnerDataModeToggle />
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyOption)}>
            <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl border-[#F3F0EB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.symbol} {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl border-[#F3F0EB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TOP KPI ROW — 5 cols on desktop, 2 on mobile */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title="Gross Revenue"
          value={`${sym}${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={data.revenueChange}
          changeLabel="vs prev"
          icon={DollarSign}
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Net Revenue"
          value={`${sym}${data.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={data.profitChange}
          changeLabel="vs prev"
          icon={TrendingUp}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Gross Margin"
          value={`${grossMargin}%`}
          icon={Percent}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Total Orders"
          value={data.totalOrders}
          change={data.activeOrdersChange}
          changeLabel="vs prev"
          icon={ShoppingCart}
          iconColor="text-orange-600"
        />
        <MetricCard
          title="Active eSIMs"
          value={data.completedCount}
          icon={Smartphone}
          iconColor="text-emerald-600"
        />
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Active Users"
          value={data.newCustomers}
          change={data.newCustomersChange}
          changeLabel="vs prev"
          icon={Users}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.completionRate.toFixed(1)}%`}
          change={data.completionRateChange}
          changeLabel="vs prev"
          icon={BarChart3}
          iconColor="text-orange-500"
        />
        <MetricCard
          title="Open Conversations"
          value={data.openConversations}
          icon={MessageSquare}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Avg Rating"
          value={data.avgRating}
          icon={Star}
          iconColor="text-orange-600"
        />
        <MetricCard
          title="Failed Provisioning"
          value={data.failedProvisioning}
          icon={AlertTriangle}
          iconColor="text-orange-600"
        />
        <MetricCard
          title="Total Countries"
          value={data.totalCountries}
          icon={Globe}
          iconColor="text-emerald-600"
        />
      </div>

      {/* Operational Health */}
      <OperationalHealth items={data.healthItems} />

      {/* Sales & Operations Charts */}
      <SalesCharts
        revenueData={data.revenueData}
        provisioningData={data.provisioningData}
        topDestinations={data.topDestinations}
        channelMix={data.channelMix}
      />

      {/* Support & Quality + Partner Performance */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SupportQuality metrics={data.supportMetrics} topProblems={data.topProblems} />
        <PartnerPerformance partners={data.partnerPerformance} alerts={data.partnerAlerts} />
      </div>

      {/* Action Center */}
      <ActionCenter />

      {/* Payment Tracking: Live Feed + Method Breakdown */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LivePaymentFeed />
        </div>
        <div className="lg:col-span-1">
          <PaymentMethodChart data={data.paymentMethodData || []} currencySymbol={sym} />
        </div>
        <div className="lg:col-span-1">
          <AdminActivityLogs />
        </div>
      </div>

      {/* Bottom: Top Packages */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-5">
          <TopPackagesTable packages={data.topPackages} />
        </div>
      </div>
    </div>
  );
}
