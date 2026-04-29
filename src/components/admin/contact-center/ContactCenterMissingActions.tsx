import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Zap, TrendingUp, AlertTriangle, Eye, CheckCircle, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  detected: "bg-yellow-500 text-white",
  reviewing: "bg-blue-500 text-white",
  approved: "bg-green-500 text-white",
  implemented: "bg-primary text-primary-foreground",
  rejected: "bg-muted text-muted-foreground",
};

export function ContactCenterMissingActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["missing-action-candidates", statusFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("missing_action_candidates")
        .select("*")
        .order("impact_score", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: kpiData } = useQuery({
    queryKey: ["missing-action-kpi"],
    queryFn: async () => {
      const [totalRes, highImpactRes, approvedRes] = await Promise.all([
        (supabase as any).from("missing_action_candidates").select("id", { count: "exact", head: true }),
        (supabase as any).from("missing_action_candidates").select("id", { count: "exact", head: true }).gte("impact_score", 50),
        (supabase as any).from("missing_action_candidates").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      return {
        total: totalRes.count || 0,
        highImpact: highImpactRes.count || 0,
        approved: approvedRes.count || 0,
      };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (notes) update.admin_notes = notes;
      if (status === "approved" || status === "rejected") {
        update.reviewed_at = new Date().toISOString();
      }
      const { error } = await (supabase as any).from("missing_action_candidates").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missing-action-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["missing-action-kpi"] });
      toast({ title: "Status updated" });
      setSelectedCandidate(null);
    },
  });

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-missing-actions", {
        body: { lookback_days: 7, min_occurrences: 2 },
      });
      if (error) throw error;
      toast({ title: "Detection complete", description: `Found ${data?.missing_actions || 0} missing actions` });
      queryClient.invalidateQueries({ queryKey: ["missing-action-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["missing-action-kpi"] });
    } catch (e: any) {
      toast({ title: "Detection failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDetecting(false);
    }
  };

  const kpis = [
    { title: "Total Candidates", value: kpiData?.total ?? 0, icon: Zap, color: "text-primary" },
    { title: "High Impact", value: kpiData?.highImpact ?? 0, icon: TrendingUp, color: "text-orange-500" },
    { title: "Approved", value: kpiData?.approved ?? 0, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
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

      {/* Candidates Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Missing Action Backlog</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="detected">Detected</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={runDetection} disabled={isDetecting} className="gap-1.5">
                {isDetecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Detect Now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
          ) : !candidates?.length ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No missing action candidates found. Run detection to scan recent conversations.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead className="hidden md:table-cell">Occurrences</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead className="hidden lg:table-cell">Est. CSAT Lift</TableHead>
                    <TableHead className="hidden lg:table-cell">Est. Containment Lift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs max-w-[180px] truncate">
                        {c.action_name?.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-xs">{c.detected_intent?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{c.occurrence_count}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold ${
                          c.impact_score >= 70 ? "text-destructive" : c.impact_score >= 40 ? "text-orange-500" : "text-muted-foreground"
                        }`}>
                          {c.impact_score}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">+{c.estimated_csat_lift}%</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">+{c.estimated_containment_lift}%</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_BADGE[c.status] || ""} text-xs`}>{c.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedCandidate(c)}>
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

      {/* Detail Modal */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {selectedCandidate.action_name?.replace(/_/g, " ")}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Impact Score</p>
                    <p className="text-2xl font-bold">{selectedCandidate.impact_score}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Volume</p>
                    <p className="text-2xl font-bold">{selectedCandidate.estimated_monthly_volume}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.action_description}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Example Customer Messages</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(selectedCandidate.example_customer_messages || []).map((msg: string, i: number) => (
                      <div key={i} className="text-xs bg-muted rounded p-2">"{msg}"</div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Expected Impact</p>
                  <div className="flex gap-4 text-sm">
                    <span>CSAT: <strong className="text-green-600">+{selectedCandidate.estimated_csat_lift}%</strong></span>
                    <span>Containment: <strong className="text-green-600">+{selectedCandidate.estimated_containment_lift}%</strong></span>
                  </div>
                </div>

                {selectedCandidate.admin_notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Admin Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.admin_notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {selectedCandidate.status === "detected" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "approved" })} className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "reviewing" })}>
                        Mark Reviewing
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "rejected" })} className="gap-1.5 text-destructive">
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {selectedCandidate.status === "reviewing" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "approved" })} className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "rejected" })} className="gap-1.5 text-destructive">
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {selectedCandidate.status === "approved" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "implemented" })} className="gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Mark Implemented
                    </Button>
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
