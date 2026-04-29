import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartnerEarningsReport } from '@/hooks/usePartnerEarningsReport';
import { EarningsHistoryChart } from './EarningsHistoryChart';
import { TierProgressVisualization } from './TierProgressVisualization';
import { ProjectedEarningsCard } from './ProjectedEarningsCard';
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarningsReportTabProps {
  affiliateId: string;
}

export function EarningsReportTab({ affiliateId }: EarningsReportTabProps) {
  const { t, currency, formatPrice } = useLanguage();
  const [timeRange, setTimeRange] = useState(30);
  
  const { 
    dailyEarnings, 
    stats, 
    tiers, 
    currentTier, 
    monthlySales,
    projectedEarnings,
    loading,
    refetch 
  } = usePartnerEarningsReport(affiliateId, timeRange);

  const timeRanges = [
    { value: 7, label: t('affiliateDashboard.earningsReport.7days') },
    { value: 30, label: t('affiliateDashboard.earningsReport.30days') },
    { value: 90, label: t('affiliateDashboard.earningsReport.90days') },
  ];

  const getDisplayAmount = (amount: number) => {
    return currency === 'THB' ? amount * 35 : amount;
  };

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('affiliateDashboard.earningsReport.title')}</h2>
          <p className="text-sm text-gray-600">{t('affiliateDashboard.earningsReport.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  timeRange === range.value 
                    ? "bg-orange-500 text-white" 
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={refetch} className="border-gray-200 hover:bg-gray-50">
            <RefreshCw className={cn("h-4 w-4 text-gray-600", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('affiliateDashboard.earningsReport.thisWeek')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : formatPrice(getDisplayAmount(stats?.thisWeek || 0))}
            </div>
            {stats && stats.weeklyChange !== 0 && (
              <div className={cn(
                "flex items-center text-xs mt-1",
                stats.weeklyChange > 0 ? "text-green-500" : "text-red-500"
              )}>
                {stats.weeklyChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {stats.weeklyChange > 0 ? '+' : ''}{stats.weeklyChange.toFixed(1)}% {t('affiliateDashboard.earningsReport.vsLastWeek')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('affiliateDashboard.earningsReport.thisMonth')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : formatPrice(getDisplayAmount(stats?.thisMonth || 0))}
            </div>
            {stats && stats.monthlyChange !== 0 && (
              <div className={cn(
                "flex items-center text-xs mt-1",
                stats.monthlyChange > 0 ? "text-green-500" : "text-red-500"
              )}>
                {stats.monthlyChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {stats.monthlyChange > 0 ? '+' : ''}{stats.monthlyChange.toFixed(1)}% {t('affiliateDashboard.earningsReport.vsLastMonth')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {t('affiliateDashboard.earningsReport.allTime')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : formatPrice(getDisplayAmount(stats?.allTime || 0))}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {t('affiliateDashboard.earningsReport.totalCommissions')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EarningsHistoryChart data={dailyEarnings} loading={loading} />
        <ProjectedEarningsCard projections={projectedEarnings} loading={loading} />
      </div>

      {/* Tier Progress */}
      <TierProgressVisualization 
        tiers={tiers} 
        currentTier={currentTier} 
        monthlySales={monthlySales}
        loading={loading} 
      />
    </div>
  );
}
