import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ControlTowerTrends() {
  const { data: chartData } = useQuery({
    queryKey: ["control-tower-trends"],
    queryFn: async () => {
      // Get daily reports for the last 14 days
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
      const { data: reports } = await supabase
        .from("ai_daily_optimization_reports")
        .select("report_date, avg_composite_score, avg_customer_rating, total_failures, total_conversations_analyzed, total_dead_air_events")
        .gte("report_date", fourteenDaysAgo)
        .order("report_date", { ascending: true });

      return (reports || []).map((r: any) => ({
        date: r.report_date?.slice(5),
        score: r.avg_composite_score ? Number(r.avg_composite_score).toFixed(1) : null,
        rating: r.avg_customer_rating ? Number(r.avg_customer_rating).toFixed(2) : null,
        failures: r.total_failures || 0,
        deadAir: r.total_dead_air_events || 0,
        convos: r.total_conversations_analyzed || 0,
      }));
    },
    staleTime: 120000,
  });

  if (!chartData?.length) {
    return (
      <Card className="bg-white border-[#E5E0D8] shadow-sm">
        <CardContent className="py-8 text-center text-[#9CA3AF] text-sm">
          Trend data will appear once daily reports are generated.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-white border-[#E5E0D8] shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-[#1A1A1A]">AI Score & Rating Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E0D8" }} />
              <Area type="monotone" dataKey="score" name="AI Score" stroke="#f97316" fill="url(#scoreGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E5E0D8] shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Failures & Dead Air Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="deadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E0D8" }} />
              <Area type="monotone" dataKey="failures" name="Failures" stroke="#ef4444" fill="url(#failGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="deadAir" name="Dead Air" stroke="#8b5cf6" fill="url(#deadGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
