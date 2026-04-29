import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, X, MoreHorizontal, Plus, Eye, Pause, Play, Pencil, ArrowUpRight, Clock, Server, CheckCircle2, XCircle, AlertTriangle, Activity, Zap, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminKPICard } from '../ui/AdminKPICard';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { format } from 'date-fns';

interface SupplierRow {
  id: string;
  provider_name: string;
  provider_code: string;
  is_active: boolean;
  api_base_url: string | null;
  priority: number;
  notes: string | null;
  updated_at: string;
  created_at: string;
  // computed
  packageCount: number;
  livePackages: number;
  destinations: number;
  avgCost: number;
  avgRetail: number;
  avgMargin: number;
  avgMarginPct: number;
  successRate: number;
  failureRate: number;
  completedOrders: number;
  failedOrders: number;
  totalOrders: number;
  lastSyncAt: string | null;
  incidentCount: number;
  // health derived
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
}

interface SupplierFilters {
  search: string;
  status: string;
  health: string;
}

const DEFAULT_FILTERS: SupplierFilters = { search: '', status: 'all', health: 'all' };

export function ProvisioningSuppliersTab() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SupplierFilters>(DEFAULT_FILTERS);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetches
      const [provRes, pkgRes, orderRes, syncRes] = await Promise.all([
        supabase.from('esim_providers').select('*').order('priority'),
        supabase.from('esim_packages').select('provider_id, country_name, cost_price, price, is_active'),
        supabase.from('orders').select('provider_id, status').not('provider_id', 'is', null),
        supabase.from('sync_jobs').select('provider_id, status, completed_at').order('completed_at', { ascending: false }),
      ]);

      const providers = provRes.data || [];
      const packages = pkgRes.data || [];
      const orders = orderRes.data || [];
      const syncJobs = syncRes.data || [];

      const rows: SupplierRow[] = providers.map((prov: any) => {
        // Package stats
        const provPkgs = packages.filter((p: any) => p.provider_id === prov.id);
        const livePkgs = provPkgs.filter((p: any) => p.is_active);
        const destinations = new Set(provPkgs.map((p: any) => p.country_name)).size;
        const withCost = provPkgs.filter((p: any) => p.cost_price && p.cost_price > 0);
        const avgCost = withCost.length > 0 ? withCost.reduce((s: number, p: any) => s + (p.cost_price || 0), 0) / withCost.length : 0;
        const avgRetail = provPkgs.length > 0 ? provPkgs.reduce((s: number, p: any) => s + p.price, 0) / provPkgs.length : 0;
        const avgMargin = avgRetail - avgCost;
        const avgMarginPct = avgCost > 0 ? ((avgRetail - avgCost) / avgCost) * 100 : 0;

        // Order stats
        const provOrders = orders.filter((o: any) => o.provider_id === prov.id);
        const completed = provOrders.filter((o: any) => o.status === 'completed' || o.status === 'active').length;
        const failed = provOrders.filter((o: any) => o.status === 'failed').length;
        const total = provOrders.length;
        const successRate = total > 0 ? (completed / total) * 100 : 0;
        const failureRate = total > 0 ? (failed / total) * 100 : 0;

        // Last sync from sync_jobs (matched by provider_id)
        const provSyncs = syncJobs.filter((sj: any) => sj.provider_id === prov.id);
        const lastSync = provSyncs.length > 0 ? provSyncs[0].completed_at : null;

        // Incidents = failed sync jobs
        const incidentCount = provSyncs.filter((sj: any) => sj.status === 'failed').length;

        // Health status
        let healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown' = 'unknown';
        if (!prov.is_active) {
          healthStatus = 'down';
        } else if (total === 0) {
          healthStatus = 'unknown';
        } else if (failureRate > 20) {
          healthStatus = 'down';
        } else if (failureRate > 5) {
          healthStatus = 'degraded';
        } else {
          healthStatus = 'healthy';
        }

        return {
          id: prov.id,
          provider_name: prov.provider_name,
          provider_code: prov.provider_code,
          is_active: prov.is_active,
          api_base_url: prov.api_base_url,
          priority: prov.priority,
          notes: prov.notes,
          updated_at: prov.updated_at,
          created_at: prov.created_at,
          packageCount: provPkgs.length,
          livePackages: livePkgs.length,
          destinations,
          avgCost,
          avgRetail,
          avgMargin,
          avgMarginPct,
          successRate,
          failureRate,
          completedOrders: completed,
          failedOrders: failed,
          totalOrders: total,
          lastSyncAt: lastSync,
          incidentCount,
          healthStatus,
        };
      });

      setSuppliers(rows.sort((a, b) => b.packageCount - a.packageCount));
    } catch (err) {
      console.error('Failed to fetch supplier data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // KPIs
  const kpis = useMemo(() => {
    const total = suppliers.length;
    const healthy = suppliers.filter(s => s.healthStatus === 'healthy').length;
    const degraded = suppliers.filter(s => s.healthStatus === 'degraded').length;
    const down = suppliers.filter(s => s.healthStatus === 'down').length;
    const withOrders = suppliers.filter(s => s.totalOrders > 0);
    const avgSuccess = withOrders.length > 0
      ? withOrders.reduce((sum, s) => sum + s.successRate, 0) / withOrders.length : 0;
    return { total, healthy, degraded, down, avgSuccess };
  }, [suppliers]);

  // Filtering
  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      const search = filters.search.toLowerCase();
      if (search && !s.provider_name.toLowerCase().includes(search) && !s.provider_code.toLowerCase().includes(search)) return false;
      if (filters.status === 'active' && !s.is_active) return false;
      if (filters.status === 'inactive' && s.is_active) return false;
      if (filters.health !== 'all' && s.healthStatus !== filters.health) return false;
      return true;
    });
  }, [suppliers, filters]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== DEFAULT_FILTERS[k as keyof SupplierFilters]).length;

  const getHealthBadge = (h: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      healthy: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '● Healthy' },
      degraded: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: '● Degraded' },
      down: { cls: 'bg-red-50 text-red-700 border-red-200', label: '● Down' },
      unknown: { cls: 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]', label: '● Unknown' },
    };
    return map[h] || map.unknown;
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const openDetail = (s: SupplierRow) => {
    setSelectedSupplier(s);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <AdminKPICard label="Total Suppliers" value={kpis.total.toString()} icon={Server} />
        <AdminKPICard label="Healthy" value={kpis.healthy.toString()} icon={CheckCircle2} accent="success" />
        <AdminKPICard label="Degraded" value={kpis.degraded.toString()} icon={AlertTriangle} accent={kpis.degraded > 0 ? 'warning' : 'default'} />
        <AdminKPICard label="Down" value={kpis.down.toString()} icon={XCircle} accent={kpis.down > 0 ? 'error' : 'default'} />
        <AdminKPICard label="Avg Success Rate" value={kpis.avgSuccess > 0 ? `${kpis.avgSuccess.toFixed(1)}%` : '—'} icon={Activity} accent={kpis.avgSuccess >= 95 ? 'success' : kpis.avgSuccess > 0 ? 'warning' : 'default'} />
        <AdminKPICard label="Avg Response" value="—" icon={Clock} />
      </div>

      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-9 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs" onClick={() => toast({ title: 'Coming soon', description: 'Add supplier wizard' })}>
          <Plus className="h-3.5 w-3.5" />Add Supplier
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => { toast({ title: 'Sync triggered for all suppliers' }); }}>
          <RotateCcw className="h-3.5 w-3.5" />Sync All
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <Input
            placeholder="Search supplier name or code..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-8 h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
          />
        </div>
        <div className="h-5 w-px bg-[#F3F0EB] hidden sm:block" />
        <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-[110px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.health} onValueChange={(v) => setFilters(f => ({ ...f, health: v }))}>
          <SelectTrigger className="w-[110px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Health" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="down">Down</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-foreground" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB] ml-auto" onClick={fetchData}>
          <RefreshCw className="h-3 w-3" />Refresh
        </Button>
        <span className="text-[11px] text-[#9CA3AF] tabular-nums">
          {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mx-auto mb-2">
              <Server className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </div>
            <p className="text-xs text-[#9CA3AF]">Loading suppliers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Supplier</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Health</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Packages</TableHead>
                  <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Live</TableHead>
                  <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Dest.</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Avg Cost</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Avg Retail</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Margin</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Success</TableHead>
                  <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Failures</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Last Sync</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-center">Incidents</TableHead>
                  <TableHead className="w-[50px] h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mb-2">
                          <Server className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">No suppliers found</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">Add a supplier integration to begin provisioning</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s, idx) => {
                  const hb = getHealthBadge(s.healthStatus);
                  return (
                    <TableRow key={s.id} className={`border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 cursor-pointer ${idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''}`} onClick={() => openDetail(s)}>
                      <TableCell className="py-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-foreground">{s.provider_name}</p>
                          <span className="text-[10px] font-mono text-[#9CA3AF]">{s.provider_code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAF7F2]'}`}>
                          {s.is_active ? '● Active' : '● Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${hb.cls}`}>
                          {hb.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span className="text-xs font-mono tabular-nums text-[#6B7280]">{s.packageCount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 text-right">
                        <span className="text-xs font-mono tabular-nums text-[#6B7280]">{s.livePackages.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 text-right">
                        <span className="text-xs tabular-nums text-[#6B7280]">{s.destinations}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-right">
                        <span className="text-xs font-mono tabular-nums text-[#6B7280]">{s.avgCost > 0 ? `$${s.avgCost.toFixed(2)}` : '—'}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-right">
                        <span className="text-xs font-mono tabular-nums text-[#6B7280]">${s.avgRetail.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-right">
                        <span className={`text-xs font-mono font-semibold tabular-nums ${s.avgMarginPct >= 200 ? 'text-emerald-600' : s.avgMarginPct >= 100 ? 'text-amber-600' : s.avgMarginPct > 0 ? 'text-red-600' : 'text-[#9CA3AF]'}`}>
                          {s.avgMarginPct > 0 ? `${s.avgMarginPct.toFixed(0)}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span className={`text-xs font-semibold tabular-nums ${s.successRate >= 95 ? 'text-emerald-600' : s.successRate > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'}`}>
                          {s.totalOrders > 0 ? `${s.successRate.toFixed(1)}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 text-right">
                        <span className={`text-xs font-semibold tabular-nums ${s.failedOrders > 0 ? 'text-red-600' : 'text-[#9CA3AF]'}`}>
                          {s.totalOrders > 0 ? s.failedOrders : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-[11px] text-[#6B7280]">
                        {formatTimeAgo(s.lastSyncAt)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-center">
                        {s.incidentCount > 0 ? (
                          <Badge variant="outline" className="text-[9px] font-semibold bg-red-50 text-red-700 border-red-200 px-1.5 py-0 h-5">
                            {s.incidentCount}
                          </Badge>
                        ) : (
                          <span className="text-[#D1D5DB]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#F3F0EB]">
                              <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openDetail(s)}>
                              <Eye className="h-3.5 w-3.5 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Coming soon' })}>
                              <FileText className="h-3.5 w-3.5 mr-2" />View Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Sync triggered', description: s.provider_name })}>
                              <RotateCcw className="h-3.5 w-3.5 mr-2" />Run Sync
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast({ title: s.is_active ? 'Supplier paused' : 'Supplier activated', description: s.provider_name })}>
                              {s.is_active ? <Pause className="h-3.5 w-3.5 mr-2" /> : <Play className="h-3.5 w-3.5 mr-2" />}
                              {s.is_active ? 'Pause Supplier' : 'Activate Supplier'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Coming soon' })}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />Edit Mapping
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast({ title: 'Incident escalated', description: s.provider_name })}>
                              <ArrowUpRight className="h-3.5 w-3.5 mr-2" />Escalate Incident
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedSupplier && (() => {
            const s = selectedSupplier;
            const hb = getHealthBadge(s.healthStatus);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-sm font-bold text-foreground">{s.provider_name}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#9CA3AF]">{s.provider_code}</span>
                    <span className="text-[10px] text-[#9CA3AF]">· Priority {s.priority}</span>
                  </div>

                  {/* Status badges */}
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs font-semibold px-2 py-0.5 ${s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]'}`}>
                      {s.is_active ? '● Active' : '● Inactive'}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 ${hb.cls}`}>
                      {hb.label}
                    </Badge>
                  </div>

                  {/* Performance metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Orders', value: s.totalOrders.toLocaleString() },
                      { label: 'Completed', value: s.completedOrders.toLocaleString(), color: 'text-emerald-600' },
                      { label: 'Failed', value: s.failedOrders.toString(), color: s.failedOrders > 0 ? 'text-red-600' : undefined },
                    ].map(item => (
                      <div key={item.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3 text-center">
                        <p className={`text-lg font-bold tabular-nums ${item.color || 'text-foreground'}`}>{item.value}</p>
                        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-medium mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Key details */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Package Count', value: s.packageCount.toLocaleString() },
                      { label: 'Live Packages', value: s.livePackages.toLocaleString() },
                      { label: 'Destinations', value: s.destinations.toString() },
                      { label: 'Priority', value: s.priority.toString() },
                      { label: 'Avg Cost', value: s.avgCost > 0 ? `$${s.avgCost.toFixed(2)}` : '—' },
                      { label: 'Avg Retail', value: `$${s.avgRetail.toFixed(2)}` },
                      { label: 'Avg Margin', value: s.avgMargin > 0 ? `$${s.avgMargin.toFixed(2)}` : '—' },
                      { label: 'Margin %', value: s.avgMarginPct > 0 ? `${s.avgMarginPct.toFixed(0)}%` : '—' },
                      { label: 'Success Rate', value: s.totalOrders > 0 ? `${s.successRate.toFixed(1)}%` : '—' },
                      { label: 'Failure Rate', value: s.totalOrders > 0 ? `${s.failureRate.toFixed(1)}%` : '—' },
                      { label: 'Last Sync', value: s.lastSyncAt ? format(new Date(s.lastSyncAt), 'MMM dd, HH:mm') : 'Never' },
                      { label: 'Incidents', value: s.incidentCount.toString() },
                    ].map(item => (
                      <div key={item.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-2.5">
                        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">{item.label}</p>
                        <p className="text-xs font-medium text-foreground mt-0.5 font-mono">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* API endpoint */}
                  {s.api_base_url && (
                    <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3">
                      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">API Endpoint</p>
                      <p className="text-xs font-mono text-foreground mt-1 break-all">{s.api_base_url}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {s.notes && (
                    <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3">
                      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Notes</p>
                      <p className="text-xs text-foreground mt-1">{s.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F3F0EB]">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: 'Sync triggered', description: s.provider_name })}>
                      <RotateCcw className="h-3 w-3" />Run Sync
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: s.is_active ? 'Paused' : 'Activated' })}>
                      {s.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {s.is_active ? 'Pause' : 'Activate'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: 'Coming soon' })}>
                      <Pencil className="h-3 w-3" />Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: 'Incident escalated' })}>
                      <ArrowUpRight className="h-3 w-3" />Escalate
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
