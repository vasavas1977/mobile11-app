import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_NBA_DECISIONS } from "./outboundSampleData";
import { MetricCard } from "./shared";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Send,
  Ban,
  ArrowRightLeft,
  Route,
  Gauge,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  send_sales_followup: "Sales Follow-up",
  send_promotion: "Send Promotion",
  send_educational: "Send Educational",
  send_recovery: "Send Recovery",
  wait: "Wait",
  switch_channel: "Switch Channel",
  stop_messaging: "Stop Messaging",
  suppress_annoyance: "Suppress (Annoyance)",
  move_to_upsell: "Move to Upsell",
  move_to_crosssell: "Move to Cross-sell",
};

const ACTION_RISK: Record<string, "low" | "medium" | "high"> = {
  wait: "low",
  send_educational: "low",
  send_promotion: "low",
  send_sales_followup: "medium",
  switch_channel: "medium",
  send_recovery: "medium",
  stop_messaging: "high",
  suppress_annoyance: "high",
  move_to_upsell: "high",
  move_to_crosssell: "high",
};

const RISK_CONFIG = {
  low: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: Shield },
  medium: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle },
  high: { color: "text-red-700 bg-red-50 border-red-200", icon: Ban },
};

const ACTION_ICON: Record<string, typeof Target> = {
  send_sales_followup: Send,
  send_promotion: Send,
  send_educational: Send,
  send_recovery: Send,
  wait: Clock,
  switch_channel: ArrowRightLeft,
  stop_messaging: Ban,
  suppress_annoyance: Ban,
  move_to_upsell: Route,
  move_to_crosssell: Route,
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

export function ContactCenterNextBestAction() {
  const { isSampleMode } = usePartnerDataMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: liveNbas, isLoading: liveLoading } = useQuery({
    queryKey: ["nba-decisions", filterAction, filterStatus, filterRisk],
    queryFn: async () => {
      let query = (supabase as any)
        .from("outbound_next_best_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      if (filterAction !== "all") query = query.eq("recommended_action", filterAction);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (filterRisk !== "all") {
        filtered = filtered.filter(
          (r: any) => ACTION_RISK[r.recommended_action] === filterRisk
        );
      }
      return filtered;
    },
    enabled: !isSampleMode,
  });

  const nbas = isSampleMode
    ? SAMPLE_NBA_DECISIONS.filter((r: any) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterAction !== "all" && r.recommended_action !== filterAction) return false;
        if (filterRisk !== "all" && ACTION_RISK[r.recommended_action] !== filterRisk) return false;
        return true;
      })
    : liveNbas;
  const isLoading = isSampleMode ? false : liveLoading;

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("outbound_next_best_actions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nba-decisions"] });
      toast({ title: "Decision updated" });
    },
  });

  const bulkAcceptMutation = useMutation({
    mutationFn: async () => {
      // Only low-risk, high-confidence, pending
      const eligible =
        nbas?.filter(
          (r: any) =>
            r.status === "pending" &&
            ACTION_RISK[r.recommended_action] === "low" &&
            r.confidence_score >= 80
        ) || [];

      for (const item of eligible) {
        await (supabase as any)
          .from("outbound_next_best_actions")
          .update({
            status: "accepted",
            reviewed_at: new Date().toISOString(),
            review_notes: "Bulk accepted (low risk, confidence ≥ 80)",
          })
          .eq("id", item.id);
      }
      return eligible.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["nba-decisions"] });
      toast({ title: `${count} decisions accepted` });
    },
  });

  const totalPending = nbas?.filter((r: any) => r.status === "pending").length || 0;
  const highConfidence = nbas?.filter((r: any) => r.confidence_score >= 80).length || 0;
  const highRiskPending =
    nbas?.filter(
      (r: any) =>
        r.status === "pending" && ACTION_RISK[r.recommended_action] === "high"
    ).length || 0;
  const avgConfidence =
    nbas?.length
      ? Math.round(
          nbas.reduce((s: number, r: any) => s + Number(r.confidence_score), 0) /
            nbas.length
        )
      : 0;

  const bulkEligibleCount =
    nbas?.filter(
      (r: any) =>
        r.status === "pending" &&
        ACTION_RISK[r.recommended_action] === "low" &&
        r.confidence_score >= 80
    ).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Next Best Action</h2>
        <p className="text-sm text-muted-foreground">
          AI-generated per-customer action recommendations
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Pending" value={totalPending} icon={Target} />
        <MetricCard
          label="High Confidence"
          value={highConfidence}
          icon={Gauge}
        />
        <MetricCard
          label="High Risk Pending"
          value={highRiskPending}
          icon={AlertTriangle}
        />
        <MetricCard
          label="Avg Confidence"
          value={`${avgConfidence}%`}
          icon={Brain}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="executed">Executed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ALL_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>

        {bulkEligibleCount > 0 && filterStatus === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-9"
            onClick={() => bulkAcceptMutation.mutate()}
            disabled={bulkAcceptMutation.isPending}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Bulk Accept Low Risk ({bulkEligibleCount})
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Loading…
        </div>
      ) : !nbas?.length ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No decisions found
        </div>
      ) : (
        <div className="space-y-2">
          {nbas.map((nba: any) => {
            const risk = ACTION_RISK[nba.recommended_action] || "medium";
            const riskCfg = RISK_CONFIG[risk];
            const ActionIcon = ACTION_ICON[nba.recommended_action] || Target;
            const isExpanded = expandedId === nba.id;

            return (
              <div
                key={nba.id}
                className="border border-border rounded-lg bg-card overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : nba.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                >
                  <ActionIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {ACTION_LABELS[nba.recommended_action] || nba.recommended_action}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                          riskCfg.color
                        )}
                      >
                        {risk}
                      </span>
                      <AdminStatusBadge status={nba.status} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {nba.explanation}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-medium text-foreground">
                        {Math.round(nba.confidence_score)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        confidence
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {/* Stage snapshots */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Funnel:</span>{" "}
                        <span className="font-medium">{nba.funnel_stage || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capability:</span>{" "}
                        <span className="font-medium">{nba.capability_stage || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Experience:</span>{" "}
                        <span className="font-medium">{nba.experience_stage || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sentiment:</span>{" "}
                        <span className="font-medium">{nba.recent_sentiment || "—"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Sends (7d):</span>{" "}
                        <span className="font-medium">{nba.sends_last_7d ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Complaints (30d):</span>{" "}
                        <span className="font-medium">{nba.complaints_last_30d ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Channel:</span>{" "}
                        <span className="font-medium">
                          {nba.current_channel || "—"}
                          {nba.recommended_channel ? ` → ${nba.recommended_channel}` : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delay:</span>{" "}
                        <span className="font-medium">
                          {nba.recommended_delay_hours ? `${nba.recommended_delay_hours}h` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning factors */}
                    {nba.reasoning_factors && Object.keys(nba.reasoning_factors).length > 0 && (
                      <div className="bg-muted/50 rounded p-2">
                        <div className="text-[11px] font-medium text-muted-foreground mb-1">
                          Reasoning Factors
                        </div>
                        <pre className="text-[11px] text-foreground whitespace-pre-wrap break-all">
                          {JSON.stringify(nba.reasoning_factors, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Review notes */}
                    {nba.review_notes && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Review notes:</span> {nba.review_notes}
                      </div>
                    )}

                    {/* Actions */}
                    {nba.status === "pending" && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Textarea
                          placeholder="Review notes (optional)…"
                          className="text-xs h-16 flex-1"
                          value={reviewNotes[nba.id] || ""}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [nba.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            size="sm"
                            className="text-xs flex-1"
                            onClick={() =>
                              reviewMutation.mutate({
                                id: nba.id,
                                status: "accepted",
                                notes: reviewNotes[nba.id],
                              })
                            }
                            disabled={reviewMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs flex-1"
                            onClick={() =>
                              reviewMutation.mutate({
                                id: nba.id,
                                status: "rejected",
                                notes: reviewNotes[nba.id],
                              })
                            }
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-muted-foreground flex gap-4">
                      <span>Engine: {nba.engine_version || "—"}</span>
                      <span>
                        Expires:{" "}
                        {nba.expires_at
                          ? new Date(nba.expires_at).toLocaleString()
                          : "—"}
                      </span>
                      <span>
                        Created: {new Date(nba.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
