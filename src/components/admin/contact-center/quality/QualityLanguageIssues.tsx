import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { subDays } from "date-fns";

const LANG_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#EAB308"];
const LANG_LABELS: Record<string, string> = {
  en: "🇺🇸 English", th: "🇹🇭 Thai", ja: "🇯🇵 Japanese", ko: "🇰🇷 Korean",
  zh: "🇨🇳 Chinese", fr: "🇫🇷 French", de: "🇩🇪 German", es: "🇪🇸 Spanish",
  pt: "🇧🇷 Portuguese", ar: "🇸🇦 Arabic",
};

export function QualityLanguageIssues() {
  const { data, isLoading } = useQuery({
    queryKey: ["quality-language-issues"],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();

      // Get ratings grouped by language
      const { data: ratings } = await supabase
        .from("conversation_ratings")
        .select("rating, language, channel")
        .gte("created_at", since);

      // Get language-related failures
      const { data: failures } = await supabase
        .from("ai_failure_events")
        .select("failure_type, failure_subtype, severity, customer_last_message")
        .eq("failure_type", "language_mismatch")
        .gte("created_at", since);

      // Get low scores by language
      const { data: scores } = await supabase
        .from("ai_conversation_scores")
        .select("language, composite_score, ai_clarity_score")
        .gte("created_at", since)
        .not("language", "is", null);

      // Rating by language
      const byLang: Record<string, { total: number; sum: number; low: number }> = {};
      for (const r of ratings || []) {
        const lang = r.language || "en";
        if (!byLang[lang]) byLang[lang] = { total: 0, sum: 0, low: 0 };
        byLang[lang].total++;
        byLang[lang].sum += r.rating;
        if (r.rating <= 2) byLang[lang].low++;
      }

      const langStats = Object.entries(byLang)
        .map(([lang, stats]) => ({
          lang,
          label: LANG_LABELS[lang] || lang.toUpperCase(),
          total: stats.total,
          avg: +(stats.sum / stats.total).toFixed(1),
          lowPct: +((stats.low / stats.total) * 100).toFixed(1),
        }))
        .sort((a, b) => a.avg - b.avg);

      // Score by language
      const scoreByLang: Record<string, { sum: number; count: number }> = {};
      for (const s of scores || []) {
        const lang = s.language || "en";
        if (!scoreByLang[lang]) scoreByLang[lang] = { sum: 0, count: 0 };
        scoreByLang[lang].sum += s.composite_score || 0;
        scoreByLang[lang].count++;
      }

      const scoreStats = Object.entries(scoreByLang)
        .map(([lang, s]) => ({
          lang: LANG_LABELS[lang] || lang.toUpperCase(),
          avgScore: Math.round(s.sum / s.count),
        }))
        .sort((a, b) => a.avgScore - b.avgScore);

      return {
        langStats,
        scoreStats,
        mismatchCount: failures?.length || 0,
        mismatchExamples: (failures || []).slice(0, 10),
        pieData: langStats.map(l => ({ name: l.label, value: l.total })),
      };
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Languages Detected</p>
              <p className="text-2xl font-bold">{data?.langStats.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Language Mismatches</p>
              <p className="text-2xl font-bold">{data?.mismatchCount || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Worst Language</p>
              <p className="text-lg font-bold">{data?.langStats[0]?.label || "—"} ({data?.langStats[0]?.avg || 0}★)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        {data?.pieData && data.pieData.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Rating Volume by Language</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.pieData.map((_, i) => <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Score by Language */}
        {data?.scoreStats && data.scoreStats.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">AI Score by Language</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.scoreStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="lang" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="avgScore" fill="#F97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Language Rating Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Rating Performance by Language</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead className="text-center">Total Ratings</TableHead>
                <TableHead className="text-center">Avg Rating</TableHead>
                <TableHead className="text-center">Low Rating %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.langStats || []).map(l => (
                <TableRow key={l.lang}>
                  <TableCell className="font-medium">{l.label}</TableCell>
                  <TableCell className="text-center">{l.total}</TableCell>
                  <TableCell className="text-center">
                    <span className={l.avg < 3 ? "text-red-600 font-semibold" : l.avg < 4 ? "text-amber-600" : "text-emerald-600"}>
                      {l.avg}★
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={l.lowPct > 20 ? "destructive" : "outline"}>{l.lowPct}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
