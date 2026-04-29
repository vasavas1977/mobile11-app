import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MousePointerClick, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

interface AffiliateMetricsCardsProps {
  metrics: AffiliateMetrics | null;
  loading: boolean;
}

export function AffiliateMetricsCards({ metrics, loading }: AffiliateMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Affiliates',
      value: metrics?.totalAffiliates || 0,
      subtitle: `${metrics?.activeAffiliates || 0} active`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Total Clicks',
      value: metrics?.totalClicks.toLocaleString() || '0',
      icon: MousePointerClick,
      color: 'text-purple-500',
    },
    {
      title: 'Conversions',
      value: metrics?.totalConversions.toLocaleString() || '0',
      subtitle: `${metrics?.conversionRate.toFixed(1)}% rate`,
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
    {
      title: 'Commissions Paid',
      value: `$${(metrics?.totalCommissionsPaid || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Pending Commissions',
      value: `$${(metrics?.pendingCommissions || 0).toFixed(2)}`,
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      title: 'Approved Commissions',
      value: `$${(metrics?.approvedCommissions || 0).toFixed(2)}`,
      icon: CheckCircle,
      color: 'text-cyan-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
