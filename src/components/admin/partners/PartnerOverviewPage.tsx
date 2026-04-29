import { useState, useMemo } from 'react';
import {
  Search, Plus, ChevronRight, Building2, Globe, Wallet, Users, ShoppingCart,
  TrendingUp, Handshake, Truck, Store, Code, DollarSign, Headphones,
  AlertTriangle, FileText, Send, UserPlus, CreditCard, Eye,
  Briefcase, MapPin,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SampleModeActionGuard, SampleModeBadge } from './SampleModeGuards';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_PARTNERS } from './sampleData';
import { Partner, PARTNER_TYPE_LABELS, STATUS_STYLES } from './types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

/* ─── Quick Actions ───────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Create Partner', icon: Plus, color: 'bg-orange-50 text-orange-600' },
  { label: 'Invite Reseller', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
  { label: 'Create Distributor', icon: Truck, color: 'bg-violet-50 text-violet-600' },
  { label: 'Create API Partner', icon: Code, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'View Settlements', icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
  { label: 'Review Contracts', icon: FileText, color: 'bg-rose-50 text-rose-600' },
];

const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#6b7280'];

/* ─── Page ────────────────────────────────────────────── */
export function PartnerOverviewPage() {
  const { isSampleMode } = usePartnerDataMode();
  const partners = isSampleMode ? SAMPLE_PARTNERS : [];

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Derived metrics ── */
  const metrics = useMemo(() => {
    const active = partners.filter(p => p.status === 'active');
    const distributors = active.filter(p => p.partner_type === 'distributor');
    const resellers = active.filter(p => p.partner_type === 'reseller');
    const apiPartners = active.filter(p => p.partner_type === 'api_partner');
    const corporates = active.filter(p => p.partner_type === 'corporate');
    const pendingContracts = partners.filter(p => p.status === 'pending').length;
    const totalRevenue = partners.reduce((s, p) => s + p.monthly_revenue, 0);
    const totalMargin = partners.reduce((s, p) => s + p.monthly_margin, 0);
    const totalSupport = partners.reduce((s, p) => s + p.support_volume, 0);
    const lowWallet = partners.filter(p => p.status === 'active' && p.wallet_balance < p.credit_limit * 0.15).length;

    return {
      totalActive: active.length,
      distributors: distributors.length,
      resellers: resellers.length,
      apiPartners: apiPartners.length,
      corporates: corporates.length,
      pendingContracts,
      totalRevenue,
      totalMargin,
      totalSupport,
      lowWallet,
    };
  }, [partners]);

  /* ── Chart data ── */
  const partnerMixData = useMemo(() => {
    const types: Record<string, number> = {};
    partners.forEach(p => { types[PARTNER_TYPE_LABELS[p.partner_type]] = (types[PARTNER_TYPE_LABELS[p.partner_type]] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [partners]);

  const revenueByType = useMemo(() => {
    const rev: Record<string, number> = {};
    const mar: Record<string, number> = {};
    partners.forEach(p => {
      const label = PARTNER_TYPE_LABELS[p.partner_type];
      rev[label] = (rev[label] || 0) + p.monthly_revenue;
      mar[label] = (mar[label] || 0) + p.monthly_margin;
    });
    return Object.keys(rev).map(name => ({ name, revenue: rev[name], margin: mar[name] }));
  }, [partners]);

  const topPartners = useMemo(() =>
    [...partners].sort((a, b) => b.monthly_revenue - a.monthly_revenue).slice(0, 5),
    [partners]
  );

  const pendingPartners = useMemo(() =>
    partners.filter(p => p.status === 'pending'),
    [partners]
  );

  const lowWalletPartners = useMemo(() =>
    partners.filter(p => p.status === 'active' && p.wallet_balance < p.credit_limit * 0.15),
    [partners]
  );

  const territoryCoverage = useMemo(() => {
    const map: Record<string, { partners: number; revenue: number }> = {};
    partners.forEach(p => {
      if (!map[p.territory]) map[p.territory] = { partners: 0, revenue: 0 };
      map[p.territory].partners++;
      map[p.territory].revenue += p.monthly_revenue;
    });
    return Object.entries(map).map(([territory, d]) => ({ territory, ...d }));
  }, [partners]);

  const supportByType = useMemo(() => {
    const map: Record<string, number> = {};
    partners.forEach(p => {
      const label = PARTNER_TYPE_LABELS[p.partner_type];
      map[label] = (map[label] || 0) + p.support_volume;
    });
    return Object.entries(map).map(([name, volume]) => ({ name, volume }));
  }, [partners]);

  const filtered = useMemo(() => {
    return partners.filter(p => {
      if (search && !p.company_name.toLowerCase().includes(search.toLowerCase()) && !p.country.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && p.partner_type !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [partners, search, typeFilter, statusFilter]);

  const openDetail = (p: Partner) => {
    setSelectedPartner(p);
    setDrawerOpen(true);
  };

  /* ── KPI strip config ── */
  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Partners', value: String(metrics.totalActive), icon: Handshake, accent: 'default' },
    { label: 'Distributors', value: String(metrics.distributors), icon: Truck, accent: 'default' },
    { label: 'Resellers', value: String(metrics.resellers), icon: Store, accent: 'default' },
    { label: 'API Partners', value: String(metrics.apiPartners), icon: Code, accent: 'default' },
    { label: 'Corporate', value: String(metrics.corporates), icon: Briefcase, accent: 'default' },
    { label: 'Pending Contracts', value: String(metrics.pendingContracts), icon: FileText, accent: 'warning' },
    { label: 'Partner Revenue', value: `$${(metrics.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, accent: 'success' },
    { label: 'Partner Margin', value: `$${(metrics.totalMargin / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
    { label: 'Support Cases', value: String(metrics.totalSupport), icon: Headphones, accent: 'default' },
    { label: 'Low Wallet Alerts', value: String(metrics.lowWallet), icon: AlertTriangle, accent: metrics.lowWallet > 0 ? 'error' : 'default' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Partner Overview</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Executive view of the partner ecosystem — performance, health, and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm flex-shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Onboard Partner
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && partners.length === 0 ? (
        <AdminEmptyState
          title="No partners onboarded yet"
          description="Start by onboarding your first distributor, reseller, or API partner."
          actionLabel="Onboard Partner"
          onAction={() => {}}
        />
      ) : (
        <>
          {/* KPI Strip — 10 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {kpis.map((kpi) => (
              <AdminKPICard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
            <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors text-left"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${action.color}`}>
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-[#1A1A1A]">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Charts Row 1: Partner Mix + Revenue by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Partner Mix Pie */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
              <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Partner Mix</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnerMixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {partnerMixData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F3F0EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {partnerMixData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] text-[#6B7280]">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue & Margin by Type */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
              <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Revenue & Margin by Partner Type</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByType} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <RTooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F3F0EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      formatter={(v: number) => `$${v.toLocaleString()}`}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} name="Margin" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Top Partners + Pending Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Partners Leaderboard */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
              <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Top Partners by Revenue</h3>
              <div className="space-y-2">
                {topPartners.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => openDetail(p)}>
                    <span className="text-[11px] font-bold text-[#9CA3AF] w-5 text-center tabular-nums">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{p.company_name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{PARTNER_TYPE_LABELS[p.partner_type]} · {p.territory}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-[#1A1A1A] tabular-nums">${p.monthly_revenue.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-600 tabular-nums">${p.monthly_margin.toLocaleString()} margin</p>
                    </div>
                  </div>
                ))}
                {topPartners.length === 0 && (
                  <p className="text-[11px] text-[#9CA3AF] text-center py-6">No partner data</p>
                )}
              </div>
            </div>

            {/* Pending Approvals / Contracts */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
              <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Pending Approvals & Contracts</h3>
              {pendingPartners.length === 0 ? (
                <p className="text-[11px] text-[#9CA3AF] text-center py-6">No pending approvals</p>
              ) : (
                <div className="space-y-2">
                  {pendingPartners.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-amber-100 bg-amber-50/40">
                      <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{p.company_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{PARTNER_TYPE_LABELS[p.partner_type]} · Contract: {p.contract_start} → {p.contract_end}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Low Wallet Alerts + Territory Coverage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Low Wallet / Credit Risk */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
              <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Low Wallet / Credit Risk Alerts</h3>
              {lowWalletPartners.length === 0 ? (
                <p className="text-[11px] text-[#9CA3AF] text-center py-6">No active alerts</p>
              ) : (
                <div className="space-y-2">
                  {lowWalletPartners.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-red-100 bg-red-50/40">
                      <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{p.company_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Wallet: ${p.wallet_balance.toLocaleString()} / Limit: ${p.credit_limit.toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-200">Low Balance</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Territory Coverage */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
              <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Territory Coverage</h3>
              {territoryCoverage.length === 0 ? (
                <p className="text-[11px] text-[#9CA3AF] text-center py-6">No territory data</p>
              ) : (
                <div className="space-y-2">
                  {territoryCoverage.map(t => (
                    <div key={t.territory} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FAF7F2] transition-colors">
                      <div className="w-7 h-7 rounded-md bg-[#FAF7F2] flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-[#6B7280]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1A1A1A]">{t.territory}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{t.partners} partner{t.partners !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="text-[12px] font-bold text-[#1A1A1A] tabular-nums">${(t.revenue / 1000).toFixed(0)}K</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Support Load by Type */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
            <h3 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Support Load by Partner Type</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supportByType} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <RTooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F3F0EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(v: number) => `${v} tickets/mo`}
                  />
                  <Bar dataKey="volume" fill="#f97316" radius={[0, 4, 4, 0]} name="Support Volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <Input placeholder="Search partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]">
                <SelectValue placeholder="Partner Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="distributor">Distributors</SelectItem>
                <SelectItem value="reseller">Resellers</SelectItem>
                <SelectItem value="api_partner">API Partners</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partner Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Territory</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Wallet</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Customers</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] cursor-pointer transition-colors" onClick={() => openDetail(p)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1A1A1A]">{p.company_name}</div>
                        <div className="text-[11px] text-[#9CA3AF]">{p.country}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280]">{PARTNER_TYPE_LABELS[p.partner_type]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280]">{p.territory}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#1A1A1A]">${p.wallet_balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#1A1A1A]">${p.monthly_revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">${p.monthly_margin.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[#6B7280]">{p.active_customers}</td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-12 text-[#9CA3AF]">No partners found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Partner Detail Drawer */}
          <PartnerDetailDrawer partner={selectedPartner} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}

/* ─── Partner Detail Drawer ──────────────────────────── */
function PartnerDetailDrawer({ partner, open, onOpenChange }: { partner: Partner | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!partner) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[520px] lg:w-[600px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{partner.company_name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">{PARTNER_TYPE_LABELS[partner.partner_type]} · {partner.territory}</SheetDescription>
              </div>
              <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[partner.status]}`}>{partner.status}</Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  <TabsTrigger value="overview" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Overview</TabsTrigger>
                  <TabsTrigger value="financial" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Financial</TabsTrigger>
                  <TabsTrigger value="operations" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Operations</TabsTrigger>
                  <TabsTrigger value="contract" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Contract</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DetailField icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={partner.company_name} sub={partner.contact_email} />
                  <DetailField icon={<Globe className="h-3.5 w-3.5" />} label="Territory" value={partner.territory} sub={partner.country} />
                  <DetailField icon={<Users className="h-3.5 w-3.5" />} label="Active Customers" value={partner.active_customers.toString()} />
                  <DetailField icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Total Orders" value={partner.total_orders.toLocaleString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetaField label="Account Manager" value={partner.account_manager} />
                  <MetaField label="Support SLA" value={partner.support_sla} />
                  <MetaField label="Pricing Plan" value={partner.default_pricing_plan} />
                  <MetaField label="Settlement" value={partner.settlement_model.charAt(0).toUpperCase() + partner.settlement_model.slice(1)} />
                  <MetaField label="White-Label" value={partner.white_label_enabled ? 'Enabled' : 'Disabled'} />
                  <MetaField label="API Access" value={partner.api_enabled ? 'Enabled' : 'Disabled'} />
                  {partner.parent_partner_name && <MetaField label="Parent Partner" value={partner.parent_partner_name} />}
                  <MetaField label="Support Volume" value={`${partner.support_volume} tickets/mo`} />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DetailField icon={<Wallet className="h-3.5 w-3.5" />} label="Wallet Balance" value={`$${partner.wallet_balance.toLocaleString()}`} />
                  <DetailField icon={<TrendingUp className="h-3.5 w-3.5" />} label="Credit Limit" value={`$${partner.credit_limit.toLocaleString()}`} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetaField label="Monthly Revenue" value={`$${partner.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Monthly Margin" value={`$${partner.monthly_margin.toLocaleString()}`} />
                  <MetaField label="Margin %" value={partner.monthly_revenue > 0 ? `${((partner.monthly_margin / partner.monthly_revenue) * 100).toFixed(1)}%` : '—'} />
                  <MetaField label="Settlement Model" value={partner.settlement_model} />
                </div>
              </TabsContent>

              <TabsContent value="operations" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetaField label="Active Customers" value={partner.active_customers.toString()} />
                  <MetaField label="Total Orders" value={partner.total_orders.toLocaleString()} />
                  <MetaField label="Support Volume" value={`${partner.support_volume} tickets/mo`} />
                  <MetaField label="Support SLA" value={partner.support_sla} />
                </div>
              </TabsContent>

              <TabsContent value="contract" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetaField label="Contract Start" value={partner.contract_start} />
                  <MetaField label="Contract End" value={partner.contract_end} />
                  <MetaField label="Contact Email" value={partner.contact_email} />
                  <MetaField label="Contact Phone" value={partner.contact_phone} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailField({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
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
