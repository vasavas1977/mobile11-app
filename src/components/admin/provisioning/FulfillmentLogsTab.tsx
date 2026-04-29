import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, X, MoreHorizontal, Clock, CheckCircle2, XCircle, AlertTriangle, Copy, ExternalLink, RotateCcw, ArrowUpRight, ChevronRight, Activity, Zap, Timer, Wrench } from 'lucide-react';
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
import { format, startOfDay, isToday } from 'date-fns';

interface FulfillmentRecord {
  id: string;
  order_id: string;
  status: string;
  provider_status: string | null;
  provider_order_id: string | null;
  provider_cost: number | null;
  created_at: string;
  updated_at: string;
  iccid: string | null;
  qr_code: string | null;
  total_amount: number;
  user_id: string;
  notification_email: string | null;
  service_tier: string | null;
  environment: string | null;
  parent_order_id: string | null;
  provider_name: string | null;
  provider_code: string | null;
  package_name: string | null;
  country_name: string | null;
  country_code: string | null;
  data_amount: string | null;
  customer_email: string | null;
  customer_name: string | null;
}

interface FulfillmentFilters {
  search: string;
  status: string;
  supplier: string;
  event: string;
  dateRange: string;
}

const DEFAULT_FILTERS: FulfillmentFilters = {
  search: '',
  status: 'all',
  supplier: 'all',
  event: 'all',
  dateRange: 'all',
};

export function FulfillmentLogsTab() {
  const [records, setRecords] = useState<FulfillmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FulfillmentFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [selectedRecord, setSelectedRecord] = useState<FulfillmentRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, order_id, status, provider_status, provider_order_id, provider_cost,
          created_at, updated_at, iccid, qr_code, total_amount, user_id,
          notification_email, guest_email, service_tier, environment, parent_order_id,
          esim_packages(name, country_name, country_code, data_amount, esim_providers(provider_name, provider_code)),
          esim_providers(provider_name, provider_code)
        `)
        .in('status', ['completed', 'processing', 'failed', 'cancelled', 'pending', 'refunded', 'active'])
        .order('created_at', { ascending: false })
        .limit(1000);

      if (ordersError) throw ordersError;

      const userIds = Array.from(
        new Set((orderRows || []).map((row: any) => row.user_id).filter(Boolean))
      );

      let profileMap = new Map<string, { email: string | null; name: string | null }>();

      if (userIds.length > 0) {
        const { data: profileRows, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        profileMap = new Map(
          (profileRows || []).map((profile: any) => [
            profile.user_id,
            {
              email: profile.email || null,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null,
            },
          ])
        );
      }

      setRecords((orderRows || []).map((o: any) => {
        const profile = o.user_id ? profileMap.get(o.user_id) : null;

        return {
          id: o.id,
          order_id: o.order_id,
          status: o.status,
          provider_status: o.provider_status,
          provider_order_id: o.provider_order_id,
          provider_cost: o.provider_cost,
          created_at: o.created_at,
          updated_at: o.updated_at,
          iccid: o.iccid,
          qr_code: o.qr_code,
          total_amount: o.total_amount,
          user_id: o.user_id,
          notification_email: o.notification_email,
          service_tier: o.service_tier,
          environment: o.environment,
          parent_order_id: o.parent_order_id,
          provider_name: o.esim_providers?.provider_name || o.esim_packages?.esim_providers?.provider_name || null,
          provider_code: o.esim_providers?.provider_code || o.esim_packages?.esim_providers?.provider_code || null,
          package_name: o.esim_packages?.name || null,
          country_name: o.esim_packages?.country_name || null,
          country_code: o.esim_packages?.country_code || null,
          data_amount: o.esim_packages?.data_amount || null,
          customer_email: profile?.email || o.notification_email || o.guest_email || null,
          customer_name: profile?.name || null,
        };
      }));
    } catch {
      toast({ title: 'Error', description: 'Failed to load fulfillment logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // KPI calculations from real data
  const kpis = useMemo(() => {
    const todayRecords = records.filter(r => isToday(new Date(r.created_at)));
    const totalToday = todayRecords.length;
    const successToday = todayRecords.filter(r => r.status === 'completed' || r.status === 'active').length;
    const failedToday = todayRecords.filter(r => r.status === 'failed').length;
    const retryQueue = records.filter(r => r.status === 'processing' || r.status === 'pending').length;

    // Avg fulfillment duration (time between created_at and updated_at for completed orders)
    const completedWithDuration = records.filter(r =>
      (r.status === 'completed' || r.status === 'active') && r.updated_at && r.created_at
    );
    let avgDuration = 0;
    if (completedWithDuration.length > 0) {
      const totalMs = completedWithDuration.reduce((sum, r) => {
        return sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime());
      }, 0);
      avgDuration = Math.round(totalMs / completedWithDuration.length / 1000);
    }

    // Manual interventions = cancelled orders (admin action)
    const manualInterventions = records.filter(r => r.status === 'cancelled').length;

    return { totalToday, successToday, failedToday, retryQueue, avgDuration, manualInterventions };
  }, [records]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Unique suppliers from data
  const suppliers = useMemo(() =>
    Array.from(new Set(records.map(r => r.provider_name).filter(Boolean))).sort() as string[],
    [records]
  );

  // Derive event type from order data
  const getEventType = (r: FulfillmentRecord): string => {
    if (r.parent_order_id) return 'Extension';
    if (r.status === 'failed') return 'Failed Provision';
    if (r.status === 'cancelled') return 'Cancelled';
    if (r.status === 'processing' || r.status === 'pending') return 'Provisioning';
    if (r.iccid && r.qr_code) return 'Activated';
    if (r.iccid) return 'Provisioned';
    return 'Created';
  };

  const getIssueType = (r: FulfillmentRecord): string | null => {
    if (r.status === 'failed') {
      if (r.provider_status?.toLowerCase().includes('timeout')) return 'Timeout';
      if (r.provider_status?.toLowerCase().includes('invalid')) return 'Invalid Request';
      return 'Provider Error';
    }
    if (r.status === 'cancelled') return 'Manual Cancel';
    return null;
  };

  const getDuration = (r: FulfillmentRecord): number | null => {
    if (!r.updated_at || r.updated_at === r.created_at) return null;
    return Math.round((new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 1000);
  };

  // Filtering
  const filtered = useMemo(() => {
    return records.filter(r => {
      const search = filters.search.toLowerCase();
      if (search) {
        const match = (r.order_id || '').toLowerCase().includes(search) ||
          (r.customer_email || '').toLowerCase().includes(search) ||
          (r.iccid || '').toLowerCase().includes(search) ||
          (r.package_name || '').toLowerCase().includes(search) ||
          (r.country_name || '').toLowerCase().includes(search) ||
          (r.provider_name || '').toLowerCase().includes(search);
        if (!match) return false;
      }
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.supplier !== 'all' && r.provider_name !== filters.supplier) return false;
      if (filters.event !== 'all') {
        const eventType = getEventType(r);
        if (eventType !== filters.event) return false;
      }
      if (filters.dateRange === 'today' && !isToday(new Date(r.created_at))) return false;
      if (filters.dateRange === '7d') {
        const weekAgo = Date.now() - 7 * 86400000;
        if (new Date(r.created_at).getTime() < weekAgo) return false;
      }
      if (filters.dateRange === '30d') {
        const monthAgo = Date.now() - 30 * 86400000;
        if (new Date(r.created_at).getTime() < monthAgo) return false;
      }
      return true;
    });
  }, [records, filters]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [filters]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== DEFAULT_FILTERS[k as keyof FulfillmentFilters]).length;

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      cancelled: 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]',
    };
    return map[status] || 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]';
  };

  const getEventBadge = (event: string) => {
    const map: Record<string, string> = {
      'Activated': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Provisioned': 'bg-teal-50 text-teal-700 border-teal-200',
      'Provisioning': 'bg-blue-50 text-blue-700 border-blue-200',
      'Extension': 'bg-purple-50 text-purple-700 border-purple-200',
      'Failed Provision': 'bg-red-50 text-red-700 border-red-200',
      'Cancelled': 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]',
      'Created': 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]',
    };
    return map[event] || 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]';
  };

  const openDetail = (r: FulfillmentRecord) => {
    setSelectedRecord(r);
    setDrawerOpen(true);
  };

  const copyError = (r: FulfillmentRecord) => {
    const text = `Order: ${r.order_id}\nStatus: ${r.status}\nProvider: ${r.provider_name || 'N/A'}\nProvider Status: ${r.provider_status || 'N/A'}\nICCID: ${r.iccid || 'N/A'}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <AdminKPICard label="Attempts Today" value={kpis.totalToday.toString()} icon={Activity} />
        <AdminKPICard label="Successful" value={kpis.successToday.toString()} icon={CheckCircle2} accent="success" />
        <AdminKPICard label="Failed" value={kpis.failedToday.toString()} icon={XCircle} accent={kpis.failedToday > 0 ? 'error' : 'default'} />
        <AdminKPICard label="Retry Queue" value={kpis.retryQueue.toString()} icon={RotateCcw} accent={kpis.retryQueue > 0 ? 'warning' : 'default'} />
        <AdminKPICard label="Avg Duration" value={kpis.avgDuration > 0 ? formatDuration(kpis.avgDuration) : '—'} icon={Timer} />
        <AdminKPICard label="Manual Actions" value={kpis.manualInterventions.toString()} icon={Wrench} accent={kpis.manualInterventions > 0 ? 'warning' : 'default'} />
      </div>

      {/* Alert strip for failures */}
      {kpis.failedToday > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium">{kpis.failedToday} failed activation{kpis.failedToday > 1 ? 's' : ''} today</span>
          <span className="text-red-500">— review and retry if needed</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <Input
            placeholder="Search order, email, ICCID, package..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-8 h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
          />
        </div>
        <div className="h-5 w-px bg-[#F3F0EB] hidden sm:block" />
        <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-[120px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.supplier} onValueChange={(v) => setFilters(f => ({ ...f, supplier: v }))}>
          <SelectTrigger className="w-[120px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Supplier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.event} onValueChange={(v) => setFilters(f => ({ ...f, event: v }))}>
          <SelectTrigger className="w-[130px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="Activated">Activated</SelectItem>
            <SelectItem value="Provisioned">Provisioned</SelectItem>
            <SelectItem value="Provisioning">Provisioning</SelectItem>
            <SelectItem value="Extension">Extension</SelectItem>
            <SelectItem value="Failed Provision">Failed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.dateRange} onValueChange={(v) => setFilters(f => ({ ...f, dateRange: v }))}>
          <SelectTrigger className="w-[100px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7d</SelectItem>
            <SelectItem value="30d">Last 30d</SelectItem>
          </SelectContent>
        </Select>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-foreground" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB] ml-auto" onClick={fetchRecords}>
          <RefreshCw className="h-3 w-3" />Refresh
        </Button>
        <span className="text-[11px] text-[#9CA3AF] tabular-nums">
          {filtered.length} records
        </span>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mx-auto mb-2">
              <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </div>
            <p className="text-xs text-[#9CA3AF]">Loading fulfillment logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Timestamp</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Order ID</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Customer</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Package</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Destination</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Supplier</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Event</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Duration</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Issue</TableHead>
                  <TableHead className="w-[50px] h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mb-2">
                          <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">No fulfillment records yet</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">Waiting for first live provisioning events</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginated.map((r, idx) => {
                  const event = getEventType(r);
                  const issue = getIssueType(r);
                  const dur = getDuration(r);
                  return (
                    <TableRow key={r.id} className={`border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 cursor-pointer ${idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''}`} onClick={() => openDetail(r)}>
                      <TableCell className="py-2 text-[11px] text-[#6B7280] tabular-nums whitespace-nowrap">
                        {format(new Date(r.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-[11px] font-mono text-foreground">{r.order_id?.slice(0, 14)}…</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="min-w-0">
                          {r.customer_name && <p className="text-[11px] font-medium text-foreground truncate max-w-[120px]">{r.customer_name}</p>}
                          <p className="text-[10px] text-[#9CA3AF] truncate max-w-[120px]">{r.customer_email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-[11px] font-medium text-foreground truncate max-w-[140px]">{r.package_name || '—'}</p>
                      </TableCell>
                      <TableCell className="py-2">
                        {r.country_code && (
                          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F3F0EB] rounded px-1.5 py-0.5">{r.country_name || r.country_code}</span>
                        )}
                        {!r.country_code && <span className="text-[#D1D5DB]">—</span>}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[10px] font-medium ${r.provider_code === 'tuge' ? 'bg-purple-50 text-purple-700 border-purple-200' : r.provider_code === 'usimsa' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]'}`}>
                          {r.provider_name || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${getEventBadge(event)}`}>
                          {event}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-[11px] text-[#6B7280] tabular-nums">
                        {dur !== null ? formatDuration(dur) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2">
                        {issue ? (
                          <span className="text-[10px] font-medium text-red-600">{issue}</span>
                        ) : <span className="text-[#D1D5DB]">—</span>}
                      </TableCell>
                      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#F3F0EB]">
                              <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openDetail(r)}>
                              <ChevronRight className="h-3.5 w-3.5 mr-2" />View Detail
                            </DropdownMenuItem>
                            {(r.status === 'failed' || r.status === 'pending') && (
                              <DropdownMenuItem onClick={() => toast({ title: 'Retry queued', description: `Order ${r.order_id?.slice(0, 12)}…` })}>
                                <RotateCcw className="h-3.5 w-3.5 mr-2" />Retry Fulfillment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => toast({ title: 'Escalated', description: 'Issue flagged for review' })}>
                              <ArrowUpRight className="h-3.5 w-3.5 mr-2" />Escalate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copyError(r)}>
                              <Copy className="h-3.5 w-3.5 mr-2" />Copy Error Info
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/admin?tab=orders&search=${r.order_id}`, '_blank')}>
                              <ExternalLink className="h-3.5 w-3.5 mr-2" />Open Related Order
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F0EB]">
            <span className="text-[11px] text-[#9CA3AF] tabular-nums">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 border-[#E5E7EB] rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center px-2.5 text-[11px] font-medium text-[#6B7280] tabular-nums">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 border-[#E5E7EB] rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedRecord && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm font-bold text-foreground">Fulfillment Detail</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Status header */}
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs font-semibold px-2 py-0.5 ${getStatusBadge(selectedRecord.status)}`}>
                    {selectedRecord.status}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getEventBadge(getEventType(selectedRecord))}`}>
                    {getEventType(selectedRecord)}
                  </Badge>
                </div>

                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Order ID', value: selectedRecord.order_id },
                    { label: 'Customer', value: selectedRecord.customer_email || '—' },
                    { label: 'Package', value: selectedRecord.package_name || '—' },
                    { label: 'Destination', value: selectedRecord.country_name || '—' },
                    { label: 'Supplier', value: selectedRecord.provider_name || '—' },
                    { label: 'Provider Order', value: selectedRecord.provider_order_id || '—' },
                    { label: 'ICCID', value: selectedRecord.iccid || '—' },
                    { label: 'Provider Status', value: selectedRecord.provider_status || '—' },
                    { label: 'Service Tier', value: selectedRecord.service_tier || '—' },
                    { label: 'Environment', value: selectedRecord.environment || '—' },
                    { label: 'Provider Cost', value: selectedRecord.provider_cost ? `$${selectedRecord.provider_cost.toFixed(2)}` : '—' },
                    { label: 'Revenue', value: `$${selectedRecord.total_amount.toFixed(2)}` },
                    { label: 'Created', value: format(new Date(selectedRecord.created_at), 'MMM dd yyyy, HH:mm:ss') },
                    { label: 'Last Updated', value: format(new Date(selectedRecord.updated_at), 'MMM dd yyyy, HH:mm:ss') },
                  ].map(item => (
                    <div key={item.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-2.5">
                      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">{item.label}</p>
                      <p className="text-xs font-medium text-foreground mt-0.5 truncate font-mono">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Duration */}
                {getDuration(selectedRecord) !== null && (
                  <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3">
                    <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Fulfillment Duration</p>
                    <p className="text-lg font-bold tabular-nums text-foreground mt-1">{formatDuration(getDuration(selectedRecord)!)}</p>
                  </div>
                )}

                {/* Issue analysis for failed */}
                {selectedRecord.status === 'failed' && (
                  <div className="bg-red-50 rounded-lg border border-red-200 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-semibold text-red-700">Failure Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-red-500 font-medium">Issue Type</p>
                        <p className="text-xs font-medium text-red-700">{getIssueType(selectedRecord) || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-red-500 font-medium">Provider Response</p>
                        <p className="text-xs font-mono text-red-700">{selectedRecord.provider_status || 'No response'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extension info */}
                {selectedRecord.parent_order_id && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
                    <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wide">Extension of Order</p>
                    <p className="text-xs font-mono text-purple-700 mt-1">{selectedRecord.parent_order_id}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F3F0EB]">
                  {(selectedRecord.status === 'failed' || selectedRecord.status === 'pending') && (
                    <Button size="sm" className="h-8 gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                      <RotateCcw className="h-3 w-3" />Retry
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: 'Escalated' })}>
                    <ArrowUpRight className="h-3 w-3" />Escalate
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => copyError(selectedRecord)}>
                    <Copy className="h-3 w-3" />Copy Info
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => window.open(`/admin?tab=orders&search=${selectedRecord.order_id}`, '_blank')}>
                    <ExternalLink className="h-3 w-3" />View Order
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
