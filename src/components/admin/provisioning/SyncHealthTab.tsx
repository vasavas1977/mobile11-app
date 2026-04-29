import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, RotateCcw, Pause, Play, Eye, Server, CheckCircle2, XCircle, Clock, AlertTriangle, Activity, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SyncJob {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_code: string;
  job_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  error_details: any;
  triggered_by: string;
  metadata: any;
  next_scheduled_at: string | null;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  api_sync: 'API Sync',
  excel_import: 'Excel Import',
  webhook_ingest: 'Webhook',
  price_update: 'Price Update',
  full_catalog_sync: 'Full Catalog',
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]',
  timeout: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function SyncHealthTab() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sync_jobs')
        .select('*, esim_providers(provider_name, provider_code)')
        .order('started_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setJobs((data || []).map((j: any) => ({
        ...j,
        provider_name: j.esim_providers?.provider_name || 'Unknown',
        provider_code: j.esim_providers?.provider_code || '',
      })));
    } catch (err) {
      console.error('Failed to fetch sync jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueSuppliers = useMemo(() => {
    const names = new Set(jobs.map(j => j.provider_name));
    return Array.from(names).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (supplierFilter !== 'all' && j.provider_name !== supplierFilter) return false;
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (typeFilter !== 'all' && j.job_type !== typeFilter) return false;
      return true;
    });
  }, [jobs, supplierFilter, statusFilter, typeFilter]);

  const activeFilterCount = [supplierFilter !== 'all', statusFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length;

  // KPI calculations from real data
  const kpis = useMemo(() => {
    const apisConnected = uniqueSuppliers.length;
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const failedJobs = jobs.filter(j => j.status === 'failed');
    const runningJobs = jobs.filter(j => j.status === 'running');

    // Freshness: check last completed sync per provider
    const lastSyncByProvider: Record<string, string> = {};
    completedJobs.forEach(j => {
      if (!lastSyncByProvider[j.provider_name] || j.completed_at! > lastSyncByProvider[j.provider_name]) {
        lastSyncByProvider[j.provider_name] = j.completed_at!;
      }
    });
    const now = Date.now();
    const staleProviders = Object.entries(lastSyncByProvider).filter(([, ts]) => now - new Date(ts).getTime() > 7 * 24 * 3600000).length;
    const freshProviders = apisConnected - staleProviders;

    // Avg duration
    const durationsMs = completedJobs.filter(j => j.duration_seconds).map(j => j.duration_seconds!);
    const avgDuration = durationsMs.length > 0 ? durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length : 0;

    // Last global sync
    const lastGlobalSync = completedJobs.length > 0 ? completedJobs[0].completed_at : null;

    return {
      apisConnected,
      healthyJobs: freshProviders,
      delayedJobs: staleProviders,
      failedJobs: failedJobs.length,
      runningJobs: runningJobs.length,
      avgDuration,
      lastGlobalSync,
    };
  }, [jobs, uniqueSuppliers]);

  // Alert strip
  const alerts = useMemo(() => {
    const items: { type: 'warning' | 'error' | 'info'; message: string }[] = [];
    const now = Date.now();
    const completedJobs = jobs.filter(j => j.status === 'completed');
    
    // Check for stale providers
    const lastSyncByProvider: Record<string, { ts: string; name: string }> = {};
    completedJobs.forEach(j => {
      if (!lastSyncByProvider[j.provider_name] || j.completed_at! > lastSyncByProvider[j.provider_name].ts) {
        lastSyncByProvider[j.provider_name] = { ts: j.completed_at!, name: j.provider_name };
      }
    });
    Object.entries(lastSyncByProvider).forEach(([name, { ts }]) => {
      const daysSince = Math.floor((now - new Date(ts).getTime()) / (24 * 3600000));
      if (daysSince > 14) {
        items.push({ type: 'error', message: `${name} last synced ${daysSince} days ago — catalog may be stale` });
      } else if (daysSince > 7) {
        items.push({ type: 'warning', message: `${name} last synced ${daysSince} days ago` });
      }
    });

    const failed = jobs.filter(j => j.status === 'failed');
    if (failed.length > 0) {
      items.push({ type: 'error', message: `${failed.length} sync job${failed.length > 1 ? 's' : ''} failed` });
    }

    const running = jobs.filter(j => j.status === 'running');
    if (running.length > 0) {
      items.push({ type: 'info', message: `${running.length} sync job${running.length > 1 ? 's' : ''} currently running` });
    }

    return items;
  }, [jobs]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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

  const getFreshnessStatus = (job: SyncJob) => {
    if (!job.completed_at) return { label: 'Unknown', color: 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]' };
    const daysSince = Math.floor((Date.now() - new Date(job.completed_at).getTime()) / (24 * 3600000));
    if (daysSince <= 3) return { label: 'Fresh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (daysSince <= 7) return { label: 'Recent', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (daysSince <= 14) return { label: 'Aging', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Stale', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: 'APIs Connected', value: kpis.apisConnected.toString(), icon: Server, color: kpis.apisConnected > 0 ? 'emerald' : 'default' },
          { label: 'Healthy Syncs', value: kpis.healthyJobs.toString(), icon: CheckCircle2, color: 'emerald' },
          { label: 'Delayed Syncs', value: kpis.delayedJobs.toString(), icon: Clock, color: kpis.delayedJobs > 0 ? 'amber' : 'default' },
          { label: 'Failed Jobs', value: kpis.failedJobs.toString(), icon: XCircle, color: kpis.failedJobs > 0 ? 'red' : 'emerald' },
          { label: 'Avg Duration', value: formatDuration(kpis.avgDuration), icon: Zap, color: 'default' },
          { label: 'Last Global Sync', value: formatTimeAgo(kpis.lastGlobalSync), icon: Activity, color: 'default' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#F3F0EB] p-2.5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                kpi.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                kpi.color === 'red' ? 'bg-red-100 text-red-600' :
                kpi.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                'bg-[#FAF7F2] text-[#6B7280]'
              }`}>
                <kpi.icon className="h-2.5 w-2.5" />
              </div>
              <span className="text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wide truncate">{kpi.label}</span>
            </div>
            <p className={`text-sm font-bold tabular-nums font-mono ${
              kpi.color === 'emerald' ? 'text-emerald-700' :
              kpi.color === 'red' ? 'text-red-700' :
              kpi.color === 'amber' ? 'text-amber-700' :
              'text-foreground'
            }`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alert Strip */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((alert, i) => (
            <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-xs ${
              alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
              alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-3 flex flex-wrap items-center gap-2.5">
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Supplier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {uniqueSuppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Job Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="api_sync">API Sync</SelectItem>
            <SelectItem value="excel_import">Excel Import</SelectItem>
            <SelectItem value="price_update">Price Update</SelectItem>
            <SelectItem value="webhook_ingest">Webhook</SelectItem>
            <SelectItem value="full_catalog_sync">Full Catalog</SelectItem>
          </SelectContent>
        </Select>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-foreground" onClick={() => { setSupplierFilter('all'); setStatusFilter('all'); setTypeFilter('all'); }}>
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={fetchJobs}>
            <RefreshCw className="h-3 w-3" />Refresh
          </Button>
          <span className="text-[11px] text-[#9CA3AF] tabular-nums">{filteredJobs.length} jobs</span>
        </div>
      </div>

      {/* Sync Jobs Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        {loading ? (
         <div className="p-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mx-auto mb-2">
              <Activity className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </div>
            <p className="text-xs text-[#9CA3AF]">Loading sync jobs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Supplier</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Job Type</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Started</TableHead>
                  <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Completed</TableHead>
                  <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Duration</TableHead>
                  <TableHead className="text-right hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Records</TableHead>
                  <TableHead className="text-right hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Errors</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Freshness</TableHead>
                  <TableHead className="w-[50px] h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mb-2">
                          <Activity className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">No sync jobs found</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">Run a supplier sync to see job history here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.map((job, idx) => {
                  const freshness = getFreshnessStatus(job);
                  return (
                    <TableRow key={job.id} className={`border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 cursor-pointer ${idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''}`} onClick={() => setSelectedJob(job)}>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[10px] font-medium ${job.provider_code === 'tuge' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {job.provider_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-xs text-[#6B7280]">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${STATUS_STYLES[job.status] || STATUS_STYLES.cancelled}`}>
                          {job.status === 'running' && '◉ '}{job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-[11px] text-[#6B7280]">
                        {format(new Date(job.started_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 text-[11px] text-[#6B7280]">
                        {job.completed_at ? format(new Date(job.completed_at), 'MMM dd, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <span className="text-xs font-mono text-[#6B7280]">{formatDuration(job.duration_seconds)}</span>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell py-2">
                        <span className="text-xs font-mono text-foreground font-semibold">{job.records_processed.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell py-2">
                        {job.records_failed > 0 ? (
                          <span className="text-xs font-mono font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{job.records_failed}</span>
                        ) : (
                          <span className="text-[#D1D5DB]">0</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2">
                        <Badge variant="outline" className={`text-[9px] font-medium ${freshness.color}`}>
                          {freshness.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#F3F0EB]" onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                              <Eye className="h-3.5 w-3.5 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "Retry triggered", description: `Retrying ${job.provider_name} ${JOB_TYPE_LABELS[job.job_type]}` }); }}>
                              <RotateCcw className="h-3.5 w-3.5 mr-2" />Retry Job
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "Coming soon" }); }}>
                              <RefreshCw className="h-3.5 w-3.5 mr-2" />Force Full Sync
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

      {/* Job Detail Drawer */}
      <Sheet open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
         <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm font-bold text-foreground">
                  Sync Job — {selectedJob.provider_name}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* Status header */}
                <div className="flex items-center justify-between">
                  <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${STATUS_STYLES[selectedJob.status]}`}>
                    {selectedJob.status}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] font-medium ${selectedJob.provider_code === 'tuge' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    {selectedJob.provider_name}
                  </Badge>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Job Type', value: JOB_TYPE_LABELS[selectedJob.job_type] || selectedJob.job_type },
                    { label: 'Triggered By', value: selectedJob.triggered_by },
                    { label: 'Started', value: format(new Date(selectedJob.started_at), 'MMM dd yyyy, HH:mm:ss') },
                    { label: 'Completed', value: selectedJob.completed_at ? format(new Date(selectedJob.completed_at), 'MMM dd yyyy, HH:mm:ss') : '—' },
                    { label: 'Duration', value: formatDuration(selectedJob.duration_seconds) },
                    { label: 'Freshness', value: getFreshnessStatus(selectedJob).label },
                  ].map(item => (
                    <div key={item.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-2.5">
                      <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wide font-medium">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Records breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Records</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Processed', value: selectedJob.records_processed, color: 'text-foreground' },
                      { label: 'Created', value: selectedJob.records_created, color: 'text-emerald-700' },
                      { label: 'Updated', value: selectedJob.records_updated, color: 'text-blue-700' },
                      { label: 'Failed', value: selectedJob.records_failed, color: selectedJob.records_failed > 0 ? 'text-red-700' : 'text-[#D1D5DB]' },
                    ].map(item => (
                      <div key={item.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-2.5 text-center">
                        <p className={`text-lg font-bold tabular-nums font-mono ${item.color}`}>{item.value.toLocaleString()}</p>
                        <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wide font-medium mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error message */}
                {selectedJob.error_message && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Error</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-700 font-mono whitespace-pre-wrap">{selectedJob.error_message}</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedJob.metadata && Object.keys(selectedJob.metadata).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Metadata</h4>
                    <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3 space-y-1.5">
                      {Object.entries(selectedJob.metadata).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between">
                          <span className="text-[11px] text-[#9CA3AF] capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] font-medium text-foreground text-right max-w-[200px] truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[#F3F0EB]">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => toast({ title: "Retry triggered" })}>
                    <RotateCcw className="h-3.5 w-3.5" />Retry Job
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => toast({ title: "Coming soon" })}>
                    <RefreshCw className="h-3.5 w-3.5" />Force Full Sync
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
