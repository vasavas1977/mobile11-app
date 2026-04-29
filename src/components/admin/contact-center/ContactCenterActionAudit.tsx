import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Play, RotateCcw, Eye, Shield, Zap, AlertTriangle, Bot } from "lucide-react";
import { format } from "date-fns";

type ActionLog = {
  id: string; action_type: string; action_payload: Record<string, unknown> | null;
  action_result: Record<string, unknown> | null; action_status: string;
  approval_status: string; conversation_id: string | null; customer_id: string | null;
  triggered_by: string; is_dry_run: boolean; retry_count: number; max_retries: number;
  error_message: string | null; approved_by: string | null; approved_at: string | null;
  completed_at: string | null; action_summary: string | null; requires_approval: boolean;
  created_at: string; updated_at: string;
};

type CatalogEntry = {
  id: string; action_type: string; display_name: string; description: string | null;
  category: string; requires_approval: boolean; is_enabled: boolean;
  input_schema: Record<string, unknown>; max_retries: number; timeout_seconds: number;
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  completed: CheckCircle, failed: XCircle, pending: Clock,
  executing: Play, pending_approval: Shield, dry_run: Eye,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-600", failed: "text-destructive", pending: "text-amber-500",
  executing: "text-primary", pending_approval: "text-purple-600", dry_run: "text-muted-foreground",
};

export function ContactCenterActionAudit() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("audit");

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["action-audit", filterStatus, filterType],
    queryFn: async () => {
      let q = supabase.from("autonomous_actions_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (filterStatus !== "all") q = q.eq("action_status", filterStatus);
      if (filterType !== "all") q = q.eq("action_type", filterType);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ActionLog[];
    },
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["action-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("action_catalog").select("*").order("category");
      if (error) throw error;
      return (data || []) as CatalogEntry[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("autonomous_actions_log").update({
        approval_status: "approved", approved_at: new Date().toISOString(),
        action_status: "completed", updated_at: new Date().toISOString(),
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["action-audit"] }); toast({ title: "Action approved" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("autonomous_actions_log").update({
        approval_status: "rejected", action_status: "failed",
        error_message: "Rejected by admin", updated_at: new Date().toISOString(),
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["action-audit"] }); toast({ title: "Action rejected" }); },
  });

  const toggleCatalogMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("action_catalog").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["action-catalog"] }); toast({ title: "Catalog updated" }); },
  });

  const detailAction = detailId ? actions.find(a => a.id === detailId) : null;
  const pendingApproval = actions.filter(a => a.action_status === "pending_approval" || a.approval_status === "pending_approval");
  const completedCount = actions.filter(a => a.action_status === "completed").length;
  const failedCount = actions.filter(a => a.action_status === "failed").length;
  const uniqueTypes = [...new Set(actions.map(a => a.action_type))];
  const catalogDisplay = (type: string) => catalog.find(c => c.action_type === type)?.display_name || type.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="audit">Action Audit Log</TabsTrigger>
          <TabsTrigger value="catalog">Action Catalog</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals ({pendingApproval.length})</TabsTrigger>
        </TabsList>

        {/* AUDIT LOG */}
        <TabsContent value="audit" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{actions.length}</p><p className="text-xs text-muted-foreground">Total Actions</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{completedCount}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{failedCount}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-purple-600">{pendingApproval.length}</p><p className="text-xs text-muted-foreground">Pending Approval</p></CardContent></Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="dry_run">Dry Run</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(t => <SelectItem key={t} value={t}>{catalogDisplay(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? <p className="text-center text-muted-foreground py-8">Loading…</p> : actions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No actions logged yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {actions.map(action => {
                const Icon = STATUS_ICONS[action.action_status] || Clock;
                const color = STATUS_COLORS[action.action_status] || "text-muted-foreground";
                return (
                  <Card key={action.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailId(action.id)}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground text-sm">{catalogDisplay(action.action_type)}</span>
                            {action.is_dry_run && <Badge variant="outline" className="text-xs">Dry Run</Badge>}
                            {action.requires_approval && <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Approval</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{action.action_summary || `Triggered by ${action.triggered_by}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={action.action_status === "completed" ? "default" : action.action_status === "failed" ? "destructive" : "secondary"} className="text-xs">
                          {action.action_status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(action.created_at), "MMM d HH:mm")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ACTION CATALOG */}
        <TabsContent value="catalog" className="space-y-4">
          <p className="text-sm text-muted-foreground">Configure which actions the AI can autonomously execute.</p>
          <div className="space-y-2">
            {catalog.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{entry.display_name}</span>
                      <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                      {entry.requires_approval && <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Needs Approval</Badge>}
                    </div>
                    {entry.description && <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Max retries: {entry.max_retries} · Timeout: {entry.timeout_seconds}s</p>
                  </div>
                  <Button
                    variant={entry.is_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCatalogMutation.mutate({ id: entry.id, enabled: !entry.is_enabled })}
                  >
                    {entry.is_enabled ? "Enabled" : "Disabled"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PENDING APPROVALS */}
        <TabsContent value="approvals" className="space-y-4">
          {pendingApproval.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No actions pending approval.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {pendingApproval.map(action => (
                <Card key={action.id} className="border-purple-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-foreground">{catalogDisplay(action.action_type)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(action.created_at), "MMM d HH:mm")}</span>
                    </div>
                    {action.action_summary && <p className="text-sm text-muted-foreground">{action.action_summary}</p>}
                    {action.action_payload && (
                      <div className="bg-muted p-2 rounded text-xs font-mono text-foreground">
                        {JSON.stringify(action.action_payload, null, 2)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveMutation.mutate(action.id)} disabled={approveMutation.isPending} className="gap-1">
                        <CheckCircle className="h-4 w-4" /> Approve & Execute
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(action.id)} disabled={rejectMutation.isPending} className="gap-1">
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailAction} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailAction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {catalogDisplay(detailAction.action_type)}
                  <Badge variant={detailAction.action_status === "completed" ? "default" : detailAction.action_status === "failed" ? "destructive" : "secondary"}>
                    {detailAction.action_status.replace(/_/g, " ")}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {detailAction.action_summary && (
                  <div className="bg-muted p-3 rounded-lg"><p className="text-sm text-foreground">{detailAction.action_summary}</p></div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Triggered by:</span> <span className="font-medium text-foreground">{detailAction.triggered_by}</span></div>
                  <div><span className="text-muted-foreground">Approval:</span> <span className="font-medium text-foreground">{detailAction.approval_status.replace(/_/g, " ")}</span></div>
                  <div><span className="text-muted-foreground">Dry Run:</span> <span className="font-medium text-foreground">{detailAction.is_dry_run ? "Yes" : "No"}</span></div>
                  <div><span className="text-muted-foreground">Retries:</span> <span className="font-medium text-foreground">{detailAction.retry_count}/{detailAction.max_retries}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium text-foreground">{format(new Date(detailAction.created_at), "MMM d, yyyy HH:mm:ss")}</span></div>
                  {detailAction.completed_at && <div><span className="text-muted-foreground">Completed:</span> <span className="font-medium text-foreground">{format(new Date(detailAction.completed_at), "MMM d, yyyy HH:mm:ss")}</span></div>}
                </div>
                {detailAction.error_message && (
                  <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    <p className="text-sm text-destructive font-medium flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Error</p>
                    <p className="text-sm text-foreground mt-1">{detailAction.error_message}</p>
                  </div>
                )}
                {detailAction.action_payload && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Input Payload</p>
                    <pre className="bg-muted p-3 rounded text-xs font-mono text-foreground overflow-x-auto">{JSON.stringify(detailAction.action_payload, null, 2)}</pre>
                  </div>
                )}
                {detailAction.action_result && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Result</p>
                    <pre className="bg-muted p-3 rounded text-xs font-mono text-foreground overflow-x-auto">{JSON.stringify(detailAction.action_result, null, 2)}</pre>
                  </div>
                )}

                {/* Approval actions in detail */}
                {(detailAction.action_status === "pending_approval" || detailAction.approval_status === "pending_approval") && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button onClick={() => { approveMutation.mutate(detailAction.id); setDetailId(null); }} className="gap-1"><CheckCircle className="h-4 w-4" />Approve</Button>
                    <Button variant="destructive" onClick={() => { rejectMutation.mutate(detailAction.id); setDetailId(null); }} className="gap-1"><XCircle className="h-4 w-4" />Reject</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
