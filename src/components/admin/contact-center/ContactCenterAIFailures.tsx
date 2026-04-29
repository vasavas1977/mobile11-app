import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bug, BookOpen, Wand2, RefreshCw, ExternalLink, Brain, Star, Globe, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-muted text-muted-foreground",
};

const FAILURE_TYPES = [
  "wrong_answer", "incomplete_answer", "unclear_answer", "hallucination",
  "wrong_language", "language_mismatch", "weak_empathy", "tone_inappropriate",
  "policy_risk", "policy_violation", "dead_air_trigger", "unresolved_issue",
  "repeated_contact_risk", "missing_backend_action", "missing_kb", "missing_knowledge",
  "wrong_intent_classification", "loop_detected", "failed_handoff", "timeout",
];

const CHANNELS = ["web_chat", "line", "whatsapp", "facebook", "email", "voice"];
const SEVERITIES = ["critical", "high", "medium", "low"];

// Queue category presets
const QUEUE_CATEGORIES = [
  { key: "all", label: "All Failures", icon: Bug, filter: {} },
  { key: "low_confidence", label: "Low Confidence", icon: Brain, filter: { types: ["unclear_answer", "wrong_intent_classification", "incomplete_answer"] } },
  { key: "low_rated", label: "Low Rated", icon: Star, filter: { severities: ["critical", "high"] } },
  { key: "dead_air", label: "Dead Air", icon: Volume2, filter: { types: ["dead_air_trigger"] } },
  { key: "provisioning", label: "Provisioning Issues", icon: Globe, filter: { types: ["missing_backend_action", "unresolved_issue", "missing_kb"] } },
  { key: "language", label: "Language Mismatch", icon: Globe, filter: { types: ["wrong_language", "language_mismatch"] } },
  { key: "kb_gaps", label: "KB Gaps", icon: BookOpen, filter: { types: ["missing_kb", "missing_knowledge"] } },
];

export function ContactCenterAIFailures() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const category = QUEUE_CATEGORIES.find(c => c.key === activeCategory) || QUEUE_CATEGORIES[0];

  const { data: failures, isLoading, refetch } = useQuery({
    queryKey: ["ai-failures", severityFilter, channelFilter, typeFilter, activeCategory],
    queryFn: async () => {
      let query = supabase
        .from("ai_failure_events")
        .select(`
          *,
          conversations:conversation_id (channel, subject, status),
          scores:ai_conversation_scores!ai_conversation_scores_conversation_id_fkey (composite_score)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply category preset filters
      const catFilter = category.filter as any;
      if (catFilter.types && typeFilter === "all") {
        query = query.in("failure_type", catFilter.types);
      }
      if (catFilter.severities && severityFilter === "all") {
        query = query.in("severity", catFilter.severities);
      }

      if (severityFilter !== "all") query = query.eq("severity", severityFilter as any);
      if (typeFilter !== "all") query = query.eq("failure_type", typeFilter as any);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (channelFilter !== "all") {
        filtered = filtered.filter((f: any) => f.conversations?.channel === channelFilter);
      }
      return filtered;
    },
  });

  // KPI data
  const { data: kpiData } = useQuery({
    queryKey: ["ai-failures-kpi"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [totalRes, criticalRes, kbRes, deadAirRes, langRes] = await Promise.all([
        supabase.from("ai_failure_events").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("ai_failure_events").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).eq("severity", "critical"),
        supabase.from("ai_failure_events").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).in("failure_type", ["missing_kb", "missing_knowledge"]),
        supabase.from("ai_failure_events").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).eq("failure_type", "dead_air_trigger"),
        supabase.from("ai_failure_events").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).in("failure_type", ["wrong_language", "language_mismatch"]),
      ]);
      return {
        total: totalRes.count || 0,
        critical: criticalRes.count || 0,
        kbGaps: kbRes.count || 0,
        deadAir: deadAirRes.count || 0,
        langMismatch: langRes.count || 0,
      };
    },
  });

  // Low-rated conversations (rating 1-2)
  const { data: lowRatedConvs } = useQuery({
    queryKey: ["low-rated-conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversation_ratings")
        .select(`
          *,
          conversation:conversation_id (id, channel, subject, status, contact_id)
        `)
        .lte("rating", 2)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const kpis = [
    { title: "Total (30d)", value: kpiData?.total ?? 0, icon: Bug, color: "text-destructive" },
    { title: "Critical", value: kpiData?.critical ?? 0, icon: AlertTriangle, color: "text-orange-500" },
    { title: "KB Gaps", value: kpiData?.kbGaps ?? 0, icon: BookOpen, color: "text-blue-500" },
    { title: "Dead Air", value: kpiData?.deadAir ?? 0, icon: Volume2, color: "text-amber-500" },
    { title: "Language", value: kpiData?.langMismatch ?? 0, icon: Globe, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {QUEUE_CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            variant={activeCategory === cat.key ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => { setActiveCategory(cat.key); setTypeFilter("all"); setSeverityFilter("all"); }}
          >
            <cat.icon className="h-3 w-3" />
            {cat.label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="failures">
        <TabsList className="h-8">
          <TabsTrigger value="failures" className="text-xs">AI Failures</TabsTrigger>
          <TabsTrigger value="low-rated" className="text-xs">Low Rated ({lowRatedConvs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="failures">
          <Card>
            <CardHeader className="pb-2 pt-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{category.label}</CardTitle>
                <div className="flex gap-2">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      {SEVERITIES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      {CHANNELS.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs gap-1">
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
              ) : !failures?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No events in this queue</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Severity</TableHead>
                        <TableHead className="text-xs">Channel</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Root Cause</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Fix</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Score</TableHead>
                        <TableHead className="text-xs">Customer Message</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failures.map((f: any) => {
                        const score = Array.isArray(f.scores) ? f.scores[0]?.composite_score : null;
                        return (
                          <TableRow key={f.id} className="hover:bg-muted/40">
                            <TableCell className="text-xs font-medium">
                              {(f.failure_type as string).replace(/_/g, " ")}
                              {f.failure_subtype && <span className="block text-muted-foreground text-[10px]">{f.failure_subtype}</span>}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${SEVERITY_COLORS[f.severity] || ""} text-[10px] px-1.5 py-0`}>{f.severity}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{f.conversations?.channel?.replace("_", " ") || "—"}</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">{f.root_cause_guess?.replace(/_/g, " ") || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {f.suggested_fix_type ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{f.suggested_fix_type.replace(/_/g, " ")}</Badge>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {score != null ? (
                                <span className={`text-xs font-semibold ${score < 40 ? "text-destructive" : score < 60 ? "text-orange-500" : "text-foreground"}`}>{score}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-xs max-w-[200px]">
                              <p className="truncate text-muted-foreground">{f.customer_last_message?.slice(0, 60) || "—"}</p>
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {f.created_at ? format(new Date(f.created_at), "MMM d HH:mm") : "—"}
                            </TableCell>
                            <TableCell>
                              {f.conversation_id && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => navigate(`/admin/contact-center/conversations/${f.conversation_id}`)}>
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-rated">
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Low-Rated Conversations (1-2 stars)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!lowRatedConvs?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No low-rated conversations</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Rating</TableHead>
                      <TableHead className="text-xs">Channel</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Feedback</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowRatedConvs.map((r: any) => (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted"}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{r.channel || r.conversation?.channel || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{r.conversation?.subject || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate text-muted-foreground">{r.feedback_text || "—"}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{r.created_at ? format(new Date(r.created_at), "MMM d") : "—"}</TableCell>
                        <TableCell>
                          {r.conversation_id && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                              onClick={() => navigate(`/admin/contact-center/conversations/${r.conversation_id}`)}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
