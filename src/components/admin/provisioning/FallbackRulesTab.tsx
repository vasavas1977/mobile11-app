import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, X, MoreHorizontal, Plus, ShieldAlert, Play, Pause, Eye, Pencil, Zap, History, Upload, Settings, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
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
import { PolicyEngineDrawer } from './policy-engine/PolicyEngineDrawer';
import { RuleBuilderDrawer } from './policy-engine/RuleBuilderDrawer';

interface FallbackRule {
  id: string;
  rule_name: string;
  scope: string;
  primary_provider_id: string | null;
  fallback_provider_id: string | null;
  trigger_condition: string;
  trigger_threshold: number;
  priority: number;
  is_enabled: boolean;
  trigger_count: number;
  recovery_success_count: number;
  last_triggered_at: string | null;
  cooldown_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  primary_provider_name: string | null;
  fallback_provider_name: string | null;
}

interface FallbackFilters {
  search: string;
  status: string;
  primarySupplier: string;
  triggerCondition: string;
}

const DEFAULT_FILTERS: FallbackFilters = {
  search: '',
  status: 'all',
  primarySupplier: 'all',
  triggerCondition: 'all',
};

export function FallbackRulesTab() {
  const [rules, setRules] = useState<FallbackRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FallbackFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [selectedRule, setSelectedRule] = useState<FallbackRule | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [policyEngineOpen, setPolicyEngineOpen] = useState(false);
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fallback_rules')
        .select('*')
        .order('priority', { ascending: true });
      if (error) throw error;

      // Fetch provider names separately
      const providerIds = new Set<string>();
      (data || []).forEach((r: any) => {
        if (r.primary_provider_id) providerIds.add(r.primary_provider_id);
        if (r.fallback_provider_id) providerIds.add(r.fallback_provider_id);
      });

      let providerMap: Record<string, string> = {};
      if (providerIds.size > 0) {
        const { data: providers } = await supabase
          .from('esim_providers')
          .select('id, provider_name')
          .in('id', Array.from(providerIds));
        (providers || []).forEach((p: any) => { providerMap[p.id] = p.provider_name; });
      }

      setRules((data || []).map((r: any) => ({
        ...r,
        primary_provider_name: r.primary_provider_id ? (providerMap[r.primary_provider_id] || null) : null,
        fallback_provider_name: r.fallback_provider_id ? (providerMap[r.fallback_provider_id] || null) : null,
      })));
    } catch (err) {
      console.error('Failed to fetch fallback rules:', err);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // KPIs from real data
  const kpis = useMemo(() => {
    const total = rules.length;
    const active = rules.filter(r => r.is_enabled).length;
    const totalTriggers = rules.reduce((sum, r) => sum + (r.trigger_count || 0), 0);
    const totalRecovery = rules.reduce((sum, r) => sum + (r.recovery_success_count || 0), 0);
    const recoveryRate = totalTriggers > 0 ? Math.round((totalRecovery / totalTriggers) * 100) : 0;
    const recentlyTriggered = rules.filter(r => {
      if (!r.last_triggered_at) return false;
      return Date.now() - new Date(r.last_triggered_at).getTime() < 24 * 3600000;
    }).length;
    return { total, active, totalTriggers, recoveryRate, recentlyTriggered };
  }, [rules]);

  // Unique suppliers from rules
  const suppliers = useMemo(() => {
    const names = new Set<string>();
    rules.forEach(r => {
      if (r.primary_provider_name) names.add(r.primary_provider_name);
      if (r.fallback_provider_name) names.add(r.fallback_provider_name);
    });
    return Array.from(names).sort();
  }, [rules]);

  // Filtering
  const filtered = useMemo(() => {
    return rules.filter(r => {
      const search = filters.search.toLowerCase();
      if (search) {
        const match =
          r.rule_name.toLowerCase().includes(search) ||
          r.scope.toLowerCase().includes(search) ||
          (r.primary_provider_name || '').toLowerCase().includes(search) ||
          (r.fallback_provider_name || '').toLowerCase().includes(search);
        if (!match) return false;
      }
      if (filters.status === 'enabled' && !r.is_enabled) return false;
      if (filters.status === 'disabled' && r.is_enabled) return false;
      if (filters.primarySupplier !== 'all' && r.primary_provider_name !== filters.primarySupplier) return false;
      if (filters.triggerCondition !== 'all' && r.trigger_condition !== filters.triggerCondition) return false;
      return true;
    });
  }, [rules, filters]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [filters]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== DEFAULT_FILTERS[k as keyof FallbackFilters]).length;

  const getRecoveryRate = (r: FallbackRule): string => {
    if (r.trigger_count === 0) return '—';
    return `${Math.round((r.recovery_success_count / r.trigger_count) * 100)}%`;
  };

  const getConditionLabel = (c: string): string => {
    const map: Record<string, string> = {
      failure_rate: 'Failure Rate',
      consecutive_failures: 'Consecutive Failures',
      timeout: 'Timeout',
      api_error: 'API Error',
      manual: 'Manual Trigger',
    };
    return map[c] || c;
  };

  const getConditionBadge = (c: string): string => {
    const map: Record<string, string> = {
      failure_rate: 'bg-red-50 text-red-700 border-red-200',
      consecutive_failures: 'bg-amber-50 text-amber-700 border-amber-200',
      timeout: 'bg-orange-50 text-orange-700 border-orange-200',
      api_error: 'bg-red-50 text-red-700 border-red-200',
      manual: 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]',
    };
    return map[c] || 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]';
  };

  const openDetail = (r: FallbackRule) => {
    setSelectedRule(r);
    setDrawerOpen(true);
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const hasRules = rules.length > 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <AdminKPICard label="Total Rules" value={kpis.total.toString()} icon={ShieldAlert} />
        <AdminKPICard label="Active Rules" value={kpis.active.toString()} icon={CheckCircle2} accent={kpis.active > 0 ? 'success' : 'default'} />
        <AdminKPICard label="Total Triggers" value={kpis.totalTriggers.toString()} icon={Zap} accent={kpis.totalTriggers > 0 ? 'warning' : 'default'} />
        <AdminKPICard label="Recovery Rate" value={kpis.totalTriggers > 0 ? `${kpis.recoveryRate}%` : '—'} icon={RotateCcw} accent={kpis.recoveryRate >= 80 ? 'success' : kpis.recoveryRate > 0 ? 'warning' : 'default'} />
        <AdminKPICard label="Triggered 24h" value={kpis.recentlyTriggered.toString()} icon={AlertTriangle} accent={kpis.recentlyTriggered > 0 ? 'error' : 'default'} />
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-9 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs" onClick={() => { setEditingRule(null); setRuleBuilderOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />{hasRules ? 'Add Rule' : 'Create First Fallback Rule'}
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const config = JSON.parse(ev.target?.result as string);
                  toast({ title: 'Import ready', description: `Found ${config.rules?.length || 0} rules. Open Policy Engine to review.` });
                } catch {
                  toast({ title: 'Invalid file', description: 'Could not parse JSON', variant: 'destructive' });
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
        }}>
          <Upload className="h-3.5 w-3.5" />Import Rules
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => setPolicyEngineOpen(true)}>
          <Settings className="h-3.5 w-3.5" />Configure Policy Engine
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <Input
            placeholder="Search rule name, scope, supplier..."
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
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        {suppliers.length > 0 && (
          <Select value={filters.primarySupplier} onValueChange={(v) => setFilters(f => ({ ...f, primarySupplier: v }))}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Supplier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filters.triggerCondition} onValueChange={(v) => setFilters(f => ({ ...f, triggerCondition: v }))}>
          <SelectTrigger className="w-[140px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Condition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="failure_rate">Failure Rate</SelectItem>
            <SelectItem value="consecutive_failures">Consecutive Failures</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
            <SelectItem value="api_error">API Error</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-foreground" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB] ml-auto" onClick={fetchRules}>
          <RefreshCw className="h-3 w-3" />Refresh
        </Button>
        <span className="text-[11px] text-[#9CA3AF] tabular-nums">
          {filtered.length} rule{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </div>
            <p className="text-xs text-[#9CA3AF]">Loading fallback rules...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Rule Name</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Scope</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Primary</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Fallback</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Trigger</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-center">Priority</TableHead>
                  <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                  <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Triggers</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Last Triggered</TableHead>
                  <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Recovery</TableHead>
                  <TableHead className="w-[50px] h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mb-2">
                          <ShieldAlert className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">No fallback rules configured</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5 max-w-xs">Create automatic failover rules to reroute orders when a supplier goes down.</p>
                        <Button size="sm" className="mt-2.5 h-7 text-[10px] bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { setEditingRule(null); setRuleBuilderOpen(true); }}>
                          Create First Rule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginated.map((r, idx) => (
                  <TableRow key={r.id} className={`border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 cursor-pointer ${idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''}`} onClick={() => openDetail(r)}>
                    <TableCell className="py-2">
                      <p className="text-[13px] font-semibold text-foreground truncate max-w-[160px]">{r.rule_name}</p>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-[10px] font-medium text-[#6B7280] bg-[#F3F0EB] rounded px-1.5 py-0.5">{r.scope}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-[10px] font-medium bg-blue-50 text-blue-700 border-blue-200">
                        {r.primary_provider_name || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-[10px] font-medium bg-purple-50 text-purple-700 border-purple-200">
                        {r.fallback_provider_name || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${getConditionBadge(r.trigger_condition)}`}>
                        {getConditionLabel(r.trigger_condition)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <span className="text-xs font-bold tabular-nums text-foreground">{r.priority}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`text-[9px] font-semibold px-1.5 py-0 h-5 ${r.is_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAF7F2]'}`}>
                        {r.is_enabled ? '● Enabled' : '● Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2 text-right">
                      <span className="text-xs font-mono tabular-nums text-[#6B7280]">{r.trigger_count}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2 text-[11px] text-[#6B7280]">
                      {formatTimeAgo(r.last_triggered_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2 text-right">
                      <span className={`text-xs font-semibold tabular-nums ${r.trigger_count > 0 && (r.recovery_success_count / r.trigger_count) >= 0.8 ? 'text-emerald-600' : r.trigger_count > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'}`}>
                        {getRecoveryRate(r)}
                      </span>
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
                            <Eye className="h-3.5 w-3.5 mr-2" />View Rule
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingRule(r); setRuleBuilderOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />Edit Rule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast({ title: r.is_enabled ? 'Rule disabled' : 'Rule enabled', description: r.rule_name })}>
                            {r.is_enabled ? <Pause className="h-3.5 w-3.5 mr-2" /> : <Play className="h-3.5 w-3.5 mr-2" />}
                            {r.is_enabled ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: 'Simulation started', description: r.rule_name })}>
                            <Zap className="h-3.5 w-3.5 mr-2" />Simulate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setPolicyEngineOpen(true); }}>
                            <History className="h-3.5 w-3.5 mr-2" />View Trigger History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
          {selectedRule && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm font-bold text-foreground">{selectedRule.rule_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Status header */}
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs font-semibold px-2 py-0.5 ${selectedRule.is_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]'}`}>
                    {selectedRule.is_enabled ? '● Enabled' : '● Disabled'}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getConditionBadge(selectedRule.trigger_condition)}`}>
                    {getConditionLabel(selectedRule.trigger_condition)}
                  </Badge>
                </div>

                {/* Rule info */}
                <div>
                  {selectedRule.notes && <p className="text-[11px] text-[#6B7280]">{selectedRule.notes}</p>}
                </div>

                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Scope', value: selectedRule.scope },
                    { label: 'Priority', value: selectedRule.priority.toString() },
                    { label: 'Primary Supplier', value: selectedRule.primary_provider_name || '—' },
                    { label: 'Fallback Supplier', value: selectedRule.fallback_provider_name || '—' },
                    { label: 'Trigger Condition', value: getConditionLabel(selectedRule.trigger_condition) },
                    { label: 'Threshold', value: selectedRule.trigger_threshold.toString() },
                    { label: 'Cooldown', value: `${selectedRule.cooldown_minutes} min` },
                    { label: 'Created', value: format(new Date(selectedRule.created_at), 'MMM dd yyyy') },
                  ].map(item => (
                    <div key={item.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-2.5">
                      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">{item.label}</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Performance metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3 text-center">
                    <p className="text-lg font-bold tabular-nums text-foreground">{selectedRule.trigger_count}</p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-medium mt-1">Total Triggers</p>
                  </div>
                  <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3 text-center">
                    <p className="text-lg font-bold tabular-nums text-emerald-600">{selectedRule.recovery_success_count}</p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-medium mt-1">Recovered</p>
                  </div>
                  <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3 text-center">
                    <p className={`text-lg font-bold tabular-nums ${selectedRule.trigger_count > 0 && (selectedRule.recovery_success_count / selectedRule.trigger_count) >= 0.8 ? 'text-emerald-600' : selectedRule.trigger_count > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'}`}>
                      {getRecoveryRate(selectedRule)}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-medium mt-1">Recovery Rate</p>
                  </div>
                </div>

                {/* Last triggered */}
                <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-3">
                  <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Last Triggered</p>
                  <p className="text-xs font-medium text-foreground mt-1">
                    {selectedRule.last_triggered_at ? format(new Date(selectedRule.last_triggered_at), 'MMM dd yyyy, HH:mm:ss') : 'Never triggered'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F3F0EB]">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => { setEditingRule(selectedRule); setRuleBuilderOpen(true); setDrawerOpen(false); }}>
                    <Pencil className="h-3 w-3" />Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: selectedRule.is_enabled ? 'Disabled' : 'Enabled' })}>
                    {selectedRule.is_enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {selectedRule.is_enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: 'Simulation started' })}>
                    <Zap className="h-3 w-3" />Simulate
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => { setDrawerOpen(false); setPolicyEngineOpen(true); }}>
                    <History className="h-3 w-3" />Trigger History
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Policy Engine Drawer */}
      <PolicyEngineDrawer open={policyEngineOpen} onOpenChange={setPolicyEngineOpen} />

      {/* Rule Builder Drawer */}
      <RuleBuilderDrawer
        open={ruleBuilderOpen}
        onOpenChange={setRuleBuilderOpen}
        editRule={editingRule}
        onSaved={fetchRules}
      />
    </div>
  );
}
