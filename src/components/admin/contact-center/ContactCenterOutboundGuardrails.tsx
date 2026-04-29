import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_AUTONOMY_RULES, SAMPLE_AUTONOMY_REQUESTS, SAMPLE_AUTONOMY_AUDIT } from "./outboundSampleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, RotateCcw, Clock, Activity, FileText } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  low_risk: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium_risk: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  high_risk: "bg-destructive/10 text-destructive",
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  auto_testing: { color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400", icon: Activity },
  controlled_rollout: { color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Activity },
  approved: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle },
  rolled_back: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: RotateCcw },
  completed: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
};

export function ContactCenterOutboundGuardrails() {
  const { isSampleMode } = usePartnerDataMode();
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: liveRules = [] } = useQuery({
    queryKey: ["outbound-autonomy-rules"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("outbound_autonomy_rules").select("*").order("risk_level");
      return (data as any[]) || [];
    },
    enabled: !isSampleMode,
  });

  const { data: liveRequests = [] } = useQuery({
    queryKey: ["outbound-autonomy-requests", statusFilter, riskFilter],
    queryFn: async () => {
      let q = (supabase as any).from("outbound_autonomy_requests").select("*").order("created_at", { ascending: false }).limit(100);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (riskFilter !== "all") q = q.eq("risk_level", riskFilter);
      const { data } = await q;
      return (data as any[]) || [];
    },
    enabled: !isSampleMode,
  });

  const { data: liveAuditLogs = [] } = useQuery({
    queryKey: ["outbound-autonomy-audit"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("outbound_autonomy_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      return (data as any[]) || [];
    },
    enabled: !isSampleMode,
  });

  const rules = isSampleMode ? SAMPLE_AUTONOMY_RULES : liveRules;
  const requests = isSampleMode
    ? SAMPLE_AUTONOMY_REQUESTS.filter((r: any) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (riskFilter !== "all" && r.risk_level !== riskFilter) return false;
        return true;
      })
    : liveRequests;
  const auditLogs = isSampleMode ? SAMPLE_AUTONOMY_AUDIT : liveAuditLogs;

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("outbound_autonomy_requests").update({
        status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(),
      }).eq("id", requestId);
      if (error) throw error;
      await (supabase as any).from("outbound_autonomy_audit_log").insert({
        request_id: requestId, action: "approved", actor_type: "user", actor_user_id: user?.id,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["outbound-autonomy-requests"] }); qc.invalidateQueries({ queryKey: ["outbound-autonomy-audit"] }); toast({ title: "Request approved" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("outbound_autonomy_requests").update({
        status: "rejected", rejected_by: user?.id, rejected_at: new Date().toISOString(), rejection_reason: reason || "Rejected by supervisor",
      }).eq("id", requestId);
      if (error) throw error;
      await (supabase as any).from("outbound_autonomy_audit_log").insert({
        request_id: requestId, action: "rejected", actor_type: "user", actor_user_id: user?.id, details: { reason },
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["outbound-autonomy-requests"] }); qc.invalidateQueries({ queryKey: ["outbound-autonomy-audit"] }); toast({ title: "Request rejected" }); },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("outbound_autonomy_requests").update({
        status: "rolled_back", rolled_back_at: new Date().toISOString(), rolled_back_by_type: "user", rolled_back_by_user_id: user?.id, rollback_triggered_by: "manual",
      }).eq("id", requestId);
      if (error) throw error;
      await (supabase as any).from("outbound_autonomy_audit_log").insert({
        request_id: requestId, action: "rollback_executed", actor_type: "user", actor_user_id: user?.id, details: { reason: "Manual rollback" },
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["outbound-autonomy-requests"] }); qc.invalidateQueries({ queryKey: ["outbound-autonomy-audit"] }); toast({ title: "Request rolled back" }); },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("outbound_autonomy_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outbound-autonomy-rules"] }),
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;
  const autoTestingCount = requests.filter((r: any) => r.status === "auto_testing").length;
  const rollbackCount = requests.filter((r: any) => r.status === "rolled_back").length;
  const activeRules = rules.filter((r: any) => r.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Outbound Autonomy Guardrails
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Manage risk levels, review change requests, and monitor rollbacks for AI-driven outbound changes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-foreground">{activeRules}</div><div className="text-xs text-muted-foreground">Active Rules</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{pendingCount}</div><div className="text-xs text-muted-foreground">Pending Requests</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{autoTestingCount}</div><div className="text-xs text-muted-foreground">Auto-Testing</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-destructive">{rollbackCount}</div><div className="text-xs text-muted-foreground">Rollbacks</div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="requests">Requests {pendingCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{pendingCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-3 mt-4">
          {rules.map((rule: any) => (
            <Card key={rule.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{rule.rule_name}</span>
                    <Badge className={RISK_COLORS[rule.risk_level] || ""}>{rule.risk_level?.replace("_", " ")}</Badge>
                    {rule.auto_test_allowed && <Badge variant="outline" className="text-[10px]">Auto-test</Badge>}
                    {rule.controlled_rollout_allowed && <Badge variant="outline" className="text-[10px]">Controlled rollout</Badge>}
                    {rule.manual_approval_required && <Badge variant="outline" className="text-[10px]">Approval required</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>Max rollout: {rule.max_rollout_pct}%</span>
                    <span>Min sample: {rule.min_sample_size}</span>
                    <span>Cooldown: {rule.cooldown_hours}h</span>
                  </div>
                </div>
                <Switch checked={rule.is_active} onCheckedChange={(v) => toggleRuleMutation.mutate({ id: rule.id, is_active: v })} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="auto_testing">Auto Testing</SelectItem>
                <SelectItem value="controlled_rollout">Controlled Rollout</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="rolled_back">Rolled Back</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Risk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low_risk">Low Risk</SelectItem>
                <SelectItem value="medium_risk">Medium Risk</SelectItem>
                <SelectItem value="high_risk">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requests.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No requests found.</CardContent></Card>
          ) : requests.map((req: any) => {
            const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const Icon = statusCfg.icon;
            const payload = req.change_payload || {};
            return (
              <Card key={req.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-foreground">{req.title}</span>
                        <Badge className={statusCfg.color}>{req.status?.replace("_", " ")}</Badge>
                        <Badge className={RISK_COLORS[req.risk_level] || ""}>{req.risk_level?.replace("_", " ")}</Badge>
                      </div>
                      {req.description && <p className="text-xs text-muted-foreground mt-1">{req.description}</p>}
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                        <span>Category: {req.change_category?.replace("_", " ")}</span>
                        <span>Rollout: {req.rollout_pct}%</span>
                        <span>Window: {req.monitoring_window_days}d</span>
                        <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                        <span>By: {req.created_by_type}</span>
                      </div>
                    </div>
                  </div>

                  {(payload.prior_state || payload.proposed_state) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {payload.prior_state && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-[10px] font-semibold text-muted-foreground mb-1">PRIOR STATE</div>
                          <pre className="text-[11px] text-foreground whitespace-pre-wrap">{JSON.stringify(payload.prior_state, null, 2)}</pre>
                        </div>
                      )}
                      {payload.proposed_state && (
                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <div className="text-[10px] font-semibold text-primary mb-1">PROPOSED STATE</div>
                          <pre className="text-[11px] text-foreground whitespace-pre-wrap">{JSON.stringify(payload.proposed_state, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {req.baseline_metrics?.sample_size > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                      {["delivery_rate", "conversion_rate", "opt_out_rate", "complaint_rate", "ticket_rate"].map((m) => (
                        <div key={m} className="bg-muted/30 rounded p-2">
                          <div className="text-[10px] text-muted-foreground">{m.replace(/_/g, " ")}</div>
                          <div className="text-xs font-medium text-foreground">{req.baseline_metrics?.[m]?.toFixed(1) ?? "–"}%</div>
                          {req.current_metrics?.sample_size > 0 && (
                            <div className="text-[10px] text-muted-foreground">→ {req.current_metrics?.[m]?.toFixed(1) ?? "–"}%</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {req.status === "rolled_back" && req.rollback_evidence && (
                    <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                      <div className="text-[10px] font-semibold text-destructive mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> ROLLBACK TRIGGERED</div>
                      <div className="text-xs text-foreground">{req.rollback_triggered_by?.replace("_", " ")}</div>
                      {req.rollback_evidence.triggers?.map((t: string, i: number) => (
                        <div key={i} className="text-[11px] text-muted-foreground">• {t}</div>
                      ))}
                    </div>
                  )}

                  {req.status === "pending" && (
                    <div className="flex gap-2 items-end flex-wrap">
                      <Button size="sm" onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <div className="flex-1 min-w-[200px]">
                        <Textarea
                          placeholder="Rejection reason..."
                          className="text-xs h-8 min-h-[32px]"
                          value={rejectReason[req.id] || ""}
                          onChange={(e) => setRejectReason((p) => ({ ...p, [req.id]: e.target.value }))}
                        />
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate({ requestId: req.id, reason: rejectReason[req.id] || "" })} disabled={rejectMutation.isPending}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                  {["auto_testing", "controlled_rollout", "approved"].includes(req.status) && (
                    <Button size="sm" variant="outline" onClick={() => rollbackMutation.mutate(req.id)} disabled={rollbackMutation.isPending}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Manual Rollback
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Audit Trail</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No audit entries yet.</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{log.action?.replace("_", " ")}</Badge>
                          <Badge variant={log.actor_type === "system" ? "secondary" : "default"} className="text-[10px]">{log.actor_type}</Badge>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
