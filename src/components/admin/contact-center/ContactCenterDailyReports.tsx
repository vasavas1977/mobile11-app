import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, TrendingUp, TrendingDown, AlertTriangle, Zap,
  Target, BookOpen, MessageSquare, RefreshCw, ChevronLeft, ChevronRight,
  BarChart3, Volume2,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface DailyReport {
  id: string;
  report_date: string;
  total_conversations_analyzed: number;
  avg_composite_score: number;
  avg_customer_rating: number;
  total_failures: number;
  total_dead_air_events: number;
  executive_summary: string | null;
  avg_score_by_channel: Record<string, number>;
  avg_rating_by_channel: Record<string, number>;
  low_score_clusters: Array<{ name: string; score: number; conversations: number; impact: number; root_cause: string; action: string }>;
  top_failure_patterns: Array<{ type: string; count: number }>;
  top_dead_air_patterns: Array<{ bot_text: string; occurrences: number; avg_silence_seconds: number; return_rate: number }>;
  top_missing_knowledge: Array<{ cause: string; count: number }>;
  top_weak_prompts: Array<{ cause: string; count: number }>;
  top_unresolved_intents: Array<{ cause: string; count: number }>;
  top_repeated_complaints: Array<{ cause: string; count: number }>;
  recommended_kb_improvements: Array<{ title: string; type: string; priority: number }>;
  recommended_prompt_experiments: Array<{ target: string; occurrences: number; suggestion: string }>;
  recommended_actions: Array<{ action_needed: string; occurrences: number }>;
  highest_impact_opportunity: { cluster?: string; score?: number; conversations?: number; impact?: number; action?: string };
  biggest_score_decline: { previous_score?: number; current_score?: number; delta?: number };
  quick_wins: Array<{ cluster: string; score: number; action: string; impact: number }>;
  high_risk_issues: Array<{ cluster: string; score: number; urgency: number; root_cause: string }>;
  kb_candidates_generated: number;
  prompt_candidates_generated: number;
  winning_experiments: Array<{ name: string; status: string }>;
  created_at: string;
}

export function ContactCenterDailyReports() {
  const [dateOffset, setDateOffset] = useState(0);
  const targetDate = format(subDays(new Date(), dateOffset + 1), "yyyy-MM-dd");

  const { data: report, isLoading } = useQuery({
    queryKey: ["daily-report", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_daily_optimization_reports")
        .select("*")
        .eq("report_date", targetDate)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DailyReport | null;
    },
  });

  const [generating, setGenerating] = useState(false);
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await supabase.functions.invoke("ai-daily-report");
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const scoreDelta = (report?.biggest_score_decline as any)?.delta ?? 0;

  const asArray = (val: unknown): any[] => {
    if (Array.isArray(val)) return val;
    return [];
  };

  const asRecord = (val: unknown): Record<string, number> => {
    if (val && typeof val === "object" && !Array.isArray(val)) return val as Record<string, number>;
    return {};
  };

  const asObj = (val: unknown): Record<string, any> => {
    if (val && typeof val === "object" && !Array.isArray(val)) return val as Record<string, any>;
    return {};
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Daily AI Learning Report</h2>
          <p className="text-sm text-[#6B7280]">Automated optimization insights for {targetDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDateOffset(d => d + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-[#1A1A1A] min-w-[100px] text-center">{targetDate}</span>
          <Button variant="outline" size="sm" onClick={() => setDateOffset(d => Math.max(0, d - 1))} disabled={dateOffset === 0}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
            Generate
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-[#6B7280]">Loading report...</p>}

      {!isLoading && !report && (
        <Card><CardContent className="py-12 text-center text-[#6B7280]">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No report available for {targetDate}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleGenerate} disabled={generating}>Generate Now</Button>
        </CardContent></Card>
      )}

      {report && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Conversations" value={report.total_conversations_analyzed} icon={<MessageSquare className="h-4 w-4" />} />
            <KpiCard label="Avg AI Score" value={`${report.avg_composite_score ?? 0}/100`} icon={<BarChart3 className="h-4 w-4" />}
              trend={scoreDelta !== 0 ? { delta: scoreDelta, positive: scoreDelta > 0 } : undefined} />
            <KpiCard label="Avg Rating" value={`${report.avg_customer_rating ?? 0}/5`} icon={<TrendingUp className="h-4 w-4" />} />
            <KpiCard label="Failures" value={report.total_failures ?? 0} icon={<AlertTriangle className="h-4 w-4" />} variant="warning" />
            <KpiCard label="Dead Air" value={report.total_dead_air_events ?? 0} icon={<Volume2 className="h-4 w-4" />} />
            <KpiCard label="KB Candidates" value={report.kb_candidates_generated} icon={<BookOpen className="h-4 w-4" />} />
          </div>

          {/* Executive Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <FileText className="h-4 w-4" /> Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">{report.executive_summary}</p>
            </CardContent>
          </Card>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard title="Highest Impact" icon={<Target className="h-4 w-4 text-orange-600" />} color="border-orange-200 bg-orange-50">
              {asObj(report.highest_impact_opportunity).cluster ? (
                <>
                  <p className="font-medium text-sm text-[#1A1A1A]">{asObj(report.highest_impact_opportunity).cluster}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Score: {asObj(report.highest_impact_opportunity).score}/100 · {asObj(report.highest_impact_opportunity).conversations} conversations</p>
                  <p className="text-xs text-orange-700 mt-1">{asObj(report.highest_impact_opportunity).action}</p>
                </>
              ) : <p className="text-xs text-[#6B7280]">No high-impact issues detected</p>}
            </ActionCard>

            <ActionCard title="Score Trend" icon={scoreDelta >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
              color={scoreDelta >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <p className="text-2xl font-bold text-[#1A1A1A]">{scoreDelta > 0 ? "+" : ""}{scoreDelta}</p>
              <p className="text-xs text-[#6B7280]">vs previous day ({asObj(report.biggest_score_decline).previous_score ?? "N/A"} → {asObj(report.biggest_score_decline).current_score ?? "N/A"})</p>
            </ActionCard>

            <ActionCard title="Quick Wins" icon={<Zap className="h-4 w-4 text-yellow-600" />} color="border-yellow-200 bg-yellow-50">
              {asArray(report.quick_wins).length > 0 ? asArray(report.quick_wins).slice(0, 3).map((qw: any, i: number) => (
                <p key={i} className="text-xs text-[#374151]">• {qw.cluster} <span className="text-[#6B7280]">(score {qw.score})</span></p>
              )) : <p className="text-xs text-[#6B7280]">None identified today</p>}
            </ActionCard>

            <ActionCard title="High Risk" icon={<AlertTriangle className="h-4 w-4 text-red-600" />} color="border-red-200 bg-red-50">
              {asArray(report.high_risk_issues).length > 0 ? asArray(report.high_risk_issues).slice(0, 3).map((hr: any, i: number) => (
                <p key={i} className="text-xs text-[#374151]">• {hr.cluster} <span className="text-red-600">(urgency {hr.urgency})</span></p>
              )) : <p className="text-xs text-[#6B7280]">No high-risk issues</p>}
            </ActionCard>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="channels" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="channels">By Channel</TabsTrigger>
              <TabsTrigger value="clusters">Low-Score Clusters</TabsTrigger>
              <TabsTrigger value="failures">Failure Patterns</TabsTrigger>
              <TabsTrigger value="deadair">Dead Air</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Gaps</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="channels">
              <Card>
                <CardHeader><CardTitle className="text-sm text-[#1A1A1A]">Performance by Channel</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Channel</TableHead><TableHead>Avg AI Score</TableHead><TableHead>Avg Rating</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {Object.keys({ ...asRecord(report.avg_score_by_channel), ...asRecord(report.avg_rating_by_channel) }).map(ch => (
                        <TableRow key={ch}>
                          <TableCell className="capitalize font-medium">{ch}</TableCell>
                          <TableCell><ScoreBadge score={asRecord(report.avg_score_by_channel)[ch]} /></TableCell>
                          <TableCell>{asRecord(report.avg_rating_by_channel)[ch] ?? "—"}/5</TableCell>
                        </TableRow>
                      ))}
                      {Object.keys({ ...asRecord(report.avg_score_by_channel), ...asRecord(report.avg_rating_by_channel) }).length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center text-[#6B7280]">No channel data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clusters">
              <Card>
                <CardHeader><CardTitle className="text-sm text-[#1A1A1A]">Top 10 Low-Score Clusters</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Cluster</TableHead><TableHead>Score</TableHead><TableHead>Convos</TableHead><TableHead>Root Cause</TableHead><TableHead>Action</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {asArray(report.low_score_clusters).map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
                          <TableCell><ScoreBadge score={c.score} /></TableCell>
                          <TableCell>{c.conversations}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate text-[#6B7280]">{c.root_cause || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{c.action || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="failures">
              <Card>
                <CardHeader><CardTitle className="text-sm text-[#1A1A1A]">Top Failure Patterns</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Failure Type</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {asArray(report.top_failure_patterns).map((f: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell><Badge variant="outline" className="text-xs">{f.type}</Badge></TableCell>
                          <TableCell className="font-medium">{f.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deadair">
              <Card>
                <CardHeader><CardTitle className="text-sm text-[#1A1A1A]">Top Dead Air-Causing Bot Patterns</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Bot Message</TableHead><TableHead>Occurrences</TableHead><TableHead>Avg Silence</TableHead><TableHead>Return Rate</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {asArray(report.top_dead_air_patterns).map((d: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs max-w-[300px] truncate">{d.bot_text}</TableCell>
                          <TableCell>{d.occurrences}</TableCell>
                          <TableCell>{d.avg_silence_seconds}s</TableCell>
                          <TableCell>{d.return_rate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge">
              <div className="grid md:grid-cols-2 gap-4">
                <IssueList title="Missing Knowledge Areas" items={asArray(report.top_missing_knowledge)} />
                <IssueList title="Weak Prompt Patterns" items={asArray(report.top_weak_prompts)} />
                <IssueList title="Unresolved Business Intents" items={asArray(report.top_unresolved_intents)} />
                <IssueList title="Repeated Customer Complaints" items={asArray(report.top_repeated_complaints)} />
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm text-[#1A1A1A] flex items-center gap-2"><BookOpen className="h-4 w-4" /> KB Improvements</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {asArray(report.recommended_kb_improvements).map((kb: any, i: number) => (
                      <div key={i} className="text-xs border-b border-[#F3F0EB] pb-2 last:border-0">
                        <p className="font-medium text-[#1A1A1A]">{kb.title}</p>
                        <p className="text-[#6B7280]">{kb.type} · Priority {kb.priority}</p>
                      </div>
                    ))}
                    {asArray(report.recommended_kb_improvements).length === 0 && <p className="text-xs text-[#6B7280]">None</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm text-[#1A1A1A] flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Prompt Experiments</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {asArray(report.recommended_prompt_experiments).map((pe: any, i: number) => (
                      <div key={i} className="text-xs border-b border-[#F3F0EB] pb-2 last:border-0">
                        <p className="font-medium text-[#1A1A1A]">{pe.target}</p>
                        <p className="text-[#6B7280]">{pe.suggestion}</p>
                      </div>
                    ))}
                    {asArray(report.recommended_prompt_experiments).length === 0 && <p className="text-xs text-[#6B7280]">None</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm text-[#1A1A1A] flex items-center gap-2"><Zap className="h-4 w-4" /> Backend Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {asArray(report.recommended_actions).map((a: any, i: number) => (
                      <div key={i} className="text-xs border-b border-[#F3F0EB] pb-2 last:border-0">
                        <p className="font-medium text-[#1A1A1A]">{a.action_needed}</p>
                        <p className="text-[#6B7280]">{a.occurrences} occurrences</p>
                      </div>
                    ))}
                    {asArray(report.recommended_actions).length === 0 && <p className="text-xs text-[#6B7280]">None</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, variant, trend }: {
  label: string; value: string | number; icon: React.ReactNode; variant?: "warning";
  trend?: { delta: number; positive: boolean };
}) {
  return (
    <Card className={variant === "warning" ? "border-red-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#6B7280] mb-1">{icon}<span className="text-xs">{label}</span></div>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-bold ${variant === "warning" ? "text-red-600" : "text-[#1A1A1A]"}`}>{value}</p>
          {trend && (
            <span className={`text-xs font-medium ${trend.positive ? "text-green-600" : "text-red-600"}`}>
              {trend.positive ? "+" : ""}{trend.delta}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ title, icon, color, children }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <Card className={`${color} border`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-semibold text-[#1A1A1A]">{title}</span></div>
        {children}
      </CardContent>
    </Card>
  );
}

function IssueList({ title, items }: { title: string; items: Array<{ cause: string; count: number }> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-[#1A1A1A]">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-[#F3F0EB] last:border-0">
            <span className="text-[#374151] truncate max-w-[200px]">{item.cause}</span>
            <Badge variant="secondary" className="text-xs">{item.count}</Badge>
          </div>
        )) : <p className="text-xs text-[#6B7280]">None detected</p>}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-[#6B7280]">—</span>;
  const color = score >= 80 ? "bg-green-100 text-green-800" : score >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <Badge className={`${color} text-xs`}>{score}</Badge>;
}
