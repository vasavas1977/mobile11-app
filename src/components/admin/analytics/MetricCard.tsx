import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon,
  iconColor = "text-orange-500"
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  // Extract color name from iconColor for bg
  const bgColorMap: Record<string, string> = {
    "text-emerald-600": "bg-emerald-500/10",
    "text-blue-600": "bg-blue-500/10",
    "text-purple-600": "bg-purple-500/10",
    "text-orange-600": "bg-orange-500/10",
    "text-orange-500": "bg-orange-500/10",
  };
  const iconBg = bgColorMap[iconColor] || "bg-orange-500/10";

  return (
    <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{title}</p>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        </div>
        <div className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-1">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : null}
            <span className={cn(
              "text-[11px] font-semibold",
              isPositive ? "text-emerald-600" : isNegative ? "text-red-500" : "text-[#9CA3AF]"
            )}>
              {isPositive && '+'}{change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-[11px] text-[#9CA3AF]">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
