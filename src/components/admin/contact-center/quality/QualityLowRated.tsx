import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ExternalLink, MessageSquare } from "lucide-react";
import { format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";

export function QualityLowRated() {
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("30");

  const { data, isLoading } = useQuery({
    queryKey: ["quality-low-rated", channelFilter, periodFilter],
    queryFn: async () => {
      const days = parseInt(periodFilter);
      const since = subDays(new Date(), days).toISOString();

      let query = supabase
        .from("conversation_ratings")
        .select("*, conversations(id, channel, subject, contact_id, status, metadata)")
        .lte("rating", 2)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (channelFilter !== "all") {
        query = query.eq("channel", channelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by channel
      const byChannel: Record<string, number> = {};
      for (const r of data || []) {
        const ch = r.channel || "web";
        byChannel[ch] = (byChannel[ch] || 0) + 1;
      }

      return { items: data || [], byChannel };
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="line">LINE</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="voice">Voice</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        {data?.byChannel && Object.keys(data.byChannel).length > 0 && (
          <div className="flex gap-2 ml-auto">
            {Object.entries(data.byChannel).map(([ch, count]) => (
              <Badge key={ch} variant="outline" className="text-xs">
                {ch}: {count}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Low Rated Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Low-Rated Conversations (1-2★)
            {data?.items.length ? (
              <Badge variant="destructive" className="ml-2">{data.items.length}</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !data?.items.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No low-rated conversations found. Great job! 🎉
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead className="max-w-[300px]">Feedback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm">{format(new Date(r.created_at), "MMM dd, HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{r.channel || "web"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-semibold">{"★".repeat(r.rating)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {r.language === "th" ? "🇹🇭 TH" : r.language === "ja" ? "🇯🇵 JA" : "🇺🇸 EN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {r.feedback_text || "—"}
                    </TableCell>
                    <TableCell>
                      {r.conversations?.status && (
                        <Badge variant="outline" className="text-xs capitalize">{r.conversations.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.conversation_id && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => navigate(`/admin/contact-center/conversations/${r.conversation_id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
