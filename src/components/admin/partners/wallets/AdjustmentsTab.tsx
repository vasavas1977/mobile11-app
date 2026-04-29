import { useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getActivePartners } from './walletMockData';

interface Adjustment {
  id: string;
  date: string;
  partner_name: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  admin_note: string;
  performed_by: string;
}

const mockAdjustments: Adjustment[] = [
  { id: 'ADJ-001', date: '2025-03-25', partner_name: 'TripStack Inc.', type: 'credit', amount: 800, reason: 'Billing dispute resolution', admin_note: 'Approved by finance team — ticket #SUP-2291', performed_by: 'Admin: Sarah' },
  { id: 'ADJ-002', date: '2025-03-22', partner_name: 'SiamConnect Co., Ltd.', type: 'credit', amount: 25, reason: 'Refund for failed provisioning', admin_note: 'Supplier issue — USIMSA timeout on ORD-4480', performed_by: 'Admin: Arthit' },
  { id: 'ADJ-003', date: '2025-03-18', partner_name: 'TravelSIM Japan', type: 'debit', amount: 150, reason: 'Late payment penalty', admin_note: 'Per contract clause 4.2', performed_by: 'System' },
  { id: 'ADJ-004', date: '2025-03-10', partner_name: 'GlobalReach API Ltd.', type: 'credit', amount: 1200, reason: 'Promotional credit — Q1 volume bonus', admin_note: 'Sales incentive program', performed_by: 'Admin: James' },
];

export function AdjustmentsTab() {
  const [adjustments] = useState<Adjustment[]>(mockAdjustments);
  const partners = getActivePartners();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">Manual credit/debit adjustments and admin notes for partner wallets.</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-3.5 w-3.5 mr-1.5" />New Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#F3F0EB]">
            <DialogHeader>
              <DialogTitle className="text-[#1A1A1A]">Create Manual Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-[#4B5563] text-sm">Partner</Label>
                <Select>
                  <SelectTrigger className="bg-white border-[#F3F0EB] text-[#1A1A1A] mt-1">
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#4B5563] text-sm">Type</Label>
                  <Select>
                    <SelectTrigger className="bg-white border-[#F3F0EB] text-[#1A1A1A] mt-1">
                      <SelectValue placeholder="Credit/Debit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit (+)</SelectItem>
                      <SelectItem value="debit">Debit (−)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#4B5563] text-sm">Amount ($)</Label>
                  <Input type="number" placeholder="0.00" className="bg-white border-[#F3F0EB] text-[#1A1A1A] mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-[#4B5563] text-sm">Reason</Label>
                <Input placeholder="e.g. Billing dispute resolution" className="bg-white border-[#F3F0EB] text-[#1A1A1A] mt-1" />
              </div>
              <div>
                <Label className="text-[#4B5563] text-sm">Admin Note</Label>
                <Textarea placeholder="Internal note for audit trail..." className="bg-white border-[#F3F0EB] text-[#1A1A1A] mt-1" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-[#F3F0EB] text-[#6B7280]">Cancel</Button>
              </DialogClose>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Submit Adjustment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Reason</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Note</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">By</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => (
                <tr key={adj.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-2.5 text-[12px] font-mono text-[#6B7280]">{adj.id}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{adj.date}</td>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-[#1A1A1A]">{adj.partner_name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${adj.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {adj.type === 'credit' ? '+Credit' : '−Debit'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                    <span className={adj.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                      {adj.type === 'credit' ? '+' : '-'}${adj.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[#4B5563] max-w-[200px] truncate">{adj.reason}</td>
                  <td className="px-4 py-2.5 text-[11px] text-[#9CA3AF] max-w-[200px] truncate">
                    <StickyNote className="inline h-3 w-3 mr-1 text-[#D1D5DB]" />{adj.admin_note}
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-[#9CA3AF]">{adj.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
