import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./shared";
import { BarChart3, Mail, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DeliveryFilter = "all" | "delivered" | "bounced" | "rejected" | "unknown";
type ConversionFilter = "all" | "converted" | "none";

interface LearningEvent {
  id: string;
  sent_at: string | null;
  channel_type: string;
  delivery_status: string;
  seen_status: string;
  reply_status: string;
  reply_sentiment: string;
  click_status: string;
  conversion_status: string;
  opt_out_status: string;
  complaint_flag: boolean;
  post_send_rating: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  bounced: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  unknown: "bg-gray-100 text-gray-700 border-gray-200",
  seen: "bg-blue-100 text-blue-800 border-blue-200",
  replied: "bg-indigo-100 text-indigo-800 border-indigo-200",
  clicked: "bg-violet-100 text-violet-800 border-violet-200",
  converted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  opted_out: "bg-orange-100 text-orange-800 border-orange-200",
  none: "bg-gray-100 text-gray-700 border-gray-200",
  positive: "bg-emerald-100 text-emerald-800 border-emerald-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  negative: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize border", statusColors[value] || statusColors.unknown)}>
      {value.replace(/_/g, " ")}
    </Badge>
  );
}

export function ContactCenterLearningEvents() {
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("all");
  const [conversionFilter, setConversionFilter] = useState<ConversionFilter>("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["outbound-learning-events", deliveryFilter, conversionFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("outbound_learning_events")
        .select("id, sent_at, channel_type, delivery_status, seen_status, reply_status, reply_sentiment, click_status, conversion_status, opt_out_status, complaint_flag, post_send_rating, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (deliveryFilter !== "all") query = query.eq("delivery_status", deliveryFilter);
      if (conversionFilter === "converted") query = query.eq("conversion_status", "converted");
      if (conversionFilter === "none") query = query.eq("conversion_status", "none");

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as LearningEvent[];
    },
  });

  const total = events.length;
  const delivered = events.filter(e => e.delivery_status === "delivered").length;
  const replied = events.filter(e => e.reply_status === "replied").length;
  const converted = events.filter(e => e.conversion_status === "converted").length;
  const complaints = events.filter(e => e.complaint_flag).length;

  const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Learning Events</h2>
        <p className="text-sm text-muted-foreground">Structured outcome data from outbound sends for optimization and analysis.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Delivery Rate" value={`${pct(delivered)}%`} suffix={`${delivered}/${total}`} icon={Mail} />
        <MetricCard label="Reply Rate" value={`${pct(replied)}%`} suffix={`${replied} replied`} icon={MessageSquare} />
        <MetricCard label="Conversion Rate" value={`${pct(converted)}%`} suffix={`${converted} converted`} icon={CheckCircle2} />
        <MetricCard label="Complaint Rate" value={`${pct(complaints)}%`} suffix={`${complaints} complaints`} icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold">Event Log</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={deliveryFilter} onValueChange={(v) => setDeliveryFilter(v as DeliveryFilter)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              <Select value={conversionFilter} onValueChange={(v) => setConversionFilter(v as ConversionFilter)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Conversion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conversion</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="none">Not Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No learning events yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Events are created automatically when outbound messages are sent.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Sent At</TableHead>
                    <TableHead className="text-xs">Channel</TableHead>
                    <TableHead className="text-xs">Delivery</TableHead>
                    <TableHead className="text-xs">Seen</TableHead>
                    <TableHead className="text-xs">Reply</TableHead>
                    <TableHead className="text-xs">Sentiment</TableHead>
                    <TableHead className="text-xs">Click</TableHead>
                    <TableHead className="text-xs">Conversion</TableHead>
                    <TableHead className="text-xs">Opt-Out</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {event.sent_at ? format(new Date(event.sent_at), "MMM d, HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase border">
                          {event.channel_type}
                        </Badge>
                      </TableCell>
                      <TableCell><StatusBadge value={event.delivery_status} /></TableCell>
                      <TableCell><StatusBadge value={event.seen_status} /></TableCell>
                      <TableCell><StatusBadge value={event.reply_status} /></TableCell>
                      <TableCell><StatusBadge value={event.reply_sentiment} /></TableCell>
                      <TableCell><StatusBadge value={event.click_status} /></TableCell>
                      <TableCell><StatusBadge value={event.conversion_status} /></TableCell>
                      <TableCell><StatusBadge value={event.opt_out_status} /></TableCell>
                      <TableCell className="text-xs text-center">
                        {event.post_send_rating ? `${event.post_send_rating}/5` : "—"}
                      </TableCell>
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
