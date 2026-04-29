import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_ANALYTICS_EVENTS } from "./outboundSampleData";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { MetricCard } from "./shared/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Send, CheckCircle2, MessageSquare, TrendingDown } from "lucide-react";

export function ContactCenterOutboundAnalytics() {
  const { isSampleMode } = usePartnerDataMode();
  const [period, setPeriod] = useState("7");
  const [channelFilter, setChannelFilter] = useState("all");

  const daysBack = parseInt(period, 10);
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  const { data: liveEvents, isLoading: liveLoading } = useQuery({
    queryKey: ["outbound-analytics", period, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from("outbound_learning_events")
        .select("*")
        .gte("created_at", since)
        .limit(1000);
      if (channelFilter !== "all") {
        query = query.eq("channel_type", channelFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !isSampleMode,
  });

  const events = isSampleMode
    ? SAMPLE_ANALYTICS_EVENTS.filter((e: any) => channelFilter === "all" || e.channel_type === channelFilter)
    : liveEvents;
  const isLoading = isSampleMode ? false : liveLoading;

  // Compute aggregate metrics
  const total = events?.length || 0;
  const delivered = events?.filter((e: any) => e.delivery_status === "delivered").length || 0;
  const replied = events?.filter((e: any) => e.reply_status === "replied").length || 0;
  const converted = events?.filter((e: any) => e.conversion_status === "converted").length || 0;
  const optedOut = events?.filter((e: any) => e.opt_out_status === "opted_out").length || 0;

  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0";
  const replyRate = delivered > 0 ? ((replied / delivered) * 100).toFixed(1) : "0";
  const conversionRate = delivered > 0 ? ((converted / delivered) * 100).toFixed(1) : "0";
  const optOutRate = delivered > 0 ? ((optedOut / delivered) * 100).toFixed(1) : "0";

  // Group by campaign
  const byCampaign: Record<string, { sends: number; delivered: number; replied: number; clicked: number; converted: number; optedOut: number; name: string }> = {};
  (events || []).forEach((e: any) => {
    const cid = e.campaign_id || "uncategorized";
    if (!byCampaign[cid]) {
      byCampaign[cid] = { sends: 0, delivered: 0, replied: 0, clicked: 0, converted: 0, optedOut: 0, name: cid === "uncategorized" ? "Uncategorized" : cid.slice(0, 8) };
    }
    byCampaign[cid].sends++;
    if (e.delivery_status === "delivered") byCampaign[cid].delivered++;
    if (e.reply_status === "replied") byCampaign[cid].replied++;
    if (e.click_status === "clicked") byCampaign[cid].clicked++;
    if (e.conversion_status === "converted") byCampaign[cid].converted++;
    if (e.opt_out_status === "opted_out") byCampaign[cid].optedOut++;
  });

  const campaignRows = Object.entries(byCampaign).sort((a, b) => b[1].sends - a[1].sends);

  const pct = (num: number, den: number) => den > 0 ? ((num / den) * 100).toFixed(1) + "%" : "—";

  return (
    <div>
      <AdminPageHeader title="Outbound Analytics" description="Aggregated delivery, engagement, and conversion performance" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard label={`Sends (${period}d)`} value={total} icon={Send} />
        <MetricCard label="Delivery Rate" value={`${deliveryRate}%`} icon={CheckCircle2} variant="success" />
        <MetricCard label="Reply Rate" value={`${replyRate}%`} icon={MessageSquare} variant="info" />
        <MetricCard label="Conversion Rate" value={`${conversionRate}%`} icon={BarChart3} variant="success" />
        <MetricCard label="Opt-out Rate" value={`${optOutRate}%`} icon={TrendingDown} variant="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="line">LINE</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading analytics...</CardContent></Card>
      ) : campaignRows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No outbound data yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Analytics will populate as outbound messages are sent and tracked.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Campaign</TableHead>
                <TableHead className="text-[11px] text-right">Sends</TableHead>
                <TableHead className="text-[11px] text-right">Delivered %</TableHead>
                <TableHead className="text-[11px] text-right">Replied %</TableHead>
                <TableHead className="text-[11px] text-right">Clicked %</TableHead>
                <TableHead className="text-[11px] text-right">Converted %</TableHead>
                <TableHead className="text-[11px] text-right">Opt-outs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignRows.map(([id, c]) => (
                <TableRow key={id}>
                  <TableCell className="py-2.5 text-xs font-medium">{c.name}</TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">{c.sends}</TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">{pct(c.delivered, c.sends)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">{pct(c.replied, c.delivered)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">{pct(c.clicked, c.delivered)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">{pct(c.converted, c.delivered)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">{c.optedOut}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
