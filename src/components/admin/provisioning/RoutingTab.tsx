import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, RefreshCw, X, MoreHorizontal, Upload, Download, Plus, CheckCircle2, XCircle, Clock, Server, Activity, RotateCcw, Pause, Play, ExternalLink, Package, Eye, Zap, ShieldCheck, AlertTriangle, Filter, Bookmark, ChevronDown, Wifi, WifiOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { format } from 'date-fns';

interface RoutePackage {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  data_amount: string;
  validity_days: number;
  price: number;
  cost_price: number;
  package_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  carrier?: string;
  network_type?: string;
  package_type?: string;
  provider_id?: string;
  provider_code?: string;
  provider_name?: string;
  purchase_count: number;
  category?: string;
}

interface ProviderData {
  id: string;
  provider_code: string;
  provider_name: string;
  is_active: boolean;
  api_base_url: string | null;
  priority: number;
  notes: string | null;
  updated_at: string;
}

interface OrderStat {
  provider_id: string;
  total: number;
  completed: number;
  failed: number;
}

interface SyncJob {
  provider_id: string;
  status: string;
  completed_at: string | null;
}

const FILTER_PRESETS = [
  { label: 'All Routes', filters: { provider: 'all', status: 'all', health: 'all' } },
  { label: 'Unmapped', filters: { provider: 'all', status: 'unmapped', health: 'all' } },
  { label: 'Inactive', filters: { provider: 'all', status: 'inactive', health: 'all' } },
  { label: 'High Failure', filters: { provider: 'all', status: 'all', health: 'failing' } },
];

interface RoutingTabProps {
  onImportExcel: () => void;
  onSyncTuge: () => void;
  importing: boolean;
}

export function RoutingTab({ onImportExcel, onSyncTuge, importing }: RoutingTabProps) {
  const [packages, setPackages] = useState<RoutePackage[]>([]);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [orderStats, setOrderStats] = useState<Record<string, OrderStat>>({});
  const [syncJobs, setSyncJobs] = useState<Record<string, SyncJob>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerRoute, setDrawerRoute] = useState<RoutePackage | null>(null);
  const [drawerTab, setDrawerTab] = useState('summary');
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPackages(), fetchProviders(), fetchOrderStats(), fetchSyncJobs()]);
    setLoading(false);
  };

  const fetchPackages = async () => {
    try {
      const PAGE_SIZE = 1000;
      let from = 0;
      let all: RoutePackage[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('esim_packages')
          .select('*, esim_providers(id, provider_code, provider_name)')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const batch = (data || []).map((item: any) => ({
          ...item,
          provider_id: item.esim_providers?.id,
          provider_code: item.esim_providers?.provider_code,
          provider_name: item.esim_providers?.provider_name,
        }));
        all = all.concat(batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      setPackages(all);
    } catch (e) { console.error('Error fetching packages:', e); }
  };

  const fetchProviders = async () => {
    try {
      const { data } = await supabase.from('esim_providers').select('*').order('priority');
      setProviders((data || []) as ProviderData[]);
    } catch {}
  };

  const fetchOrderStats = async () => {
    try {
      const { data } = await supabase.from('orders').select('provider_id, status').not('provider_id', 'is', null);
      if (data) {
        const grouped: Record<string, OrderStat> = {};
        data.forEach((row: any) => {
          if (!row.provider_id) return;
          if (!grouped[row.provider_id]) grouped[row.provider_id] = { provider_id: row.provider_id, total: 0, completed: 0, failed: 0 };
          grouped[row.provider_id].total++;
          if (row.status === 'completed' || row.status === 'active') grouped[row.provider_id].completed++;
          if (row.status === 'failed' || row.status === 'cancelled') grouped[row.provider_id].failed++;
        });
        setOrderStats(grouped);
      }
    } catch {}
  };

  const fetchSyncJobs = async () => {
    try {
      const { data } = await supabase.from('sync_jobs').select('provider_id, status, completed_at').order('completed_at', { ascending: false });
      if (data) {
        const latest: Record<string, SyncJob> = {};
        data.forEach((row: any) => {
          if (row.provider_id && !latest[row.provider_id]) {
            latest[row.provider_id] = row;
          }
        });
        setSyncJobs(latest);
      }
    } catch {}
  };

  const uniqueProviders = useMemo(() => Array.from(new Set(packages.map(p => p.provider_name).filter(Boolean))).sort(), [packages]);

  const getRouteHealth = useCallback((pkg: RoutePackage): 'healthy' | 'degraded' | 'failing' | 'unknown' => {
    if (!pkg.provider_id) return 'unknown';
    const stats = orderStats[pkg.provider_id];
    if (!stats || stats.total === 0) return 'unknown';
    const failRate = stats.failed / stats.total;
    if (failRate > 0.15) return 'failing';
    if (failRate > 0.05) return 'degraded';
    return 'healthy';
  }, [orderStats]);

  const getFailureRate = useCallback((pkg: RoutePackage): number | null => {
    if (!pkg.provider_id) return null;
    const stats = orderStats[pkg.provider_id];
    if (!stats || stats.total === 0) return null;
    return (stats.failed / stats.total) * 100;
  }, [orderStats]);

  const getLastSync = useCallback((pkg: RoutePackage): string | null => {
    if (!pkg.provider_id) return null;
    return syncJobs[pkg.provider_id]?.completed_at || null;
  }, [syncJobs]);

  const getSyncStatus = useCallback((pkg: RoutePackage): string => {
    if (!pkg.provider_id) return 'unmapped';
    const job = syncJobs[pkg.provider_id];
    if (!job) return 'no_sync';
    return job.status || 'unknown';
  }, [syncJobs]);

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const search = searchTerm.toLowerCase();
      if (search && !(pkg.name.toLowerCase().includes(search) || pkg.country_name.toLowerCase().includes(search) || pkg.package_id.toLowerCase().includes(search) || (pkg.provider_name || '').toLowerCase().includes(search))) return false;
      if (providerFilter !== 'all' && pkg.provider_name !== providerFilter) return false;
      if (statusFilter === 'active' && !pkg.is_active) return false;
      if (statusFilter === 'inactive' && pkg.is_active) return false;
      if (statusFilter === 'unmapped' && pkg.provider_id) return false;
      if (healthFilter !== 'all') {
        const health = getRouteHealth(pkg);
        if (healthFilter !== health) return false;
      }
      return true;
    });
  }, [packages, searchTerm, providerFilter, statusFilter, healthFilter, getRouteHealth]);

  const totalPages = Math.ceil(filteredPackages.length / pageSize);
  const paginatedPackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, providerFilter, statusFilter, healthFilter]);

  const activeFilterCount = [providerFilter !== 'all', statusFilter !== 'all', healthFilter !== 'all'].filter(Boolean).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPackages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPackages.map(p => p.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    const count = selectedIds.size;
    toast({ title: `${action} — ${count} routes`, description: 'Action queued for processing' });
    setSelectedIds(new Set());
  };

  const applyPreset = (preset: typeof FILTER_PRESETS[0]) => {
    setProviderFilter(preset.filters.provider);
    setStatusFilter(preset.filters.status);
    setHealthFilter(preset.filters.health);
  };

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const source = selectedIds.size > 0 ? filteredPackages.filter(p => selectedIds.has(p.id)) : filteredPackages;
      const exportData = source.map(pkg => ({
        'Option ID': pkg.package_id, 'Name': pkg.name, 'Country': pkg.country_name,
        'Supplier': pkg.provider_name || 'Unmapped', 'Data': pkg.data_amount,
        'Validity': pkg.validity_days, 'Cost': pkg.cost_price, 'Price': pkg.price,
        'Active': pkg.is_active ? 'Yes' : 'No', 'Failure Rate': getFailureRate(pkg)?.toFixed(1) || 'N/A',
        'Last Sync': getLastSync(pkg) || 'N/A', 'Last Updated': pkg.updated_at,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Routes');
      XLSX.writeFile(wb, `routes-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Exported", description: `${exportData.length} routes` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const healthConfig: Record<string, { label: string; color: string }> = {
    healthy: { label: 'Healthy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    degraded: { label: 'Degraded', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    failing: { label: 'Failing', color: 'bg-red-50 text-red-700 border-red-200' },
    unknown: { label: 'No Data', color: 'bg-[#FAF7F2] text-[#6B7280] border-[#E8E4DE]' },
  };

  // KPI summary from real data
  const kpiSummary = useMemo(() => {
    const total = packages.length;
    const active = packages.filter(p => p.is_active).length;
    const unmapped = packages.filter(p => !p.provider_id).length;
    const healthCounts = { healthy: 0, degraded: 0, failing: 0, unknown: 0 };
    packages.forEach(p => { healthCounts[getRouteHealth(p)]++; });
    return { total, active, unmapped, ...healthCounts };
  }, [packages, getRouteHealth]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-[#F3F0EB] rounded-lg animate-pulse w-1/3" />
        <div className="h-64 bg-[#F3F0EB] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-3.5 w-3.5" />Import Routes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onImportExcel} disabled={importing}>
              <Upload className="h-3.5 w-3.5 mr-2" />Import Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSyncTuge}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />Sync TUGE API
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: "Retry sync triggered for failed routes" })}>
          <RotateCcw className="h-3.5 w-3.5" />Retry All Failed
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-[#E5E7EB]" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />Export
        </Button>

        {/* Bulk Actions — visible when rows are selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[#E5E7EB]">
            <span className="text-[11px] font-medium text-orange-600 tabular-nums">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-[#E5E7EB]" onClick={() => handleBulkAction('Retry Sync')}>
              <RotateCcw className="h-3 w-3 mr-1" />Retry Sync
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-[#E5E7EB]" onClick={() => handleBulkAction('Enable Fallback')}>
              <ShieldCheck className="h-3 w-3 mr-1" />Enable Fallback
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-[#E5E7EB]" onClick={handleExport}>
              <Download className="h-3 w-3 mr-1" />Export
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-[#E5E7EB]" onClick={() => handleBulkAction('Pause')}>
              <Pause className="h-3 w-3 mr-1" />Pause
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-[#E5E7EB]" onClick={() => handleBulkAction('Assign Supplier')}>
              <Server className="h-3 w-3 mr-1" />Assign Supplier
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-[#9CA3AF]" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Mini KPI chips */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium tabular-nums">{kpiSummary.healthy} healthy</span>
          {kpiSummary.degraded > 0 && <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium tabular-nums">{kpiSummary.degraded} degraded</span>}
          {kpiSummary.failing > 0 && <span className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium tabular-nums">{kpiSummary.failing} failing</span>}
          {kpiSummary.unmapped > 0 && <span className="text-[10px] px-2 py-1 rounded-full bg-[#FAF7F2] text-[#6B7280] border border-[#E8E4DE] font-medium tabular-nums">{kpiSummary.unmapped} unmapped</span>}
        </div>
      </div>

      {/* Filter bar with presets */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-3 space-y-2.5">
        {/* Preset chips */}
        <div className="flex items-center gap-1.5">
          <Bookmark className="h-3 w-3 text-[#9CA3AF]" />
          {FILTER_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                providerFilter === preset.filters.provider && statusFilter === preset.filters.status && healthFilter === preset.filters.health
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-[#FAFAF8] text-[#6B7280] border-[#E8E4DE] hover:bg-[#F3F0EB]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <Input placeholder="Search package, supplier, option ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]" />
          </div>
          <div className="h-5 w-px bg-[#F3F0EB] hidden sm:block" />
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Supplier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {uniqueProviders.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="unmapped">Unmapped</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Health" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
              <SelectItem value="failing">Failing</SelectItem>
              <SelectItem value="unknown">No Data</SelectItem>
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-foreground" onClick={() => { setProviderFilter('all'); setStatusFilter('all'); setHealthFilter('all'); setSearchTerm(''); }}>
              <X className="h-3 w-3 mr-1" />Clear ({activeFilterCount})
            </Button>
          )}
          <span className="text-[11px] text-[#9CA3AF] ml-auto tabular-nums">
            {filteredPackages.length === packages.length ? `${packages.length.toLocaleString()} routes` : `${filteredPackages.length.toLocaleString()} of ${packages.length.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Routing Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                <TableHead className="w-[40px] h-9 px-2">
                  <Checkbox
                    checked={paginatedPackages.length > 0 && selectedIds.size === paginatedPackages.length}
                    onCheckedChange={toggleSelectAll}
                    className="border-[#D1D5DB]"
                  />
                </TableHead>
                <TableHead className="min-w-[180px] h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Package</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Destination</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Supplier</TableHead>
                <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Product ID</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Route Status</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">API Health</TableHead>
                <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Sync</TableHead>
                <TableHead className="hidden xl:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Fail Rate</TableHead>
                <TableHead className="hidden xl:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Cost</TableHead>
                <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Last Sync</TableHead>
                <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Fallback</TableHead>
                <TableHead className="w-[50px] h-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPackages.map((pkg, idx) => {
                const health = getRouteHealth(pkg);
                const failRate = getFailureRate(pkg);
                const lastSync = getLastSync(pkg);
                const syncStatus = getSyncStatus(pkg);
                const isSelected = selectedIds.has(pkg.id);

                return (
                  <TableRow
                    key={pkg.id}
                    className={`border-b border-[#F3F0EB]/60 transition-colors cursor-pointer ${isSelected ? 'bg-orange-50/40' : idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''} hover:bg-[#FAF7F2]/70`}
                    onClick={() => setDrawerRoute(pkg)}
                  >
                    <TableCell className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(pkg.id)} className="border-[#D1D5DB]" />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-foreground truncate max-w-[200px] leading-tight">{pkg.name}</p>
                        <span className="text-[10px] text-[#9CA3AF]">{pkg.data_amount} · {pkg.validity_days}d</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-[11px] font-medium text-[#6B7280] bg-[#F3F0EB] rounded px-1.5 py-0.5">{pkg.country_name}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      {pkg.provider_name ? (
                        <Badge variant="outline" className={`text-[10px] font-medium ${pkg.provider_code === 'tuge' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {pkg.provider_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-200">Unmapped</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2">
                      <span className="text-[10px] font-mono text-[#9CA3AF] truncate max-w-[120px] block">{pkg.package_id}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <AdminStatusBadge status={pkg.is_active ? 'active' : 'inactive'} size="sm" />
                    </TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${healthConfig[health].color}`}>
                        {health === 'healthy' ? <Wifi className="h-2.5 w-2.5" /> : health === 'failing' ? <WifiOff className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
                        {healthConfig[health].label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2">
                      <AdminStatusBadge
                        status={syncStatus === 'completed' ? 'completed' : syncStatus === 'running' ? 'processing' : syncStatus === 'failed' ? 'failed' : 'pending'}
                        label={syncStatus === 'no_sync' ? 'No Sync' : syncStatus === 'unmapped' ? '—' : undefined}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell py-2 text-right">
                      {failRate !== null ? (
                        <span className={`text-[11px] font-mono font-medium tabular-nums ${failRate > 15 ? 'text-red-600' : failRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {failRate.toFixed(1)}%
                        </span>
                      ) : <span className="text-[10px] text-[#9CA3AF]">—</span>}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell py-2 text-right">
                      <span className="font-mono text-[11px] text-[#6B7280] tabular-nums">${pkg.cost_price.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2 text-[11px] text-[#6B7280]">
                      {formatTimeAgo(lastSync || pkg.updated_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2">
                      <span className={`text-[10px] font-medium ${!pkg.provider_id ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                        {!pkg.provider_id ? '—' : 'Off'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#F3F0EB]">
                            <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setDrawerRoute(pkg)}>
                            <Eye className="h-3.5 w-3.5 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "Retry sync queued", description: pkg.name })}>
                            <RotateCcw className="h-3.5 w-3.5 mr-2" />Retry Sync
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "Enable fallback", description: pkg.name })}>
                            <ShieldCheck className="h-3.5 w-3.5 mr-2" />Enable Fallback
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast({ title: "Change supplier", description: pkg.name })}>
                            <Server className="h-3.5 w-3.5 mr-2" />Change Supplier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "Pause route", description: pkg.name })}>
                            <Pause className="h-3.5 w-3.5 mr-2" />Pause Route
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(pkg.package_id);
                            toast({ title: "Copied", description: pkg.package_id });
                          }}>
                            <Copy className="h-3.5 w-3.5 mr-2" />Copy Product ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "View orders for this route" })}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />View Orders
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

        {filteredPackages.length === 0 && packages.length > 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mb-2">
              <Search className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">No routes match your filters</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Try adjusting your search or filter criteria</p>
          </div>
        )}
        {packages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mb-2">
              <Package className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">No provisioning routes</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Import packages from a supplier to set up routes</p>
            <Button size="sm" className="mt-2.5 h-7 text-[10px] bg-orange-500 hover:bg-orange-600 text-white" onClick={onImportExcel}>Import Packages</Button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F0EB]">
            <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
              <span className="tabular-nums">Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredPackages.length)} of {filteredPackages.length.toLocaleString()}</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="h-7 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-2 py-0.5 text-[11px] text-[#6B7280]">
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 border-[#E5E7EB] rounded-lg" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center px-2.5 text-[11px] font-medium text-[#6B7280] tabular-nums">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 border-[#E5E7EB] rounded-lg" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Route Detail Drawer */}
      <Sheet open={!!drawerRoute} onOpenChange={(open) => { if (!open) setDrawerRoute(null); }}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {drawerRoute && <RouteDetailDrawer route={drawerRoute} health={getRouteHealth(drawerRoute)} failRate={getFailureRate(drawerRoute)} lastSync={getLastSync(drawerRoute)} syncStatus={getSyncStatus(drawerRoute)} providers={providers} onClose={() => setDrawerRoute(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ============================================ */
/* Route Detail Drawer                          */
/* ============================================ */

function RouteDetailDrawer({ route, health, failRate, lastSync, syncStatus, providers, onClose }: {
  route: RoutePackage;
  health: string;
  failRate: number | null;
  lastSync: string | null;
  syncStatus: string;
  providers: ProviderData[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [relatedOrders, setRelatedOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount, provider_cost')
        .eq('package_id', route.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setRelatedOrders(data || []);
    };
    fetchOrders();
  }, [route.id]);

  const healthConfig: Record<string, { label: string; color: string }> = {
    healthy: { label: 'Healthy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    degraded: { label: 'Degraded', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    failing: { label: 'Failing', color: 'bg-red-50 text-red-700 border-red-200' },
    unknown: { label: 'No Data', color: 'bg-[#FAF7F2] text-[#6B7280] border-[#E8E4DE]' },
  };

  const hc = healthConfig[health] || healthConfig.unknown;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-base font-bold text-foreground">{route.name}</SheetTitle>
        <SheetDescription className="text-xs text-[#6B7280]">{route.country_name} · {route.data_amount} · {route.validity_days}d</SheetDescription>
      </SheetHeader>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-2.5 text-center">
          <p className="text-[10px] text-[#9CA3AF] uppercase font-medium">Status</p>
          <AdminStatusBadge status={route.is_active ? 'active' : 'inactive'} size="sm" className="mt-1" />
        </div>
        <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-2.5 text-center">
          <p className="text-[10px] text-[#9CA3AF] uppercase font-medium">Health</p>
          <span className={`inline-flex items-center mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${hc.color}`}>{hc.label}</span>
        </div>
        <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-2.5 text-center">
          <p className="text-[10px] text-[#9CA3AF] uppercase font-medium">Fail Rate</p>
          <p className={`text-sm font-bold mt-1 tabular-nums ${failRate !== null && failRate > 15 ? 'text-red-600' : failRate !== null && failRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {failRate !== null ? `${failRate.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="h-9 bg-[#F3F0EB] border border-[#E8E4DE] w-full">
          <TabsTrigger value="summary" className="text-[10px] flex-1 data-[state=active]:bg-white">Summary</TabsTrigger>
          <TabsTrigger value="health" className="text-[10px] flex-1 data-[state=active]:bg-white">Health</TabsTrigger>
          <TabsTrigger value="mapping" className="text-[10px] flex-1 data-[state=active]:bg-white">Mapping</TabsTrigger>
          <TabsTrigger value="incidents" className="text-[10px] flex-1 data-[state=active]:bg-white">Incidents</TabsTrigger>
          <TabsTrigger value="logs" className="text-[10px] flex-1 data-[state=active]:bg-white">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-3 space-y-3">
          <div className="space-y-2">
            {[
              ['Package ID', route.package_id],
              ['Supplier', route.provider_name || 'Unmapped'],
              ['Provider Code', route.provider_code || '—'],
              ['Category', route.category || '—'],
              ['Cost Price', `$${route.cost_price.toFixed(2)}`],
              ['Retail Price', `$${route.price.toFixed(2)}`],
              ['Margin', route.price > 0 ? `${(((route.price - route.cost_price) / route.price) * 100).toFixed(1)}%` : '—'],
              ['Carrier', route.carrier || '—'],
              ['Network', route.network_type || '—'],
              ['Package Type', route.package_type || '—'],
              ['Last Updated', route.updated_at ? format(new Date(route.updated_at), 'dd MMM yyyy HH:mm') : '—'],
              ['Created', route.created_at ? format(new Date(route.created_at), 'dd MMM yyyy') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#F3F0EB]/60">
                <span className="text-[11px] text-[#9CA3AF]">{label}</span>
                <span className="text-[11px] font-medium text-[#6B7280] text-right max-w-[200px] truncate">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="h-8 text-xs flex-1 border-[#E5E7EB]" onClick={() => toast({ title: "Retry sync queued" })}>
              <RotateCcw className="h-3 w-3 mr-1.5" />Retry Sync
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs flex-1 border-[#E5E7EB]" onClick={() => toast({ title: "Enable fallback" })}>
              <ShieldCheck className="h-3 w-3 mr-1.5" />Fallback
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-3 space-y-3">
          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3">
            <p className="text-[11px] font-semibold text-foreground mb-2">Fulfillment History</p>
            {relatedOrders.length === 0 ? (
              <p className="text-[11px] text-[#9CA3AF]">No orders found for this route.</p>
            ) : (
              <div className="space-y-1">
                {relatedOrders.slice(0, 10).map(order => (
                  <div key={order.id} className="flex items-center justify-between py-1 border-b border-[#F3F0EB]/60 last:border-0">
                    <span className="text-[10px] font-mono text-[#9CA3AF]">{order.id.slice(0, 8)}</span>
                    <AdminStatusBadge status={order.status} size="sm" />
                    <span className="text-[10px] text-[#9CA3AF]">{format(new Date(order.created_at), 'dd MMM HH:mm')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="mt-3 space-y-3">
          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3 space-y-2">
            <p className="text-[11px] font-semibold text-foreground">Supplier Mapping</p>
            {[
              ['Primary Supplier', route.provider_name || 'Not assigned'],
              ['Provider Code', route.provider_code || '—'],
              ['Supplier Product ID', route.package_id],
              ['Backup Supplier', '— (not configured)'],
              ['Fallback', 'Disabled'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#F3F0EB]/60 last:border-0">
                <span className="text-[11px] text-[#9CA3AF]">{label}</span>
                <span className="text-[11px] font-medium text-[#6B7280]">{value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3 space-y-2">
            <p className="text-[11px] font-semibold text-foreground">Available Suppliers</p>
            {providers.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[#F3F0EB]/60 last:border-0">
                <div>
                  <span className="text-[11px] font-medium text-[#6B7280]">{p.provider_name}</span>
                  <span className="text-[10px] text-[#9CA3AF] ml-2">Priority {p.priority}</span>
                </div>
                <AdminStatusBadge status={p.is_active ? 'active' : 'inactive'} size="sm" />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-3">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">No incidents recorded</p>
            <p className="text-[10px] text-[#9CA3AF] mt-1">This route has no open or recent incidents</p>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold text-foreground">Recent Fulfillment Logs</p>
          {relatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xs text-[#9CA3AF]">No fulfillment logs for this route yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {relatedOrders.map(order => (
                <div key={order.id} className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#9CA3AF]">{order.id.slice(0, 12)}...</span>
                    <p className="text-[10px] text-[#6B7280]">{format(new Date(order.created_at), 'dd MMM yyyy HH:mm:ss')}</p>
                  </div>
                  <div className="text-right">
                    <AdminStatusBadge status={order.status} size="sm" />
                    <p className="text-[10px] font-mono text-[#9CA3AF] mt-0.5">${order.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
