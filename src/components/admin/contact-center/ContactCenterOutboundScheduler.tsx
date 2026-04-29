import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, Play, FlaskConical, Send, ShieldOff, SkipForward,
  AlertTriangle, CheckCircle2, RefreshCw, Loader2,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  suppressed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  skipped: "bg-muted text-muted-foreground",
  sending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
  retryable: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export function ContactCenterOutboundScheduler() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["scheduler-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [pending, sentToday, suppressedToday, failedAll] = await Promise.all([
        supabase.from("outbound_send_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("outbound_send_queue").select("id", { count: "exact", head: true }).eq("status", "sent").gte("resolved_at", todayISO),
        supabase.from("outbound_send_queue").select("id", { count: "exact", head: true }).eq("status", "suppressed").gte("created_at", todayISO),
        supabase.from("outbound_send_queue").select("id", { count: "exact", head: true }).in("status", ["failed", "retryable"]),
      ]);
      return {
        pending: pending.count || 0,
        sentToday: sentToday.count || 0,
        suppressedToday: suppressedToday.count || 0,
        failed: failedAll.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  // Run logs
  const { data: runLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["scheduler-run-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scheduler_run_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Queue items
  const { data: queueItems, isLoading: queueLoading } = useQuery({
    queryKey: ["scheduler-queue", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("outbound_send_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // Run scheduler mutation
  const runScheduler = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const { data, error } = await supabase.functions.invoke("outbound-scheduler", {
        body: { dry_run: dryRun },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, dryRun) => {
      toast({
        title: dryRun ? "Dry Run Complete" : "Scheduler Run Complete",
        description: `Evaluated: ${data.evaluated}, Queued: ${data.queued}, Suppressed: ${data.suppressed}, Skipped: ${data.skipped}`,
      });
      queryClient.invalidateQueries({ queryKey: ["scheduler-stats"] });
      queryClient.invalidateQueries({ queryKey: ["scheduler-run-logs"] });
      queryClient.invalidateQueries({ queryKey: ["scheduler-queue"] });
    },
    onError: (error: any) => {
      toast({ title: "Scheduler Error", description: error.message, variant: "destructive" });
    },
  });

  const statCards = [
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-yellow-600" },
    { label: "Sent Today", value: stats?.sentToday ?? 0, icon: Send, color: "text-green-600" },
    { label: "Suppressed Today", value: stats?.suppressedToday ?? 0, icon: ShieldOff, color: "text-red-600" },
    { label: "Failed / Retryable", value: stats?.failed ?? 0, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Outbound Scheduler</h2>
          <p className="text-sm text-muted-foreground">Queue management and scheduling runs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runScheduler.mutate(true)}
            disabled={runScheduler.isPending}
          >
            {runScheduler.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-1" />}
            Dry Run
          </Button>
          <Button
            size="sm"
            onClick={() => runScheduler.mutate(false)}
            disabled={runScheduler.isPending}
          >
            {runScheduler.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Scheduler
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !runLogs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No scheduler runs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mode</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Evaluated</TableHead>
                    <TableHead className="text-right">Queued</TableHead>
                    <TableHead className="text-right">Suppressed</TableHead>
                    <TableHead className="text-right">Skipped</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runLogs.map((log: any) => {
                    const duration = log.completed_at
                      ? `${((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1)}s`
                      : "—";
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={log.run_mode === "dry_run" ? "outline" : "default"} className="text-xs">
                            {log.run_mode === "dry_run" ? "Dry Run" : "Live"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{format(new Date(log.started_at), "MMM d, HH:mm:ss")}</TableCell>
                        <TableCell className="text-right">{log.enrollments_evaluated}</TableCell>
                        <TableCell className="text-right font-medium">{log.sends_queued}</TableCell>
                        <TableCell className="text-right">{log.sends_suppressed}</TableCell>
                        <TableCell className="text-right">{log.sends_skipped}</TableCell>
                        <TableCell className="text-right">{log.errors > 0 ? <span className="text-destructive">{log.errors}</span> : 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{duration}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Send Queue</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suppressed">Suppressed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="retryable">Retryable</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["scheduler-queue"] })}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !queueItems?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No queue items found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ""}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{item.channel_type}</TableCell>
                      <TableCell className="text-xs">{format(new Date(item.scheduled_send_at), "MMM d, HH:mm")}</TableCell>
                      <TableCell className="text-sm">{item.attempt_count}/{item.max_attempts}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {item.suppression_reason || item.failure_reason || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{format(new Date(item.created_at), "MMM d, HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
