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
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  HelpCircle, CheckCircle, XCircle, Sparkles, TrendingDown,
  ArrowRight, Eye, BarChart3, Volume2, MessageSquare, BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type FaqCandidate = {
  id: string;
  canonical_question: string;
  customer_phrasings: string[];
  short_answer: string | null;
  long_answer: string | null;
  faq_title: string | null;
  intent_tag: string | null;
  language: string;
  category: string;
  source_cluster_id: string | null;
  source_failure_types: string[];
  conversation_count: number;
  frequency_score: number;
  confusion_score: number;
  expected_support_reduction: number;
  confidence: number;
  priority: number;
  status: string;
  publish_target: string | null;
  published_article_id: string | null;
  rejected_reason: string | null;
  pre_publish_low_rating_rate: number | null;
  post_publish_low_rating_rate: number | null;
  pre_publish_dead_air_rate: number | null;
  post_publish_dead_air_rate: number | null;
  published_at: string | null;
  analytics_measured_at: string | null;
  created_at: string;
};

export function ContactCenterFAQCandidates() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [selected, setSelected] = useState<FaqCandidate | null>(null);
  const [editShort, setEditShort] = useState("");
  const [editLong, setEditLong] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [publishTarget, setPublishTarget] = useState<string>("bot-core-knowledge");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["faq-candidates", statusFilter, langFilter],
    queryFn: async () => {
      let q = supabase
        .from("faq_candidates")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (langFilter !== "all") q = q.eq("language", langFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as FaqCandidate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("faq_candidates").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-candidates"] });
      toast({ title: "Updated" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (candidate: FaqCandidate) => {
      const isBot = publishTarget === "bot-core-knowledge";
      const content = isBot ? (editShort || candidate.short_answer || "") : (editLong || candidate.long_answer || "");
      const title = editTitle || candidate.faq_title || candidate.canonical_question;

      const { data: article, error: insertErr } = await supabase
        .from("kb_articles")
        .insert({
          title,
          content,
          category: isBot ? "bot-core-knowledge" : candidate.category,
          language: candidate.language,
          is_published: true,
          is_internal: publishTarget === "internal",
          source: isBot ? "chatbot" : publishTarget === "internal" ? "chatbot" : "both",
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;

      const { error: updateErr } = await supabase
        .from("faq_candidates")
        .update({
          status: "published",
          publish_target: publishTarget,
          published_article_id: article.id,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-candidates"] });
      setSelected(null);
      toast({ title: "Published", description: "FAQ published to KB successfully." });
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await supabase.functions.invoke("faq-generate-candidates");
      queryClient.invalidateQueries({ queryKey: ["faq-candidates"] });
      toast({ title: "Generated", description: "FAQ candidates generated from conversation patterns." });
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const openDetail = (c: FaqCandidate) => {
    setSelected(c);
    setEditShort(c.short_answer || "");
    setEditLong(c.long_answer || "");
    setEditTitle(c.faq_title || c.canonical_question);
  };

  const pending = candidates?.filter(c => c.status === "pending").length || 0;
  const published = candidates?.filter(c => c.status === "published").length || 0;
  const avgReduction = candidates?.filter(c => c.status === "published" && c.post_publish_low_rating_rate != null)
    .reduce((sum, c) => sum + ((c.pre_publish_low_rating_rate || 0) - (c.post_publish_low_rating_rate || 0)), 0) || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">FAQ Candidates</h2>
          <p className="text-sm text-[#6B7280]">Auto-generated FAQs from repeated customer questions</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} size="sm">
          <Sparkles className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
          Generate FAQs
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#6B7280] mb-1"><HelpCircle className="h-4 w-4" /><span className="text-xs">Pending Review</span></div>
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#6B7280] mb-1"><BookOpen className="h-4 w-4" /><span className="text-xs">Published</span></div>
          <p className="text-2xl font-bold text-green-600">{published}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#6B7280] mb-1"><TrendingDown className="h-4 w-4" /><span className="text-xs">Est. Support Reduction</span></div>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            {candidates?.filter(c => c.status !== "rejected").reduce((s, c) => s + (c.expected_support_reduction || 0), 0).toFixed(0)}%
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#6B7280] mb-1"><BarChart3 className="h-4 w-4" /><span className="text-xs">Actual Improvement</span></div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{avgReduction > 0 ? `${(avgReduction * 100).toFixed(1)}%` : "—"}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lang</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="th">Thai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? <p className="text-[#6B7280]">Loading...</p> : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>FAQ Title</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Convos</TableHead>
              <TableHead>Confusion</TableHead>
              <TableHead>Est. Reduction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(candidates || []).map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-[#FAF7F2]" onClick={() => openDetail(c)}>
                  <TableCell>
                    <p className="font-medium text-sm text-[#1A1A1A] truncate max-w-[250px]">{c.faq_title || c.canonical_question}</p>
                    <p className="text-xs text-[#6B7280] truncate max-w-[250px]">{c.canonical_question}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.intent_tag || "—"}</Badge></TableCell>
                  <TableCell className="text-sm">{c.conversation_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.confusion_score * 100} className="w-16 h-2" />
                      <span className="text-xs text-[#6B7280]">{Math.round(c.confusion_score * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{Math.round(c.expected_support_reduction * 100)}%</TableCell>
                  <TableCell><Badge className={`text-xs ${statusColors[c.status]}`}>{c.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => openDetail(c)}><Eye className="h-3.5 w-3.5" /></Button>
                      {c.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMutation.mutate({ id: c.id, updates: { status: "approved" } })}>
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setSelected(c); setShowReject(true); }}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(candidates || []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-[#6B7280]">No FAQ candidates found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected && !showReject} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" /> FAQ Candidate Detail
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Meta row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <MetricBox label="Conversations" value={selected.conversation_count} />
                  <MetricBox label="Confusion" value={`${Math.round(selected.confusion_score * 100)}%`} />
                  <MetricBox label="Frequency" value={`${Math.round(selected.frequency_score * 100)}%`} />
                  <MetricBox label="Est. Reduction" value={`${Math.round(selected.expected_support_reduction * 100)}%`} />
                  <MetricBox label="Confidence" value={`${Math.round(selected.confidence * 100)}%`} />
                </div>

                {/* Customer phrasings */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-[#1A1A1A]"><MessageSquare className="h-4 w-4 inline mr-1" />Customer Phrasings ({(selected.customer_phrasings || []).length})</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {(selected.customer_phrasings || []).map((p: string, i: number) => (
                        <li key={i} className="text-sm text-[#374151] flex items-start gap-2">
                          <span className="text-[#9CA3AF]">•</span> "{p}"
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Content tabs */}
                <Tabs defaultValue="short">
                  <TabsList>
                    <TabsTrigger value="short">Bot Answer (Short)</TabsTrigger>
                    <TabsTrigger value="long">Help Center (Long)</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="short" className="space-y-3">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="FAQ Title" className="font-medium" />
                    <Textarea value={editShort} onChange={e => setEditShort(e.target.value)} rows={6} placeholder="Short bot answer..." />
                  </TabsContent>

                  <TabsContent value="long">
                    <Textarea value={editLong} onChange={e => setEditLong(e.target.value)} rows={16} className="font-mono text-sm" placeholder="Long help-center article (markdown)..." />
                  </TabsContent>

                  <TabsContent value="preview">
                    <Card><CardContent className="p-4 prose prose-sm max-w-none">
                      <h3>{editTitle}</h3>
                      <ReactMarkdown>{editLong || editShort || "(empty)"}</ReactMarkdown>
                    </CardContent></Card>
                  </TabsContent>
                </Tabs>

                {/* Post-publish analytics (if published) */}
                {selected.status === "published" && (
                  <Card className="border-green-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700"><BarChart3 className="h-4 w-4 inline mr-1" />Post-Publish Impact</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#6B7280]">Low Rating Rate</p>
                          <p className="text-sm">
                            <span className="text-red-600">{selected.pre_publish_low_rating_rate != null ? `${(selected.pre_publish_low_rating_rate * 100).toFixed(1)}%` : "—"}</span>
                            {" → "}
                            <span className="text-green-600">{selected.post_publish_low_rating_rate != null ? `${(selected.post_publish_low_rating_rate * 100).toFixed(1)}%` : "pending"}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6B7280]">Dead Air Rate</p>
                          <p className="text-sm">
                            <span className="text-red-600">{selected.pre_publish_dead_air_rate != null ? `${(selected.pre_publish_dead_air_rate * 100).toFixed(1)}%` : "—"}</span>
                            {" → "}
                            <span className="text-green-600">{selected.post_publish_dead_air_rate != null ? `${(selected.post_publish_dead_air_rate * 100).toFixed(1)}%` : "pending"}</span>
                          </p>
                        </div>
                      </div>
                      {!selected.analytics_measured_at && (
                        <p className="text-xs text-[#9CA3AF] mt-2 italic">Analytics will be measured 7 days after publish.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Publish controls */}
                {(selected.status === "pending" || selected.status === "approved") && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Select value={publishTarget} onValueChange={setPublishTarget}>
                      <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bot-core-knowledge">Bot Core Knowledge</SelectItem>
                        <SelectItem value="public">Public Article</SelectItem>
                        <SelectItem value="internal">Internal Article</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1" />
                    {selected.status === "pending" && (
                      <>
                        <Button variant="outline" onClick={() => updateMutation.mutate({ id: selected.id, updates: { status: "approved", short_answer: editShort, long_answer: editLong, faq_title: editTitle } })}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" className="text-red-600" onClick={() => setShowReject(true)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    <Button onClick={() => publishMutation.mutate(selected)} disabled={publishMutation.isPending}>
                      <ArrowRight className="h-4 w-4 mr-1" /> Publish
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject FAQ Candidate</DialogTitle></DialogHeader>
          <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason..." rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (selected) updateMutation.mutate({ id: selected.id, updates: { status: "rejected", rejected_reason: rejectReason } });
              setShowReject(false);
              setSelected(null);
              setRejectReason("");
            }}>Reject</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#FAF7F2] rounded-lg p-2">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="text-lg font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}
