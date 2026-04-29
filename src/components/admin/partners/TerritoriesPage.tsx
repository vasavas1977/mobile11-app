import { useState, useMemo } from 'react';
import {
  Search, Plus, Globe, MapPin, Shield, ShieldOff, ShieldAlert,
  MoreHorizontal, Users, TrendingUp, DollarSign, HeadphonesIcon,
  Clock, Mail, Phone, FileText, ChevronRight, Package, AlertTriangle,
  Eye, Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SampleModeActionGuard, SampleModeBadge } from './SampleModeGuards';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_TERRITORIES, type SampleTerritory } from './sampleData';
import { SAMPLE_PARTNERS } from './sampleData';

// ── Styles ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expiring: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  draft: 'bg-[#F9F7F4] text-[#6B7280] border-[#F3F0EB]',
  terminated: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-[#F9F7F4] text-[#9CA3AF] border-[#F3F0EB]',
};

const EXCL_CONFIG: Record<string, { icon: typeof Shield; label: string; color: string }> = {
  exclusive: { icon: Shield, label: 'Exclusive', color: 'text-orange-600' },
  semi_exclusive: { icon: ShieldAlert, label: 'Semi-Exclusive', color: 'text-amber-600' },
  non_exclusive: { icon: ShieldOff, label: 'Non-Exclusive', color: 'text-[#9CA3AF]' },
};

// ── Main Page ───────────────────────────────────────────────
export function TerritoriesPage() {
  const { isSampleMode } = usePartnerDataMode();
  const territories = useMemo(() => (isSampleMode ? SAMPLE_TERRITORIES : []), [isSampleMode]);

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [exclFilter, setExclFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [distFilter, setDistFilter] = useState('all');
  const [selected, setSelected] = useState<SampleTerritory | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const regions = useMemo(() => [...new Set(territories.map(t => t.region))].sort(), [territories]);
  const distributors = useMemo(() =>
    [...new Set(territories.filter(t => t.distributor_name).map(t => t.distributor_name!))].sort(),
    [territories],
  );

  const filtered = useMemo(() => {
    return territories.filter(t => {
      if (search && !t.territory_name.toLowerCase().includes(search.toLowerCase()) && !t.country_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (regionFilter !== 'all' && t.region !== regionFilter) return false;
      if (exclFilter !== 'all' && t.exclusivity_model !== exclFilter) return false;
      if (statusFilter !== 'all' && t.contract_status !== statusFilter) return false;
      if (distFilter !== 'all' && t.distributor_name !== distFilter) return false;
      return true;
    });
  }, [territories, search, regionFilter, exclFilter, statusFilter, distFilter]);

  const active = territories.filter(t => t.is_active);
  const exclusive = territories.filter(t => t.exclusivity_model === 'exclusive').length;
  const nonExclusive = territories.filter(t => t.exclusivity_model !== 'exclusive').length;
  const assignedDist = new Set(territories.filter(t => t.distributor_id).map(t => t.distributor_id)).size;
  const totalResellers = territories.reduce((s, t) => s + t.active_resellers, 0);
  const totalRevenue = territories.reduce((s, t) => s + t.monthly_revenue, 0);

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Total Territories', value: String(territories.length), icon: Globe, accent: 'default' },
    { label: 'Exclusive', value: String(exclusive), icon: Shield, accent: 'default' },
    { label: 'Non-Exclusive', value: String(nonExclusive), icon: ShieldOff, accent: 'default' },
    { label: 'Assigned Distributors', value: String(assignedDist), icon: Users, accent: 'default' },
    { label: 'Active Resellers', value: String(totalResellers), icon: Users, accent: 'default' },
    { label: 'Territory Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
  ];

  const openDetail = (t: SampleTerritory) => { setSelected(t); setDrawerOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Territories</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage country and regional commercial ownership</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Territory
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && territories.length === 0 ? (
        <AdminEmptyState
          title="No territories configured yet"
          description="Create your first territory to manage country-level operations, pricing, and partner assignments."
          actionLabel="Create First Territory"
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
              <Input placeholder="Search territories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Regions</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={exclFilter} onValueChange={setExclFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Exclusivity" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Models</SelectItem><SelectItem value="exclusive">Exclusive</SelectItem><SelectItem value="semi_exclusive">Semi-Exclusive</SelectItem><SelectItem value="non_exclusive">Non-Exclusive</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="expiring">Expiring</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
            </Select>
            <Select value={distFilter} onValueChange={setDistFilter}>
              <SelectTrigger className="w-[180px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Distributor" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]"><SelectItem value="all">All Distributors</SelectItem>{distributors.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Territory</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Region</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Model</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Distributor</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Resellers</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Currency</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Language</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Support</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={12} className="text-center py-12 text-[#9CA3AF] text-[13px]">No territories found</td></tr>
                  ) : filtered.map(t => {
                    const excl = EXCL_CONFIG[t.exclusivity_model] || EXCL_CONFIG.non_exclusive;
                    const ExclIcon = excl.icon;
                    return (
                      <tr key={t.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => openDetail(t)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                              {t.country_code}
                            </div>
                            <div>
                              <p className="font-medium text-[12px] text-[#1A1A1A]">{t.territory_name}</p>
                              <p className="text-[10px] text-[#9CA3AF]">{t.country_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280]">{t.region}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <ExclIcon className={`h-3.5 w-3.5 ${excl.color}`} />
                            <span className="text-[11px] text-[#6B7280]">{excl.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280]">{t.distributor_name || '—'}</td>
                        <td className="px-4 py-3 text-right text-[11px] text-[#1A1A1A]">{t.active_resellers}</td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280]">{t.local_currency}</td>
                        <td className="px-4 py-3 text-[11px] text-[#6B7280] uppercase">{t.default_language}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[t.contract_status] || ''}`}>{t.contract_status}</Badge></td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">${t.monthly_revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-emerald-600">${t.monthly_margin.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[11px] text-[#6B7280]">{t.monthly_support_tickets}</td>
                        <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                                <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                              <DropdownMenuItem onClick={() => openDetail(t)} className="text-[12px] text-[#1A1A1A]"><Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Details</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Edit Territory</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Users className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Assign Distributor</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Globe className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Partners</DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Package className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Package Access</DropdownMenuItem>
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
          <TerritoryDetailDrawer territory={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}

// ── Detail Drawer ───────────────────────────────────────────
function TerritoryDetailDrawer({ territory, open, onOpenChange }: { territory: SampleTerritory | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!territory) return null;
  const t = territory;
  const excl = EXCL_CONFIG[t.exclusivity_model] || EXCL_CONFIG.non_exclusive;
  const partners = SAMPLE_PARTNERS.filter(p => p.territory === t.region || p.country === t.country_name);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600">
                  {t.country_code}
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{t.territory_name}</SheetTitle>
                  <SheetDescription className="text-xs text-[#9CA3AF] mt-0.5">{t.region} · {t.country_name}</SheetDescription>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[t.contract_status] || ''}`}>{t.contract_status}</Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'partners', 'pricing', 'packages', 'support', 'contract'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Globe className="h-3.5 w-3.5" />} label="Country" value={t.country_name} />
                  <DrawerField icon={<MapPin className="h-3.5 w-3.5" />} label="Region" value={t.region} />
                  <DrawerField icon={<Shield className="h-3.5 w-3.5" />} label="Model" value={excl.label} />
                  <DrawerField icon={<DollarSign className="h-3.5 w-3.5" />} label="Currency" value={t.local_currency} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Language" value={t.default_language.toUpperCase()} />
                  <MetaField label="Distributor" value={t.distributor_name || 'Unassigned'} />
                  <MetaField label="Active Resellers" value={t.active_resellers.toString()} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div>
                  <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Channels</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {t.enabled_channels.map(ch => (
                      <Badge key={ch} variant="outline" className="text-[9px] bg-orange-50 text-orange-600 border-orange-200 capitalize">{ch}</Badge>
                    ))}
                  </div>
                </div>
                {(t.tax_notes || t.legal_notes) && (
                  <>
                    <Separator className="bg-[#F3F0EB]" />
                    <div className="grid grid-cols-1 gap-2">
                      {t.tax_notes && <MetaField label="Tax Notes" value={t.tax_notes} />}
                      {t.legal_notes && <MetaField label="Legal Notes" value={t.legal_notes} />}
                    </div>
                  </>
                )}
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Revenue/mo" value={`$${t.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Margin/mo" value={`$${t.monthly_margin.toLocaleString()}`} />
                  <MetaField label="Orders/mo" value={t.monthly_orders.toLocaleString()} />
                  <MetaField label="Support/mo" value={t.monthly_support_tickets.toString()} />
                </div>
              </TabsContent>

              <TabsContent value="partners" className="px-6 py-4 space-y-4 mt-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partners in {t.territory_name} ({partners.length})</span>
                {partners.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] text-center py-6">No partners assigned to this territory</p>
                ) : (
                  <div className="space-y-2">
                    {partners.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                        <div>
                          <p className="text-[12px] font-medium text-[#1A1A1A]">{p.company_name}</p>
                          <p className="text-[10px] text-[#9CA3AF] capitalize">{p.partner_type.replace('_', ' ')}</p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#F9F7F4] text-[#9CA3AF]'}`}>{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Currency" value={t.local_currency} />
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Territory-specific pricing rules can be configured in the Pricing Plans module.</p>
              </TabsContent>

              <TabsContent value="packages" className="px-6 py-4 space-y-4 mt-0">
                <p className="text-[11px] text-[#9CA3AF]">Package availability for this territory is managed in the Catalog module. All active packages for {t.country_name} are currently accessible.</p>
              </TabsContent>

              <TabsContent value="support" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Open Tickets" value={t.monthly_support_tickets.toString()} />
                  <MetaField label="Language" value={t.default_language.toUpperCase()} />
                </div>
              </TabsContent>

              <TabsContent value="contract" className="px-6 py-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Status" value={t.contract_status} />
                  <MetaField label="Start" value={new Date(t.start_date).toLocaleDateString()} />
                  <MetaField label="End" value={new Date(t.end_date).toLocaleDateString()} />
                </div>
                {t.contract_status === 'expiring' && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    This territory contract is expiring soon. Initiate renewal to avoid service disruption.
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
