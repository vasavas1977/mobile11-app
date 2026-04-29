import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FlaskConical, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  RotateCcw, Save, GitCompare, Play, Clock, Shield, Zap, Ban
} from 'lucide-react';

interface FallbackRule {
  id: string;
  rule_name: string;
  scope: string;
  trigger_condition: string;
  trigger_threshold: number;
  priority: number;
  is_enabled: boolean;
  cooldown_minutes: number;
  primary_provider_name?: string | null;
  fallback_provider_name?: string | null;
  [key: string]: any;
}

interface Props {
  rules: FallbackRule[];
}

interface RuleEvaluation {
  rule: FallbackRule;
  matched: boolean;
  skipped: boolean;
  reason: string;
}

interface SimOutcome {
  triggered: boolean;
  selectedRoute: string;
  fallbackSupplier: string | null;
  autoFallback: boolean;
  emergencyStop: boolean;
  conflicts: string[];
  recommendation: string;
  evaluations: RuleEvaluation[];
}

interface SavedScenario {
  id: string;
  timestamp: string;
  name: string;
  result: 'triggered' | 'no-trigger';
  route: string;
}

const TRIGGER_MAP: Record<string, { field: string; label: string }> = {
  api_timeout: { field: 'timeoutCount', label: 'API Timeout Count' },
  failure_rate: { field: 'failRate', label: 'Failure Rate (%)' },
  http_5xx: { field: 'http5xx', label: 'HTTP 5xx Count' },
  api_error: { field: 'http5xx', label: 'HTTP 5xx Count' },
  timeout: { field: 'timeoutCount', label: 'Timeout Count' },
  latency_threshold: { field: 'latency', label: 'Avg Latency (ms)' },
  supplier_down: { field: 'supplierStatus', label: 'Supplier Status' },
  sync_stale: { field: 'syncAge', label: 'Sync Age (min)' },
  manual_override: { field: 'manualOverride', label: 'Manual Override' },
};

export function PolicySimulationTab({ rules }: Props) {
  // Inputs
  const [supplier, setSupplier] = useState('');
  const [pkg, setPkg] = useState('');
  const [destination, setDestination] = useState('');
  const [scope, setScope] = useState('global');
  const [supplierStatus, setSupplierStatus] = useState('healthy');
  const [timeoutCount, setTimeoutCount] = useState('');
  const [failRate, setFailRate] = useState('');
  const [http5xx, setHttp5xx] = useState('');
  const [latency, setLatency] = useState('');
  const [syncAge, setSyncAge] = useState('');
  const [manualOverride, setManualOverride] = useState(false);

  // Results
  const [outcome, setOutcome] = useState<SimOutcome | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const suppliers = useMemo(() =>
    [...new Set(rules.flatMap(r => [r.primary_provider_name, r.fallback_provider_name]).filter(Boolean))] as string[],
    [rules]
  );

  const getFieldValue = (field: string): number | null => {
    const map: Record<string, string> = {
      timeoutCount, failRate, http5xx, latency, syncAge,
      supplierStatus: supplierStatus === 'down' ? '1' : '0',
      manualOverride: manualOverride ? '1' : '0',
    };
    const v = map[field];
    if (v === undefined || v === '') return null;
    return Number(v);
  };

  const runSimulation = () => {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const evaluations: RuleEvaluation[] = [];
    const conflicts: string[] = [];
    const matchedRules: FallbackRule[] = [];

    for (const r of sorted) {
      // Disabled check
      if (!r.is_enabled) {
        evaluations.push({ rule: r, matched: false, skipped: true, reason: 'Rule is disabled' });
        continue;
      }

      // Scope check
      if (supplier && r.primary_provider_name && r.primary_provider_name !== supplier) {
        evaluations.push({ rule: r, matched: false, skipped: true, reason: `Supplier scope mismatch (rule targets ${r.primary_provider_name})` });
        continue;
      }

      // Trigger evaluation
      const triggerInfo = TRIGGER_MAP[r.trigger_condition];
      if (!triggerInfo) {
        evaluations.push({ rule: r, matched: false, skipped: true, reason: `Unknown trigger type: ${r.trigger_condition}` });
        continue;
      }

      const val = getFieldValue(triggerInfo.field);
      if (val === null) {
        evaluations.push({ rule: r, matched: false, skipped: false, reason: `No input for ${triggerInfo.label}` });
        continue;
      }

      const matched = val >= r.trigger_threshold;
      evaluations.push({
        rule: r,
        matched,
        skipped: false,
        reason: matched
          ? `${triggerInfo.label} ${val} ≥ threshold ${r.trigger_threshold}`
          : `${triggerInfo.label} ${val} < threshold ${r.trigger_threshold}`,
      });

      if (matched) matchedRules.push(r);
    }

    // Detect conflicts
    const seen = new Map<string, string>();
    matchedRules.forEach(r => {
      const key = `${r.primary_provider_name}-${r.trigger_condition}`;
      if (seen.has(key)) {
        conflicts.push(`"${r.rule_name}" conflicts with "${seen.get(key)}" — same supplier + trigger condition`);
      }
      seen.set(key, r.rule_name);
    });

    const winner = matchedRules[0] || null;
    const emergencyStop = matchedRules.length >= 3;

    setOutcome({
      triggered: !!winner,
      selectedRoute: winner
        ? `${winner.primary_provider_name} → ${winner.fallback_provider_name}`
        : 'Primary route unchanged',
      fallbackSupplier: winner?.fallback_provider_name || null,
      autoFallback: !!winner,
      emergencyStop,
      conflicts,
      recommendation: winner
        ? emergencyStop
          ? 'Multiple rules triggered simultaneously — consider emergency stop. Review rule overlap.'
          : conflicts.length > 0
            ? 'Fallback would engage, but conflicts detected. Resolve priority overlaps before enabling.'
            : `Rule "${winner.rule_name}" (P${winner.priority}) would route traffic to ${winner.fallback_provider_name}. Cooldown: ${winner.cooldown_minutes}min.`
        : 'No rules match current conditions. Primary routing remains active.',
      evaluations,
    });
  };

  const resetInputs = () => {
    setSupplier(''); setPkg(''); setDestination(''); setScope('global');
    setSupplierStatus('healthy'); setTimeoutCount(''); setFailRate('');
    setHttp5xx(''); setLatency(''); setSyncAge(''); setManualOverride(false);
    setOutcome(null);
  };

  const saveScenario = () => {
    if (!outcome) return;
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      name: `${supplier || 'Any'} — ${scope}`,
      result: outcome.triggered ? 'triggered' : 'no-trigger',
      route: outcome.selectedRoute,
    };
    setSavedScenarios(prev => [scenario, ...prev].slice(0, 20));
  };

  const inputCls = "h-8 text-[11px] border-[hsl(var(--border))] bg-[hsl(var(--muted))]";
  const labelCls = "text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0 mt-0.5">
          <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground">Rule Simulation Workspace</p>
          <p className="text-[9px] text-muted-foreground">Test how fallback rules respond to specific supplier conditions. No live routing is affected.</p>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* LEFT — Inputs */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-orange-500" /> Scenario Inputs
            </p>

            <div className="space-y-2.5">
              <div>
                <label className={labelCls}>Supplier</label>
                <Select value={supplier} onValueChange={setSupplier}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Any supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelCls}>Package</label>
                <Input className={inputCls} placeholder="e.g. EU-5GB-30D" value={pkg} onChange={e => setPkg(e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Destination</label>
                <Input className={inputCls} placeholder="e.g. Thailand" value={destination} onChange={e => setDestination(e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Scope</label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border pt-2.5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Health Metrics</p>
              </div>

              <div>
                <label className={labelCls}>Supplier Status</label>
                <Select value={supplierStatus} onValueChange={setSupplierStatus}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="degraded">Degraded</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelCls}>API Timeout Count</label>
                <Input className={inputCls} placeholder="0" type="number" value={timeoutCount} onChange={e => setTimeoutCount(e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Failure Rate (%)</label>
                <Input className={inputCls} placeholder="0" type="number" value={failRate} onChange={e => setFailRate(e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>HTTP 5xx Count</label>
                <Input className={inputCls} placeholder="0" type="number" value={http5xx} onChange={e => setHttp5xx(e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Avg Latency (ms)</label>
                <Input className={inputCls} placeholder="0" type="number" value={latency} onChange={e => setLatency(e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Sync Age (min)</label>
                <Input className={inputCls} placeholder="0" type="number" value={syncAge} onChange={e => setSyncAge(e.target.value)} />
              </div>

              <div className="flex items-center justify-between">
                <label className={labelCls + " mb-0"}>Manual Override</label>
                <Switch checked={manualOverride} onCheckedChange={setManualOverride} className="scale-75" />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-1.5">
              <Button size="sm" className="w-full h-8 gap-1.5 text-[11px]" onClick={runSimulation}>
                <Play className="h-3 w-3" /> Run Simulation
              </Button>
              <div className="grid grid-cols-2 gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={resetInputs}>
                  <RotateCcw className="h-2.5 w-2.5" /> Reset
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={saveScenario} disabled={!outcome}>
                  <Save className="h-2.5 w-2.5" /> Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — Rule Evaluation */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-orange-500" /> Rule Evaluation Order
            </p>

            {!outcome ? (
              <div className="py-10 text-center">
                <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[11px] text-muted-foreground">Run a simulation to see rule evaluation results</p>
              </div>
            ) : (
              <div className="space-y-1">
                {outcome.evaluations.map((ev, i) => (
                  <div
                    key={ev.rule.id}
                    className={`rounded-lg border p-2.5 flex items-start gap-2.5 ${
                      ev.matched
                        ? 'bg-amber-50/60 border-amber-200'
                        : ev.skipped
                          ? 'bg-muted/30 border-border opacity-60'
                          : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground w-4 block text-center">{i + 1}</span>
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      {ev.matched ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                      ) : ev.skipped ? (
                        <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-foreground truncate">{ev.rule.rule_name}</span>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-border">
                          P{ev.rule.priority}
                        </Badge>
                        {ev.matched && i === outcome.evaluations.findIndex(e => e.matched) && (
                          <Badge className="text-[8px] px-1.5 py-0 h-4 bg-orange-500 text-white border-0">
                            WINNER
                          </Badge>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{ev.reason}</p>
                      {ev.skipped && (
                        <Badge variant="outline" className="text-[8px] mt-1 px-1.5 py-0 h-4 text-muted-foreground border-border">
                          SKIPPED
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Outcome */}
        <div className="lg:col-span-4 space-y-3">
          {!outcome ? (
            <div className="bg-card rounded-xl border border-border p-3 py-10 text-center">
              <ArrowRight className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-[11px] text-muted-foreground">Outcome will appear here</p>
            </div>
          ) : (
            <>
              {/* Main Outcome */}
              <div className={`rounded-xl border p-3 space-y-3 ${
                outcome.triggered
                   ? 'bg-amber-50/50 border-amber-200'
                   : 'bg-emerald-50/50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2">
                  {outcome.triggered ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <p className="text-[12px] font-bold text-foreground">
                    {outcome.triggered ? 'Failover Would Trigger' : 'No Failover Triggered'}
                  </p>
                </div>

                {outcome.triggered && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {outcome.selectedRoute.split(' → ')[0]}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                      {outcome.fallbackSupplier}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Detail Cards */}
              <div className="bg-card rounded-xl border border-border p-3 space-y-2.5">
                <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Decision Details</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Auto-Fallback</p>
                    <p className={`text-[12px] font-bold ${outcome.autoFallback ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {outcome.autoFallback ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Emergency Stop</p>
                    <p className={`text-[12px] font-bold ${outcome.emergencyStop ? 'text-red-600' : 'text-emerald-600'}`}>
                      {outcome.emergencyStop ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Selected Route</p>
                  <p className="text-[11px] font-semibold text-foreground">{outcome.selectedRoute}</p>
                </div>

                {/* Recommendation */}
                <div className="rounded-lg bg-orange-50/60 border border-orange-200/60 p-2">
                  <p className="text-[8px] text-orange-700 uppercase tracking-wider font-bold mb-0.5">Recommendation</p>
                  <p className="text-[10px] text-orange-700/80 leading-relaxed">{outcome.recommendation}</p>
                </div>
              </div>

              {/* Conflicts */}
              {outcome.conflicts.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-3">
                  <p className="text-[9px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Priority Conflicts</p>
                  {outcome.conflicts.map((c, i) => (
                    <p key={i} className="text-[10px] text-red-600">• {c}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Simulations Table */}
      {savedScenarios.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" /> Recent Simulations
          </p>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-[9px] h-7 px-2 text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-[9px] h-7 px-2 text-muted-foreground">Scenario</TableHead>
                  <TableHead className="text-[9px] h-7 px-2 text-muted-foreground">Result</TableHead>
                  <TableHead className="text-[9px] h-7 px-2 text-muted-foreground">Route</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedScenarios.map(s => (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="text-[10px] py-1.5 px-2 text-muted-foreground font-mono">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-[10px] py-1.5 px-2 font-medium text-foreground">{s.name}</TableCell>
                    <TableCell className="py-1.5 px-2">
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 ${
                        s.result === 'triggered'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {s.result === 'triggered' ? 'Triggered' : 'No Trigger'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] py-1.5 px-2 text-foreground">{s.route}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
