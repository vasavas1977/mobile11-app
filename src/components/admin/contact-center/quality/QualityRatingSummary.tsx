import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, MessageSquare, AlertTriangle, Volume2, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const STAR_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981"];
const CHANNEL_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];

export function QualityRatingSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["quality-rating-summary"],
    queryFn: async () => {
      const today = new Date();
      const last30 = subDays(today, 30);
      const prev30 = subDays(today, 60);

      const [{ data: current }, { data: prev }, { data: deadAir }] = await Promise.all([
        supabase.from("conversation_ratings").select("*").gte("created_at", last30.toISOString()),
        supabase.from("conversation_ratings").select("rating").gte("created_at", prev30.toISOString()).lt("created_at", last30.toISOString()),
        supabase.from("dead_air_events").select("id").gte("created_at", last30.toISOString()),
      ]);

      const ratings = current || [];
      const prevRatings = prev || [];
      const avgRating = ratings.length ? +(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0;
      const prevAvg = prevRatings.length ? +(prevRatings.reduce((s, r) => s + r.rating, 0) / prevRatings.length).toFixed(1) : 0;
      const lowPct = ratings.length ? +((ratings.filter(r => r.rating <= 2).length / ratings.length) * 100).toFixed(1) : 0;
      const csatPct = ratings.length ? +((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100).toFixed(1) : 0;

      const distribution = [1, 2, 3, 4, 5].map(star => ({
        star: `${star}★`, count: ratings.filter(r => r.rating === star).length, starNum: star,
      }));

      const dailyTrend: { date: string; avg: number | null; count: number; lowPct: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i);
        const dayRatings = ratings.filter(r => {
          const d = new Date(r.created_at!);
          return d >= startOfDay(date) && d <= endOfDay(date);
        });
        const dayLow = dayRatings.filter(r => r.rating <= 2).length;
        dailyTrend.push({
          date: format(date, "MM/dd"),
          avg: dayRatings.length ? +(dayRatings.reduce((s, r) => s + r.rating, 0) / dayRatings.length).toFixed(1) : null,
          count: dayRatings.length,
          lowPct: dayRatings.length ? +((dayLow / dayRatings.length) * 100).toFixed(0) : 0,
        });
      }

      const channels = ["web", "line", "whatsapp", "facebook", "voice"];
      const byChannel = channels.map(ch => {
        const chRatings = ratings.filter(r => r.channel === ch);
        return {
          name: ch.charAt(0).toUpperCase() + ch.slice(1),
          count: chRatings.length,
          avg: chRatings.length ? +(chRatings.reduce((s, r) => s + r.rating, 0) / chRatings.length).toFixed(1) : 0,
        };
      }).filter(c => c.count > 0);

      return {
        avgRating, prevAvg, totalRatings: ratings.length, lowPct, csatPct,
        deadAirCount: deadAir?.length || 0,
        distribution, dailyTrend, byChannel,
        ratingTrend: +(avgRating - prevAvg).toFixed(1),
      };
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading rating data...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Avg Rating", value: data?.avgRating || 0, icon: Star,
            iconClass: "text-amber-500 fill-amber-500",
            trend: data?.ratingTrend, suffix: "/ 5",
          },
          { label: "CSAT (4-5★)", value: `${data?.csatPct || 0}%`, icon: TrendingUp, iconClass: "text-emerald-500" },
          { label: "Low Rating %", value: `${data?.lowPct || 0}%`, icon: AlertTriangle, iconClass: "text-red-500" },
          { label: "Total Ratings", value: data?.totalRatings || 0, icon: MessageSquare, iconClass: "text-muted-foreground" },
          { label: "Dead Air Events", value: data?.deadAirCount || 0, icon: Volume2, iconClass: "text-muted-foreground" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.iconClass}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                {kpi.suffix && <span className="text-xs text-muted-foreground">{kpi.suffix}</span>}
              </div>
              {kpi.trend !== undefined && kpi.trend !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.trend > 0 ? '+' : ''}{kpi.trend} vs prev 30d
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="star" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(data?.distribution || []).map((_, i) => (
                      <Cell key={i} fill={STAR_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Rating Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="avg" stroke="#F97316" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown */}
      {data?.byChannel && data.byChannel.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Rating by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {data.byChannel.map((ch, i) => (
                <div key={ch.name} className="rounded-xl border border-border/50 p-3 text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: CHANNEL_COLORS[i % 5] }} />
                  <p className="text-sm font-semibold">{ch.name}</p>
                  <p className="text-xl font-bold">{ch.avg}★</p>
                  <p className="text-xs text-muted-foreground">{ch.count} ratings</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
