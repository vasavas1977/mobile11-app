import { useState } from 'react';
import { useAffiliateAnalytics } from '@/hooks/useAffiliateAnalytics';
import { AffiliateMetricsCards } from './affiliate-analytics/AffiliateMetricsCards';
import { AffiliateTierDistribution } from './affiliate-analytics/AffiliateTierDistribution';
import { AffiliateRevenueTrend } from './affiliate-analytics/AffiliateRevenueTrend';
import { TopPerformersTable } from './affiliate-analytics/TopPerformersTable';
import { CommissionAnalytics } from './affiliate-analytics/CommissionAnalytics';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';

export function AdminAffiliateAnalytics() {
  const [timeRange, setTimeRange] = useState(30);
  const { 
    metrics, 
    tierDistribution, 
    topPerformers, 
    revenueTrends, 
    commissionBreakdown, 
    loading, 
    refetch 
  } = useAffiliateAnalytics(timeRange);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Affiliate Analytics</h2>
          <p className="text-muted-foreground">Monitor affiliate partner performance and commissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <AffiliateMetricsCards metrics={metrics} loading={loading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AffiliateRevenueTrend data={revenueTrends} loading={loading} />
        </div>
        <div>
          <AffiliateTierDistribution data={tierDistribution} loading={loading} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopPerformersTable performers={topPerformers} loading={loading} />
        </div>
        <div>
          <CommissionAnalytics breakdown={commissionBreakdown} loading={loading} />
        </div>
      </div>
    </div>
  );
}
