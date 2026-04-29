import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Shield, History, RotateCcw, CheckCircle, X, Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-500 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-orange-500 text-white",
  critical: "bg-destructive text-destructive-foreground",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  auto_approved: "bg-green-500 text-white",
  approved: "bg-green-500 text-white",
  canary: "bg-blue-500 text-white",
  shadow: "bg-purple-500 text-white",
  promoted: "bg-primary text-primary-foreground",
  reverted: "bg-destructive text-destructive-foreground",
  rejected: "bg-muted text-muted-foreground",
};

const DOMAINS = ["kb_proposal", "prompt_rollout", "backend_action", "faq_publish", "refund_credit", "policy_response", "language_change", "experiment"];

export function ContactCenterGuardrails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("changes");
  const [statusFilter, setStatusFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [selectedCR, setSelectedCR] = useState<any>(null);
  const [revertReason, setRevertReason] = useState("");

  // Change requests
  const { data: changeRequests, isLoading: crLoading } = useQuery({
    queryKey: ["guardrail-changes", statusFilter, domainFilter],
    queryFn: async () => {
      let q = (supabase as any).from("guardrail_change_requests").select("*").order("created_at", { ascending: false }).limit(100);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (domainFilter !== "all") q = q.eq("domain", domainFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["guardrail-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("guardrail_rules").select("*").order("domain").order("risk_level");
      if (error) throw error;
      return data || [];
    },
  });

  // Rollback events
  const { data: rollbacks, isLoading: rollbackLoading } = useQuery({
    queryKey: ["guardrail-rollbacks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("guardrail_rollback_events").select("*, guardrail_change_requests(change_title, domain, risk_level)").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ["guardrail-kpis"],
    queryFn: async () => {
      const [pendingRes, activeRes, revertedRes, rollbackRes] = await Promise.all([
        (supabase as any).from("guardrail_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("guardrail_change_requests").select("id", { count: "exact", head: true }).in("status", ["canary", "promoted", "auto_approved"]),
        (supabase as any).from("guardrail_change_requests").select("id", { count: "exact", head: true }).eq("status", "reverted"),
        (supabase as any).from("guardrail_rollback_events").select("id", { count: "exact", head: true }),
      ]);
      return {
        pending: pendingRes.count || 0,
        active: activeRes.count || 0,
        reverted: revertedRes.count || 0,
        rollbacks: rollbackRes.count || 0,
      };
    },
  });

  const updateCR = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await (supabase as any).from("guardrail_change_requests").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardrail-changes"] });
      queryClient.invalidateQueries({ queryKey: ["guardrail-kpis"] });
      toast({ title: "Updated" });
      setSelectedCR(null);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await (supabase as any).from("guardrail_rules").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardrail-rules"] });
      toast({ title: "Rule updated" });
    },
  });

  const revertMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.functions.invoke("guardrail-engine", {
        body: { action: "revert", change_request_id: id, reverted_by: user?.id, reason },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardrail-changes"] });
      queryClient.invalidateQueries({ queryKey: ["guardrail-rollbacks"] });
      queryClient.invalidateQueries({ queryKey: ["guardrail-kpis"] });
      toast({ title: "Change reverted" });
      setSelectedCR(null);
      setRevertReason("");
    },
  });

  const kpiCards = [
    { title: "Pending Approval", value: kpis?.pending ?? 0, icon: Shield, color: "text-yellow-500" },
    { title: "Active Changes", value: kpis?.active ?? 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Reverted", value: kpis?.reverted ?? 0, icon: RotateCcw, color: "text-destructive" },
    { title: "Total Rollbacks", value: kpis?.rollbacks ?? 0, icon: AlertTriangle, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.title}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{k.title}</p>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="changes">Change History</TabsTrigger>
          <TabsTrigger value="rules">Guardrail Rules</TabsTrigger>
          <TabsTrigger value="rollbacks">Rollback Log</TabsTrigger>
        </TabsList>

        {/* CHANGE HISTORY TAB */}
        <TabsContent value="changes">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Change Requests</CardTitle>
                <div className="flex gap-2">
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {DOMAINS.map(d => <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {["pending", "auto_approved", "approved", "canary", "shadow", "promoted", "reverted", "rejected"].map(s =>
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {crLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : !changeRequests?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No change requests found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead className="hidden md:table-cell">Rollout</TableHead>
                        <TableHead className="hidden md:table-cell">Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changeRequests.map((cr: any) => (
                        <TableRow key={cr.id}>
                          <TableCell className="font-medium text-xs max-w-[200px] truncate">{cr.change_title}</TableCell>
                          <TableCell className="text-xs">{cr.domain?.replace(/_/g, " ")}</TableCell>
                          <TableCell><Badge className={`${RISK_BADGE[cr.risk_level] || ""} text-xs`}>{cr.risk_level}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{cr.rollout_pct}%</TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{cr.rollout_mode}</TableCell>
                          <TableCell><Badge className={`${STATUS_BADGE[cr.status] || ""} text-xs`}>{cr.status?.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {cr.created_at ? format(new Date(cr.created_at), "MMM d HH:mm") : "—"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedCR(cr)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RULES TAB */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Guardrail Rules Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead className="hidden md:table-cell">Approval</TableHead>
                        <TableHead className="hidden md:table-cell">Max Rollout</TableHead>
                        <TableHead className="hidden lg:table-cell">Canary</TableHead>
                        <TableHead className="hidden lg:table-cell">Shadow</TableHead>
                        <TableHead className="hidden lg:table-cell">Auto Rollback</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(rules || []).map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-xs">{r.rule_name}</TableCell>
                          <TableCell className="text-xs">{r.domain?.replace(/_/g, " ")}</TableCell>
                          <TableCell><Badge className={`${RISK_BADGE[r.risk_level] || ""} text-xs`}>{r.risk_level}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{r.requires_approval ? "Yes" : "No"}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{r.max_rollout_pct}%</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Switch checked={r.canary_enabled} onCheckedChange={(v) => updateRule.mutate({ id: r.id, updates: { canary_enabled: v } })} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Switch checked={r.shadow_test_enabled} onCheckedChange={(v) => updateRule.mutate({ id: r.id, updates: { shadow_test_enabled: v } })} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Switch checked={r.auto_rollback_enabled} onCheckedChange={(v) => updateRule.mutate({ id: r.id, updates: { auto_rollback_enabled: v } })} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={r.is_active} onCheckedChange={(v) => updateRule.mutate({ id: r.id, updates: { is_active: v } })} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLLBACK LOG TAB */}
        <TabsContent value="rollbacks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rollback Events</CardTitle>
            </CardHeader>
            <CardContent>
              {rollbackLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : !rollbacks?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No rollback events recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Change</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead className="hidden md:table-cell">Metric</TableHead>
                        <TableHead className="hidden md:table-cell">Value</TableHead>
                        <TableHead className="hidden md:table-cell">Threshold</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rollbacks.map((rb: any) => (
                        <TableRow key={rb.id}>
                          <TableCell className="text-xs font-medium max-w-[180px] truncate">
                            {rb.guardrail_change_requests?.change_title || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rb.trigger_type === "auto" ? "destructive" : "outline"} className="text-xs">
                              {rb.trigger_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{rb.trigger_metric?.replace(/_/g, " ") || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs font-semibold">{rb.trigger_value != null ? Number(rb.trigger_value).toFixed(1) : "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{rb.threshold_value != null ? Number(rb.threshold_value).toFixed(1) : "—"}</TableCell>
                          <TableCell className="text-xs">{rb.rolled_back_by || "system"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {rb.created_at ? format(new Date(rb.created_at), "MMM d HH:mm") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail / Action Modal */}
      <Dialog open={!!selectedCR} onOpenChange={() => { setSelectedCR(null); setRevertReason(""); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCR && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {selectedCR.change_title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <Badge className={`${RISK_BADGE[selectedCR.risk_level] || ""} mt-1`}>{selectedCR.risk_level}</Badge>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`${STATUS_BADGE[selectedCR.status] || ""} mt-1`}>{selectedCR.status?.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Rollout</p>
                    <p className="text-lg font-bold mt-1">{selectedCR.rollout_pct}% ({selectedCR.rollout_mode})</p>
                  </div>
                </div>

                {selectedCR.change_description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedCR.change_description}</p>
                  </div>
                )}

                {selectedCR.revert_reason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-destructive mb-1">Revert Reason</p>
                    <p className="text-sm">{selectedCR.revert_reason}</p>
                  </div>
                )}

                {selectedCR.rejection_reason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                    <p className="text-sm">{selectedCR.rejection_reason}</p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <p className="text-sm font-medium mb-2">Timeline</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Created: {selectedCR.created_at ? format(new Date(selectedCR.created_at), "MMM d, yyyy HH:mm") : "—"}</p>
                    {selectedCR.approved_at && <p>Approved: {format(new Date(selectedCR.approved_at), "MMM d, yyyy HH:mm")}</p>}
                    {selectedCR.canary_started_at && <p>Canary started: {format(new Date(selectedCR.canary_started_at), "MMM d, yyyy HH:mm")}</p>}
                    {selectedCR.promoted_at && <p>Promoted: {format(new Date(selectedCR.promoted_at), "MMM d, yyyy HH:mm")}</p>}
                    {selectedCR.reverted_at && <p className="text-destructive">Reverted: {format(new Date(selectedCR.reverted_at), "MMM d, yyyy HH:mm")}</p>}
                    {selectedCR.rejected_at && <p className="text-destructive">Rejected: {format(new Date(selectedCR.rejected_at), "MMM d, yyyy HH:mm")}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {selectedCR.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateCR.mutate({ id: selectedCR.id, updates: { status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() } })} className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateCR.mutate({ id: selectedCR.id, updates: { status: "canary", canary_started_at: new Date().toISOString(), rollout_pct: 10, rollout_mode: "canary" } })}>
                        Start Canary
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateCR.mutate({ id: selectedCR.id, updates: { status: "shadow", rollout_mode: "shadow", rollout_pct: 0 } })}>
                        Shadow Test
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive gap-1.5" onClick={() => updateCR.mutate({ id: selectedCR.id, updates: { status: "rejected", rejected_by: user?.id, rejected_at: new Date().toISOString(), rejection_reason: "Manually rejected" } })}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {(selectedCR.status === "approved" || selectedCR.status === "canary") && (
                    <>
                      <Button size="sm" onClick={() => {
                        supabase.functions.invoke("guardrail-engine", { body: { action: "promote", change_request_id: selectedCR.id, promoted_by: user?.id } })
                          .then(() => { queryClient.invalidateQueries({ queryKey: ["guardrail-changes"] }); queryClient.invalidateQueries({ queryKey: ["guardrail-kpis"] }); toast({ title: "Promoted to 100%" }); setSelectedCR(null); });
                      }} className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> Promote to 100%
                      </Button>
                    </>
                  )}
                  {["approved", "canary", "promoted", "auto_approved"].includes(selectedCR.status) && (
                    <div className="flex items-center gap-2 w-full mt-2">
                      <Input placeholder="Revert reason…" value={revertReason} onChange={(e) => setRevertReason(e.target.value)} className="flex-1" />
                      <Button size="sm" variant="destructive" disabled={!revertReason} onClick={() => revertMutation.mutate({ id: selectedCR.id, reason: revertReason })} className="gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5" /> Revert
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
