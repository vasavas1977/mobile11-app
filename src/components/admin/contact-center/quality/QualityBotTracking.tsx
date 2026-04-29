import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, CheckCircle, Clock, BookOpen, Beaker, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export function QualityBotTracking() {
  const { data, isLoading } = useQuery({
    queryKey: ["quality-bot-improvement-tracking"],
    queryFn: async () => {
      const today = new Date();

      // KB candidates status
      const { data: kbCandidates } = await supabase
        .from("kb_improvement_candidates")
        .select("status, impact_score, created_at")
        .order("created_at", { ascending: false });

      // Prompt experiments
      const { data: experiments } = await supabase
        .from("prompt_experiments")
        .select("status, created_at")
        .order("created_at", { ascending: false });

      // Daily reports for tracking score progression
      const { data: dailyReports } = await supabase
        .from("ai_daily_optimization_reports")
        .select("report_date, avg_composite_score, avg_customer_rating, total_failures, total_dead_air_events")
        .order("report_date", { ascending: true })
        .limit(30);

      // Pending KB suggestions
      const { data: kbSuggestions } = await supabase
        .from("pending_kb_suggestions")
        .select("status")
        .limit(200);

      const candidates = kbCandidates || [];
      const exps = experiments || [];
      const reports = dailyReports || [];
      const suggestions = kbSuggestions || [];

      return {
        kbStats: {
          total: candidates.length,
          pending: candidates.filter(c => c.status === "pending").length,
          approved: candidates.filter(c => c.status === "approved" || c.status === "published").length,
          rejected: candidates.filter(c => c.status === "rejected").length,
        },
        experimentStats: {
          total: exps.length,
          active: exps.filter(e => e.status === "running").length,
          completed: exps.filter(e => e.status === "completed" || e.status === "rolled_back").length,
        },
        suggestionStats: {
          total: suggestions.length,
          pending: suggestions.filter(s => s.status === "pending").length,
          approved: suggestions.filter(s => s.status === "approved").length,
        },
        scoreTrend: reports.map(r => ({
          date: format(new Date(r.report_date), "MM/dd"),
          score: r.avg_composite_score,
          rating: r.avg_customer_rating,
          failures: r.total_failures,
        })),
      };
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5">
      {/* Improvement Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "KB Improvements", value: data?.kbStats.total || 0, pending: data?.kbStats.pending || 0, icon: BookOpen, color: "text-blue-500" },
          { label: "KB Published", value: data?.kbStats.approved || 0, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Experiments", value: data?.experimentStats.total || 0, pending: data?.experimentStats.active || 0, icon: Beaker, color: "text-purple-500" },
          { label: "KB Suggestions", value: data?.suggestionStats.total || 0, pending: data?.suggestionStats.pending || 0, icon: FileText, color: "text-amber-500" },
        ].map(k => (
          <Card key={k.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <k.icon className={`h-5 w-5 ${k.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{k.value}</p>
                    {k.pending !== undefined && k.pending > 0 && (
                      <Badge variant="outline" className="text-[10px]">{k.pending} pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score Progression Chart */}
      {data?.scoreTrend && data.scoreTrend.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              AI Quality Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis yAxisId="score" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Line yAxisId="score" type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2} dot={false} name="AI Score" />
                  <Line yAxisId="rating" type="monotone" dataKey="rating" stroke="#10B981" strokeWidth={2} dot={false} name="Avg Rating" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-orange-500 rounded" /> AI Score</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-500 rounded" /> Avg Rating</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Pipeline */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Improvement Pipeline Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* KB Pipeline */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">KB Improvements</p>
              <div className="space-y-1">
                {[
                  { label: "Pending Review", count: data?.kbStats.pending || 0, color: "bg-amber-500" },
                  { label: "Published", count: data?.kbStats.approved || 0, color: "bg-emerald-500" },
                  { label: "Rejected", count: data?.kbStats.rejected || 0, color: "bg-red-500" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Experiments Pipeline */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Experiments</p>
              <div className="space-y-1">
                {[
                  { label: "Active", count: data?.experimentStats.active || 0, color: "bg-blue-500" },
                  { label: "Completed", count: data?.experimentStats.completed || 0, color: "bg-emerald-500" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KB Suggestions Pipeline */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">AI Suggestions</p>
              <div className="space-y-1">
                {[
                  { label: "Pending", count: data?.suggestionStats.pending || 0, color: "bg-amber-500" },
                  { label: "Approved", count: data?.suggestionStats.approved || 0, color: "bg-emerald-500" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
