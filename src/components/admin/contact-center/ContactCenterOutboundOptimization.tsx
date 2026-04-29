import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_OPTIMIZATION_RECS } from "./outboundSampleData";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Zap, AlertTriangle, CheckCircle2, XCircle, Clock,
  TrendingUp, Shield, ChevronDown, ChevronUp, Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Recommendation = {
  id: string;
  recommendation_type: string;
  severity: string;
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
  current_value: Record<string, unknown> | null;
  recommended_value: Record<string, unknown> | null;
  impact_score: number | null;
  confidence_score: number | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  implemented_at: string | null;
  implementation_notes: string | null;
  engine_version: string | null;
  analysis_window_days: number;
  created_at: string;
  campaign_id: string | null;
  journey_id: string | null;
  journey_step_id: string | null;
  template_id: string | null;
  experiment_id: string | null;
};

const SEVERITY_CONFIG: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  critical: { color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
  high: { color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: AlertTriangle },
  medium: { color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30", icon: Clock },
  low: { color: "bg-muted text-muted-foreground border-border", icon: Clock },
};

const TYPE_LABELS: Record<string, string> = {
  channel_order: "Channel Order",
  send_timing: "Send Timing",
  wait_duration: "Wait Duration",
  message_tone: "Message Tone",
  cta_type: "CTA Type",
  segment_targeting: "Segment Targeting",
  suppression_rule: "Suppression Rule",
  journey_pause: "Journey Pause",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  implemented: { label: "Implemented", variant: "secondary" },
  expired: { label: "Expired", variant: "outline" },
};

export function ContactCenterOutboundOptimization() {
  const { isSampleMode } = usePartnerDataMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [implNotes, setImplNotes] = useState<Record<string, string>>({});

  const { data: liveRecs = [], isLoading: liveLoading } = useQuery({
    queryKey: ["outbound-optimization-recommendations", filterType, filterSeverity, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("outbound_optimization_recommendations")
        .select("*")
        .order("impact_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      if (filterType !== "all") query = query.eq("recommendation_type", filterType);
      if (filterSeverity !== "all") query = query.eq("severity", filterSeverity);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data ?? []) as Recommendation[];
    },
    enabled: !isSampleMode,
  });

  const recommendations = isSampleMode
    ? (SAMPLE_OPTIMIZATION_RECS as unknown as Recommendation[]).filter(r => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterType !== "all" && r.recommendation_type !== filterType) return false;
        if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
        return true;
      })
    : liveRecs;
  const isLoading = isSampleMode ? false : liveLoading;

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("outbound_optimization_recommendations")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-optimization-recommendations"] });
      toast({ title: "Recommendation updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleAccept = (id: string) => {
    updateMutation.mutate({
      id,
      updates: { status: "accepted", reviewed_at: new Date().toISOString(), review_notes: reviewNotes[id] || null },
    });
  };

  const handleReject = (id: string) => {
    updateMutation.mutate({
      id,
      updates: { status: "rejected", reviewed_at: new Date().toISOString(), review_notes: reviewNotes[id] || null },
    });
  };

  const handleImplement = (id: string) => {
    updateMutation.mutate({
      id,
      updates: { status: "implemented", implemented_at: new Date().toISOString(), implementation_notes: implNotes[id] || null },
    });
  };

  // Metrics
  const pending = recommendations.filter((r) => r.status === "pending");
  const allRecs = recommendations;
  const highSeverity = allRecs.filter((r) => r.severity === "critical" || r.severity === "high");
  const avgImpact = allRecs.length > 0
    ? allRecs.reduce((sum, r) => sum + (r.impact_score ?? 0), 0) / allRecs.length
    : 0;

  const renderJsonValue = (val: Record<string, unknown> | null) => {
    if (!val) return <span className="text-muted-foreground text-xs">—</span>;
    return (
      <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto max-w-md">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  };

  return (
    <div>
      <AdminPageHeader title="Outbound Optimization" description="AI-generated recommendations to improve outbound performance" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
          <div><div className="text-2xl font-bold">{filterStatus === "pending" ? allRecs.length : pending.length}</div><div className="text-xs text-muted-foreground">Pending</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          <div><div className="text-2xl font-bold">{highSeverity.length}</div><div className="text-xs text-muted-foreground">High / Critical</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="h-5 w-5 text-green-600" /></div>
          <div><div className="text-2xl font-bold">{allRecs.filter(r => r.status === "accepted" || r.status === "implemented").length}</div><div className="text-xs text-muted-foreground">Accepted</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><Gauge className="h-5 w-5 text-blue-600" /></div>
          <div><div className="text-2xl font-bold">{avgImpact.toFixed(0)}</div><div className="text-xs text-muted-foreground">Avg Impact</div></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading recommendations…</div>
      ) : allRecs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recommendations found</p>
          <p className="text-sm mt-1">Run the optimization engine or adjust filters.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {allRecs.map((rec) => {
            const expanded = expandedId === rec.id;
            const sevConfig = SEVERITY_CONFIG[rec.severity] ?? SEVERITY_CONFIG.low;
            const statusCfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.pending;
            const SevIcon = sevConfig.icon;

            return (
              <Card key={rec.id} className={cn("transition-all", expanded && "ring-1 ring-primary/20")}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(expanded ? null : rec.id)}>
                    <div className={cn("p-1.5 rounded-md border mt-0.5", sevConfig.color)}>
                      <SevIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{rec.title}</span>
                        <Badge variant={statusCfg.variant} className="text-[10px]">{statusCfg.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[rec.recommendation_type] ?? rec.recommendation_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.explanation}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {rec.impact_score != null && (
                        <div className="text-center">
                          <div className={cn("text-lg font-bold", rec.impact_score >= 70 ? "text-destructive" : rec.impact_score >= 40 ? "text-orange-600" : "text-muted-foreground")}>
                            {rec.impact_score.toFixed(0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Impact</div>
                        </div>
                      )}
                      {rec.confidence_score != null && (
                        <div className="text-center">
                          <div className={cn("text-lg font-bold", rec.confidence_score >= 70 ? "text-green-600" : "text-muted-foreground")}>
                            {rec.confidence_score.toFixed(0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Conf.</div>
                        </div>
                      )}
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Current</div>
                          {renderJsonValue(rec.current_value)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Recommended</div>
                          {renderJsonValue(rec.recommended_value)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Evidence</div>
                        {renderJsonValue(rec.evidence)}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {rec.engine_version && <span>Engine: {rec.engine_version}</span>}
                        <span>Window: {rec.analysis_window_days}d</span>
                        <span>Created: {new Date(rec.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      {rec.status === "pending" && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Review notes (optional)…"
                            className="text-sm h-16"
                            value={reviewNotes[rec.id] ?? ""}
                            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [rec.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAccept(rec.id)} className="gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(rec.id)} className="gap-1.5">
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {rec.status === "accepted" && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Implementation notes…"
                            className="text-sm h-16"
                            value={implNotes[rec.id] ?? ""}
                            onChange={(e) => setImplNotes((prev) => ({ ...prev, [rec.id]: e.target.value }))}
                          />
                          <Button size="sm" variant="secondary" onClick={() => handleImplement(rec.id)} className="gap-1.5">
                            <Shield className="h-3.5 w-3.5" /> Mark Implemented
                          </Button>
                        </div>
                      )}

                      {rec.review_notes && (
                        <div className="text-xs"><span className="font-medium">Review notes:</span> {rec.review_notes}</div>
                      )}
                      {rec.implementation_notes && (
                        <div className="text-xs"><span className="font-medium">Implementation notes:</span> {rec.implementation_notes}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
