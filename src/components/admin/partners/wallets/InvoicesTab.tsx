import { useState, useMemo } from 'react';
import { Search, Download, FileText, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateInvoices, INVOICE_STATUS_STYLES } from './walletMockData';

export function InvoicesTab() {
  const invoices = useMemo(() => generateInvoices(), []);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return invoices;
    return invoices.filter(inv => inv.partner_name.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number.toLowerCase().includes(search.toLowerCase()));
  }, [invoices, search]);

  const overdue = invoices.filter(i => i.status === 'overdue');
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-[#1A1A1A] font-mono">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Overdue</span>
          </div>
          <p className="text-xl font-bold text-red-600 font-mono">{overdue.length}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">${overdue.reduce((s, i) => s + i.total, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Paid This Month</span>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{invoices.filter(i => i.status === 'paid').length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A]" />
        </div>
        <Button variant="outline" size="sm" className="border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
          <Download className="h-3.5 w-3.5 mr-1.5" />Export
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Invoice #</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Period</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Amount</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Tax</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Due</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-2.5 text-[12px] font-mono text-orange-600 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-2.5">
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{inv.partner_name}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{inv.partner_type}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[#4B5563]">{inv.period}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#6B7280]">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#9CA3AF]">${inv.tax.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] font-medium text-[#1A1A1A]">${inv.total.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${INVOICE_STATUS_STYLES[inv.status]}`}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{inv.due_date}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
                        <FileText className="h-3 w-3 mr-1" />View
                      </Button>
                      {inv.status === 'sent' || inv.status === 'overdue' ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                          Mark Paid
                        </Button>
                      ) : null}
                    </div>
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
