import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MessageSquare, ExternalLink, AlertTriangle, Clock, Smile, Meh, Frown } from "lucide-react";
import { useConversationRatingsBatch } from "@/hooks/useConversationRating";
import { ConversationRatingDisplay } from "@/components/shared/ConversationRatingDisplay";
import { formatDistanceToNow } from "date-fns";

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  web: { label: "Web", color: "bg-blue-100 text-blue-700 border-blue-200" },
  web_chat: { label: "Web", color: "bg-blue-100 text-blue-700 border-blue-200" },
  email: { label: "Email", color: "bg-purple-100 text-purple-700 border-purple-200" },
  facebook: { label: "Messenger", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  line: { label: "LINE", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-700 border-green-200" },
  voice: { label: "Voice", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-500 text-white" },
  pending: { label: "Pending", className: "bg-amber-500 text-white" },
  resolved: { label: "Resolved", className: "bg-emerald-500 text-white" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: string }> = {
  urgent: { label: "Urgent", variant: "destructive" },
  high: { label: "High", variant: "default" },
  medium: { label: "Medium", variant: "secondary" },
  low: { label: "Low", variant: "outline" },
};

const ISSUE_CATEGORIES = [
  "all", "activation", "connectivity", "billing", "refund", "provisioning",
  "compatibility", "top-up", "account", "general", "promo",
];

export function ContactCenterConversations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch conversations with contact data
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["admin-conversations", search, statusFilter, channelFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("conversations")
        .select(`
          *,
          contact:contacts(name, email, phone, whatsapp_phone, facebook_id, facebook_display_name, facebook_picture_url, line_display_name, line_picture_url, session_token, user_id)
        `)
        .order("updated_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (channelFilter !== "all") query = query.eq("channel", channelFilter);
      if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

      const { data, error } = await query.limit(100);
      if (error) throw error;

      let filtered = data || [];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((conv: any) => {
          const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact;
          return (
            contact?.name?.toLowerCase().includes(s) ||
            contact?.email?.toLowerCase().includes(s) ||
            contact?.phone?.toLowerCase().includes(s) ||
            contact?.whatsapp_phone?.toLowerCase().includes(s) ||
            contact?.facebook_display_name?.toLowerCase().includes(s) ||
            contact?.line_display_name?.toLowerCase().includes(s) ||
            conv.subject?.toLowerCase().includes(s) ||
            conv.ticket_id?.toLowerCase().includes(s)
          );
        });
      }
      return filtered;
    },
  });

  // Fetch linked orders for conversations that have contact user_ids
  const contactUserIds = [...new Set(
    (conversations || [])
      .map((c: any) => {
        const contact = Array.isArray(c.contact) ? c.contact[0] : c.contact;
        return contact?.user_id;
      })
      .filter(Boolean)
  )];

  const { data: linkedOrders } = useQuery({
    queryKey: ["conv-linked-orders", contactUserIds],
    queryFn: async () => {
      if (contactUserIds.length === 0) return {};
      const { data } = await supabase
        .from("orders")
        .select("id, user_id, status, package_id, total_amount, created_at, esim_packages!inner(country_name, data_amount, name)")
        .in("user_id", contactUserIds as string[])
        .order("created_at", { ascending: false })
        .limit(200);
      
      const map: Record<string, any[]> = {};
      (data || []).forEach((o: any) => {
        if (!map[o.user_id]) map[o.user_id] = [];
        map[o.user_id].push(o);
      });
      return map;
    },
    enabled: contactUserIds.length > 0,
  });

  // Fetch AI scores for conversations
  const convIds = (conversations || []).map((c: any) => c.id);
  const { data: ratingsMap } = useConversationRatingsBatch(convIds);

  const { data: aiScores } = useQuery({
    queryKey: ["conv-ai-scores", convIds.slice(0, 20)],
    queryFn: async () => {
      if (convIds.length === 0) return {};
      const { data } = await supabase
        .from("ai_conversation_scores")
        .select("conversation_id, composite_score, predicted_customer_satisfaction_score")
        .in("conversation_id", convIds.slice(0, 100));
      const map: Record<string, any> = {};
      (data || []).forEach((s: any) => { map[s.conversation_id] = s; });
      return map;
    },
    enabled: convIds.length > 0,
  });

  // Fetch agents
  const { data: agents } = useQuery({
    queryKey: ["admin-agents-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name");
      return data || [];
    },
  });

  const getAgentName = (userId: string | null) => {
    if (!userId) return "—";
    const agent = agents?.find((a: any) => a.user_id === userId);
    if (!agent) return "Unknown";
    return agent.first_name ? `${agent.first_name} ${agent.last_name || ""}`.trim() : agent.email;
  };

  const getContactName = (conv: any) => {
    const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact;
    if (!contact) return "Unknown";
    return contact.facebook_display_name ||
      (contact.name && !contact.name.startsWith('Facebook User') && !contact.name.startsWith('Messenger Contact') ? contact.name : null) ||
      contact.line_display_name ||
      contact.email ||
      contact.whatsapp_phone ||
      contact.phone ||
      "Unknown";
  };

  const getContactAvatar = (conv: any) => {
    const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact;
    return contact?.facebook_picture_url || contact?.line_picture_url;
  };

  const getLinkedOrder = (conv: any) => {
    const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact;
    if (!contact?.user_id || !linkedOrders) return null;
    const orders = linkedOrders[contact.user_id];
    return orders?.[0] || null;
  };

  const getSentimentIcon = (convId: string) => {
    const score = aiScores?.[convId];
    if (!score?.predicted_customer_satisfaction_score) return null;
    const s = score.predicted_customer_satisfaction_score;
    if (s >= 70) return <Smile className="h-4 w-4 text-emerald-500" />;
    if (s >= 40) return <Meh className="h-4 w-4 text-amber-500" />;
    return <Frown className="h-4 w-4 text-red-500" />;
  };

  const getIssueCategory = (conv: any) => {
    const meta = conv.metadata as any;
    return meta?.issue_category || meta?.intent || null;
  };

  // Stats
  const openCount = conversations?.filter((c: any) => c.status === "open").length || 0;
  const urgentCount = conversations?.filter((c: any) => c.priority === "urgent" || c.priority === "high").length || 0;
  const unassignedCount = conversations?.filter((c: any) => !c.assigned_to && c.status === "open").length || 0;

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Open</p>
              <p className="text-2xl font-bold text-blue-700">{openCount}</p>
            </div>
            <MessageSquare className="h-5 w-5 text-blue-400" />
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">High Priority</p>
              <p className="text-2xl font-bold text-red-700">{urgentCount}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Unassigned</p>
              <p className="text-2xl font-bold text-amber-700">{unassignedCount}</p>
            </div>
            <Clock className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customer, ticket..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-52 h-9 text-sm" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="facebook">Messenger</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {ISSUE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading conversations...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Customer</TableHead>
                    <TableHead className="text-xs font-semibold">Channel</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Priority</TableHead>
                    <TableHead className="text-xs font-semibold">Linked Order</TableHead>
                    <TableHead className="text-xs font-semibold">Destination</TableHead>
                    <TableHead className="text-xs font-semibold">Sentiment</TableHead>
                    <TableHead className="text-xs font-semibold">Rating</TableHead>
                    <TableHead className="text-xs font-semibold">Assigned</TableHead>
                    <TableHead className="text-xs font-semibold">Updated</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations?.map((conv: any) => {
                    const order = getLinkedOrder(conv);
                    const channelInfo = CHANNEL_LABELS[conv.channel] || { label: conv.channel, color: "bg-muted text-muted-foreground" };
                    const statusInfo = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open;
                    const priorityInfo = PRIORITY_CONFIG[conv.priority] || PRIORITY_CONFIG.medium;
                    const avatar = getContactAvatar(conv);

                    return (
                      <TableRow
                        key={conv.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => navigate(`/admin/contact-center/conversations/${conv.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {avatar ? (
                              <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium text-muted-foreground">
                                {getContactName(conv).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[160px]">{getContactName(conv)}</p>
                              {conv.subject && (
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">{conv.subject}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${channelInfo.color}`}>
                            {channelInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] px-1.5 py-0 ${statusInfo.className}`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityInfo.variant as any} className="text-[10px] px-1.5 py-0">
                            {priorityInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order ? (
                            <div className="text-xs">
                              <p className="font-medium text-foreground truncate max-w-[120px]">
                                {order.esim_packages?.name || order.esim_packages?.country_name}
                              </p>
                              <p className="text-muted-foreground">{order.esim_packages?.data_amount}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {order?.esim_packages?.country_name ? (
                            <span className="text-xs">{order.esim_packages.country_name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getSentimentIcon(conv.id) || <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {ratingsMap?.get(conv.id) ? (
                            <ConversationRatingDisplay rating={ratingsMap.get(conv.id)!} compact />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{getAgentName(conv.assigned_to)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); navigate(`/admin/contact-center/conversations/${conv.id}`); }}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!conversations || conversations.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No conversations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
