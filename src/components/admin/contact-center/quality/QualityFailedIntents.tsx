import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function QualityFailedIntents() {
  const { data: clusters, isLoading } = useQuery({
    queryKey: ["quality-failed-intent-clusters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_intent_clusters")
        .select("*")
        .order("urgency_score", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: failures } = useQuery({
    queryKey: ["quality-failure-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_failure_events")
        .select("failure_type, severity")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      // Group by type
      const byType: Record<string, { count: number; critical: number }> = {};
      for (const f of data || []) {
        if (!byType[f.failure_type]) byType[f.failure_type] = { count: 0, critical: 0 };
        byType[f.failure_type].count++;
        if (f.severity === "critical") byType[f.failure_type].critical++;
      }
      return Object.entries(byType)
        .map(([type, stats]) => ({ type: type.replace(/_/g, " "), ...stats }))
        .sort((a, b) => b.count - a.count);
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  const criticalClusters = clusters?.filter(c => (c.average_ai_score || 100) < 50) || [];
  const chartData = (failures || []).slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Failure Type Distribution */}
      {chartData.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Failure Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="#F97316" radius={[0, 4, 4, 0]} name="Total" />
                  <Bar dataKey="critical" fill="#EF4444" radius={[0, 4, 4, 0]} name="Critical" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Intent Clusters */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Top Intent Clusters by Urgency
            {criticalClusters.length > 0 && (
              <Badge variant="destructive" className="ml-2">{criticalClusters.length} critical</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!clusters?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No intent clusters found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster</TableHead>
                  <TableHead className="text-center w-20">Convos</TableHead>
                  <TableHead className="text-center w-20">AI Score</TableHead>
                  <TableHead className="text-center w-20">Rating</TableHead>
                  <TableHead className="text-center w-20">Dead Air</TableHead>
                  <TableHead className="text-center w-20">Urgency</TableHead>
                  <TableHead className="max-w-[200px]">Root Cause</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map(c => {
                  const score = c.average_ai_score;
                  const scoreBadge = score === null ? "outline" :
                    score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive";
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium text-sm truncate">{c.admin_label || c.cluster_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.cluster_description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{c.conversation_count}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={scoreBadge as any}>{score ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {c.average_customer_rating !== null ? `${c.average_customer_rating}★` : "—"}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {c.dead_air_rate !== null ? `${Math.round(c.dead_air_rate * 100)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={(c.urgency_score || 0) > 5 ? "destructive" : "outline"}>
                          {c.urgency_score?.toFixed(1) || "0"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {c.root_cause_hypothesis || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
