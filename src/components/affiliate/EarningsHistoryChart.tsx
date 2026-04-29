import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { DailyEarning } from '@/hooks/usePartnerEarningsReport';
import { Loader2 } from 'lucide-react';

interface EarningsHistoryChartProps {
  data: DailyEarning[];
  loading: boolean;
}

export function EarningsHistoryChart({ data, loading }: EarningsHistoryChartProps) {
  const { t, currency, formatPrice } = useLanguage();

  // Format data for display
  const chartData = data.map(d => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    displayAmount: currency === 'THB' ? d.amount * 35 : d.amount
  }));

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('affiliateDashboard.earningsReport.commissionTrend')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">{t('affiliateDashboard.earningsReport.commissionTrend')}</CardTitle>
        <CardDescription className="text-gray-600">{t('affiliateDashboard.earningsReport.commissionTrendDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${currency === 'THB' ? '฿' : '$'}${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#111827' }}
                formatter={(value: number) => [
                  formatPrice(value),
                  t('affiliateDashboard.earningsReport.commission')
                ]}
              />
              <Area
                type="monotone"
                dataKey="displayAmount"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#earningsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
