import { useState, useMemo } from 'react';
import {
  Search, Plus, DollarSign, Users, Layers, TrendingUp,
  MoreHorizontal, Copy, Download, Archive, Globe, Tag,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_PRICING_PLANS, SAMPLE_PARTNERS, type SamplePricingPlan } from './sampleData';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-[#F9F7F4] text-[#9CA3AF] border-[#F3F0EB]',
};

const MARGIN_TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed',
  tiered: 'Tiered',
};

export function PricingPlansPage() {
  const { isSampleMode } = usePartnerDataMode();
  const plans = useMemo(() => (isSampleMode ? SAMPLE_PRICING_PLANS : []), [isSampleMode]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<SamplePricingPlan | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return plans.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && p.partner_type !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [plans, search, typeFilter, statusFilter]);

  const activePlans = plans.filter(p => p.status === 'active').length;
  const totalAssigned = plans.reduce((s, p) => s + p.assigned_partners, 0);
  const withOverrides = plans.filter(p => p.override_count > 0).length;
  const avgMargin = plans.length > 0 ? (plans.reduce((s, p) => s + p.avg_margin, 0) / plans.length).toFixed(1) : '0';

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Plans', value: String(activePlans), icon: Tag, accent: 'default' },
    { label: 'Assigned Partners', value: String(totalAssigned), icon: Users, accent: 'default' },
    { label: 'Plans w/ Overrides', value: String(withOverrides), icon: Layers, accent: 'default' },
    { label: 'Avg Margin', value: `${avgMargin}%`, icon: TrendingUp, accent: 'success' },
  ];

  const openDetail = (p: SamplePricingPlan) => { setSelected(p); setDrawerOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Pricing Plans</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Configure pricing tiers, partner margins, and channel rules</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <Button variant="outline" size="sm" className="h-9 rounded-lg border-[#F3F0EB] text-[13px]">
            <Download className="h-3.5 w-3.5 mr-1.5" />Export
          </Button>
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 text-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Create Plan
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && plans.length === 0 ? (
        <AdminEmptyState
          title="No pricing plans configured"
          description="Create your first pricing plan to define partner discounts, margins, and channel scope."
          actionLabel="Create Pricing Plan"
          onAction={() => {}}
        />
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {kpis.map(kpi => <AdminKPICard key={kpi.label} {...kpi} />)}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <Input placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="api_partner">API Partner</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-white border-[#F3F0EB]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Plan Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partners</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Avg Margin</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Channel Scope</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Overrides</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Updated</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-[#9CA3AF] text-[13px]">No pricing plans found</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => openDetail(p)}>
                      <td className="px-4 py-3 font-medium text-[12px] text-[#1A1A1A]">{p.name}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280] capitalize">{p.tier}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">{p.assigned_partners}</td>
                      <td className="px-4 py-3 text-[11px] text-[#6B7280]">{MARGIN_TYPE_LABELS[p.margin_type]}</td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">{p.avg_margin}%</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {p.channel_scope.slice(0, 3).map(ch => (
                            <Badge key={ch} variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#F3F0EB] text-[#9CA3AF] capitalize">{ch}</Badge>
                          ))}
                          {p.channel_scope.length > 3 && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#F3F0EB] text-[#9CA3AF]">+{p.channel_scope.length - 3}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-[#1A1A1A]">{p.override_count > 0 ? p.override_count : '—'}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-[10px] text-[#9CA3AF]">{new Date(p.updated_at).toLocaleDateString()}</td>
                      <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                              <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                            <DropdownMenuItem onClick={() => openDetail(p)} className="text-[12px] text-[#1A1A1A]"><Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Plan</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Edit Plan</DropdownMenuItem>
                            <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Copy className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                            <DropdownMenuItem className="text-[12px] text-red-600"><Archive className="h-3.5 w-3.5 mr-2" />Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Drawer */}
          <PlanDetailDrawer plan={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
      )}
    </div>
  );
}

// ── Detail Drawer ───────────────────────────────────────────
function PlanDetailDrawer({ plan, open, onOpenChange }: { plan: SamplePricingPlan | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!plan) return null;
  const p = plan;
  const assignedPartners = SAMPLE_PARTNERS.filter(partner => partner.default_pricing_plan === p.name);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{p.name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">{p.tier} · {MARGIN_TYPE_LABELS[p.margin_type]}</SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                <Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280] capitalize">{p.tier}</Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'margins', 'channels', 'territory', 'partners'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Plan Name" value={p.name} />
                  <MetaField label="Partner Type" value={p.tier} />
                  <MetaField label="Margin Type" value={MARGIN_TYPE_LABELS[p.margin_type]} />
                  <MetaField label="Avg Margin" value={`${p.avg_margin}%`} />
                  <MetaField label="Discount" value={`${p.discount_pct}% off retail`} />
                  <MetaField label="Settlement" value={p.settlement} />
                  <MetaField label="Min Commitment" value={`$${p.min_commitment.toLocaleString()}/mo`} />
                </div>
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Assigned Partners" value={p.assigned_partners.toString()} />
                  <MetaField label="Overrides" value={p.override_count.toString()} />
                </div>
              </TabsContent>

              <TabsContent value="margins" className="px-6 py-4 space-y-5 mt-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Margin Structure</span>
                {[
                  { label: 'Retail Margin', value: p.margins.retail, color: 'bg-orange-500' },
                  { label: 'Reseller', value: p.margins.reseller, color: 'bg-blue-500' },
                  { label: 'Distributor', value: p.margins.distributor, color: 'bg-violet-500' },
                  { label: 'API Partner', value: p.margins.api_partner, color: 'bg-emerald-500' },
                  { label: 'Affiliate', value: p.margins.affiliate, color: 'bg-amber-500' },
                ].filter(m => m.value > 0).map(m => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#6B7280]">{m.label}</span>
                      <span className="font-mono font-medium text-[#1A1A1A]">{m.value}%</span>
                    </div>
                    <Progress value={m.value} className="h-1.5" />
                  </div>
                ))}
                <Separator className="bg-[#F3F0EB]" />
                <p className="text-[11px] text-[#9CA3AF]">
                  Retail price = Provider cost × 4.0x multiplier. Partner discount of <span className="font-mono font-medium text-[#1A1A1A]">{p.discount_pct}%</span> applied.
                </p>
              </TabsContent>

              <TabsContent value="channels" className="px-6 py-4 space-y-4 mt-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Channel Scope</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.channel_scope.map(ch => (
                    <Badge key={ch} variant="outline" className="text-[9px] bg-orange-50 text-orange-600 border-orange-200 capitalize">{ch}</Badge>
                  ))}
                </div>
                <p className="text-[11px] text-[#9CA3AF]">This plan applies to orders placed through the channels above.</p>
              </TabsContent>

              <TabsContent value="territory" className="px-6 py-4 space-y-4 mt-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Territory Scope</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.territory_rules.map(tr => (
                    <Badge key={tr} variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280]">
                      <Globe className="h-3 w-3 mr-1" />{tr}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Pricing applies to orders originating from or destined to these territories.</p>
              </TabsContent>

              <TabsContent value="partners" className="px-6 py-4 space-y-4 mt-0">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Assigned Partners ({assignedPartners.length})</span>
                {assignedPartners.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF]">No partners assigned to this plan.</p>
                ) : (
                  <div className="space-y-2">
                    {assignedPartners.map(partner => (
                      <div key={partner.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                        <div>
                          <p className="text-[12px] font-medium text-[#1A1A1A]">{partner.company_name}</p>
                          <p className="text-[10px] text-[#9CA3AF] capitalize">{partner.partner_type.replace('_', ' ')} · {partner.country}</p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${partner.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#F9F7F4] text-[#9CA3AF]'}`}>
                          {partner.status}
                        </Badge>
                      </div>
                    ))}
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
function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
      <p className="text-xs text-[#1A1A1A]">{value}</p>
    </div>
  );
}
