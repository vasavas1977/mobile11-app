import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Volume2, RefreshCw, Clock, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function QualityDeadAir() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["quality-dead-air-clusters"],
    queryFn: async () => {
      const today = new Date();
      const last30 = subDays(today, 30);

      const { data: events } = await supabase
        .from("dead_air_events")
        .select("*")
        .gte("created_at", last30.toISOString())
        .order("created_at", { ascending: false });

      const items = events || [];

      // Daily trend
      const dailyTrend: { date: string; count: number; abandoned: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = subDays(today, i);
        const dayItems = items.filter(e => {
          const d = new Date(e.created_at);
          return d >= startOfDay(date) && d <= endOfDay(date);
        });
        dailyTrend.push({
          date: format(date, "MM/dd"),
          count: dayItems.length,
          abandoned: dayItems.filter(e => !e.customer_returned).length,
        });
      }

      // Cluster by bot message
      const contentMap = new Map<string, { content: string; count: number; avgDuration: number; abandoned: number; channels: Set<string> }>();
      for (const evt of items) {
        const key = evt.bot_message_content?.substring(0, 80) || "unknown";
        const existing = contentMap.get(key);
        if (existing) {
          existing.count++;
          existing.avgDuration = (existing.avgDuration * (existing.count - 1) + evt.silence_duration_seconds) / existing.count;
          if (!evt.customer_returned) existing.abandoned++;
          existing.channels.add(evt.channel || "web");
        } else {
          contentMap.set(key, {
            content: evt.bot_message_content || "",
            count: 1,
            avgDuration: evt.silence_duration_seconds,
            abandoned: evt.customer_returned ? 0 : 1,
            channels: new Set([evt.channel || "web"]),
          });
        }
      }

      const clusters = Array.from(contentMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
        .map(c => ({ ...c, channels: Array.from(c.channels) }));

      // By channel
      const byChannel: Record<string, number> = {};
      items.forEach(e => { byChannel[e.channel || "web"] = (byChannel[e.channel || "web"] || 0) + 1; });

      return {
        totalEvents: items.length,
        avgSilence: items.length ? Math.round(items.reduce((s, e) => s + e.silence_duration_seconds, 0) / items.length) : 0,
        abandonedCount: items.filter(e => !e.customer_returned).length,
        abandonRate: items.length ? +((items.filter(e => !e.customer_returned).length / items.length) * 100).toFixed(1) : 0,
        clusters, dailyTrend, byChannel,
      };
    },
  });

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-dead-air", { body: { daysBack: 7 } });
      if (error) throw error;
      toast({ title: "Analysis Complete", description: `Detected ${result.events_detected} events, inserted ${result.events_inserted} new.` });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading dead air data...</div>;

  return (
    <div className="space-y-5">
      {/* KPI + Action */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: "Total Events", value: data?.totalEvents || 0, icon: Volume2 },
            { label: "Avg Silence", value: data?.avgSilence ? `${Math.round(data.avgSilence / 60)}m ${data.avgSilence % 60}s` : "0s", icon: Clock },
            { label: "Abandoned", value: data?.abandonedCount || 0, icon: XCircle },
            { label: "Abandon Rate", value: `${data?.abandonRate || 0}%`, icon: XCircle },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border/50 p-3 text-center bg-card">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {/* Daily Trend */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Dead Air Trend (14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#94A3B8" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="abandoned" fill="#EF4444" radius={[3, 3, 0, 0]} name="Abandoned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Offending Bot Replies */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Top Bot Replies Causing Silence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.clusters.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No dead air clusters. Click "Run Analysis" to scan.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot Message</TableHead>
                  <TableHead className="text-center w-20">Count</TableHead>
                  <TableHead className="text-center w-24">Avg Silence</TableHead>
                  <TableHead className="text-center w-24">Abandoned</TableHead>
                  <TableHead className="w-28">Channels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clusters.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm max-w-[400px]">
                      <p className="line-clamp-2 text-muted-foreground">{item.content}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono">{item.count}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {Math.round(item.avgDuration / 60)}m {Math.round(item.avgDuration % 60)}s
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">{item.abandoned}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.channels.map(ch => (
                          <Badge key={ch} variant="outline" className="text-[10px] capitalize">{ch}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
