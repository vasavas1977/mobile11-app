import { useState, useMemo } from 'react';
import {
  Search, Plus, Store, Users, Wallet, Palette,
  TrendingUp, DollarSign, Headphones, Globe, ShoppingCart,
  MoreHorizontal, Eye, Pencil, Ban, CheckCircle2, UserPlus, Upload,
  CreditCard, Building2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SampleModeActionGuard, SampleModeBadge } from './SampleModeGuards';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_PARTNERS } from './sampleData';
import { Partner, STATUS_STYLES } from './types';

export function ResellersPage() {
  const { isSampleMode } = usePartnerDataMode();
  const allPartners = isSampleMode ? SAMPLE_PARTNERS : [];
  const resellers = allPartners.filter(p => p.partner_type === 'reseller');

  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [wlFilter, setWlFilter] = useState('all');
  const [selectedReseller, setSelectedReseller] = useState<Partner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const parentDistributors = useMemo(() => [...new Set(resellers.map(r => r.parent_partner_name).filter(Boolean) as string[])], [resellers]);
  const countries = useMemo(() => [...new Set(resellers.map(r => r.country))], [resellers]);
  const plans = useMemo(() => [...new Set(resellers.map(r => r.default_pricing_plan))], [resellers]);

  const filtered = useMemo(() => {
    return resellers.filter(r => {
      if (search && !r.company_name.toLowerCase().includes(search.toLowerCase()) && !r.country.toLowerCase().includes(search.toLowerCase())) return false;
      if (parentFilter !== 'all' && r.parent_partner_name !== parentFilter) return false;
      if (countryFilter !== 'all' && r.country !== countryFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (planFilter !== 'all' && r.default_pricing_plan !== planFilter) return false;
      if (walletFilter === 'low' && r.wallet_balance >= r.credit_limit * 0.15) return false;
      if (walletFilter === 'healthy' && r.wallet_balance < r.credit_limit * 0.15) return false;
      if (wlFilter === 'enabled' && !r.white_label_enabled) return false;
      if (wlFilter === 'disabled' && r.white_label_enabled) return false;
      return true;
    });
  }, [resellers, search, parentFilter, countryFilter, statusFilter, planFilter, walletFilter, wlFilter]);

  const metrics = useMemo(() => {
    const active = resellers.filter(r => r.status === 'active');
    const wlCount = resellers.filter(r => r.white_label_enabled).length;
    const totalRevenue = resellers.reduce((s, r) => s + r.monthly_revenue, 0);
    const totalMargin = resellers.reduce((s, r) => s + r.monthly_margin, 0);
    const avgWallet = active.length > 0 ? active.reduce((s, r) => s + r.wallet_balance, 0) / active.length : 0;
    const openIssues = resellers.reduce((s, r) => s + r.support_volume, 0);
    return { active: active.length, wlCount, totalRevenue, totalMargin, avgWallet, openIssues };
  }, [resellers]);

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Resellers', value: String(metrics.active), icon: Store, accent: 'default' },
    { label: 'White-Label Enabled', value: String(metrics.wlCount), icon: Palette, accent: 'default' },
    { label: 'Reseller Revenue', value: `$${(metrics.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, accent: 'success' },
    { label: 'Reseller Margin', value: `$${(metrics.totalMargin / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
    { label: 'Avg Wallet Balance', value: `$${(metrics.avgWallet / 1000).toFixed(1)}K`, icon: Wallet, accent: 'warning' },
    { label: 'Open Issues', value: String(metrics.openIssues), icon: Headphones, accent: metrics.openIssues > 40 ? 'error' : 'default' },
  ];

  const openDetail = (r: Partner) => { setSelectedReseller(r); setDrawerOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Resellers</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage reseller accounts, white-label storefronts, wallets, and downstream performance</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Reseller
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && resellers.length === 0 ? (
        <div className="space-y-4">
          <AdminEmptyState
            title="No resellers onboarded"
            description="Invite or create your first reseller to start managing downstream sales channels."
            actionLabel="Create Reseller"
            onAction={() => {}}
          />
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />Invite Reseller
            </Button>
            <Button variant="outline" className="text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <Upload className="h-3.5 w-3.5 mr-1.5" />Import List
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {kpis.map(kpi => <AdminKPICard key={kpi.label} {...kpi} />)}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <Input placeholder="Search resellers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={parentFilter} onValueChange={setParentFilter}>
              <SelectTrigger className="w-[160px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Parent" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Distributors</SelectItem>
                {parentDistributors.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={walletFilter} onValueChange={setWalletFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Wallet" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Wallets</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="low">Low Balance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={wlFilter} onValueChange={setWlFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="White-Label" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enabled">White-Label On</SelectItem>
                <SelectItem value="disabled">White-Label Off</SelectItem>
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
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Parent</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Country</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">WL</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">API</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Wallet</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Credit</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Plan</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Cust.</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Orders</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Support</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Activity</th>
                    <th className="text-center px-2 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-3 py-3 cursor-pointer" onClick={() => openDetail(r)}>
                        <div className="font-medium text-[12px] text-[#1A1A1A]">{r.company_name}</div>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-[#6B7280] max-w-[140px] truncate">{r.parent_partner_name || '—'}</td>
                      <td className="px-3 py-3 text-[11px] text-[#6B7280]">{r.country}</td>
                      <td className="px-3 py-3"><Badge variant="outline" className={`text-[9px] ${STATUS_STYLES[r.status]}`}>{r.status}</Badge></td>
                      <td className="px-3 py-3">
                        {r.white_label_enabled
                          ? <Badge variant="outline" className="text-[9px] bg-violet-50 text-violet-700 border-violet-200">On</Badge>
                          : <span className="text-[10px] text-[#D1D5DB]">Off</span>}
                      </td>
                      <td className="px-3 py-3">
                        {r.api_enabled
                          ? <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Yes</Badge>
                          : <span className="text-[10px] text-[#D1D5DB]">No</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">${r.wallet_balance.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#9CA3AF]">${r.credit_limit.toLocaleString()}</td>
                      <td className="px-3 py-3 text-[10px] text-[#6B7280] max-w-[120px] truncate">{r.default_pricing_plan}</td>
                      <td className="px-3 py-3 text-right text-[11px] text-[#6B7280]">{r.active_customers}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#6B7280]">{r.total_orders.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">${r.monthly_revenue.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] text-emerald-600">${r.monthly_margin.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-[11px] text-[#6B7280]">{r.support_volume}</td>
                      <td className="px-3 py-3 text-[10px] text-[#9CA3AF] whitespace-nowrap">{r.updated_at}</td>
                      <td className="px-2 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                              <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                            <DropdownMenuItem onClick={() => openDetail(r)} className="text-[12px] text-[#1A1A1A]"><Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Edit Reseller</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Users className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Customers</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><ShoppingCart className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Orders</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Wallet className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Wallet</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                            {r.status === 'active' ? (
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
                    <tr><td colSpan={16} className="text-center py-12 text-[#9CA3AF] text-[13px]">No resellers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ResellerDetailDrawer reseller={selectedReseller} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}

/* ─── Detail Drawer ──────────────────────────────────── */
function ResellerDetailDrawer({ reseller, open, onOpenChange }: { reseller: Partner | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!reseller) return null;

  const walletPct = reseller.credit_limit > 0 ? Math.round((reseller.wallet_balance / reseller.credit_limit) * 100) : 0;
  const marginPct = reseller.monthly_revenue > 0 ? ((reseller.monthly_margin / reseller.monthly_revenue) * 100).toFixed(1) : '0';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{reseller.company_name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">Reseller · {reseller.country} · {reseller.parent_partner_name || 'Independent'}</SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                {reseller.white_label_enabled && <Badge variant="outline" className="text-[9px] bg-violet-50 text-violet-700 border-violet-200">White-Label</Badge>}
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[reseller.status]}`}>{reseller.status}</Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'customers', 'wallet', 'pricing', 'branding', 'support'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Overview */}
              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={reseller.company_name} sub={reseller.contact_email} />
                  <DrawerField icon={<Globe className="h-3.5 w-3.5" />} label="Country" value={reseller.country} sub={reseller.territory} />
                  <DrawerField icon={<Users className="h-3.5 w-3.5" />} label="Active Customers" value={reseller.active_customers.toString()} />
                  <DrawerField icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Total Orders" value={reseller.total_orders.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Parent Distributor" value={reseller.parent_partner_name || 'Independent'} />
                  <MetaField label="Account Manager" value={reseller.account_manager} />
                  <MetaField label="Contact Phone" value={reseller.contact_phone} />
                  <MetaField label="Support SLA" value={reseller.support_sla} />
                  <MetaField label="White-Label" value={reseller.white_label_enabled ? 'Enabled' : 'Disabled'} />
                  <MetaField label="API Access" value={reseller.api_enabled ? 'Enabled' : 'Disabled'} />
                  <MetaField label="Settlement Model" value={reseller.settlement_model.charAt(0).toUpperCase() + reseller.settlement_model.slice(1)} />
                  <MetaField label="Pricing Plan" value={reseller.default_pricing_plan} />
                </div>
              </TabsContent>

              {/* Customers */}
              <TabsContent value="customers" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Users className="h-3.5 w-3.5" />} label="Active Customers" value={reseller.active_customers.toString()} />
                  <DrawerField icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Total Orders" value={reseller.total_orders.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <p className="text-[11px] text-[#9CA3AF] text-center py-6">Customer list available in the main Customers module</p>
              </TabsContent>

              {/* Wallet */}
              <TabsContent value="wallet" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Wallet className="h-3.5 w-3.5" />} label="Wallet Balance" value={`$${reseller.wallet_balance.toLocaleString()}`} />
                  <DrawerField icon={<CreditCard className="h-3.5 w-3.5" />} label="Credit Limit" value={`$${reseller.credit_limit.toLocaleString()}`} />
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Wallet Utilization</span>
                    <span className="text-[11px] font-mono text-[#1A1A1A]">{walletPct}%</span>
                  </div>
                  <div className="w-full bg-[#F3F0EB] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${walletPct > 50 ? 'bg-emerald-500' : walletPct > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.max(walletPct, 0), 100)}%` }}
                    />
                  </div>
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Settlement Model" value={reseller.settlement_model} />
                  <MetaField label="Pricing Plan" value={reseller.default_pricing_plan} />
                </div>
              </TabsContent>

              {/* Pricing */}
              <TabsContent value="pricing" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Pricing Plan" value={reseller.default_pricing_plan} />
                  <MetaField label="Settlement Model" value={reseller.settlement_model.charAt(0).toUpperCase() + reseller.settlement_model.slice(1)} />
                  <MetaField label="Monthly Revenue" value={`$${reseller.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Monthly Margin" value={`$${reseller.monthly_margin.toLocaleString()}`} />
                  <MetaField label="Margin %" value={`${marginPct}%`} />
                  <MetaField label="Total Orders" value={reseller.total_orders.toLocaleString()} />
                </div>
              </TabsContent>

              {/* Branding */}
              <TabsContent value="branding" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="White-Label Status" value={reseller.white_label_enabled ? 'Enabled' : 'Disabled'} />
                  <MetaField label="Storefront Readiness" value={reseller.white_label_enabled ? 'Ready' : 'Not configured'} />
                </div>
                {reseller.white_label_enabled ? (
                  <>
                    <Separator className="bg-[#F3F0EB]" />
                    <div className="grid grid-cols-2 gap-3">
                      <MetaField label="Custom Domain" value={`${reseller.company_name.toLowerCase().replace(/\s+/g, '')}.esim.shop`} />
                      <MetaField label="Brand Theme" value="Custom" />
                      <MetaField label="Logo" value="Uploaded" />
                      <MetaField label="Favicon" value="Uploaded" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      White-label storefront is live and configured
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB] text-[11px] text-[#9CA3AF]">
                    <Palette className="h-3.5 w-3.5" />
                    White-label not enabled for this reseller
                  </div>
                )}
              </TabsContent>

              {/* Support */}
              <TabsContent value="support" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Support SLA" value={reseller.support_sla} />
                  <MetaField label="Monthly Tickets" value={`${reseller.support_volume} tickets`} />
                  <MetaField label="Active Customers" value={reseller.active_customers.toString()} />
                  <MetaField label="Last Activity" value={reseller.updated_at} />
                </div>
                {reseller.support_volume > 15 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    <Headphones className="h-3.5 w-3.5" />
                    Above-average support volume — review escalation patterns
                  </div>
                )}
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
