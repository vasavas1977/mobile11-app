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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, CheckCircle, X, Eye, Clock, FileCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const DECISION_BADGE: Record<string, string> = {
  auto_approve: "bg-green-500 text-white",
  auto_test: "bg-blue-500 text-white",
  require_approval: "bg-yellow-500 text-white",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  approved: "bg-green-500 text-white",
  rejected: "bg-destructive text-destructive-foreground",
  testing: "bg-blue-500 text-white",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-500 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-orange-500 text-white",
  critical: "bg-destructive text-destructive-foreground",
};

const DOMAINS = ["backend_action", "kb_improvement", "prompt_experiment", "faq_publish", "policy_response", "language_change"];

export function ContactCenterApprovalPolicies() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [domainFilter, setDomainFilter] = useState("all");
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  // Pending approvals
  const { data: pendingItems, isLoading: pendingLoading } = useQuery({
    queryKey: ["approval-pending"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("approval_audit_log").select("*").eq("execution_status", "pending").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Audit log
  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ["approval-audit", domainFilter],
    queryFn: async () => {
      let q = (supabase as any).from("approval_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
      if (domainFilter !== "all") q = q.eq("domain", domainFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Policies
  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ["approval-policies"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("approval_policies").select("*").order("priority", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ["approval-kpis"],
    queryFn: async () => {
      const [pendingRes, approvedRes, rejectedRes, policiesRes] = await Promise.all([
        (supabase as any).from("approval_audit_log").select("id", { count: "exact", head: true }).eq("execution_status", "pending"),
        (supabase as any).from("approval_audit_log").select("id", { count: "exact", head: true }).eq("execution_status", "approved"),
        (supabase as any).from("approval_audit_log").select("id", { count: "exact", head: true }).eq("execution_status", "rejected"),
        (supabase as any).from("approval_policies").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return { pending: pendingRes.count || 0, approved: approvedRes.count || 0, rejected: rejectedRes.count || 0, activePolicies: policiesRes.count || 0 };
    },
  });

  const approveReject = useMutation({
    mutationFn: async ({ auditId, approve, reason }: { auditId: string; approve: boolean; reason?: string }) => {
      const { error } = await supabase.functions.invoke("approval-policy-engine", {
        body: { action: approve ? "approve" : "reject", audit_id: auditId, user_id: user?.id, reason },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-pending"] });
      queryClient.invalidateQueries({ queryKey: ["approval-audit"] });
      queryClient.invalidateQueries({ queryKey: ["approval-kpis"] });
      toast({ title: "Decision saved" });
      setSelectedAudit(null);
      setRejectReason("");
    },
  });

  const updatePolicy = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await (supabase as any).from("approval_policies").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-policies"] });
      queryClient.invalidateQueries({ queryKey: ["approval-kpis"] });
      toast({ title: "Policy updated" });
      setEditingPolicy(null);
    },
  });

  const kpiCards = [
    { title: "Pending", value: kpis?.pending ?? 0, icon: Clock, color: "text-yellow-500" },
    { title: "Approved", value: kpis?.approved ?? 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Rejected", value: kpis?.rejected ?? 0, icon: X, color: "text-destructive" },
    { title: "Active Policies", value: kpis?.activePolicies ?? 0, icon: Shield, color: "text-primary" },
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
          <TabsTrigger value="pending" className="gap-1.5">
            Pending {(kpis?.pending ?? 0) > 0 && <Badge variant="destructive" className="text-xs ml-1">{kpis?.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Awaiting Approval</CardTitle></CardHeader>
            <CardContent>
              {pendingLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : !pendingItems?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No items pending approval</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead className="hidden md:table-cell">Policy</TableHead>
                        <TableHead className="hidden lg:table-cell">Channel</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.domain?.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-xs font-medium">{item.action_type?.replace(/_/g, " ") || "—"}</TableCell>
                          <TableCell><Badge className={`${RISK_BADGE[item.risk_level] || "bg-muted"} text-xs`}>{item.risk_level || "—"}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{item.matched_policy_name || "default"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">{item.channel || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.created_at ? format(new Date(item.created_at), "MMM d HH:mm") : "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => approveReject.mutate({ auditId: item.id, approve: true })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedAudit(item)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

        {/* POLICIES TAB */}
        <TabsContent value="policies">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Approval Policies</CardTitle></CardHeader>
            <CardContent>
              {policiesLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead className="hidden md:table-cell">Pattern</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead className="hidden lg:table-cell">Priority</TableHead>
                        <TableHead className="hidden lg:table-cell">Auto-Test</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(policies || []).map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs font-medium max-w-[180px] truncate">{p.policy_name}</TableCell>
                          <TableCell className="text-xs">{p.domain?.replace(/_/g, " ")}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs font-mono">{p.action_type_pattern}</TableCell>
                          <TableCell><Badge className={`${RISK_BADGE[p.risk_level] || "bg-muted"} text-xs`}>{p.risk_level}</Badge></TableCell>
                          <TableCell><Badge className={`${DECISION_BADGE[p.decision] || "bg-muted"} text-xs`}>{p.decision?.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">{p.priority}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Switch checked={p.auto_test_allowed} onCheckedChange={(v) => updatePolicy.mutate({ id: p.id, updates: { auto_test_allowed: v } })} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={p.is_active} onCheckedChange={(v) => updatePolicy.mutate({ id: p.id, updates: { is_active: v } })} />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingPolicy(p)}>
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

        {/* AUDIT TAB */}
        <TabsContent value="audit">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Approval Audit Log</CardTitle>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    {DOMAINS.map(d => <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : !auditLog?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No audit entries found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Policy</TableHead>
                        <TableHead className="hidden lg:table-cell">Risk</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{a.domain?.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-xs font-medium">{a.action_type?.replace(/_/g, " ") || "—"}</TableCell>
                          <TableCell><Badge className={`${DECISION_BADGE[a.decision] || "bg-muted"} text-xs`}>{a.decision?.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell><Badge className={`${STATUS_BADGE[a.execution_status] || "bg-muted"} text-xs`}>{a.execution_status}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{a.matched_policy_name || "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell"><Badge className={`${RISK_BADGE[a.risk_level] || "bg-muted"} text-xs`}>{a.risk_level || "—"}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.created_at ? format(new Date(a.created_at), "MMM d HH:mm") : "—"}</TableCell>
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

      {/* Audit Detail / Approve-Reject Modal */}
      <Dialog open={!!selectedAudit} onOpenChange={() => { setSelectedAudit(null); setRejectReason(""); }}>
        <DialogContent className="max-w-lg">
          {selectedAudit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Approval Request
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Domain</p>
                    <p className="text-sm font-medium">{selectedAudit.domain?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Risk</p>
                    <Badge className={`${RISK_BADGE[selectedAudit.risk_level] || "bg-muted"} mt-1`}>{selectedAudit.risk_level || "—"}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Action Type</p>
                  <p className="text-sm font-medium">{selectedAudit.action_type?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">{selectedAudit.decision_reason || "—"}</p>
                </div>
                {selectedAudit.input_context && Object.keys(selectedAudit.input_context).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Context</p>
                    <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">{JSON.stringify(selectedAudit.input_context, null, 2)}</pre>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button size="sm" onClick={() => approveReject.mutate({ auditId: selectedAudit.id, approve: true })} className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <div className="flex gap-2">
                    <Input placeholder="Rejection reason…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="flex-1" />
                    <Button size="sm" variant="destructive" disabled={!rejectReason} onClick={() => approveReject.mutate({ auditId: selectedAudit.id, approve: false, reason: rejectReason })} className="gap-1.5">
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Policy Edit Modal */}
      <Dialog open={!!editingPolicy} onOpenChange={() => setEditingPolicy(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {editingPolicy && (
            <PolicyEditForm
              policy={editingPolicy}
              onSave={(updates) => updatePolicy.mutate({ id: editingPolicy.id, updates })}
              onClose={() => setEditingPolicy(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PolicyEditForm({ policy, onSave, onClose }: { policy: any; onSave: (u: Record<string, any>) => void; onClose: () => void }) {
  const [name, setName] = useState(policy.policy_name || "");
  const [desc, setDesc] = useState(policy.description || "");
  const [decision, setDecision] = useState(policy.decision || "require_approval");
  const [priority, setPriority] = useState(String(policy.priority || 50));
  const [maxAmount, setMaxAmount] = useState(String(policy.max_auto_amount || 0));
  const [canaryPct, setCanaryPct] = useState(String(policy.canary_rollout_pct || 0));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Policy</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Policy Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Decision</Label>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_approve">Auto Approve</SelectItem>
                <SelectItem value="auto_test">Auto Test</SelectItem>
                <SelectItem value="require_approval">Require Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Max Auto Amount</Label>
            <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Canary Rollout %</Label>
            <Input type="number" value={canaryPct} onChange={(e) => setCanaryPct(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" onClick={() => onSave({
            policy_name: name, description: desc, decision,
            priority: parseInt(priority) || 50,
            max_auto_amount: parseFloat(maxAmount) || 0,
            canary_rollout_pct: parseInt(canaryPct) || 0,
          })}>Save</Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
