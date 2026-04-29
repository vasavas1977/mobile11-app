import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal, Plus, Eye, Pencil, Copy, Pause, Play, Archive, ArrowUpDown,
  RefreshCw, AlertTriangle, RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { RuleBuilderDrawer } from './RuleBuilderDrawer';
import { getConflictsForRule, CONFLICT_LABELS, CONFLICT_BADGE_COLORS, type ConflictWarning } from './conflictDetection';

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
  primary_provider_name?: string | null;
  fallback_provider_name?: string | null;
}

interface Props {
  rules: FallbackRule[];
  loading: boolean;
  onRefresh: () => void;
  conflicts: ConflictWarning[];
}

const CONDITION_LABELS: Record<string, string> = {
  api_timeout: 'API Timeout',
  failure_rate: 'Failure Rate',
  http_5xx: 'HTTP 5xx',
  supplier_down: 'Supplier Down',
  sync_stale: 'Sync Stale',
  package_unavailable: 'Pkg Unavailable',
  latency_threshold: 'Latency',
  manual_override: 'Manual',
  consecutive_failures: 'Consec. Failures',
  timeout: 'Timeout',
  api_error: 'API Error',
  manual: 'Manual',
};

const CONDITION_COLORS: Record<string, string> = {
  api_timeout: 'bg-orange-50 text-orange-700 border-orange-200',
  failure_rate: 'bg-red-50 text-red-700 border-red-200',
  http_5xx: 'bg-red-50 text-red-700 border-red-200',
  supplier_down: 'bg-red-50 text-red-800 border-red-300',
  sync_stale: 'bg-amber-50 text-amber-700 border-amber-200',
  package_unavailable: 'bg-purple-50 text-purple-700 border-purple-200',
  latency_threshold: 'bg-orange-50 text-orange-700 border-orange-200',
  manual_override: 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]',
};

export function PolicyRulesTab({ rules, loading, onRefresh, conflicts }: Props) {
  const { toast } = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const getRecoveryRate = (r: FallbackRule) => {
    if (r.trigger_count === 0) return '—';
    return `${Math.round((r.recovery_success_count / r.trigger_count) * 100)}%`;
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatUpdated = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, HH:mm');
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-3">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px]" onClick={() => { setEditingRule(null); setBuilderOpen(true); }}>
            <Plus className="h-3 w-3" />New Rule
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px] border-[#E5E7EB]" onClick={() => toast({ title: 'Reorder mode', description: 'Edit rules to change priority values. Lower number = higher priority.' })}>
            <ArrowUpDown className="h-3 w-3" />Reorder Priority
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px] border-[#E5E7EB]" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3" />Refresh
        </Button>
      </div>

      {/* Rules table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#9CA3AF]">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs font-medium text-[#6B7280]">No fallback rules configured</p>
            <p className="text-[10px] text-[#9CA3AF] mt-1">Create your first rule to enable automated supplier failover.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] w-8">#</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Rule Name</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Trigger</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Primary</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Fallback</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Issues</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Triggers</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">Modified</TableHead>
                <TableHead className="h-8 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Recovery</TableHead>
                <TableHead className="w-10 h-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r, idx) => {
                const ruleConflicts = getConflictsForRule(r.id, conflicts);
                return (
                  <TableRow key={r.id} className={`border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 ${idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''}`}>
                    <TableCell className="py-1.5">
                      <span className="text-[10px] font-bold tabular-nums text-[#9CA3AF]">{r.priority}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <p className="text-[11px] font-semibold text-foreground truncate max-w-[180px]">{r.rule_name}</p>
                      {r.notes && <p className="text-[9px] text-[#9CA3AF] truncate max-w-[180px]">{r.notes}</p>}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge className={`text-[8px] font-semibold px-1.5 py-0 h-4 ${r.is_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAF7F2]'}`}>
                        {r.is_enabled ? '● Active' : '● Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className={`text-[8px] font-semibold px-1.5 py-0 h-4 ${CONDITION_COLORS[r.trigger_condition] || 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]'}`}>
                        {CONDITION_LABELS[r.trigger_condition] || r.trigger_condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[9px] font-medium bg-blue-50 text-blue-700 border-blue-200">
                        {r.primary_provider_name || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[9px] font-medium bg-purple-50 text-purple-700 border-purple-200">
                        {r.fallback_provider_name || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      {ruleConflicts.length > 0 ? (
                        <div className="flex flex-wrap gap-0.5">
                          {ruleConflicts.slice(0, 2).map((c, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className={`text-[7px] font-bold px-1 py-0 h-3.5 ${CONFLICT_BADGE_COLORS[c.type]}`}
                              title={c.message}
                            >
                              {c.severity === 'critical' && <AlertTriangle className="h-2 w-2 mr-0.5" />}
                              {CONFLICT_LABELS[c.type]}
                            </Badge>
                          ))}
                          {ruleConflicts.length > 2 && (
                            <span className="text-[8px] text-[#9CA3AF]">+{ruleConflicts.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-[#9CA3AF]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <span className="text-[11px] font-mono tabular-nums text-[#6B7280]">{r.trigger_count}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-[9px] text-[#6B7280]">{formatUpdated(r.updated_at)}</span>
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <span className={`text-[11px] font-semibold tabular-nums ${r.trigger_count > 0 && (r.recovery_success_count / r.trigger_count) >= 0.8 ? 'text-emerald-600' : r.trigger_count > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'}`}>
                        {getRecoveryRate(r)}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#F3F0EB]">
                            <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem className="text-[11px]" onClick={() => { setEditingRule(r); setBuilderOpen(true); }}>
                            <Eye className="h-3 w-3 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]" onClick={() => { setEditingRule(r); setBuilderOpen(true); }}>
                            <Pencil className="h-3 w-3 mr-2" />Edit Rule
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]" onClick={() => toast({ title: 'Rule duplicated' })}>
                            <Copy className="h-3 w-3 mr-2" />Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[11px]" onClick={() => toast({ title: r.is_enabled ? 'Rule disabled' : 'Rule enabled' })}>
                            {r.is_enabled ? <Pause className="h-3 w-3 mr-2" /> : <Play className="h-3 w-3 mr-2" />}
                            {r.is_enabled ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]" onClick={() => toast({ title: 'Version rollback', description: `Rule "${r.rule_name}" — review version history in the audit trail` })}>
                            <RotateCcw className="h-3 w-3 mr-2" />Rollback
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[11px] text-[#9CA3AF]" onClick={() => toast({ title: 'Rule archived' })}>
                            <Archive className="h-3 w-3 mr-2" />Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Rule Builder Drawer */}
      <RuleBuilderDrawer
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        editRule={editingRule}
        onSaved={onRefresh}
      />
    </div>
  );
}
