import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Brain,
  AlertTriangle,
  BookOpen,
  MessageSquareText,
  Zap,
  Layers,
  FlaskConical,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AIReasoningPanelProps {
  conversationId: string;
}

// Score dimension display
function ScoreDimension({ label, value, max = 10 }: { label: string; value: number | null; max?: number }) {
  if (value == null) return null;
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusIcon({ positive }: { positive: boolean | null }) {
  if (positive === true) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />;
  if (positive === false) return <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />;
  return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
}

export function AIReasoningPanel({ conversationId }: AIReasoningPanelProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  // Fetch AI score
  const { data: score } = useQuery({
    queryKey: ["ai-reasoning-score", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_conversation_scores")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any;
      return data as any;
    },
    enabled: !!conversationId,
  });

  // Fetch failure events
  const { data: failures } = useQuery({
    queryKey: ["ai-reasoning-failures", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_failure_events")
        .select("id, failure_type, failure_subtype, severity, root_cause_guess, suggested_fix_type")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(10) as any;
      return (data || []) as any[];
    },
    enabled: !!conversationId,
  });

  // Fetch cluster membership
  const { data: clusterEvent } = useQuery({
    queryKey: ["ai-reasoning-cluster", conversationId],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("ai_conversation_events")
        .select("payload")
        .eq("conversation_id", conversationId)
        .eq("processing_status", "clustered")
        .limit(1)
        .maybeSingle();
      if (!events?.payload) return null;
      const payload = events.payload as any;
      if (!payload.cluster_id) return null;
      const { data: cluster } = await supabase
        .from("ai_intent_clusters")
        .select("id, cluster_name, impact_score, recommended_action, status")
        .eq("id", payload.cluster_id)
        .maybeSingle();
      return cluster;
    },
    enabled: !!conversationId,
  });

  // Fetch related KB candidate
  const { data: kbCandidate } = useQuery({
    queryKey: ["ai-reasoning-kb", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("kb_improvement_candidates")
        .select("id, suggested_title, issue_type, priority, status, issue_summary")
        .order("priority", { ascending: false })
        .limit(20) as any;
      // Find one whose conversation_examples contains the conversationId
      const items = (data || []) as any[];
      return items.find((item: any) => {
        const examples = item.conversation_examples;
        if (!examples) return false;
        return JSON.stringify(examples).includes(conversationId);
      }) || null;
    },
    enabled: !!conversationId,
  });

  // Fetch prompt experiment
  const { data: experiment } = useQuery({
    queryKey: ["ai-reasoning-experiment", conversationId],
    queryFn: async () => {
      const res = await (supabase as any)
        .from("prompt_experiment_results")
        .select("experiment_id")
        .eq("conversation_id", conversationId)
        .limit(1)
        .maybeSingle();
      const results = res?.data;
      if (!results?.experiment_id) return null;
      const { data: exp } = await supabase
        .from("prompt_experiments")
        .select("id, experiment_name, status, winner_version_id")
        .eq("id", results.experiment_id)
        .maybeSingle() as any;
      return exp as any;
    },
    enabled: !!conversationId,
  });

  // Fetch autonomous actions
  const { data: actions } = useQuery({
    queryKey: ["ai-reasoning-actions", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("autonomous_actions_log")
        .select("id, action_type, action_status, approval_status, action_summary, is_dry_run")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(5) as any;
      return (data || []) as any[];
    },
    enabled: !!conversationId,
  });

  // Fetch intent matches
  const { data: intentMatches } = useQuery({
    queryKey: ["ai-reasoning-intents", conversationId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("conversation_intent_matches")
        .select("*, domain_intent_library(display_name, intent_key, category)")
        .eq("conversation_id", conversationId)
        .order("confidence", { ascending: false })
        .limit(3);
      return (data || []) as any[];
    },
    enabled: !!conversationId,
  });

  const hasKBWeakness = failures?.some(
    (f: any) => f.failure_type === "missing_kb" || f.suggested_fix_type === "kb_update"
  );
  const hasPromptWeakness = failures?.some(
    (f: any) => f.failure_type === "incomplete_answer" || f.failure_type === "wrong_answer" || f.suggested_fix_type === "prompt_change"
  );
  const hasMissingAction = failures?.some(
    (f: any) => f.failure_type === "missing_backend_action"
  );

  const hasAnyData = score || (failures && failures.length > 0) || clusterEvent || kbCandidate || experiment || (actions && actions.length > 0) || (intentMatches && intentMatches.length > 0);

  if (!hasAnyData) {
    return (
      <Card className="border-border/50">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            AI Reasoning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No AI analysis available for this conversation yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader
        className="py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="flex-1">AI Reasoning</span>
          {score?.composite_score != null && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono",
                score.composite_score >= 7 ? "border-emerald-500/50 text-emerald-600" :
                score.composite_score >= 4 ? "border-amber-500/50 text-amber-600" :
                "border-destructive/50 text-destructive"
              )}
            >
              {score.composite_score.toFixed(1)}
            </Badge>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Score Breakdown */}
          {score && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Score Breakdown
              </h4>
              <div className="space-y-2">
                <ScoreDimension label="Accuracy" value={score.ai_accuracy_score} />
                <ScoreDimension label="Resolution" value={score.ai_resolution_score} />
                <ScoreDimension label="Clarity" value={score.ai_clarity_score} />
                <ScoreDimension label="Empathy" value={score.ai_empathy_score} />
                <ScoreDimension label="Policy Compliance" value={score.ai_policy_compliance_score} />
                <ScoreDimension label="Confidence" value={score.ai_confidence_score} />
                <ScoreDimension label="Predicted CSAT" value={score.predicted_customer_satisfaction_score} max={5} />
                <ScoreDimension label="Business Outcome" value={score.business_outcome_score} />
              </div>
              {score.score_reasoning_summary && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 leading-relaxed">
                  {score.score_reasoning_summary}
                </p>
              )}
            </div>
          )}

          {/* Diagnosis Flags */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Diagnosis
            </h4>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2 text-xs">
                <StatusIcon positive={hasKBWeakness === true ? false : hasKBWeakness === false ? true : null} />
                <span>{hasKBWeakness ? "KB weakness detected" : "No KB gaps identified"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <StatusIcon positive={hasPromptWeakness === true ? false : hasPromptWeakness === false ? true : null} />
                <span>{hasPromptWeakness ? "Prompt weakness detected" : "Prompt performed well"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <StatusIcon positive={hasMissingAction === true ? false : hasMissingAction === false ? true : null} />
                <span>{hasMissingAction ? "Missing backend action" : "Action coverage sufficient"}</span>
              </div>
            </div>
          </div>

          {/* Detected Failures */}
          {failures && failures.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Failures ({failures.length})
              </h4>
              <div className="space-y-1.5">
                {failures.map((f) => (
                  <div key={f.id} className="flex items-start gap-2 text-xs bg-muted/40 rounded-md p-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] flex-shrink-0",
                        f.severity === "critical" ? "border-destructive/50 text-destructive" :
                        f.severity === "high" ? "border-amber-500/50 text-amber-600" :
                        "border-border"
                      )}
                    >
                      {f.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{f.failure_type.replace(/_/g, " ")}</span>
                      {f.failure_subtype && <span className="text-muted-foreground"> · {f.failure_subtype}</span>}
                      {f.root_cause_guess && (
                        <p className="text-muted-foreground mt-0.5 leading-snug">{f.root_cause_guess}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Intents */}
          {intentMatches && intentMatches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Matched Intents
              </h4>
              <div className="space-y-1.5">
                {intentMatches.map((m: any) => (
                  <div key={m.id} className="bg-muted/40 rounded-md p-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{m.domain_intent_library?.display_name || m.intent_id}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {(m.confidence * 100).toFixed(0)}% match
                      </Badge>
                    </div>
                    {m.improvement_suggestions?.length > 0 && (
                      <ul className="space-y-0.5">
                        {m.improvement_suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                            <span className="text-amber-500">⚠</span> {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary gap-1 px-0"
                onClick={() => navigate("/admin/contact-center/intent-library")}
              >
                <ExternalLink className="h-3 w-3" /> View Intent Library
              </Button>
            </div>
          )}

          <Separator />

          {/* Cluster */}
          {clusterEvent && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Intent Cluster
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{clusterEvent.cluster_name}</Badge>
                {clusterEvent.impact_score != null && (
                  <span className="text-[10px] text-muted-foreground">Impact: {clusterEvent.impact_score}</span>
                )}
              </div>
              {clusterEvent.recommended_action && (
                <p className="text-xs text-muted-foreground">{clusterEvent.recommended_action}</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary gap-1 px-0"
                onClick={() => navigate("/admin/contact-center/ai-clusters")}
              >
                <ExternalLink className="h-3 w-3" /> View Cluster
              </Button>
            </div>
          )}

          {/* KB Candidate */}
          {kbCandidate && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> KB Improvement
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium">{kbCandidate.suggested_title || kbCandidate.issue_summary}</span>
                <Badge variant="outline" className="text-[10px]">{kbCandidate.issue_type}</Badge>
                <Badge variant="outline" className="text-[10px]">{kbCandidate.status}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary gap-1 px-0"
                onClick={() => navigate("/admin/contact-center/kb-candidates")}
              >
                <ExternalLink className="h-3 w-3" /> View KB Candidate
              </Button>
            </div>
          )}

          {/* Prompt Experiment */}
          {experiment && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FlaskConical className="h-3 w-3" /> Experiment
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium">{experiment.experiment_name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    experiment.status === "running" ? "border-blue-500/50 text-blue-600" :
                    experiment.status === "completed" ? "border-emerald-500/50 text-emerald-600" :
                    ""
                  )}
                >
                  {experiment.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary gap-1 px-0"
                onClick={() => navigate("/admin/contact-center/prompt-experiments")}
              >
                <ExternalLink className="h-3 w-3" /> View Experiment
              </Button>
            </div>
          )}

          {/* Backend Actions */}
          {actions && actions.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Actions Triggered ({actions.length})
              </h4>
              <div className="space-y-1.5">
                {actions.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        a.action_status === "completed" ? "border-emerald-500/50 text-emerald-600" :
                        a.action_status === "failed" ? "border-destructive/50 text-destructive" :
                        "border-amber-500/50 text-amber-600"
                      )}
                    >
                      {a.action_status}
                    </Badge>
                    <span className="font-medium">{a.action_type.replace(/_/g, " ")}</span>
                    {a.is_dry_run && <Badge variant="secondary" className="text-[10px]">dry-run</Badge>}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary gap-1 px-0"
                onClick={() => navigate("/admin/contact-center/action-audit")}
              >
                <ExternalLink className="h-3 w-3" /> View Action Log
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
