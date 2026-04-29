import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PartnerItem {
  name: string;
  type: string;
  revenue: string;
  orders: number;
  trend: string;
}

interface AlertItem {
  text: string;
  severity: 'warning' | 'info';
}

interface PartnerPerformanceProps {
  partners: PartnerItem[];
  alerts: AlertItem[];
}

const typeBadge: Record<string, string> = {
  Reseller: 'bg-blue-50 text-blue-600 border-blue-200',
  Distributor: 'bg-purple-50 text-purple-600 border-purple-200',
  API: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export function PartnerPerformance({ partners, alerts }: PartnerPerformanceProps) {
  return (
    <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
          Partner Performance
        </p>

        {partners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#F3F0EB]">
                  <th className="text-left pb-2 font-semibold">Partner</th>
                  <th className="text-left pb-2 font-semibold">Type</th>
                  <th className="text-right pb-2 font-semibold">Revenue</th>
                  <th className="text-right pb-2 font-semibold">Orders</th>
                  <th className="text-right pb-2 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.name} className="border-b border-[#F3F0EB]/50 last:border-0">
                    <td className="py-2.5 font-medium text-[#1A1A1A]">{p.name}</td>
                    <td className="py-2.5">
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4", typeBadge[p.type] || '')}>
                        {p.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right text-[#1A1A1A] font-medium">{p.revenue}</td>
                    <td className="py-2.5 text-right text-[#9CA3AF]">{p.orders}</td>
                    <td className={cn(
                      "py-2.5 text-right font-semibold",
                      p.trend.startsWith('+') ? "text-emerald-600" : "text-red-500"
                    )}>{p.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] text-center py-8">No partner data available</p>
        )}

        {alerts.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {alerts.map((a, i) => (
              <div key={i} className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                a.severity === 'warning' ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  a.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
                )} />
                {a.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
