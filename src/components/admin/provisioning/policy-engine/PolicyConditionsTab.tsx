import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Clock, Gauge, AlertTriangle, Server, RefreshCw, Package, Zap, Hand } from 'lucide-react';

interface FallbackRule {
  id: string;
  rule_name: string;
  trigger_condition: string;
  trigger_threshold: number;
  cooldown_minutes: number;
  is_enabled: boolean;
  priority: number;
  [key: string]: any;
}

interface Props {
  rules: FallbackRule[];
}

const TRIGGER_TYPES = [
  { value: 'api_timeout', label: 'API Timeout', icon: Clock, desc: 'Triggers when API response time exceeds threshold' },
  { value: 'failure_rate', label: 'High Failure Rate', icon: AlertTriangle, desc: 'Triggers when failure percentage exceeds threshold over rolling window' },
  { value: 'http_5xx', label: 'HTTP 5xx Errors', icon: Server, desc: 'Triggers after N consecutive 5xx responses from supplier' },
  { value: 'supplier_down', label: 'Supplier Down', icon: Zap, desc: 'Triggers when supplier health check fails completely' },
  { value: 'sync_stale', label: 'Sync Stale', icon: RefreshCw, desc: 'Triggers when last sync exceeds staleness threshold' },
  { value: 'package_unavailable', label: 'Package Unavailable', icon: Package, desc: 'Triggers when specific package becomes unavailable' },
  { value: 'latency_threshold', label: 'Latency Threshold', icon: Gauge, desc: 'Triggers when p95 latency exceeds acceptable range' },
  { value: 'manual_override', label: 'Manual Override', icon: Hand, desc: 'Admin-initiated manual failover, bypasses automated checks' },
];

export function PolicyConditionsTab({ rules }: Props) {
  const activeRules = rules.filter(r => r.is_enabled);

  return (
    <div className="space-y-4">
      {/* Supported trigger types reference */}
      <div>
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">Supported Trigger Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {TRIGGER_TYPES.map(tt => {
            const count = rules.filter(r => r.trigger_condition === tt.value).length;
            return (
              <div key={tt.value} className="bg-white rounded-lg border border-[#F3F0EB] p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#FAF7F2] border border-[#F3F0EB] flex items-center justify-center flex-shrink-0">
                  <tt.icon className="h-3.5 w-3.5 text-[#6B7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-foreground">{tt.label}</p>
                    {count > 0 && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-orange-50 text-orange-600 border-orange-200">
                        {count} rule{count > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[9px] text-[#9CA3AF] mt-0.5 leading-relaxed">{tt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-rule condition details */}
      <div>
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">Active Rule Conditions</h3>
        {activeRules.length === 0 ? (
          <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-6 text-center">
            <p className="text-[11px] text-[#9CA3AF]">No active rules to display conditions for.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeRules.sort((a, b) => a.priority - b.priority).map(rule => (
              <div key={rule.id} className="bg-white rounded-lg border border-[#F3F0EB] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[#9CA3AF] tabular-nums">P{rule.priority}</span>
                    <p className="text-[11px] font-semibold text-foreground">{rule.rule_name}</p>
                  </div>
                  <Badge className="text-[8px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Active</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <ConditionField label="Trigger Type" value={TRIGGER_TYPES.find(t => t.value === rule.trigger_condition)?.label || rule.trigger_condition} />
                  <ConditionField label="Threshold" value={String(rule.trigger_threshold)} />
                  <ConditionField label="Cooldown" value={`${rule.cooldown_minutes} min`} />
                  <ConditionField label="Comparison" value={rule.trigger_condition === 'failure_rate' ? '≥ percentage' : rule.trigger_condition === 'api_timeout' ? '≥ seconds' : '≥ count'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-2.5 py-1.5">
      <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className="text-[10px] font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
