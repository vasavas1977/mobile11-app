import { useState, useMemo } from 'react';
import {
  Search, Plus, ChevronRight, Globe, Users, Store, Wallet, Truck,
  TrendingUp, DollarSign, FileText, Building2, ShoppingCart, Headphones,
  MoreHorizontal, Eye, Pencil, Ban, CheckCircle2, Upload,
  CreditCard, MapPin, Shield,
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
import { Partner, PARTNER_TYPE_LABELS, STATUS_STYLES } from './types';

export function DistributorsPage() {
  const { isSampleMode } = usePartnerDataMode();
  const allPartners = isSampleMode ? SAMPLE_PARTNERS : [];
  const distributors = allPartners.filter(p => p.partner_type === 'distributor');

  const [search, setSearch] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedDist, setSelectedDist] = useState<Partner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Unique filter options ── */
  const territories = useMemo(() => [...new Set(distributors.map(d => d.territory))], [distributors]);
  const managers = useMemo(() => [...new Set(distributors.map(d => d.account_manager))], [distributors]);
  const plans = useMemo(() => [...new Set(distributors.map(d => d.default_pricing_plan))], [distributors]);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return distributors.filter(d => {
      if (search && !d.company_name.toLowerCase().includes(search.toLowerCase()) && !d.country.toLowerCase().includes(search.toLowerCase())) return false;
      if (territoryFilter !== 'all' && d.territory !== territoryFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (managerFilter !== 'all' && d.account_manager !== managerFilter) return false;
      if (planFilter !== 'all' && d.default_pricing_plan !== planFilter) return false;
      if (walletFilter === 'low' && d.wallet_balance >= d.credit_limit * 0.15) return false;
      if (walletFilter === 'healthy' && d.wallet_balance < d.credit_limit * 0.15) return false;
      if (contractFilter === 'active') {
        if (new Date(d.contract_end) <= new Date()) return false;
      }
      if (contractFilter === 'expiring') {
        const end = new Date(d.contract_end);
        const now = new Date();
        const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diff < 0 || diff > 90) return false;
      }
      if (contractFilter === 'expired') {
        if (new Date(d.contract_end) > new Date()) return false;
      }
      return true;
    });
  }, [distributors, search, territoryFilter, statusFilter, contractFilter, managerFilter, walletFilter, planFilter]);

  /* ── Helpers ── */
  const getResellers = (distId: string) => allPartners.filter(p => p.parent_partner_id === distId && p.partner_type === 'reseller');
  const getDownstream = (distId: string) => allPartners.filter(p => p.parent_partner_id === distId);

  /* ── KPIs ── */
  const metrics = useMemo(() => {
    const active = distributors.filter(d => d.status === 'active');
    const uniqueTerritories = new Set(active.map(d => d.territory)).size;
    const totalRevenue = distributors.reduce((s, d) => s + d.monthly_revenue, 0);
    const totalMargin = distributors.reduce((s, d) => s + d.monthly_margin, 0);
    const avgWallet = active.length > 0 ? active.reduce((s, d) => s + d.wallet_balance, 0) / active.length : 0;
    const pending = distributors.filter(d => d.status === 'pending').length;
    return { active: active.length, uniqueTerritories, totalRevenue, totalMargin, avgWallet, pending };
  }, [distributors]);

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Distributors', value: String(metrics.active), icon: Truck, accent: 'default' },
    { label: 'Exclusive Territories', value: String(metrics.uniqueTerritories), icon: MapPin, accent: 'default' },
    { label: 'Distributor Revenue', value: `$${(metrics.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, accent: 'success' },
    { label: 'Distributor Margin', value: `$${(metrics.totalMargin / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
    { label: 'Avg Wallet Balance', value: `$${(metrics.avgWallet / 1000).toFixed(1)}K`, icon: Wallet, accent: 'warning' },
    { label: 'Pending Contracts', value: String(metrics.pending), icon: FileText, accent: metrics.pending > 0 ? 'warning' : 'default' },
  ];

  const openDetail = (d: Partner) => {
    setSelectedDist(d);
    setDrawerOpen(true);
  };

  const getContractStatus = (d: Partner) => {
    const end = new Date(d.contract_end);
    const now = new Date();
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'Expired', style: 'bg-red-50 text-red-700 border-red-200' };
    if (diff < 90) return { label: 'Expiring Soon', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Active', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Distributors</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage country distributors, territories, and downstream resellers</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Distributor
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && distributors.length === 0 ? (
        <div className="space-y-4">
          <AdminEmptyState
            title="No distributors registered"
            description="Add your first country distributor to start managing territories and downstream resellers."
            actionLabel="Create Distributor"
            onAction={() => {}}
          />
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <Upload className="h-3.5 w-3.5 mr-1.5" />Import Distributor List
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {kpis.map((kpi) => (
              <AdminKPICard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <Input placeholder="Search distributors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Territory" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Territories</SelectItem>
                {territories.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Contract" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Manager" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Managers</SelectItem>
                {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Pricing Plan" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Company</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Territory</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Manager</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Wallet</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Credit Limit</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Contract</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Resellers</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Customers</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Orders</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Support</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const resellers = getResellers(d.id);
                    const cs = getContractStatus(d);
                    return (
                      <tr key={d.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                        <td className="px-4 py-3 cursor-pointer" onClick={() => openDetail(d)}>
                          <div className="font-medium text-[#1A1A1A]">{d.company_name}</div>
                          <div className="text-[11px] text-[#9CA3AF]">{d.country}</div>
                        </td>
                        <td className="px-4 py-3 text-[#6B7280] text-[12px]">{d.territory}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[d.status]}`}>{d.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#6B7280]">{d.account_manager}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-[#1A1A1A]">${d.wallet_balance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-[#9CA3AF]">${d.credit_limit.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280]">{d.default_pricing_plan}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] ${cs.style}`}>{cs.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-[12px] text-[#6B7280]">{resellers.length}</td>
                        <td className="px-4 py-3 text-right text-[12px] text-[#6B7280]">{d.active_customers}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-[#6B7280]">{d.total_orders.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-[#1A1A1A]">${d.monthly_revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-emerald-600">${d.monthly_margin.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[12px] text-[#6B7280]">{d.support_volume}</td>
                        <td className="px-3 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                                <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                              <DropdownMenuItem onClick={() => openDetail(d)} className="text-[12px] text-[#1A1A1A]">
                                <Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]">
                                <Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Edit Distributor
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]">
                                <Store className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Resellers
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]">
                                <Wallet className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Wallet
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]">
                                <FileText className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Contract
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                              {d.status === 'active' ? (
                                <DropdownMenuItem className="text-[12px] text-red-600">
                                  <Ban className="h-3.5 w-3.5 mr-2" />Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-[12px] text-emerald-600">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={15} className="text-center py-12 text-[#9CA3AF] text-[13px]">No distributors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Drawer */}
          <DistributorDetailDrawer
            distributor={selectedDist}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            allPartners={allPartners}
          />
        </>
      )}
    </div>
  );
}

/* ─── Detail Drawer ─────────────────────────────────────── */
function DistributorDetailDrawer({
  distributor, open, onOpenChange, allPartners,
}: {
  distributor: Partner | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allPartners: Partner[];
}) {
  if (!distributor) return null;

  const resellers = allPartners.filter(p => p.parent_partner_id === distributor.id && p.partner_type === 'reseller');
  const downstream = allPartners.filter(p => p.parent_partner_id === distributor.id);
  const marginPct = distributor.monthly_revenue > 0 ? ((distributor.monthly_margin / distributor.monthly_revenue) * 100).toFixed(1) : '0';
  const walletPct = distributor.credit_limit > 0 ? Math.round((distributor.wallet_balance / distributor.credit_limit) * 100) : 0;

  const contractEnd = new Date(distributor.contract_end);
  const now = new Date();
  const daysToExpiry = Math.ceil((contractEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{distributor.company_name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">Distributor · {distributor.territory} · {distributor.country}</SheetDescription>
              </div>
              <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[distributor.status]}`}>{distributor.status}</Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'resellers', 'wallet', 'pricing', 'contract', 'support'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={distributor.company_name} sub={distributor.contact_email} />
                  <DrawerField icon={<Globe className="h-3.5 w-3.5" />} label="Territory" value={distributor.territory} sub={distributor.country} />
                  <DrawerField icon={<Users className="h-3.5 w-3.5" />} label="Active Customers" value={distributor.active_customers.toString()} />
                  <DrawerField icon={<Store className="h-3.5 w-3.5" />} label="Downstream Resellers" value={String(resellers.length)} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Account Manager" value={distributor.account_manager} />
                  <MetaField label="Contact Phone" value={distributor.contact_phone} />
                  <MetaField label="Exclusivity" value="Exclusive" />
                  <MetaField label="Onboarding Status" value={distributor.status === 'active' ? 'Completed' : 'In Progress'} />
                  <MetaField label="White-Label" value={distributor.white_label_enabled ? 'Enabled' : 'Disabled'} />
                  <MetaField label="API Access" value={distributor.api_enabled ? 'Enabled' : 'Disabled'} />
                  <MetaField label="Support SLA" value={distributor.support_sla} />
                  <MetaField label="Settlement Model" value={distributor.settlement_model.charAt(0).toUpperCase() + distributor.settlement_model.slice(1)} />
                </div>
              </TabsContent>

              {/* Resellers Tab */}
              <TabsContent value="resellers" className="px-6 py-4 space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Downstream Resellers ({resellers.length})</h4>
                  <Button size="sm" className="h-7 text-[11px] bg-orange-500 hover:bg-orange-600 text-white rounded-md">
                    <Plus className="h-3 w-3 mr-1" />Add Reseller
                  </Button>
                </div>
                {resellers.length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF] text-center py-8">No resellers under this distributor</p>
                ) : (
                  <div className="space-y-2">
                    {resellers.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{r.company_name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{r.country} · {r.active_customers} customers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-mono text-[#1A1A1A]">${r.monthly_revenue.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 font-mono">${r.monthly_margin.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${STATUS_STYLES[r.status]}`}>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Wallet Tab */}
              <TabsContent value="wallet" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Wallet className="h-3.5 w-3.5" />} label="Wallet Balance" value={`$${distributor.wallet_balance.toLocaleString()}`} />
                  <DrawerField icon={<CreditCard className="h-3.5 w-3.5" />} label="Credit Limit" value={`$${distributor.credit_limit.toLocaleString()}`} />
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Wallet Utilization</span>
                    <span className="text-[11px] font-mono text-[#1A1A1A]">{walletPct}%</span>
                  </div>
                  <div className="w-full bg-[#F3F0EB] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${walletPct > 50 ? 'bg-emerald-500' : walletPct > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(walletPct, 100)}%` }}
                    />
                  </div>
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Settlement Model" value={distributor.settlement_model} />
                  <MetaField label="Pricing Plan" value={distributor.default_pricing_plan} />
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Pricing Plan" value={distributor.default_pricing_plan} />
                  <MetaField label="Settlement Model" value={distributor.settlement_model.charAt(0).toUpperCase() + distributor.settlement_model.slice(1)} />
                  <MetaField label="Monthly Revenue" value={`$${distributor.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Monthly Margin" value={`$${distributor.monthly_margin.toLocaleString()}`} />
                  <MetaField label="Margin %" value={`${marginPct}%`} />
                  <MetaField label="Total Orders" value={distributor.total_orders.toLocaleString()} />
                </div>
              </TabsContent>

              {/* Contract Tab */}
              <TabsContent value="contract" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Contract Start" value={distributor.contract_start} />
                  <MetaField label="Contract End" value={distributor.contract_end} />
                  <MetaField label="Days to Expiry" value={daysToExpiry > 0 ? `${daysToExpiry} days` : 'Expired'} />
                  <MetaField label="Contact Email" value={distributor.contact_email} />
                  <MetaField label="Contact Phone" value={distributor.contact_phone} />
                </div>
                {daysToExpiry <= 90 && daysToExpiry > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    <FileText className="h-3.5 w-3.5" />
                    Contract expires in {daysToExpiry} days — consider renewal
                  </div>
                )}
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Support SLA" value={distributor.support_sla} />
                  <MetaField label="Monthly Tickets" value={`${distributor.support_volume} tickets`} />
                  <MetaField label="Active Customers" value={distributor.active_customers.toString()} />
                  <MetaField label="Total Orders" value={distributor.total_orders.toLocaleString()} />
                </div>
                {distributor.support_volume > 30 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    <Headphones className="h-3.5 w-3.5" />
                    High support volume — review escalation patterns
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

/* ─── Field Helpers ──────────────────────────────────────── */
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
