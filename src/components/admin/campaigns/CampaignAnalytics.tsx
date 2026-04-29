import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, TrendingUp, TrendingDown, Eye, MousePointer, ShoppingCart, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { USD_TO_THB_RATE } from '@/lib/currencyUtils';

interface CampaignAnalyticsProps {
  campaignId: string;
  onBack: () => void;
}

interface AnalyticsData {
  campaign: any;
  totals: {
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
    discount_given: number;
  };
  daily: {
    date: string;
    views: number;
    clicks: number;
    conversions: number;
  }[];
  promo_performance: {
    code: string;
    uses: number;
    revenue: number;
    discount: number;
  }[];
}

export function CampaignAnalytics({ campaignId, onBack }: CampaignAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysBack = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), daysBack)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      // Fetch campaign details
      const { data: campaign } = await supabase
        .from('promo_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      // Fetch analytics events
      const { data: events } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Fetch linked promo codes
      const { data: linkedCodes } = await supabase
        .from('campaign_promo_codes')
        .select('promo_code_id, promo_codes(id, code)')
        .eq('campaign_id', campaignId);

      const promoCodeIds = linkedCodes?.map(lc => lc.promo_code_id) || [];

      // Fetch orders directly for accurate revenue/discount data
      let promoPerformance: any[] = [];
      if (promoCodeIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('promo_code_id, total_amount, discount_amount, currency')
          .in('promo_code_id', promoCodeIds)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        // Group by promo code with currency conversion to USD
        const usageMap = new Map<string, { uses: number; revenue: number; discount: number }>();
        orders?.forEach(order => {
          const promoCodeId = order.promo_code_id as string;
          const existing = usageMap.get(promoCodeId) || { uses: 0, revenue: 0, discount: 0 };
          
          // Convert THB to USD if needed
          const isThb = order.currency === 'THB';
          const revenueUsd = isThb 
            ? (order.total_amount || 0) / USD_TO_THB_RATE 
            : (order.total_amount || 0);
          const discountUsd = isThb 
            ? (order.discount_amount || 0) / USD_TO_THB_RATE 
            : (order.discount_amount || 0);
          
          usageMap.set(promoCodeId, {
            uses: existing.uses + 1,
            revenue: existing.revenue + revenueUsd,
            discount: existing.discount + discountUsd,
          });
        });

        promoPerformance = linkedCodes?.map(lc => {
          const stats = usageMap.get(lc.promo_code_id) || { uses: 0, revenue: 0, discount: 0 };
          return {
            code: (lc.promo_codes as any)?.code || 'Unknown',
            ...stats,
          };
        }) || [];
      }

      // Calculate totals
      const views = events?.filter(e => e.event_type === 'view').length || 0;
      const clicks = events?.filter(e => e.event_type === 'click').length || 0;
      const conversions = events?.filter(e => e.event_type === 'conversion').length || 0;
      const revenue = promoPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const discount_given = promoPerformance.reduce((sum, p) => sum + p.discount, 0);

      // Group by day for chart
      const dailyMap = new Map<string, { views: number; clicks: number; conversions: number }>();
      events?.forEach(e => {
        const day = format(new Date(e.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(day) || { views: 0, clicks: 0, conversions: 0 };
        if (e.event_type === 'view') existing.views++;
        if (e.event_type === 'click') existing.clicks++;
        if (e.event_type === 'conversion') existing.conversions++;
        dailyMap.set(day, existing);
      });

      const daily = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData({
        campaign,
        totals: { views, clicks, conversions, revenue, discount_given },
        daily,
        promo_performance: promoPerformance,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  const ctr = data.totals.views > 0 
    ? ((data.totals.clicks / data.totals.views) * 100).toFixed(2) 
    : '0.00';
  const conversionRate = data.totals.clicks > 0 
    ? ((data.totals.conversions / data.totals.clicks) * 100).toFixed(2) 
    : '0.00';
  const roi = data.totals.discount_given > 0 
    ? (((data.totals.revenue - data.totals.discount_given) / data.totals.discount_given) * 100).toFixed(0) 
    : '∞';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{data.campaign?.name}</h2>
            <p className="text-sm text-muted-foreground">Campaign Analytics</p>
          </div>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <div className="text-2xl font-bold">{data.totals.views.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clicks</span>
            </div>
            <div className="text-2xl font-bold">{data.totals.clicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">CTR</span>
            </div>
            <div className="text-2xl font-bold">{ctr}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conversions</span>
            </div>
            <div className="text-2xl font-bold">{data.totals.conversions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <div className="text-2xl font-bold">${data.totals.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">ROI</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{roi}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Code Performance */}
      {data.promo_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Promo Code Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promo Code</TableHead>
                  <TableHead className="text-right">Uses</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Discount Given</TableHead>
                  <TableHead className="text-right">Net Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.promo_performance.map((promo) => (
                  <TableRow key={promo.code}>
                    <TableCell>
                      <Badge variant="secondary">{promo.code}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{promo.uses}</TableCell>
                    <TableCell className="text-right">${promo.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      -${promo.discount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(promo.revenue - promo.discount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Daily Breakdown */}
      {data.daily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daily.slice(-10).reverse().map((day) => (
                  <TableRow key={day.date}>
                    <TableCell>{format(new Date(day.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">{day.views}</TableCell>
                    <TableCell className="text-right">{day.clicks}</TableCell>
                    <TableCell className="text-right">{day.conversions}</TableCell>
                    <TableCell className="text-right">
                      {day.views > 0 ? ((day.clicks / day.views) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
