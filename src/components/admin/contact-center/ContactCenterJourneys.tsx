import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Route, ShoppingCart, CreditCard, Wifi, QrCode, RotateCcw, Clock, TrendingUp,
  CheckCircle2, AlertTriangle, Users, Target, ArrowRight, Zap, BarChart3,
  ChevronDown, ChevronUp,
} from "lucide-react";

const journeyIcons: Record<string, any> = {
  package_recommendation: ShoppingCart,
  payment_problem: CreditCard,
  activation_not_working: Wifi,
  qr_resend: QrCode,
  refund_request: RotateCcw,
  silent_after_recommendation: Clock,
  hot_lead_upsell: TrendingUp,
};

const categoryColors: Record<string, string> = {
  commerce: "bg-emerald-100 text-emerald-800",
  support: "bg-blue-100 text-blue-800",
};

export function ContactCenterJourneys() {
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);

  const { data: journeys, isLoading } = useQuery({
    queryKey: ["customer-journey-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_journey_templates" as any)
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: executions } = useQuery({
    queryKey: ["journey-executions-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_executions" as any)
        .select("journey_id, outcome, journey_score, matched_success_criteria")
        .not("outcome", "is", null);
      if (error) throw error;
      return data as any[];
    },
  });

  // Compute stats per journey
  const statsMap: Record<string, { total: number; resolved: number; converted: number; handedOff: number; avgScore: number; successRate: number }> = {};
  if (executions) {
    for (const ex of executions) {
      if (!statsMap[ex.journey_id]) {
        statsMap[ex.journey_id] = { total: 0, resolved: 0, converted: 0, handedOff: 0, avgScore: 0, successRate: 0 };
      }
      const s = statsMap[ex.journey_id];
      s.total++;
      if (ex.outcome === "resolved") s.resolved++;
      if (ex.outcome === "converted") s.converted++;
      if (ex.outcome === "handed_off") s.handedOff++;
      if (ex.journey_score) s.avgScore += ex.journey_score;
      if (ex.matched_success_criteria) s.successRate++;
    }
    for (const id in statsMap) {
      const s = statsMap[id];
      if (s.total > 0) {
        s.avgScore = Math.round(s.avgScore / s.total);
        s.successRate = Math.round((s.successRate / s.total) * 100);
      }
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading journeys…</div>;
  }

  const commerceJourneys = journeys?.filter((j: any) => j.category === "commerce") || [];
  const supportJourneys = journeys?.filter((j: any) => j.category === "support") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Autonomous Customer Journeys
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-orchestrated flows combining support and commerce for maximum resolution and conversion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{journeys?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Active Journeys</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Executions" value={executions?.length || 0} icon={BarChart3} />
        <StatCard label="Auto-Resolved" value={executions?.filter((e: any) => e.outcome === "resolved").length || 0} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard label="Converted" value={executions?.filter((e: any) => e.outcome === "converted").length || 0} icon={TrendingUp} color="text-blue-600" />
        <StatCard label="Handed Off" value={executions?.filter((e: any) => e.outcome === "handed_off").length || 0} icon={Users} color="text-amber-600" />
        <StatCard label="Abandoned" value={executions?.filter((e: any) => e.outcome === "abandoned" || e.outcome === "dead_air").length || 0} icon={AlertTriangle} color="text-red-600" />
      </div>

      {/* Journey Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({journeys?.length || 0})</TabsTrigger>
          <TabsTrigger value="commerce">Commerce ({commerceJourneys.length})</TabsTrigger>
          <TabsTrigger value="support">Support ({supportJourneys.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {journeys?.map((j: any) => (
            <JourneyCard key={j.id} journey={j} stats={statsMap[j.id]} expanded={expandedJourney === j.id} onToggle={() => setExpandedJourney(expandedJourney === j.id ? null : j.id)} />
          ))}
        </TabsContent>
        <TabsContent value="commerce" className="mt-4 space-y-4">
          {commerceJourneys.map((j: any) => (
            <JourneyCard key={j.id} journey={j} stats={statsMap[j.id]} expanded={expandedJourney === j.id} onToggle={() => setExpandedJourney(expandedJourney === j.id ? null : j.id)} />
          ))}
        </TabsContent>
        <TabsContent value="support" className="mt-4 space-y-4">
          {supportJourneys.map((j: any) => (
            <JourneyCard key={j.id} journey={j} stats={statsMap[j.id]} expanded={expandedJourney === j.id} onToggle={() => setExpandedJourney(expandedJourney === j.id ? null : j.id)} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color || "text-muted-foreground"}`} />
        <div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function JourneyCard({ journey, stats, expanded, onToggle }: { journey: any; stats?: any; expanded: boolean; onToggle: () => void }) {
  const Icon = journeyIcons[journey.journey_key] || Route;
  const steps = (journey.ideal_steps || []) as any[];
  const actions = (journey.action_opportunities || []) as any[];
  const handoffs = (journey.handoff_triggers || []) as any[];
  const targets = journey.optimization_targets || {};
  const scoring = journey.scoring_criteria || {};
  const successOutcomes = journey.success_outcomes || {};
  const fallback = journey.fallback_rules || {};

  return (
    <Card className="border-border overflow-hidden">
      <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{journey.journey_name}</h3>
                <Badge variant="outline" className={categoryColors[journey.category] || ""}>{journey.category}</Badge>
                {!journey.is_active && <Badge variant="destructive">Disabled</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{journey.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {stats && stats.total > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Runs</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-emerald-600">{stats.successRate}%</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{stats.avgScore}</div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                </div>
              </div>
            )}
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/10 p-4 space-y-5">
          {/* Ideal Conversation Path */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" /> Ideal Conversation Path
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((step: any, i: number) => (
                <div key={step.step} className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${step.required ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground"}`}>
                    <span className="font-bold mr-1">{i + 1}.</span> {step.description}
                  </div>
                  {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Action Opportunities */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> Action Opportunities
              </h4>
              <div className="space-y-1.5">
                {actions.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant={a.required ? "default" : "outline"} className="text-[10px] px-1.5">
                      {a.required ? "Required" : "Optional"}
                    </Badge>
                    <code className="font-mono text-xs text-primary">{a.action}</code>
                    <span className="text-muted-foreground">— {a.when}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring Criteria */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" /> Scoring Criteria
              </h4>
              <div className="space-y-1.5">
                {Object.entries(scoring).filter(([k]) => k.startsWith("min_")).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">{key.replace("min_", "").replace("_", " ")}:</span>
                    <Progress value={val as number} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-foreground">{val as number}+</span>
                  </div>
                ))}
                {Object.entries(scoring).filter(([k]) => k.startsWith("must_")).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="text-muted-foreground capitalize">{key.replace("must_", "").replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Success Outcomes */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Success Outcomes</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Primary</Badge>
                  <span className="text-muted-foreground">{successOutcomes.primary}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">Secondary</Badge>
                  <span className="text-muted-foreground">{successOutcomes.secondary}</span>
                </div>
              </div>
            </div>

            {/* Handoff Triggers */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Human Handoff Triggers</h4>
              <div className="space-y-1">
                {handoffs.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <Badge variant={h.priority === "critical" ? "destructive" : h.priority === "high" ? "default" : "outline"} className="text-[10px]">
                      {h.priority}
                    </Badge>
                    <span className="text-muted-foreground">{h.trigger}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Targets */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Optimization Targets</h4>
              <div className="space-y-1">
                {Object.entries(targets).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="font-semibold text-foreground">{typeof val === "number" ? (key.includes("seconds") ? `${val}s` : key.includes("rate") || key.includes("satisfaction") || key.includes("without") ? `${val}%` : val) : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fallback Rules */}
          {Object.keys(fallback).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Fallback Logic</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {Object.entries(fallback).filter(([k]) => k !== "max_fallback_turns").map(([key, val]) => (
                  <div key={key} className="text-xs bg-muted/50 rounded-md px-3 py-2">
                    <span className="font-medium text-foreground capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                    <span className="text-muted-foreground">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
