import { Gauge, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_API_PARTNERS } from './apiPartnerData';

export function RateLimitsTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">Configure and monitor rate limits for each API partner.</p>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">RPM Limit</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Daily Limit</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Current RPM</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Daily Used</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Utilization</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_API_PARTNERS.map(p => {
                const currentRpm = Math.round(p.monthly_requests / 30 / 24 / 60 * (0.5 + Math.random()));
                const dailyUsed = Math.round(p.monthly_requests / 30);
                const utilPct = p.rate_limit_daily > 0 ? (dailyUsed / p.rate_limit_daily * 100) : 0;
                const isHigh = utilPct > 80;
                return (
                  <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1A1A1A] text-[13px]">{p.company_name}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{p.billing_model}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-[#6B7280]">{p.rate_limit_rpm.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-[#6B7280]">{p.rate_limit_daily.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-[#1A1A1A]">{currentRpm}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-[#1A1A1A]">{dailyUsed.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 bg-[#F3F0EB] rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${utilPct > 80 ? 'bg-red-500' : utilPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, utilPct)}%` }} />
                        </div>
                        <span className={`text-[11px] font-mono w-10 text-right ${isHigh ? 'text-red-600' : 'text-[#6B7280]'}`}>{utilPct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isHigh ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />Near Limit
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Normal</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
