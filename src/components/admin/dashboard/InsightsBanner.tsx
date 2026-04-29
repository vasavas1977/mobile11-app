import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertCircle, Star } from 'lucide-react';

interface InsightsBannerProps {
  topPackage?: string;
  revenueChange: number;
  pendingOrders: number;
}

export function InsightsBanner({ topPackage, revenueChange, pendingOrders }: InsightsBannerProps) {
  const insights = [];

  if (topPackage) {
    insights.push({
      icon: Star,
      text: `Your best-selling package is ${topPackage}`,
      type: 'info' as const,
    });
  }

  if (Math.abs(revenueChange) > 5) {
    insights.push({
      icon: TrendingUp,
      text: `Revenue is ${revenueChange > 0 ? 'up' : 'down'} ${Math.abs(revenueChange).toFixed(1)}% 📈`,
      type: revenueChange > 0 ? 'success' : 'warning' as const,
    });
  }

  if (pendingOrders > 0) {
    insights.push({
      icon: AlertCircle,
      text: `You have ${pendingOrders} pending orders that need attention`,
      type: 'warning' as const,
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: TrendingUp,
      text: 'All systems running smoothly',
      type: 'success' as const,
    });
  }

  const insight = insights[0];
  const Icon = insight.icon;

  const bgClass = 
    insight.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
    insight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
    'bg-blue-50 border-blue-200';

  const textClass = 
    insight.type === 'success' ? 'text-emerald-700' :
    insight.type === 'warning' ? 'text-orange-700' :
    'text-blue-700';

  return (
    <Card className={`border rounded-2xl shadow-sm ${bgClass}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${textClass}`} />
          <p className={`font-medium ${textClass}`}>{insight.text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
