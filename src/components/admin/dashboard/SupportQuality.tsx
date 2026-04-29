import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, Clock, CheckCircle, ThumbsDown, VolumeX, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportMetricItem {
  label: string;
  value: string;
  color: string;
}

interface TopProblem {
  category: string;
  count: number;
  pct: number;
}

interface SupportQualityProps {
  metrics: SupportMetricItem[];
  topProblems: TopProblem[];
}

const iconMap: Record<string, any> = {
  'Open Conversations': MessageSquare,
  'Pending / Urgent': AlertTriangle,
  'Avg First Response': Clock,
  'Resolution Rate': CheckCircle,
  'Low Ratings': ThumbsDown,
  'Dead Air Events': VolumeX,
};

export function SupportQuality({ metrics, topProblems }: SupportQualityProps) {
  return (
    <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4">
          Support & Quality
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {metrics.map((m) => {
            const Icon = iconMap[m.label] || MessageSquare;
            return (
              <div key={m.label} className="text-center">
                <div className={cn("mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-1.5", 
                  m.color.replace('text-', 'bg-').replace('600', '500/10').replace('500', '500/10')
                )}>
                  <Icon className={cn("h-4 w-4", m.color)} />
                </div>
                <div className="text-lg font-bold text-[#1A1A1A]">{m.value}</div>
                <div className="text-[10px] text-[#9CA3AF] font-medium">{m.label}</div>
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
            Top Problem Categories
          </p>
          {topProblems.length > 0 ? (
            <div className="space-y-1.5">
              {topProblems.map((p) => (
                <div key={p.category} className="flex items-center gap-3">
                  <span className="text-xs text-[#1A1A1A] w-32 truncate">{p.category}</span>
                  <div className="flex-1 h-1.5 bg-[#F3F0EB] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400 rounded-full" 
                      style={{ width: `${p.pct}%` }} 
                    />
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] font-medium w-8 text-right">{p.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF] text-center py-4">No problem categories recorded</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
