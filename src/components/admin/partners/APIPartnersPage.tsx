import { useState, useMemo } from 'react';
import {
  Search, Plus, Code, Globe, ShoppingCart,
  TrendingUp, DollarSign, Headphones, AlertTriangle,
  MoreHorizontal, Eye, Pencil, Ban, CheckCircle2, Upload,
  Building2, Wallet, Key, Webhook, BarChart3, FileText,
  CreditCard, Shield, Activity, Zap, Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SampleModeActionGuard, SampleModeBadge } from './SampleModeGuards';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_API_PARTNERS } from './sampleData';
import { APIPartner, PARTNER_STATUS_STYLES } from './api/apiPartnerData';

const BILLING_LABELS: Record<string, string> = {
  per_request: 'Per Request',
  per_order: 'Per Order',
  monthly_flat: 'Monthly Flat',
  tiered: 'Tiered',
};

const ENV_STYLES: Record<string, string> = {
  sandbox: 'bg-blue-50 text-blue-700 border-blue-200',
  production: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  both: 'bg-violet-50 text-violet-700 border-violet-200',
};

export function APIPartnersPage() {
  const { isSampleMode } = usePartnerDataMode();
  const apiPartners = isSampleMode ? SAMPLE_API_PARTNERS : [];

  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<APIPartner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const countries = useMemo(() => [...new Set(apiPartners.map(p => p.country))], [apiPartners]);
  const managers = useMemo(() => [...new Set(apiPartners.map(p => p.account_manager))], [apiPartners]);

  const filtered = useMemo(() => {
    return apiPartners.filter(p => {
      if (search && !p.company_name.toLowerCase().includes(search.toLowerCase()) && !p.country.toLowerCase().includes(search.toLowerCase())) return false;
      if (envFilter !== 'all' && p.environment !== envFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (billingFilter !== 'all' && p.billing_model !== billingFilter) return false;
      if (countryFilter !== 'all' && p.country !== countryFilter) return false;
      if (managerFilter !== 'all' && p.account_manager !== managerFilter) return false;
      return true;
    });
  }, [apiPartners, search, envFilter, statusFilter, billingFilter, countryFilter, managerFilter]);

  const metrics = useMemo(() => {
    const active = apiPartners.filter(p => p.status === 'active').length;
    const sandbox = apiPartners.filter(p => p.status === 'sandbox' || p.environment === 'sandbox').length;
    const production = apiPartners.filter(p => p.environment === 'production' || p.environment === 'both').length;
    const totalRevenue = apiPartners.reduce((s, p) => s + p.monthly_revenue, 0);
    const totalOrders = apiPartners.reduce((s, p) => s + p.monthly_orders, 0);
    const activePartners = apiPartners.filter(p => p.monthly_requests > 0);
    const avgErrorRate = activePartners.length > 0
      ? activePartners.reduce((s, p) => s + p.error_rate, 0) / activePartners.length
      : 0;
    const lowUsage = apiPartners.filter(p => p.status === 'active' && p.monthly_requests < 1000).length;
    return { active, sandbox, production, totalRevenue, totalOrders, avgErrorRate, lowUsage };
  }, [apiPartners]);

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Partners', value: String(metrics.active), icon: Code, accent: 'default' },
    { label: 'Sandbox', value: String(metrics.sandbox), icon: Shield, accent: 'default' },
    { label: 'Production', value: String(metrics.production), icon: Zap, accent: 'default' },
    { label: 'API Revenue', value: `$${(metrics.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, accent: 'success' },
    { label: 'API Orders', value: metrics.totalOrders.toLocaleString(), icon: ShoppingCart, accent: 'success' },
    { label: 'Avg Error Rate', value: `${metrics.avgErrorRate.toFixed(1)}%`, icon: Activity, accent: metrics.avgErrorRate > 2 ? 'error' : 'default' },
    { label: 'Low Usage Alerts', value: String(metrics.lowUsage), icon: AlertTriangle, accent: metrics.lowUsage > 0 ? 'warning' : 'default' },
  ];

  const openDetail = (p: APIPartner) => { setSelectedPartner(p); setDrawerOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">API Partners</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage external commercial API partners — credentials, usage, billing, and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Create API Partner
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && apiPartners.length === 0 ? (
        <div className="space-y-4">
          <AdminEmptyState
            title="No API partners configured"
            description="Onboard your first external API partner to manage credentials, usage, and billing."
            actionLabel="Create API Partner"
            onAction={() => {}}
          />
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <Upload className="h-3.5 w-3.5 mr-1.5" />Request API Onboarding
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {kpis.map(kpi => <AdminKPICard key={kpi.label} {...kpi} />)}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <Input placeholder="Search API partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={envFilter} onValueChange={setEnvFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Environment" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={billingFilter} onValueChange={setBillingFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Billing" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="per_request">Per Request</SelectItem>
                <SelectItem value="per_order">Per Order</SelectItem>
                <SelectItem value="monthly_flat">Monthly Flat</SelectItem>
                <SelectItem value="tiered">Tiered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Manager" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Managers</SelectItem>
                {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Company</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Env</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Country</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Billing</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">API</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Webhooks</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Rate Limit</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Requests</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Orders</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Error %</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Activity</th>
                    <th className="text-center px-2 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-3 py-3 cursor-pointer" onClick={() => openDetail(p)}>
                        <div className="font-medium text-[12px] text-[#1A1A1A]">{p.company_name}</div>
                        <div className="text-[10px] text-[#9CA3AF]">{p.contact_email}</div>
                      </td>
                      <td className="px-3 py-3"><Badge variant="outline" className={`text-[9px] ${ENV_STYLES[p.environment]}`}>{p.environment}</Badge></td>
                      <td className="px-3 py-3"><Badge variant="outline" className={`text-[9px] ${PARTNER_STATUS_STYLES[p.status]}`}>{p.status}</Badge></td>
                      <td className="px-3 py-3 text-[11px] text-[#6B7280]">{p.country}</td>
                      <td className="px-3 py-3 text-[10px] text-[#6B7280]">{BILLING_LABELS[p.billing_model]}</td>
                      <td className="px-3 py-3"><Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">{p.api_version}</Badge></td>
                      <td className="px-3 py-3">
                        {p.webhook_url
                          ? <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">On</Badge>
                          : <span className="text-[10px] text-[#D1D5DB]">Off</span>}
                      </td>
                      <td className="px-3 py-3 text-[10px] text-[#6B7280]">{p.rate_limit_rpm} rpm</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">{p.monthly_requests.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#6B7280]">{p.monthly_orders.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">${p.monthly_revenue.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-mono text-[11px] ${p.error_rate > 2 ? 'text-red-600' : p.error_rate > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {p.error_rate}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[10px] text-[#9CA3AF] whitespace-nowrap">{p.created_at}</td>
                      <td className="px-2 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                              <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                            <DropdownMenuItem onClick={() => openDetail(p)} className="text-[12px] text-[#1A1A1A]"><Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Edit Partner</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Key className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Credentials</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><BarChart3 className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Usage</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><CreditCard className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Billing</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                            {p.status === 'active' ? (
                              <DropdownMenuItem className="text-[12px] text-red-600"><Ban className="h-3.5 w-3.5 mr-2" />Disable</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-[12px] text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Enable</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={14} className="text-center py-12 text-[#9CA3AF] text-[13px]">No API partners found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <APIPartnerDetailDrawer partner={selectedPartner} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}

/* ─── Detail Drawer ──────────────────────────────────── */
function APIPartnerDetailDrawer({ partner, open, onOpenChange }: { partner: APIPartner | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!partner) return null;

  const successRate = (100 - partner.error_rate).toFixed(1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{partner.company_name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">API Partner · {partner.country} · {partner.api_version}</SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[9px] ${ENV_STYLES[partner.environment]}`}>{partner.environment}</Badge>
                <Badge variant="outline" className={`text-[10px] ${PARTNER_STATUS_STYLES[partner.status]}`}>{partner.status}</Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'credentials', 'webhooks', 'usage', 'billing', 'support'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Overview */}
              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={partner.company_name} sub={partner.contact_email} />
                  <DrawerField icon={<Globe className="h-3.5 w-3.5" />} label="Country" value={partner.country} sub={partner.territory} />
                  <DrawerField icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Monthly Orders" value={partner.monthly_orders.toLocaleString()} />
                  <DrawerField icon={<Activity className="h-3.5 w-3.5" />} label="Monthly Requests" value={partner.monthly_requests.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Account Manager" value={partner.account_manager} />
                  <MetaField label="API Version" value={partner.api_version} />
                  <MetaField label="Billing Model" value={BILLING_LABELS[partner.billing_model]} />
                  <MetaField label="Rate Limit" value={`${partner.rate_limit_rpm} RPM / ${partner.rate_limit_daily.toLocaleString()} daily`} />
                  <MetaField label="Contract Start" value={partner.contract_start} />
                  <MetaField label="Contract End" value={partner.contract_end} />
                  <MetaField label="Avg Latency" value={`${partner.avg_latency_ms}ms`} />
                  <MetaField label="Scopes" value={`${partner.scopes.length} granted`} />
                </div>
              </TabsContent>

              {/* Credentials */}
              <TabsContent value="credentials" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Key Status" value={partner.status === 'active' ? 'Active' : partner.status === 'suspended' ? 'Revoked' : 'Limited'} />
                  <MetaField label="Environment" value={partner.environment} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">API Keys</h4>
                  {partner.production_key_prefix && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB]">
                      <div>
                        <span className="text-[10px] text-[#9CA3AF] uppercase">Production</span>
                        <p className="text-[12px] font-mono text-[#1A1A1A]">{partner.production_key_prefix}••••••••</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">Live</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB]">
                    <div>
                      <span className="text-[10px] text-[#9CA3AF] uppercase">Sandbox</span>
                      <p className="text-[12px] font-mono text-[#1A1A1A]">{partner.sandbox_key_prefix}••••••••</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Test</Badge>
                  </div>
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">IP Allowlist ({partner.allowed_ips.length})</h4>
                  {partner.allowed_ips.length === 0 ? (
                    <p className="text-[11px] text-[#9CA3AF]">No IP restrictions — all IPs allowed</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {partner.allowed_ips.map(ip => (
                        <span key={ip} className="px-2 py-0.5 text-[10px] font-mono bg-[#FAFAF8] border border-[#F3F0EB] rounded text-[#6B7280]">{ip}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Scopes ({partner.scopes.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {partner.scopes.map(s => (
                      <span key={s} className="px-2 py-0.5 text-[10px] font-mono bg-violet-50 border border-violet-200 rounded text-violet-700">{s}</span>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Webhooks */}
              <TabsContent value="webhooks" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-1 gap-3">
                  <MetaField label="Webhook URL" value={partner.webhook_url || 'Not configured'} />
                  <MetaField label="Webhook Secret" value={partner.webhook_secret_masked || 'Not set'} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Subscribed Events ({partner.webhook_events.length})</h4>
                  {partner.webhook_events.length === 0 ? (
                    <p className="text-[11px] text-[#9CA3AF]">No webhook events configured</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {partner.webhook_events.map(e => (
                        <span key={e} className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 border border-blue-200 rounded text-blue-700">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Usage */}
              <TabsContent value="usage" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Activity className="h-3.5 w-3.5" />} label="Request Volume" value={partner.monthly_requests.toLocaleString()} sub="this month" />
                  <DrawerField icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Success Rate" value={`${successRate}%`} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Error Rate" value={`${partner.error_rate}%`} />
                  <MetaField label="Avg Latency" value={`${partner.avg_latency_ms}ms`} />
                  <MetaField label="Rate Limit (RPM)" value={partner.rate_limit_rpm.toLocaleString()} />
                  <MetaField label="Rate Limit (Daily)" value={partner.rate_limit_daily.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Allowed Endpoints ({partner.allowed_endpoints.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {partner.allowed_endpoints.map(ep => (
                      <span key={ep} className="px-2 py-0.5 text-[10px] font-mono bg-[#FAFAF8] border border-[#F3F0EB] rounded text-[#6B7280]">{ep}</span>
                    ))}
                  </div>
                </div>
                {partner.error_rate > 2 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    High error rate detected — review API logs and integration health
                  </div>
                )}
              </TabsContent>

              {/* Billing */}
              <TabsContent value="billing" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<CreditCard className="h-3.5 w-3.5" />} label="Billing Model" value={BILLING_LABELS[partner.billing_model]} />
                  <DrawerField icon={<DollarSign className="h-3.5 w-3.5" />} label="Monthly Revenue" value={`$${partner.monthly_revenue.toLocaleString()}`} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Monthly Orders" value={partner.monthly_orders.toLocaleString()} />
                  <MetaField label="Monthly Requests" value={partner.monthly_requests.toLocaleString()} />
                  <MetaField label="Contract Start" value={partner.contract_start} />
                  <MetaField label="Contract End" value={partner.contract_end} />
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                  <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Current Period Charges</span>
                  <p className="text-lg font-bold text-[#1A1A1A] tabular-nums mt-1">${partner.monthly_revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">Based on {BILLING_LABELS[partner.billing_model].toLowerCase()} model</p>
                </div>
              </TabsContent>

              {/* Support */}
              <TabsContent value="support" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Account Manager" value={partner.account_manager} />
                  <MetaField label="Contact Email" value={partner.contact_email} />
                  <MetaField label="API Version" value={partner.api_version} />
                  <MetaField label="Environment" value={partner.environment} />
                  <MetaField label="Error Rate" value={`${partner.error_rate}%`} />
                  <MetaField label="Avg Latency" value={`${partner.avg_latency_ms}ms`} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Field Helpers ──────────────────────────────────── */
function DrawerField({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#9CA3AF]">{icon}</div>
      <div className="min-w-0">
        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
        <p className="text-sm font-medium truncate text-[#1A1A1A]">{value}</p>
        {sub && <p className="text-[11px] text-[#6B7280] truncate">{sub}</p>}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
      <p className="text-xs text-[#1A1A1A]">{value}</p>
    </div>
  );
}
