import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface AdminKPICardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  accent?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const accentMap = {
  default: 'text-[#1A1A1A]',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
};

const iconBgMap = {
  default: 'bg-[#FAF7F2] text-[#6B7280]',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
};

export function AdminKPICard({ label, value, icon: Icon, trend, accent = 'default', className }: AdminKPICardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-[#F3F0EB] p-2.5 transition-shadow hover:shadow-sm',
      className
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', iconBgMap[accent])}>
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wide truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={cn('text-sm font-bold tabular-nums', accentMap[accent])}>{value}</p>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-[9px] font-medium',
            trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {trend.value >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}
