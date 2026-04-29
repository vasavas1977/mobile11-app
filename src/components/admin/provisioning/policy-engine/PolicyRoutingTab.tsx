import { Badge } from '@/components/ui/badge';
import { ArrowRight, RotateCcw, Shield } from 'lucide-react';

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

export function PolicyRoutingTab({ rules }: Props) {
  const activeRules = rules.filter(r => r.is_enabled).sort((a, b) => a.priority - b.priority);

  // Group routes by primary→fallback pair
  const routePairs = new Map<string, FallbackRule[]>();
  activeRules.forEach(r => {
    const key = `${r.primary_provider_name || 'Unknown'}→${r.fallback_provider_name || 'Unknown'}`;
    if (!routePairs.has(key)) routePairs.set(key, []);
    routePairs.get(key)!.push(r);
  });

  return (
    <div className="space-y-4">
      {/* Route summary */}
      <div>
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">Active Routing Chains</h3>
        {routePairs.size === 0 ? (
          <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-6 text-center">
            <p className="text-[11px] text-[#9CA3AF]">No active routing chains configured.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(routePairs.entries()).map(([key, pairRules]) => {
              const [primary, fallback] = key.split('→');
              return (
                <div key={key} className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
                  {/* Route header */}
                  <div className="px-4 py-3 border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5">
                        {primary}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
                      <Badge variant="outline" className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200 px-2 py-0.5">
                        {fallback}
                      </Badge>
                      <span className="text-[9px] text-[#9CA3AF] ml-auto">{pairRules.length} rule{pairRules.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Route details */}
                  <div className="p-4 space-y-3">
                    {/* Routing parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <RouteField label="Fallback Order" value="Primary → Fallback" icon={ArrowRight} />
                      <RouteField label="Recovery Policy" value="Auto-return on health" icon={RotateCcw} />
                      <RouteField label="Max Attempts" value="3 retries" icon={Shield} />
                      <RouteField label="Min Cooldown" value={`${Math.min(...pairRules.map(r => r.cooldown_minutes))} min`} icon={RotateCcw} />
                    </div>

                    {/* Trigger rules for this route */}
                    <div>
                      <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Trigger Rules</p>
                      <div className="space-y-1">
                        {pairRules.map(r => (
                          <div key={r.id} className="flex items-center gap-2 bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-3 py-1.5">
                            <span className="text-[9px] font-bold text-[#9CA3AF] tabular-nums w-5">P{r.priority}</span>
                            <span className="text-[10px] font-medium text-foreground flex-1">{r.rule_name}</span>
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-[#E5E7EB]">
                              {r.trigger_condition} ≥ {r.trigger_threshold}
                            </Badge>
                            <span className="text-[9px] text-[#9CA3AF]">{r.scope}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scope coverage */}
                    <div className="grid grid-cols-3 gap-2">
                      <ScopeField label="Scope" values={[...new Set(pairRules.map(r => r.scope))]} />
                      <ScopeField label="Conditions Covered" values={[...new Set(pairRules.map(r => r.trigger_condition))]} />
                      <div className="bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-2.5 py-2">
                        <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">Emergency Disable</p>
                        <p className="text-[10px] font-medium text-foreground mt-0.5">Manual kill-switch available</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RouteField({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-2.5 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="h-2.5 w-2.5 text-[#9CA3AF]" />
        <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[10px] font-medium text-foreground">{value}</p>
    </div>
  );
}

function ScopeField({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-2.5 py-2">
      <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {values.map(v => (
          <Badge key={v} variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-[#E5E7EB] bg-white">{v}</Badge>
        ))}
      </div>
    </div>
  );
}
