import { useState, useMemo } from 'react';
import { Search, Plus, Key, Activity, AlertTriangle, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_API_PARTNERS, PARTNER_STATUS_STYLES } from './apiPartnerData';

export function OverviewTab({ onSelectPartner }: { onSelectPartner: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const partners = MOCK_API_PARTNERS;

  const filtered = useMemo(() => {
    if (!search) return partners;
    return partners.filter(p => p.company_name.toLowerCase().includes(search.toLowerCase()));
  }, [partners, search]);

  const active = partners.filter(p => p.status === 'active').length;
  const sandbox = partners.filter(p => p.status === 'sandbox').length;
  const totalRevenue = partners.reduce((s, p) => s + p.monthly_revenue, 0);
  const totalRequests = partners.reduce((s, p) => s + p.monthly_requests, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Partners', value: active, color: 'text-emerald-600' },
          { label: 'Sandbox', value: sandbox, color: 'text-blue-600' },
          { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-[#1A1A1A]' },
          { label: 'Monthly Requests', value: totalRequests.toLocaleString(), color: 'text-[#1A1A1A]' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#F3F0EB] p-4">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">{kpi.label}</span>
            <p className={`text-xl font-bold font-mono mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input placeholder="Search API partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A]" />
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />Onboard Partner
        </Button>
      </div>

      <div className="grid gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-[#F3F0EB] p-5 cursor-pointer hover:border-orange-200 transition-colors" onClick={() => onSelectPartner(p.id)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#1A1A1A]">{p.company_name}</h3>
                  <Badge variant="outline" className={`text-[10px] ${PARTNER_STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                  <Badge variant="outline" className="text-[10px] bg-[#FAF7F2] text-[#6B7280] border-[#F3F0EB]">{p.api_version}</Badge>
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{p.territory} · {p.contact_email} · {p.account_manager}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${p.environment === 'production' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.environment === 'sandbox' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                {p.environment}
              </Badge>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-sm">
              {[
                { label: 'API Key', value: p.api_key_prefix + '••••', mono: true, icon: <Key className="h-3 w-3 text-[#9CA3AF] inline mr-1" /> },
                { label: 'Monthly Requests', value: p.monthly_requests.toLocaleString(), mono: true },
                { label: 'Monthly Orders', value: p.monthly_orders.toLocaleString(), mono: true },
                { label: 'Revenue', value: `$${p.monthly_revenue.toLocaleString()}`, mono: true },
                { label: 'Error Rate', value: `${p.error_rate}%`, mono: true, alert: p.error_rate > 2 },
                { label: 'Avg Latency', value: `${p.avg_latency_ms}ms`, mono: true },
              ].map(m => (
                <div key={m.label}>
                  <span className="text-[10px] text-[#9CA3AF] uppercase block">{m.label}</span>
                  <span className={`text-[13px] font-medium ${m.mono ? 'font-mono' : ''} ${m.alert ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                    {m.icon}{m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
