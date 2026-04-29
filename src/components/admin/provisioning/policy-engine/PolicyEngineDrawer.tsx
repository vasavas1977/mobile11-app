import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert, List, GitBranch, Route, FlaskConical, ScrollText, Settings,
  AlertTriangle, FileCheck, Clock, ShieldOff, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PolicyRulesTab } from './PolicyRulesTab';
import { PolicyConditionsTab } from './PolicyConditionsTab';
import { PolicyRoutingTab } from './PolicyRoutingTab';
import { PolicySimulationTab } from './PolicySimulationTab';
import { PolicyAuditTab } from './PolicyAuditTab';
import { PolicySettingsTab } from './PolicySettingsTab';
import { detectConflicts, type ConflictWarning } from './conflictDetection';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PolicyEngineDrawer({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [rules, setRules] = useState<FallbackRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fallback_rules')
        .select('*')
        .order('priority', { ascending: true });
      if (error) throw error;

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
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchRules();
  }, [open, fetchRules]);

  const conflicts = useMemo(() => detectConflicts(rules), [rules]);

  const stats = useMemo(() => {
    const active = rules.filter(r => r.is_enabled).length;
    const drafts = rules.filter(r => !r.is_enabled).length;
    const recentlyTriggered = rules.filter(r => {
      if (!r.last_triggered_at) return false;
      return Date.now() - new Date(r.last_triggered_at).getTime() < 24 * 3600000;
    }).length;
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    const warnings = conflicts.filter(c => c.severity === 'warning').length;
    return { total: rules.length, active, drafts, recentlyTriggered, conflicts: conflicts.length, critical, warnings };
  }, [rules, conflicts]);

  const handleDisableAll = async () => {
    if (!window.confirm('Disable ALL active rules? This will stop all automated failover.')) return;
    const { error } = await supabase
      .from('fallback_rules')
      .update({ is_enabled: false })
      .eq('is_enabled', true);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Safe Mode Activated', description: 'All fallback rules have been disabled' });
      fetchRules();
    }
  };

  const handleExportConfig = () => {
    const config = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      rules: rules.map(r => ({
        rule_name: r.rule_name,
        scope: r.scope,
        priority: r.priority,
        trigger_condition: r.trigger_condition,
        trigger_threshold: r.trigger_threshold,
        is_enabled: r.is_enabled,
        cooldown_minutes: r.cooldown_minutes,
        primary_provider: r.primary_provider_name,
        fallback_provider: r.fallback_provider_name,
      })),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fallback-policy-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Policy configuration downloaded' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-5xl p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-[#F3F0EB] bg-white flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-4.5 w-4.5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-bold text-foreground">Fallback Policy Engine</SheetTitle>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Configure automated failover rules, routing logic, and recovery policies for supplier redundancy.</p>
            </div>
            {/* Safety actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 border-[#E5E7EB]"
                onClick={handleExportConfig}
              >
                <Download className="h-2.5 w-2.5" /> Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleDisableAll}
              >
                <ShieldOff className="h-2.5 w-2.5" /> Safe Mode
              </Button>
            </div>
          </div>

          {/* Overview KPIs */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { label: 'Active Rules', value: stats.active, icon: FileCheck, color: 'text-emerald-600' },
              { label: 'Draft / Disabled', value: stats.drafts, icon: List, color: 'text-[#6B7280]' },
              { label: 'Conflicts', value: stats.conflicts, icon: AlertTriangle, color: stats.conflicts > 0 ? 'text-red-600' : 'text-[#9CA3AF]' },
              { label: 'Triggered 24h', value: stats.recentlyTriggered, icon: Clock, color: stats.recentlyTriggered > 0 ? 'text-amber-600' : 'text-[#9CA3AF]' },
              { label: 'Total Rules', value: stats.total, icon: ShieldAlert, color: 'text-foreground' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
                  <span className={`text-sm font-bold tabular-nums ${kpi.color}`}>{kpi.value}</span>
                </div>
                <p className="text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Conflict summary banner */}
          {conflicts.length > 0 && (
            <div className={`mt-3 rounded-lg border px-3 py-2 ${
              stats.critical > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-3.5 w-3.5 ${stats.critical > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                <p className={`text-[10px] font-bold uppercase tracking-wider ${stats.critical > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  {stats.critical > 0
                    ? `${stats.critical} Critical · ${stats.warnings} Warning`
                    : `${stats.warnings} Conflict Warning${stats.warnings !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <div className="mt-1 space-y-0.5">
                {conflicts.slice(0, 3).map((c, i) => (
                  <p key={i} className={`text-[9px] ${stats.critical > 0 ? 'text-red-600' : 'text-amber-600'}`}>• {c.message}</p>
                ))}
                {conflicts.length > 3 && (
                  <p className="text-[9px] text-[#9CA3AF]">+{conflicts.length - 3} more…</p>
                )}
              </div>
            </div>
          )}

          {/* Evaluation order summary */}
          <div className="mt-3 bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] px-3 py-2">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Policy Evaluation Order</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {rules.filter(r => r.is_enabled).sort((a, b) => a.priority - b.priority).slice(0, 8).map((r, i) => (
                <div key={r.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[9px] text-[#9CA3AF]">→</span>}
                  <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0 h-4 bg-white border-[#E5E7EB]">
                    P{r.priority}: {r.rule_name.length > 20 ? r.rule_name.slice(0, 20) + '…' : r.rule_name}
                  </Badge>
                </div>
              ))}
              {rules.filter(r => r.is_enabled).length > 8 && (
                <span className="text-[9px] text-[#9CA3AF]">+{rules.filter(r => r.is_enabled).length - 8} more</span>
              )}
              {rules.filter(r => r.is_enabled).length === 0 && (
                <span className="text-[10px] text-[#9CA3AF]">No active rules configured</span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-3 border-b border-[#F3F0EB] bg-white flex-shrink-0">
              <TabsList className="bg-transparent h-8 p-0 gap-0">
                {[
                  { value: 'rules', label: 'Rules', icon: List },
                  { value: 'conditions', label: 'Conditions', icon: GitBranch },
                  { value: 'routing', label: 'Routing Logic', icon: Route },
                  { value: 'simulation', label: 'Simulation', icon: FlaskConical },
                  { value: 'audit', label: 'Audit Trail', icon: ScrollText },
                  { value: 'settings', label: 'Settings', icon: Settings },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-[11px] font-medium h-8 px-3 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-[#6B7280] hover:text-foreground"
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                    {tab.value === 'rules' && conflicts.length > 0 && (
                      <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                        {conflicts.length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="rules" className="mt-0 h-full">
                <PolicyRulesTab rules={rules} loading={loading} onRefresh={fetchRules} conflicts={conflicts} />
              </TabsContent>
              <TabsContent value="conditions" className="mt-0 h-full">
                <PolicyConditionsTab rules={rules} />
              </TabsContent>
              <TabsContent value="routing" className="mt-0 h-full">
                <PolicyRoutingTab rules={rules} />
              </TabsContent>
              <TabsContent value="simulation" className="mt-0 h-full">
                <PolicySimulationTab rules={rules} />
              </TabsContent>
              <TabsContent value="audit" className="mt-0 h-full">
                <PolicyAuditTab />
              </TabsContent>
              <TabsContent value="settings" className="mt-0 h-full">
                <PolicySettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
