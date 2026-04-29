import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layers, TrendingDown, AlertTriangle, Target, ArrowUpDown, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Cluster = {
  id: string;
  cluster_name: string;
  cluster_description: string | null;
  language: string | null;
  conversation_count: number;
  average_ai_score: number | null;
  average_customer_rating: number | null;
  dead_air_rate: number | null;
  human_handoff_rate: number | null;
  containment_rate: number | null;
  repeat_contact_rate: number | null;
  representative_questions: any;
  common_bad_responses: any;
  channel_distribution: any;
  language_distribution: any;
  root_cause_hypothesis: string | null;
  recommended_action: string | null;
  impact_score: number | null;
  urgency_score: number | null;
  status: string | null;
  admin_label: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export function ContactCenterClusters() {
  const [sortBy, setSortBy] = useState<"impact" | "urgency" | "conversations" | "score">("urgency");
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clusters, isLoading } = useQuery({
    queryKey: ["ai-intent-clusters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_intent_clusters")
        .select("*")
        .order("urgency_score", { ascending: false });
      if (error) throw error;
      return data as Cluster[];
    },
  });

  const updateCluster = useMutation({
    mutationFn: async ({ id, label, notes }: { id: string; label: string; notes: string }) => {
      const { error } = await supabase
        .from("ai_intent_clusters")
        .update({ admin_label: label || null, admin_notes: notes || null, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-intent-clusters"] });
      toast({ title: "Cluster updated" });
      setSelectedCluster(null);
    },
  });

  const filtered = (clusters || [])
    .filter(c => {
      if (searchQuery && !c.cluster_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.cluster_description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (languageFilter !== "all" && c.language !== languageFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "impact": return (b.impact_score || 0) - (a.impact_score || 0);
        case "urgency": return (b.urgency_score || 0) - (a.urgency_score || 0);
        case "conversations": return b.conversation_count - a.conversation_count;
        case "score": return (a.average_ai_score || 100) - (b.average_ai_score || 100);
        default: return 0;
      }
    });

  const totalConversations = clusters?.reduce((sum, c) => sum + c.conversation_count, 0) || 0;
  const avgScore = clusters?.length
    ? Math.round(clusters.reduce((sum, c) => sum + (c.average_ai_score || 0), 0) / clusters.length)
    : 0;
  const criticalClusters = clusters?.filter(c => (c.average_ai_score || 100) < 50).length || 0;

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge variant="outline">N/A</Badge>;
    if (score >= 80) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{score}</Badge>;
    if (score >= 60) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{score}</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">{score}</Badge>;
  };

  const formatPercent = (val: number | null) => val !== null ? `${Math.round(val * 100)}%` : "—";

  const openDetail = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setEditLabel(cluster.admin_label || "");
    setEditNotes(cluster.admin_notes || "");
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Layers className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clusters</p>
                <p className="text-2xl font-bold">{clusters?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg"><Target className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Conversations Clustered</p>
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg"><TrendingDown className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Cluster Score</p>
                <p className="text-2xl font-bold">{avgScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Critical Clusters</p>
                <p className="text-2xl font-bold">{criticalClusters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clusters..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="th">Thai</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[160px]"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">Urgency</SelectItem>
            <SelectItem value="impact">Impact</SelectItem>
            <SelectItem value="conversations">Conversations</SelectItem>
            <SelectItem value="score">Lowest Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cluster Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cluster</TableHead>
                <TableHead className="text-center">Convos</TableHead>
                <TableHead className="text-center">AI Score</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Dead Air</TableHead>
                <TableHead className="text-center">Containment</TableHead>
                <TableHead className="text-center">Impact</TableHead>
                <TableHead>Root Cause</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading clusters...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No clusters found</TableCell></TableRow>
              ) : filtered.map(cluster => (
                <TableRow key={cluster.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(cluster)}>
                  <TableCell>
                    <div className="max-w-[250px]">
                      <p className="font-medium truncate">{cluster.admin_label || cluster.cluster_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{cluster.cluster_description}</p>
                      <div className="flex gap-1 mt-1">
                        {cluster.language && <Badge variant="outline" className="text-[10px] px-1">{cluster.language.toUpperCase()}</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{cluster.conversation_count}</TableCell>
                  <TableCell className="text-center">{getScoreBadge(cluster.average_ai_score)}</TableCell>
                  <TableCell className="text-center">{cluster.average_customer_rating !== null ? `${cluster.average_customer_rating}★` : "—"}</TableCell>
                  <TableCell className="text-center">{formatPercent(cluster.dead_air_rate)}</TableCell>
                  <TableCell className="text-center">{formatPercent(cluster.containment_rate)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cluster.urgency_score && cluster.urgency_score > 5 ? "destructive" : "outline"}>
                      {cluster.urgency_score?.toFixed(1) || "0"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] text-xs text-muted-foreground truncate">{cluster.root_cause_hypothesis || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cluster Detail Dialog */}
      {selectedCluster && (
        <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {selectedCluster.admin_label || selectedCluster.cluster_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground">{selectedCluster.cluster_description}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Conversations", value: selectedCluster.conversation_count },
                  { label: "AI Score", value: selectedCluster.average_ai_score ?? "—" },
                  { label: "Rating", value: selectedCluster.average_customer_rating !== null ? `${selectedCluster.average_customer_rating}★` : "—" },
                  { label: "Dead Air", value: formatPercent(selectedCluster.dead_air_rate) },
                  { label: "Handoff Rate", value: formatPercent(selectedCluster.human_handoff_rate) },
                  { label: "Containment", value: formatPercent(selectedCluster.containment_rate) },
                  { label: "Impact", value: selectedCluster.impact_score?.toFixed(1) || "0" },
                  { label: "Urgency", value: selectedCluster.urgency_score?.toFixed(1) || "0" },
                ].map(m => (
                  <div key={m.label} className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Channel & Language Distribution */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Channel Distribution</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries((selectedCluster.channel_distribution as Record<string, number>) || {}).map(([ch, cnt]) => (
                      <Badge key={ch} variant="outline" className="text-xs">{ch}: {cnt as number}</Badge>
                    ))}
                    {Object.keys(selectedCluster.channel_distribution || {}).length === 0 && <span className="text-xs text-muted-foreground">No data</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Language Distribution</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries((selectedCluster.language_distribution as Record<string, number>) || {}).map(([lang, cnt]) => (
                      <Badge key={lang} variant="outline" className="text-xs">{lang.toUpperCase()}: {cnt as number}</Badge>
                    ))}
                    {Object.keys(selectedCluster.language_distribution || {}).length === 0 && <span className="text-xs text-muted-foreground">No data</span>}
                  </div>
                </div>
              </div>

              {/* Representative Questions */}
              <div>
                <p className="text-sm font-medium mb-2">Representative Customer Questions</p>
                <div className="space-y-1">
                  {(Array.isArray(selectedCluster.representative_questions) ? selectedCluster.representative_questions : []).map((q: string, i: number) => (
                    <p key={i} className="text-sm bg-muted/50 rounded px-3 py-1.5">"{q}"</p>
                  ))}
                  {(!selectedCluster.representative_questions || (selectedCluster.representative_questions as any[]).length === 0) && (
                    <p className="text-xs text-muted-foreground">No questions recorded</p>
                  )}
                </div>
              </div>

              {/* Common Bad Responses */}
              <div>
                <p className="text-sm font-medium mb-2">Common Bad Bot Responses</p>
                <div className="space-y-1">
                  {(Array.isArray(selectedCluster.common_bad_responses) ? selectedCluster.common_bad_responses : []).map((r: string, i: number) => (
                    <p key={i} className="text-sm bg-red-50 text-red-800 rounded px-3 py-1.5">"{r}"</p>
                  ))}
                  {(!selectedCluster.common_bad_responses || (selectedCluster.common_bad_responses as any[]).length === 0) && (
                    <p className="text-xs text-muted-foreground">No bad responses recorded</p>
                  )}
                </div>
              </div>

              {/* Root Cause & Action */}
              {selectedCluster.root_cause_hypothesis && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800 mb-1">Root Cause Hypothesis</p>
                  <p className="text-sm text-amber-700">{selectedCluster.root_cause_hypothesis}</p>
                </div>
              )}
              {selectedCluster.recommended_action && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">Recommended Action</p>
                  <p className="text-sm text-blue-700">{selectedCluster.recommended_action}</p>
                </div>
              )}

              {/* Admin Edit */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Admin Label & Notes</p>
                <Input
                  placeholder="Custom label for this cluster..."
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                />
                <Textarea
                  placeholder="Admin notes..."
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={() => updateCluster.mutate({ id: selectedCluster.id, label: editLabel, notes: editNotes })}
                  disabled={updateCluster.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
