import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_SEND_LOGS } from "./outboundSampleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Send, CheckCircle2, AlertTriangle, MessageSquare, MousePointerClick,
  ShoppingCart, ChevronDown, ChevronUp, Loader2, Mail, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

const SEND_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
};

const DELIVERY_STATUS_COLORS: Record<string, string> = {
  unknown: "bg-muted text-muted-foreground",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  bounced: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  rejected: "bg-destructive/10 text-destructive",
};

const CHANNEL_ICONS: Record<string, string> = {
  line: "🟢",
  email: "📧",
  whatsapp: "💬",
  facebook: "📘",
};

export function ContactCenterSendLogs() {
  const { t } = useLanguage();
  const { isSampleMode } = usePartnerDataMode();
  const [sendStatusFilter, setSendStatusFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Stats (last 7 days)
  const { data: stats } = useQuery({
    queryKey: ["send-logs-stats"],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekISO = weekAgo.toISOString();

      const [totalSent, delivered, replied, clicked] = await Promise.all([
        (supabase as any).from("outbound_send_logs").select("id", { count: "exact", head: true })
          .eq("send_status", "sent").gte("created_at", weekISO),
        (supabase as any).from("outbound_send_logs").select("id", { count: "exact", head: true })
          .eq("delivery_status", "delivered").gte("created_at", weekISO),
        (supabase as any).from("outbound_send_logs").select("id", { count: "exact", head: true })
          .eq("reply_status", "replied").gte("created_at", weekISO),
        (supabase as any).from("outbound_send_logs").select("id", { count: "exact", head: true })
          .eq("click_status", "clicked").gte("created_at", weekISO),
      ]);

      const sentCount = totalSent.count || 0;
      return {
        totalSent: sentCount,
        deliveryRate: sentCount > 0 ? Math.round(((delivered.count || 0) / sentCount) * 100) : 0,
        replyRate: sentCount > 0 ? Math.round(((replied.count || 0) / sentCount) * 100) : 0,
        clickRate: sentCount > 0 ? Math.round(((clicked.count || 0) / sentCount) * 100) : 0,
      };
    },
    refetchInterval: 30000,
    enabled: !isSampleMode,
  });

  // Sample stats
  const sampleStats = isSampleMode ? (() => {
    const sent = SAMPLE_SEND_LOGS.filter(l => l.send_status === "sent");
    const del = sent.filter(l => l.delivery_status === "delivered");
    const rep = sent.filter(l => l.reply_status === "replied");
    const clk = sent.filter(l => l.click_status === "clicked");
    return {
      totalSent: sent.length,
      deliveryRate: sent.length > 0 ? Math.round((del.length / sent.length) * 100) : 0,
      replyRate: sent.length > 0 ? Math.round((rep.length / sent.length) * 100) : 0,
      clickRate: sent.length > 0 ? Math.round((clk.length / sent.length) * 100) : 0,
    };
  })() : null;

  const effectiveStats = isSampleMode ? sampleStats : stats;

  // Log entries
  const { data: liveLogs, isLoading: liveLoading, refetch } = useQuery({
    queryKey: ["send-logs", sendStatusFilter, deliveryFilter, channelFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("outbound_send_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (sendStatusFilter !== "all") query = query.eq("send_status", sendStatusFilter);
      if (deliveryFilter !== "all") query = query.eq("delivery_status", deliveryFilter);
      if (channelFilter !== "all") query = query.eq("channel_type", channelFilter);

      const { data } = await query;
      return data || [];
    },
    enabled: !isSampleMode,
  });

  const logs = isSampleMode
    ? SAMPLE_SEND_LOGS.filter(l => {
        if (sendStatusFilter !== "all" && l.send_status !== sendStatusFilter) return false;
        if (deliveryFilter !== "all" && l.delivery_status !== deliveryFilter) return false;
        if (channelFilter !== "all" && l.channel_type !== channelFilter) return false;
        return true;
      })
    : liveLogs;
  const isLoading = isSampleMode ? false : liveLoading;

  const statCards = [
    { label: "Sent (7d)", value: String(effectiveStats?.totalSent ?? 0), icon: Send, accent: "default" as const },
    { label: "Delivery Rate", value: `${effectiveStats?.deliveryRate ?? 0}%`, icon: CheckCircle2, accent: "success" as const },
    { label: "Reply Rate", value: `${effectiveStats?.replyRate ?? 0}%`, icon: MessageSquare, accent: "warning" as const },
    { label: "Click Rate", value: `${effectiveStats?.clickRate ?? 0}%`, icon: MousePointerClick, accent: "default" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Send Logs</h2>
          <p className="text-xs text-muted-foreground">Outbound message delivery history and tracking</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.accent === "success" ? "text-emerald-600" : s.accent === "warning" ? "text-amber-600" : "text-muted-foreground"}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={sendStatusFilter} onValueChange={setSendStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Send Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Send Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Delivery" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Delivery</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="line">LINE</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">Message Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !logs?.length ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No send logs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Attempt</TableHead>
                  <TableHead className="text-xs">Send Status</TableHead>
                  <TableHead className="text-xs">Delivery</TableHead>
                  <TableHead className="text-xs">Engagement</TableHead>
                  <TableHead className="text-xs">Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const isExpanded = expandedRow === log.id;
                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <TableCell className="py-2 px-2">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          <span className="mr-1">{CHANNEL_ICONS[log.channel_type] || "📨"}</span>
                          {log.channel_type}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {log.provider_name || "—"}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-center">
                          #{log.send_attempt_number}
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" className={`text-[10px] ${SEND_STATUS_COLORS[log.send_status] || ""}`}>
                            {log.send_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" className={`text-[10px] ${DELIVERY_STATUS_COLORS[log.delivery_status] || ""}`}>
                            {log.delivery_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex gap-1">
                            {log.reply_status === "replied" && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-300 text-blue-700">
                                <MessageSquare className="h-2.5 w-2.5 mr-0.5" /> Reply
                              </Badge>
                            )}
                            {log.click_status === "clicked" && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-300 text-purple-700">
                                <MousePointerClick className="h-2.5 w-2.5 mr-0.5" /> Click
                              </Badge>
                            )}
                            {log.conversion_status === "converted" && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-300 text-emerald-700">
                                <ShoppingCart className="h-2.5 w-2.5 mr-0.5" /> Conv
                              </Badge>
                            )}
                            {log.reply_status === "none" && log.click_status === "none" && log.conversion_status === "none" && (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {log.sent_at ? format(new Date(log.sent_at), "MMM d, HH:mm") : log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm") : "—"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${log.id}-detail`}>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-muted-foreground">Customer Profile ID</span>
                                  <p className="font-mono text-[11px] break-all">{log.customer_profile_id}</p>
                                </div>
                                {log.email_subject && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Email Subject</span>
                                    <p>{log.email_subject}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium text-muted-foreground">Rendered Content</span>
                                  <p className="bg-background rounded p-2 border border-border mt-1 whitespace-pre-wrap max-h-32 overflow-auto">
                                    {log.rendered_content || "No content snapshot"}
                                  </p>
                                </div>
                                {log.failure_reason && (
                                  <div>
                                    <span className="font-medium text-destructive">Failure Reason</span>
                                    <p className="text-destructive">{log.failure_reason}</p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-muted-foreground">External Message ID</span>
                                  <p className="font-mono text-[11px]">{log.external_message_id || "—"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium text-muted-foreground">Created</span>
                                    <p>{log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm:ss") : "—"}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Sent</span>
                                    <p>{log.sent_at ? format(new Date(log.sent_at), "MMM d, HH:mm:ss") : "—"}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Delivered</span>
                                    <p>{log.delivered_at ? format(new Date(log.delivered_at), "MMM d, HH:mm:ss") : "—"}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Replied</span>
                                    <p>{log.replied_at ? format(new Date(log.replied_at), "MMM d, HH:mm:ss") : "—"}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Clicked</span>
                                    <p>{log.clicked_at ? format(new Date(log.clicked_at), "MMM d, HH:mm:ss") : "—"}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Converted</span>
                                    <p>{log.converted_at ? format(new Date(log.converted_at), "MMM d, HH:mm:ss") : "—"}</p>
                                  </div>
                                </div>
                                {log.metadata && (
                                  <>
                                    {/* Template & Experiment Resolution Details */}
                                    {(log.metadata.template_name || log.metadata.experiment_name) && (
                                      <div className="space-y-1.5">
                                        <span className="font-medium text-muted-foreground">Resolution</span>
                                        <div className="bg-background rounded p-2 border border-border mt-1 space-y-1">
                                          {log.metadata.template_name && (
                                            <div className="flex items-center gap-1.5 text-[11px]">
                                              <span className="text-muted-foreground">Template:</span>
                                              <span className="font-medium">{log.metadata.template_name}</span>
                                              {log.metadata.resolution_method && (
                                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                                  {log.metadata.resolution_method}
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                          {log.metadata.experiment_name && (
                                            <div className="flex items-center gap-1.5 text-[11px]">
                                              <span className="text-muted-foreground">Experiment:</span>
                                              <span className="font-medium text-blue-700 dark:text-blue-400">{log.metadata.experiment_name}</span>
                                            </div>
                                          )}
                                          {log.metadata.variant_label && (
                                            <div className="flex items-center gap-1.5 text-[11px]">
                                              <span className="text-muted-foreground">Variant:</span>
                                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{log.metadata.variant_label}</Badge>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {/* Raw metadata (excluding already-displayed fields) */}
                                    {(() => {
                                      const displayedKeys = ['template_name', 'template_id', 'resolution_method', 'experiment_name', 'experiment_id', 'variant_label', 'variant_id'];
                                      const remaining = Object.fromEntries(
                                        Object.entries(log.metadata).filter(([k]) => !displayedKeys.includes(k))
                                      );
                                      return Object.keys(remaining).length > 0 ? (
                                        <div>
                                          <span className="font-medium text-muted-foreground">Metadata</span>
                                          <pre className="bg-background rounded p-2 border border-border mt-1 text-[10px] max-h-24 overflow-auto">
                                            {JSON.stringify(remaining, null, 2)}
                                          </pre>
                                        </div>
                                      ) : null;
                                    })()}
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
