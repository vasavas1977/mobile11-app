import { useState, useMemo } from 'react';
import { Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generatePayouts, PAYOUT_STATUS_STYLES } from './walletMockData';
import { format } from 'date-fns';

export function PayoutsTab() {
  const payouts = useMemo(() => generatePayouts(), []);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return payouts;
    return payouts.filter(p => p.partner_name.toLowerCase().includes(search.toLowerCase()));
  }, [payouts, search]);

  const pendingTotal = payouts.filter(p => p.status !== 'completed' && p.status !== 'rejected').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Pending Payouts</span>
          <p className="text-xl font-bold text-[#1A1A1A] font-mono mt-1">${pendingTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Awaiting Approval</span>
          <p className="text-xl font-bold text-amber-600 font-mono mt-1">{payouts.filter(p => p.status === 'requested').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Completed This Month</span>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{payouts.filter(p => p.status === 'completed').length}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <Input placeholder="Search payouts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A]" />
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Method</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Requested</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Bank Ref</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Notes</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-2.5 text-[12px] font-mono text-[#6B7280]">{p.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{p.partner_name}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{p.partner_type}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] font-medium text-[#1A1A1A]">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#4B5563]">{p.method}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${PAYOUT_STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{format(new Date(p.requested_at), 'MMM dd')}</td>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-[#9CA3AF]">{p.bank_reference || '—'}</td>
                  <td className="px-4 py-2.5 text-[11px] text-[#9CA3AF] max-w-[160px] truncate">{p.notes || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.status === 'requested' && (
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {p.status === 'approved' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-orange-600 hover:bg-orange-50">
                        Mark Paid
                      </Button>
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
