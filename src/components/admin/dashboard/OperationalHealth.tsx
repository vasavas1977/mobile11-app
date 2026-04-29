import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertTriangle, XCircle, 
  Cpu, CreditCard, Mail, Webhook, 
  Headphones, BookOpen, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthItem {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  detail?: string;
}

interface OperationalHealthProps {
  items: HealthItem[];
}

const iconMap: Record<string, any> = {
  'Supplier API': Cpu,
  'Payment Gateway': CreditCard,
  'Email Service': Mail,
  'Webhooks': Webhook,
  'Contact Center': Headphones,
  'Knowledge Base': BookOpen,
  'Dead Air': VolumeX,
};

const statusConfig = {
  healthy: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export function OperationalHealth({ items }: OperationalHealthProps) {
  return (
    <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
          Operational Health
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            const ItemIcon = iconMap[item.label] || Cpu;
            return (
              <Badge
                key={item.label}
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg",
                  config.bg, config.border
                )}
              >
                <ItemIcon className={cn("h-3 w-3", config.color)} />
                <span className={config.color}>{item.label}</span>
                <StatusIcon className={cn("h-3 w-3 ml-0.5", config.color)} />
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
