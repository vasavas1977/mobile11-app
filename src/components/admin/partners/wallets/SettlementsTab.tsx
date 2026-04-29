import { useState, useMemo } from 'react';
import { Search, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateSettlements, SETTLEMENT_STATUS_STYLES } from './walletMockData';

export function SettlementsTab() {
  const settlements = useMemo(() => generateSettlements(), []);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return settlements;
    return settlements.filter(s => s.partner_name.toLowerCase().includes(search.toLowerCase()));
  }, [settlements, search]);

  const pending = settlements.filter(s => s.status === 'pending' || s.status === 'processing');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Pending</span>
          </div>
          <p className="text-xl font-bold text-[#1A1A1A] font-mono">{pending.length}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">${pending.reduce((s, p) => s + p.net_payable, 0).toLocaleString()} total</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Processing</span>
          </div>
          <p className="text-xl font-bold text-[#1A1A1A] font-mono">{settlements.filter(s => s.status === 'processing').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Completed This Month</span>
          </div>
          <p className="text-xl font-bold text-[#1A1A1A] font-mono">{settlements.filter(s => s.status === 'completed').length}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <Input placeholder="Search settlements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A]" />
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Period</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Orders</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Commission</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Net Payable</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Due</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-2.5 text-[12px] font-mono text-[#6B7280]">{s.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{s.partner_name}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{s.partner_type}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[#4B5563]">{s.period}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#6B7280]">{s.total_orders.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#1A1A1A]">${s.gross_revenue.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-orange-600">${s.commission.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] font-medium text-[#1A1A1A]">${s.net_payable.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${SETTLEMENT_STATUS_STYLES[s.status]}`}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{s.due_date}</td>
                  <td className="px-4 py-2.5 text-center">
                    {s.status === 'pending' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-orange-600 hover:bg-orange-50">
                        Process
                      </Button>
                    )}
                    {s.status === 'completed' && (
                      <span className="text-[11px] text-[#9CA3AF]">{s.reference}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
