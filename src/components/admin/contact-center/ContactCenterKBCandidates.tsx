import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen, CheckCircle, XCircle, Pencil, RefreshCw, ArrowRight,
  Sparkles, AlertTriangle, FileText, Eye, Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type KbCandidate = {
  id: string;
  issue_summary: string;
  issue_type: string;
  status: string;
  suggested_title: string | null;
  suggested_category: string | null;
  suggested_language: string | null;
  proposed_kb_draft: string | null;
  current_kb_excerpt: string | null;
  weakness_analysis: string | null;
  missing_facts: any;
  expected_impact: string | null;
  confidence_level: number | null;
  impact_score: number | null;
  priority: number | null;
  related_failure_types: any;
  conversation_examples: any;
  rejected_reason: string | null;
  created_at: string;
  related_cluster_id: string | null;
  related_article_id: string | null;
  generated_by: string;
  approved_by: string | null;
};

export function ContactCenterKBCandidates() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<KbCandidate | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["kb-candidates", statusFilter, impactFilter],
    queryFn: async () => {
      let query = supabase
        .from("kb_improvement_candidates")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (impactFilter !== "all") query = query.eq("expected_impact", impactFilter);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as KbCandidate[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, extra }: { id: string; status: string; extra?: Record<string, any> }) => {
      const { error } = await supabase
        .from("kb_improvement_candidates")
        .update({ status, ...extra, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-candidates"] });
      toast({ title: "Updated", description: "Candidate status updated." });
    },
  });

  const publishToKB = useMutation({
    mutationFn: async (candidate: KbCandidate) => {
      // Insert new KB article
      const { data: article, error: insertErr } = await supabase
        .from("kb_articles")
        .insert({
          title: editTitle || candidate.suggested_title || "Untitled",
          content: editDraft || candidate.proposed_kb_draft || "",
          category: candidate.suggested_category || "troubleshoot",
          language: candidate.suggested_language || "en",
          is_published: true,
          source: "both",
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // Update candidate as published
      const { error: updateErr } = await supabase
        .from("kb_improvement_candidates")
        .update({
          status: "published",
          published_article_id: article.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id);

      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-candidates"] });
      setSelectedCandidate(null);
      toast({ title: "Published", description: "KB article published successfully." });
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await supabase.functions.invoke("kb-generate-improvements");
      queryClient.invalidateQueries({ queryKey: ["kb-candidates"] });
      toast({ title: "Generated", description: "KB improvement candidates generated." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to generate candidates.", variant: "destructive" });
    }
    setGenerating(false);
  };

  const openDetail = (c: KbCandidate) => {
    setSelectedCandidate(c);
    setEditDraft(c.proposed_kb_draft || "");
    setEditTitle(c.suggested_title || "");
  };

  const pendingCount = candidates?.filter(c => c.status === "pending").length || 0;
  const approvedCount = candidates?.filter(c => c.status === "approved").length || 0;
  const publishedCount = candidates?.filter(c => c.status === "published").length || 0;

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const impactColor: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">KB Improvement Candidates</h2>
          <p className="text-sm text-[#6B7280]">AI-generated proposals to improve the Knowledge Base</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} size="sm">
          <Sparkles className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
          Generate Improvements
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-[#6B7280]">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-[#6B7280]">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-[#6B7280]">Published</p>
          <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={impactFilter} onValueChange={setImpactFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Impact" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Impact</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-[#6B7280]">Loading candidates...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(candidates || []).map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-[#FAF7F2]" onClick={() => openDetail(c)}>
                    <TableCell>
                      <p className="font-medium text-sm text-[#1A1A1A] truncate max-w-[250px]">{c.suggested_title || c.issue_summary}</p>
                      <p className="text-xs text-[#6B7280] truncate max-w-[250px]">{c.issue_summary}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.issue_type}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs ${impactColor[c.expected_impact || "low"]}`}>{c.expected_impact}</Badge></TableCell>
                    <TableCell>{c.confidence_level != null ? `${Math.round(c.confidence_level * 100)}%` : "—"}</TableCell>
                    <TableCell><Badge className={`text-xs ${statusColor[c.status] || ""}`}>{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openDetail(c)}><Eye className="h-3.5 w-3.5" /></Button>
                        {c.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateStatus.mutate({ id: c.id, status: "approved" })}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setSelectedCandidate(c); setShowRejectDialog(true); }}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(candidates || []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-[#6B7280]">No candidates found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidate && !showRejectDialog} onOpenChange={(open) => { if (!open) setSelectedCandidate(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  KB Improvement Detail
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-[#6B7280]">Status</p>
                    <Badge className={statusColor[selectedCandidate.status]}>{selectedCandidate.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Impact</p>
                    <Badge className={impactColor[selectedCandidate.expected_impact || "low"]}>{selectedCandidate.expected_impact}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Confidence</p>
                    <p className="text-sm font-medium text-[#1A1A1A]">{selectedCandidate.confidence_level != null ? `${Math.round(selectedCandidate.confidence_level * 100)}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Issue Type</p>
                    <Badge variant="outline">{selectedCandidate.issue_type}</Badge>
                  </div>
                </div>

                {/* Issue Summary */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-[#1A1A1A]"><AlertTriangle className="h-4 w-4 inline mr-1" />Issue Summary</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-[#374151]">{selectedCandidate.issue_summary}</p></CardContent>
                </Card>

                {/* Weakness Analysis */}
                {selectedCandidate.weakness_analysis && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-[#1A1A1A]"><Target className="h-4 w-4 inline mr-1" />Weakness Analysis</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-[#374151] whitespace-pre-line">{selectedCandidate.weakness_analysis}</p></CardContent>
                  </Card>
                )}

                {/* Missing Facts */}
                {Array.isArray(selectedCandidate.missing_facts) && selectedCandidate.missing_facts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-[#1A1A1A]">Missing Facts</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {(selectedCandidate.missing_facts as string[]).map((f, i) => (
                          <li key={i} className="text-sm text-[#374151]">{f}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Diff View: Current vs Proposed */}
                <Tabs defaultValue="proposed">
                  <TabsList>
                    <TabsTrigger value="proposed">Proposed Draft</TabsTrigger>
                    <TabsTrigger value="current">Current KB</TabsTrigger>
                    <TabsTrigger value="diff">Side-by-Side</TabsTrigger>
                  </TabsList>

                  <TabsContent value="proposed" className="space-y-3">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Article title" className="font-medium" />
                    <Textarea
                      value={editDraft}
                      onChange={e => setEditDraft(e.target.value)}
                      rows={16}
                      className="font-mono text-sm"
                      placeholder="KB article content..."
                    />
                  </TabsContent>

                  <TabsContent value="current">
                    <Card>
                      <CardContent className="p-4">
                        {selectedCandidate.current_kb_excerpt ? (
                          <pre className="whitespace-pre-wrap text-sm text-[#374151] font-mono">{selectedCandidate.current_kb_excerpt}</pre>
                        ) : (
                          <p className="text-sm text-[#6B7280] italic">No existing KB content — this is a new article proposal</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="diff">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-red-600">Current KB</CardTitle></CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-xs text-[#374151] font-mono max-h-[400px] overflow-y-auto">
                            {selectedCandidate.current_kb_excerpt || "(empty — no existing article)"}
                          </pre>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200">
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-green-600">Proposed Draft</CardTitle></CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-xs text-[#374151] font-mono max-h-[400px] overflow-y-auto">
                            {editDraft || "(empty)"}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-2 border-t">
                  {selectedCandidate.status === "pending" && (
                    <>
                      <Button variant="outline" onClick={() => updateStatus.mutate({ id: selectedCandidate.id, status: "approved", extra: { proposed_kb_draft: editDraft, suggested_title: editTitle } })}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button variant="outline" className="text-red-600" onClick={() => setShowRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {(selectedCandidate.status === "pending" || selectedCandidate.status === "approved") && (
                    <Button onClick={() => publishToKB.mutate(selectedCandidate)} disabled={publishToKB.isPending}>
                      <ArrowRight className="h-4 w-4 mr-1" /> Publish to KB
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Candidate</DialogTitle></DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (selectedCandidate) {
                updateStatus.mutate({ id: selectedCandidate.id, status: "rejected", extra: { rejected_reason: rejectReason } });
              }
              setShowRejectDialog(false);
              setSelectedCandidate(null);
              setRejectReason("");
            }}>Reject</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
