import { useState, useMemo } from 'react';
import {
  Search, Plus, Building2, Users, ShoppingCart, Wallet,
  TrendingUp, AlertTriangle, FileText, MoreHorizontal,
  Clock, Shield, Phone, Mail, MapPin, ChevronRight,
  DollarSign, HeadphonesIcon, Eye, Pencil, Ban, CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SampleModeActionGuard, SampleModeBadge } from './SampleModeGuards';
import { Progress } from '@/components/ui/progress';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_PARTNERS } from './sampleData';
import { STATUS_STYLES, type Partner } from './types';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ── Helpers ─────────────────────────────────────────────────
function contractStatus(end: string) {
  const d = new Date(end);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / 86_400_000;
  if (diff < 0) return 'Expired';
  if (diff < 60) return 'Expiring';
  return 'Active';
}

const CONTRACT_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Expiring: 'bg-amber-50 text-amber-700 border-amber-200',
  Expired: 'bg-red-50 text-red-700 border-red-200',
};

// ── Main Page ───────────────────────────────────────────────
export function CorporateAccountsPage() {
  const { isSampleMode } = usePartnerDataMode();
  const corporates = useMemo(
    () => (isSampleMode ? SAMPLE_PARTNERS : []).filter(p => p.partner_type === 'corporate'),
    [isSampleMode],
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [selected, setSelected] = useState<Partner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const countries = useMemo(() => [...new Set(corporates.map(c => c.country))].sort(), [corporates]);
  const plans = useMemo(() => [...new Set(corporates.map(c => c.default_pricing_plan))].sort(), [corporates]);

  const filtered = useMemo(() => {
    return corporates.filter(c => {
      if (search && !c.company_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (countryFilter !== 'all' && c.country !== countryFilter) return false;
      if (contractFilter !== 'all' && contractStatus(c.contract_end) !== contractFilter) return false;
      if (planFilter !== 'all' && c.default_pricing_plan !== planFilter) return false;
      if (walletFilter === 'low' && c.wallet_balance >= c.credit_limit * 0.15) return false;
      if (walletFilter === 'negative' && c.wallet_balance >= 0) return false;
      if (walletFilter === 'healthy' && c.wallet_balance < c.credit_limit * 0.15) return false;
      return true;
    });
  }, [corporates, search, statusFilter, countryFilter, contractFilter, planFilter, walletFilter]);

  const active = corporates.filter(c => c.status === 'active');
  const totalRevenue = active.reduce((s, c) => s + c.monthly_revenue, 0);
  const totalMargin = active.reduce((s, c) => s + c.monthly_margin, 0);
  const totalUsers = corporates.reduce((s, c) => s + c.active_customers, 0);
  const openSupport = corporates.reduce((s, c) => s + c.support_volume, 0);
  const pendingRenewals = corporates.filter(c => contractStatus(c.contract_end) === 'Expiring').length;

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Accounts', value: String(active.length), icon: Building2, accent: 'default' },
    { label: 'Corporate Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, accent: 'success' },
    { label: 'Corporate Margin', value: `$${(totalMargin / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
    { label: 'Active Users', value: totalUsers.toLocaleString(), icon: Users, accent: 'default' },
    { label: 'Support Cases', value: String(openSupport), icon: HeadphonesIcon, accent: openSupport > 20 ? 'warning' : 'default' },
    { label: 'Pending Renewals', value: String(pendingRenewals), icon: FileText, accent: pendingRenewals > 0 ? 'warning' : 'default' },
  ];

  const openDetail = (c: Partner) => { setSelected(c); setDrawerOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Corporate Accounts</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage business customers, team plans, and enterprise billing</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Account
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && corporates.length === 0 ? (
        <AdminEmptyState
          title="No corporate accounts registered"
          description="Add your first corporate account to manage team plans and enterprise billing."
          actionLabel="Add Corporate Account"
          onAction={() => {}}
        />
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {kpis.map(kpi => <AdminKPICard key={kpi.label} {...kpi} />)}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Countries</SelectItem>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Contract" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Contracts</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Expiring">Expiring</SelectItem><SelectItem value="Expired">Expired</SelectItem></SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Plans</SelectItem>{plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={walletFilter} onValueChange={setWalletFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Wallet" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Wallets</SelectItem><SelectItem value="healthy">Healthy</SelectItem><SelectItem value="low">Low Balance</SelectItem><SelectItem value="negative">Negative</SelectItem></SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Company</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Country</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Billing</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Plan</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Users</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Orders</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Contract</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Support</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Activity</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={13} className="text-center py-12 text-[#9CA3AF] text-[13px]">No corporate accounts found</td></tr>
                  ) : filtered.map(c => {
                    const cs = contractStatus(c.contract_end);
                    return (
                      <tr key={c.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[12px] text-[#1A1A1A]">{c.company_name}</div>
                          <div className="text-[10px] text-[#9CA3AF]">{c.contact_email}</div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280]">{c.country}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280] capitalize">{c.settlement_model}</td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280]">{c.default_pricing_plan}</td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">{c.active_customers}</td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-[#6B7280]">{c.total_orders.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">${c.monthly_revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-emerald-600">${c.monthly_margin.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${CONTRACT_STYLES[cs]}`}>{cs}</Badge></td>
                        <td className="px-4 py-3 text-right text-[11px] text-[#6B7280]">{c.support_volume}</td>
                        <td className="px-4 py-3 text-[10px] text-[#9CA3AF] whitespace-nowrap">{c.updated_at}</td>
                        <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                                <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                              <DropdownMenuItem onClick={() => openDetail(c)} className="text-[12px] text-[#1A1A1A]"><Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Details</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Edit Account</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Users className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Users</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><ShoppingCart className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Orders</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><FileText className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Contract</DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                              <DropdownMenuItem className={`text-[12px] ${c.status === 'active' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {c.status === 'active' ? <><Ban className="h-3.5 w-3.5 mr-2" />Suspend</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Activate</>}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Drawer */}
          <CorporateDetailDrawer partner={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}

// ── Detail Drawer ───────────────────────────────────────────
function CorporateDetailDrawer({ partner, open, onOpenChange }: { partner: Partner | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!partner) return null;
  const c = partner;
  const cs = contractStatus(c.contract_end);
  const walletPct = c.credit_limit > 0 ? Math.max(0, Math.min(100, (c.wallet_balance / c.credit_limit) * 100)) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{c.company_name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">Corporate · {c.country} · {c.territory}</SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[c.status]}`}>{c.status}</Badge>
                <Badge variant="outline" className={`text-[10px] ${CONTRACT_STYLES[cs]}`}>{cs}</Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'users', 'billing', 'pricing', 'contract', 'support'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={c.company_name} sub={c.contact_email} />
                  <DrawerField icon={<MapPin className="h-3.5 w-3.5" />} label="Country" value={`${c.country} · ${c.territory}`} />
                  <DrawerField icon={<Users className="h-3.5 w-3.5" />} label="Active Users" value={c.active_customers.toString()} />
                  <DrawerField icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Total Orders" value={c.total_orders.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Account Manager" value={c.account_manager} />
                  <MetaField label="Support SLA" value={c.support_sla} />
                  <MetaField label="Contact Phone" value={c.contact_phone} />
                  <MetaField label="Settlement Model" value={c.settlement_model.charAt(0).toUpperCase() + c.settlement_model.slice(1)} />
                  {c.parent_partner_name && <MetaField label="Managed by" value={c.parent_partner_name} />}
                </div>
              </TabsContent>

              <TabsContent value="users" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Users className="h-3.5 w-3.5" />} label="Active Users" value={c.active_customers.toString()} />
                  <DrawerField icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Total Orders" value={c.total_orders.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <p className="text-[11px] text-[#9CA3AF] text-center py-6">Individual user management is available in the Organization module.</p>
              </TabsContent>

              <TabsContent value="billing" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Wallet className="h-3.5 w-3.5" />} label="Wallet Balance" value={`$${c.wallet_balance.toLocaleString()}`} />
                  <DrawerField icon={<TrendingUp className="h-3.5 w-3.5" />} label="Credit Limit" value={`$${c.credit_limit.toLocaleString()}`} />
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Wallet Utilization</span>
                    <span className="text-[11px] font-mono text-[#1A1A1A]">{walletPct.toFixed(0)}%</span>
                  </div>
                  <Progress value={walletPct} className="h-1.5" />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Monthly Revenue" value={`$${c.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Monthly Margin" value={`$${c.monthly_margin.toLocaleString()}`} />
                  <MetaField label="Settlement Model" value={c.settlement_model} />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Pricing Plan" value={c.default_pricing_plan} />
                  <MetaField label="Settlement Model" value={c.settlement_model.charAt(0).toUpperCase() + c.settlement_model.slice(1)} />
                  <MetaField label="Monthly Revenue" value={`$${c.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Monthly Margin" value={`$${c.monthly_margin.toLocaleString()}`} />
                </div>
              </TabsContent>

              <TabsContent value="contract" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Contract Start" value={c.contract_start} />
                  <MetaField label="Contract End" value={c.contract_end} />
                  <MetaField label="Status" value={cs} />
                  <MetaField label="Contact Email" value={c.contact_email} />
                </div>
                {cs === 'Expiring' && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    This contract is expiring soon. Consider initiating renewal.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="support" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Support SLA" value={c.support_sla} />
                  <MetaField label="Monthly Tickets" value={`${c.support_volume} tickets`} />
                  <MetaField label="Account Manager" value={c.account_manager} />
                  <MetaField label="Active Users" value={c.active_customers.toString()} />
                </div>
                {c.support_volume > 10 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    <HeadphonesIcon className="h-3.5 w-3.5" />
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
