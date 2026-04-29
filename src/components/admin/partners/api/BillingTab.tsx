import { Receipt, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_API_PARTNERS } from './apiPartnerData';

const billingModelLabels: Record<string, string> = {
  per_request: 'Per Request',
  per_order: 'Per Order',
  monthly_flat: 'Monthly Flat',
  tiered: 'Tiered Volume',
};

const mockInvoices = [
  { id: 'API-INV-038', partner: 'GlobalReach API Ltd.', period: 'Mar 2025', amount: 234000, status: 'pending' as const },
  { id: 'API-INV-037', partner: 'FlyConnect GmbH', period: 'Mar 2025', amount: 52400, status: 'pending' as const },
  { id: 'API-INV-036', partner: 'GlobalReach API Ltd.', period: 'Feb 2025', amount: 218000, status: 'paid' as const },
  { id: 'API-INV-035', partner: 'FlyConnect GmbH', period: 'Feb 2025', amount: 48900, status: 'paid' as const },
  { id: 'API-INV-034', partner: 'TripStack Inc.', period: 'Feb 2025', amount: 12100, status: 'overdue' as const },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
};

export function BillingTab() {
  const totalRevenue = MOCK_API_PARTNERS.reduce((s, p) => s + p.monthly_revenue, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Monthly Revenue</span>
          </div>
          <p className="text-xl font-bold font-mono text-[#1A1A1A]">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Pending Invoices</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">{mockInvoices.filter(i => i.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Overdue</span>
          <p className="text-xl font-bold font-mono text-red-600 mt-1">{mockInvoices.filter(i => i.status === 'overdue').length}</p>
        </div>
      </div>

      {/* Billing Models */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Partner Billing Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Partner</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Model</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Requests</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Orders</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Revenue</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Avg/Order</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_API_PARTNERS.map(p => (
                <tr key={p.id} className="border-b border-[#F3F0EB]">
                  <td className="px-4 py-2.5 text-[13px] font-medium text-[#1A1A1A]">{p.company_name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px] bg-[#FAF7F2] text-[#6B7280] border-[#F3F0EB]">{billingModelLabels[p.billing_model]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#6B7280]">{p.monthly_requests.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#6B7280]">{p.monthly_orders.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] font-medium text-[#1A1A1A]">${p.monthly_revenue.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] text-[#6B7280]">{p.monthly_orders > 0 ? `$${(p.monthly_revenue / p.monthly_orders).toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">API Partner Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Invoice</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Partner</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Period</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Amount</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map(inv => (
                <tr key={inv.id} className="border-b border-[#F3F0EB]">
                  <td className="px-4 py-2.5 text-[12px] font-mono text-orange-600">{inv.id}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#1A1A1A]">{inv.partner}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#4B5563]">{inv.period}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] font-medium text-[#1A1A1A]">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[inv.status]}`}>{inv.status}</Badge>
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
