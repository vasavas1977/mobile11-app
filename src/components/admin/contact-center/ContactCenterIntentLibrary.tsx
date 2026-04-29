import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BookOpen,
  BarChart3,
  TrendingUp,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainIntent {
  id: string;
  intent_key: string;
  display_name: string;
  description: string;
  category: string;
  ideal_behavior: any;
  ideal_actions: any[];
  resolution_criteria: any;
  typical_failures: any[];
  score_expectations: any;
  related_kb_categories: string[];
  related_action_types: string[];
  matching_keywords: string[];
  total_conversations: number;
  avg_score: number;
  avg_rating: number;
  containment_rate: number;
  is_active: boolean;
}

function IntentCard({ intent }: { intent: DomainIntent }) {
  const [expanded, setExpanded] = useState(false);
  const behavior = intent.ideal_behavior || {};
  const resolution = intent.resolution_criteria || {};
  const scoreExp = intent.score_expectations || {};

  return (
    <Card className="border-border/50">
      <CardHeader
        className="py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{intent.display_name}</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  intent.category === "sales"
                    ? "border-primary/50 text-primary"
                    : "border-muted-foreground/50"
                )}
              >
                {intent.category}
              </Badge>
              {!intent.is_active && (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{intent.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mini KPIs */}
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="font-mono font-medium">{intent.avg_score?.toFixed(1) || "—"}</p>
                <p className="text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <p className="font-mono font-medium">{intent.avg_rating?.toFixed(1) || "—"}</p>
                <p className="text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <p className="font-mono font-medium">{intent.containment_rate?.toFixed(0) || "—"}%</p>
                <p className="text-muted-foreground">Contained</p>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-5">
          <Tabs defaultValue="behavior" className="w-full">
            <TabsList className="w-full justify-start h-8 bg-muted/50">
              <TabsTrigger value="behavior" className="text-xs h-7">Behavior</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs h-7">Actions</TabsTrigger>
              <TabsTrigger value="resolution" className="text-xs h-7">Resolution</TabsTrigger>
              <TabsTrigger value="failures" className="text-xs h-7">Failures</TabsTrigger>
              <TabsTrigger value="scoring" className="text-xs h-7">Scoring</TabsTrigger>
              <TabsTrigger value="connections" className="text-xs h-7">Connections</TabsTrigger>
            </TabsList>

            {/* Ideal Behavior */}
            <TabsContent value="behavior" className="space-y-3 mt-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tone</p>
                <p className="text-sm">{behavior.tone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Greeting</p>
                <p className="text-sm">{behavior.greeting}</p>
              </div>
              {behavior.steps?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Steps</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {behavior.steps.map((s: string, i: number) => (
                      <li key={i} className="text-sm">{s}</li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {behavior.must_do?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Must Do
                    </p>
                    <ul className="space-y-0.5">
                      {behavior.must_do.map((m: string, i: number) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">•</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {behavior.must_not_do?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-destructive" /> Must Not Do
                    </p>
                    <ul className="space-y-0.5">
                      {behavior.must_not_do.map((m: string, i: number) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                          <span className="text-destructive mt-0.5">•</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Ideal Actions */}
            <TabsContent value="actions" className="space-y-2 mt-3">
              {intent.ideal_actions?.map((action: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-md p-2.5">
                  <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{action.action_type?.replace(/_/g, " ")}</span>
                    <p className="text-xs text-muted-foreground">{action.when}</p>
                  </div>
                  <Badge variant={action.required ? "default" : "outline"} className="text-[10px]">
                    {action.required ? "Required" : "Optional"}
                  </Badge>
                </div>
              ))}
            </TabsContent>

            {/* Resolution Criteria */}
            <TabsContent value="resolution" className="space-y-3 mt-3">
              {resolution.must_resolve?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Must Resolve</p>
                  <ul className="space-y-0.5">
                    {resolution.must_resolve.map((r: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resolution.success_indicators?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Success Indicators</p>
                  <ul className="space-y-0.5">
                    {resolution.success_indicators.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resolution.max_turns && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Max Turns:</span>
                  <Badge variant="outline" className="text-xs">{resolution.max_turns}</Badge>
                </div>
              )}
            </TabsContent>

            {/* Failure Patterns */}
            <TabsContent value="failures" className="space-y-2 mt-3">
              {intent.typical_failures?.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-md p-2.5">
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
                    f.frequency === "common" ? "text-destructive" :
                    f.frequency === "occasional" ? "text-amber-500" :
                    "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{f.failure_type?.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        f.frequency === "common" ? "border-destructive/50 text-destructive" :
                        f.frequency === "occasional" ? "border-amber-500/50 text-amber-600" :
                        ""
                      )}>
                        {f.frequency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Score Expectations */}
            <TabsContent value="scoring" className="mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(scoreExp).map(([key, val]) => {
                  const label = key.replace("min_", "").replace(/_/g, " ");
                  const value = val as number;
                  return (
                    <div key={key} className="text-center bg-muted/40 rounded-md p-2.5">
                      <p className="text-lg font-mono font-semibold">{value}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{label}</p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Connections */}
            <TabsContent value="connections" className="space-y-3 mt-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> KB Categories
                </p>
                <div className="flex flex-wrap gap-1">
                  {intent.related_kb_categories?.map((c: string) => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Backend Actions
                </p>
                <div className="flex flex-wrap gap-1">
                  {intent.related_action_types?.map((a: string) => (
                    <Badge key={a} variant="outline" className="text-xs">{a.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Target className="h-3 w-3" /> Matching Keywords
                </p>
                <div className="flex flex-wrap gap-1">
                  {intent.matching_keywords?.map((k: string) => (
                    <Badge key={k} variant="outline" className="text-[10px] bg-muted/50">{k}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

export function ContactCenterIntentLibrary() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: intents, isLoading } = useQuery({
    queryKey: ["domain-intent-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domain_intent_library")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return (data || []) as DomainIntent[];
    },
  });

  // Aggregate stats
  const { data: matchStats } = useQuery({
    queryKey: ["intent-match-stats"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("conversation_intent_matches")
        .select("intent_id, confidence")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data || []) as any[];
    },
  });

  const filtered = intents?.filter(
    (i) => categoryFilter === "all" || i.category === categoryFilter
  );

  const salesCount = intents?.filter((i) => i.category === "sales").length || 0;
  const supportCount = intents?.filter((i) => i.category === "support").length || 0;
  const totalMatches = matchStats?.length || 0;
  const avgConfidence = totalMatches > 0
    ? (matchStats!.reduce((sum: number, m: any) => sum + (m.confidence || 0), 0) / totalMatches)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Domain Intent Library
          </h2>
          <p className="text-sm text-muted-foreground">
            Mobile11 telecom & eSIM intent models with behavior definitions, scoring, and improvement flows
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{intents?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Intents</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{salesCount}</p>
            <p className="text-xs text-muted-foreground">Sales Intents</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{supportCount}</p>
            <p className="text-xs text-muted-foreground">Support Intents</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalMatches}</p>
            <p className="text-xs text-muted-foreground">Recent Matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "support", "sales"].map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
            className="text-xs capitalize"
          >
            {cat === "all" ? "All Intents" : cat}
          </Button>
        ))}
      </div>

      {/* Intent List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading intent library...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((intent) => (
            <IntentCard key={intent.id} intent={intent} />
          ))}
          {(!filtered || filtered.length === 0) && (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                No intents found
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
