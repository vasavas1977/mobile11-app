import { useState, useMemo } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateLedgerEntries, TX_TYPE_STYLES, TransactionType } from './walletMockData';
import { format } from 'date-fns';

export function LedgerTab() {
  const entries = useMemo(() => generateLedgerEntries(), []);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = entries;
    if (search) result = result.filter(e => e.partner_name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') result = result.filter(e => e.type === typeFilter);
    return result;
  }, [entries, search, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input placeholder="Search ledger..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A]" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] bg-white border-[#F3F0EB] text-[#4B5563]">
            <Filter className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TX_TYPE_STYLES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
          <Download className="h-3.5 w-3.5 mr-1.5" />Export
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Description</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Debit</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Credit</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Balance</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Ref</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const style = TX_TYPE_STYLES[e.type];
                return (
                  <tr key={e.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-2.5 text-[#6B7280] whitespace-nowrap text-[12px]">
                      {format(new Date(e.date), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-[10px] ${style.color}`}>{style.label}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-medium text-[#1A1A1A]">{e.partner_name}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{e.partner_type}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#4B5563] max-w-[240px] truncate">{e.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                      {e.debit > 0 ? <span className="text-red-600">-${e.debit.toLocaleString()}</span> : <span className="text-[#D1D5DB]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                      {e.credit > 0 ? <span className="text-emerald-600">+${e.credit.toLocaleString()}</span> : <span className="text-[#D1D5DB]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] font-medium text-[#1A1A1A]">
                      ${e.balance_after.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-[#9CA3AF]">
                      {e.related_order_id || e.related_payout_id || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-[#9CA3AF] max-w-[160px] truncate">
                      {e.admin_note || '—'}
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
