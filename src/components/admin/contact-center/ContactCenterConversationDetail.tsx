import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Send, User, Clock, MessageSquare, Lock, MessageCircle,
  Bot, BotOff, Bell, Copy, Package, ShoppingCart, Globe, History, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChatAttachments, type Attachment } from "@/components/chat/ChatAttachments";
import { linkifyText } from "@/utils/linkifyText";
import { useConversationRating } from "@/hooks/useConversationRating";
import { ConversationRatingDisplay } from "@/components/shared/ConversationRatingDisplay";
import { AIScoreCard } from "./AIScoreCard";
import { AIReasoningPanel } from "./AIReasoningPanel";

export function ContactCenterConversationDetail() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [facebookMessageTag, setFacebookMessageTag] = useState<string>('');
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("context");

  const { data: conversationRating } = useConversationRating(conversationId);

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select(`*, contact:contacts(*)`)
        .eq("id", conversationId)
        .single();
      return data;
    },
    enabled: !!conversationId,
  });

  const { data: messages } = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!conversationId,
    refetchInterval: 10000,
  });

  const { data: agents } = useQuery({
    queryKey: ["agents-for-assignment"],
    queryFn: async () => {
      const { data } = await supabase.from("agent_status").select("user_id, status");
      if (!data) return [];
      const userIds = data.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name")
        .in("user_id", userIds);
      return data.map((agent) => ({
        ...agent,
        profile: profiles?.find((p) => p.user_id === agent.user_id),
      }));
    },
  });

  // Fetch customer orders
  const contactUserId = conversation?.contact?.user_id;
  const { data: customerOrders } = useQuery({
    queryKey: ["customer-orders", contactUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at, provider, qr_code, smdp_address, activation_code, esim_packages!inner(name, country_name, data_amount, validity_days, carrier)")
        .eq("user_id", contactUserId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!contactUserId,
  });

  // Fetch dead air events for this conversation
  const { data: deadAirEvents } = useQuery({
    queryKey: ["dead-air-conv", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("dead_air_events")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!conversationId,
  });

  // Fetch support history (other conversations for same contact)
  const contactId = conversation?.contact_id;
  const { data: supportHistory } = useQuery({
    queryKey: ["support-history", contactId, conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, channel, status, priority, subject, created_at, resolved_at")
        .eq("contact_id", contactId!)
        .neq("id", conversationId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!contactId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !conversationId || !user || !conversation) return;
      const channel = conversation.channel;
      const message = newMessage.trim();

      if (isInternal) {
        const { error } = await supabase.from("conversation_messages").insert({
          conversation_id: conversationId, content: message,
          sender_type: "agent", sender_id: user.id, is_internal_note: true,
        });
        if (error) throw error;
        return;
      }

      if (channel === "facebook") {
        const { error } = await supabase.functions.invoke("send-facebook-reply", {
          body: { conversationId, message, agentId: user.id, isInternalNote: false, messageTag: facebookMessageTag || undefined },
        });
        if (error) throw error;
      } else if (channel === "line") {
        const { error } = await supabase.functions.invoke("send-line-reply", {
          body: { conversationId, message, agentId: user.id, isInternalNote: false },
        });
        if (error) throw error;
      } else if (channel === "whatsapp") {
        const { error } = await supabase.functions.invoke("send-whatsapp-reply", {
          body: { conversationId, message, agentId: user.id, isInternalNote: false },
        });
        if (error) throw error;
      } else if (channel === "email") {
        const { error } = await supabase.functions.invoke("send-agent-reply", {
          body: { conversationId, message, agentId: user.id, isInternalNote: false },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("conversation_messages").insert({
          conversation_id: conversationId, content: message,
          sender_type: "agent", sender_id: user.id, is_internal_note: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setNewMessage("");
      setIsInternal(false);
      setFacebookMessageTag('');
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
      toast({ title: isInternal ? "Internal note added" : "Message sent" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send", description: error?.message, variant: "destructive" });
    },
  });

  const updateConversation = useMutation({
    mutationFn: async (updates: { status?: string; priority?: string; assigned_to?: string | null }) => {
      const { error } = await supabase.from("conversations").update(updates).eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
      toast({ title: "Updated" });
    },
  });

  const getAgentName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const agent = agents?.find((a) => a.user_id === userId);
    if (!agent?.profile) return "Unknown";
    return agent.profile.first_name ? `${agent.profile.first_name} ${agent.profile.last_name || ""}`.trim() : agent.profile.email;
  };

  const checkBotPaused = () => (conversation?.metadata as any)?.ai_paused === true;

  const handleToggleBot = async () => {
    if (!conversationId || !conversation) return;
    setTogglingBot(true);
    try {
      const currentMeta = (conversation.metadata || {}) as any;
      const newPaused = !checkBotPaused();
      await supabase.from('conversations').update({
        metadata: { ...currentMeta, ai_paused: newPaused, ai_paused_reason: newPaused ? 'manual_agent_toggle' : null, ai_paused_at: newPaused ? new Date().toISOString() : null },
      }).eq('id', conversationId);
      queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
      toast({ title: newPaused ? 'Bot paused' : 'Bot resumed' });
    } catch { toast({ title: 'Failed to toggle bot', variant: 'destructive' }); }
    finally { setTogglingBot(false); }
  };

  const handleSendEscalationAlert = async () => {
    if (!conversationId || !conversation) return;
    setSendingAlert(true);
    try {
      const contact = conversation.contact as any;
      const customerName = contact?.name || contact?.email || 'Unknown';
      await Promise.all([
        supabase.functions.invoke('notify-agents', { body: { conversationId, customerName, channel: conversation.channel, messagePreview: 'Manual escalation from admin portal' } }),
        supabase.functions.invoke('notify-line-group', { body: { conversationId, customerName, channel: conversation.channel, messagePreview: 'Manual escalation from admin portal', alertType: 'escalation' } }),
      ]);
      toast({ title: 'Escalation alert sent' });
    } catch { toast({ title: 'Failed to send alert', variant: 'destructive' }); }
    finally { setSendingAlert(false); }
  };

  const filteredMessages = showNotes ? messages : messages?.filter(m => !m.is_internal_note);

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!conversation) return <div className="text-center py-8"><p className="text-muted-foreground">Conversation not found</p><Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button></div>;

  const contact = conversation.contact as any;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {contact?.facebook_picture_url && (
              <img src={contact.facebook_picture_url} alt="" className="h-8 w-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div>
              <h2 className="text-base font-semibold truncate">{conversation.subject || "No subject"}</h2>
              <p className="text-xs text-muted-foreground">
                {contact?.facebook_display_name || contact?.line_display_name || contact?.name || contact?.email || 'Unknown'} · {conversation.channel}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleBot} disabled={togglingBot}
            className={cn('gap-1.5 text-xs', checkBotPaused() ? 'border-orange-300 text-orange-600' : 'border-emerald-300 text-emerald-600')}>
            {checkBotPaused() ? <BotOff className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            {checkBotPaused() ? 'Paused' : 'Active'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEscalationAlert} disabled={sendingAlert}
            className="gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50">
            <Bell className="h-3.5 w-3.5" />
            Alert
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Messages Column */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="h-[520px] flex flex-col">
            <CardHeader className="border-b py-2 px-4 flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Thread
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)} className="text-xs h-7">
                {showNotes ? "Hide Notes" : "Show Notes"}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredMessages?.map((msg: any) => (
                <div key={msg.id} className={cn("flex gap-2.5", msg.sender_type !== "customer" && "flex-row-reverse")}>
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {msg.is_internal_note ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> :
                     (msg.metadata as any)?.source === 'voice' ? <span className="text-xs">🎤</span> :
                     <User className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className={cn("max-w-[75%] rounded-lg p-2.5 text-sm",
                    msg.is_internal_note ? "bg-yellow-500/10 border border-yellow-500/30" :
                    msg.sender_type === "agent" ? "bg-orange-500 text-white" :
                    msg.sender_type === "bot" ? "bg-blue-50 text-foreground border border-blue-100" :
                    "bg-white text-foreground border border-border"
                  )}>
                    {msg.is_internal_note && <div className="text-[10px] text-yellow-600 mb-0.5 font-medium">Internal Note</div>}
                    {msg.sender_type === 'bot' && !msg.is_internal_note && (
                      <div className="text-[10px] text-muted-foreground mb-0.5 font-medium">
                        {(msg.metadata as any)?.source === 'voice' ? '🎤 Voice Bot' : '🤖 AI'}
                      </div>
                    )}
                    {msg.content && !/^\[(?:attachment|sticker|image|video|audio|file)\]$/i.test(msg.content) && (
                      <p className="whitespace-pre-wrap text-[13px]">{linkifyText(msg.content)}</p>
                    )}
                    {msg.attachments && (msg.attachments as Attachment[]).length > 0 && (
                      <ChatAttachments attachments={msg.attachments as Attachment[]} storageBucket="ticket-attachments" className="mt-1" />
                    )}
                    <p className={cn("text-[10px] mt-1", msg.sender_type === "agent" && !msg.is_internal_note ? "text-white/70" : "text-muted-foreground")}>
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
              {(!filteredMessages || filteredMessages.length === 0) && <p className="text-center text-muted-foreground py-4 text-sm">No messages</p>}
            </CardContent>
          </Card>

          {/* Reply */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant={isInternal ? "default" : "outline"} size="sm" onClick={() => setIsInternal(!isInternal)} className="h-7 text-xs">
                  <Lock className="h-3 w-3 mr-1" /> Note
                </Button>
                {conversation?.channel === 'facebook' && !isInternal && (
                  <Select value={facebookMessageTag || 'standard'} onValueChange={(v) => setFacebookMessageTag(v === 'standard' ? '' : v)}>
                    <SelectTrigger className="w-[160px] h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard" className="text-xs">Standard (24h)</SelectItem>
                      <SelectItem value="HUMAN_AGENT" className="text-xs">Human Agent</SelectItem>
                      <SelectItem value="POST_PURCHASE_UPDATE" className="text-xs">Order Update</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Textarea placeholder={isInternal ? "Internal note..." : "Reply..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={2} className="text-sm" />
              <div className="flex justify-end">
                <Button onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending} size="sm" className="h-8">
                  <Send className="h-3.5 w-3.5 mr-1" /> {isInternal ? "Add Note" : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar with Tabs */}
        <div className="space-y-3">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
            <TabsList className="w-full grid grid-cols-3 h-8">
              <TabsTrigger value="context" className="text-xs">Context</TabsTrigger>
              <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
            </TabsList>

            {/* Context Tab */}
            <TabsContent value="context" className="space-y-3 mt-3">
              {/* Customer Profile */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Customer Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {contact?.facebook_picture_url && (
                    <img src={contact.facebook_picture_url} alt="" className="h-12 w-12 rounded-full object-cover mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Name</p><p className="font-medium">{contact?.facebook_display_name || contact?.line_display_name || contact?.name || '—'}</p></div>
                    <div><p className="text-muted-foreground">Email</p><p className="font-medium truncate">{contact?.email || '—'}</p></div>
                    <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{contact?.phone || contact?.whatsapp_phone || '—'}</p></div>
                    <div><p className="text-muted-foreground">Channel</p><Badge variant="outline" className="text-[10px]">{conversation.channel}</Badge></div>
                  </div>
                  {contact?.facebook_id && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">PSID:</span>
                      <code className="font-mono text-[10px]">{contact.facebook_id}</code>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => { navigator.clipboard.writeText(contact.facebook_id); toast({ title: "Copied" }); }}>
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Controls */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold">Controls</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Status</p>
                    <Select value={conversation.status} onValueChange={(v) => updateConversation.mutate({ status: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Priority</p>
                    <Select value={conversation.priority} onValueChange={(v) => updateConversation.mutate({ priority: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Assigned To</p>
                    <Select value={conversation.assigned_to || "unassigned"} onValueChange={(v) => updateConversation.mutate({ assigned_to: v === "unassigned" ? null : v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {agents?.map((a) => (
                          <SelectItem key={a.user_id} value={a.user_id}>
                            {a.profile?.first_name ? `${a.profile.first_name} ${a.profile.last_name || ""}` : a.profile?.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>

              {/* Support History */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Support History ({supportHistory?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {supportHistory && supportHistory.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {supportHistory.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                          onClick={() => navigate(`/admin/contact-center/conversations/${h.id}`)}>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{h.subject || "No subject"}</p>
                            <p className="text-muted-foreground">{h.channel} · {format(new Date(h.created_at), "MMM d")}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] ml-1 flex-shrink-0">{h.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No previous conversations</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-3 mt-3">
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" /> Customer Orders ({customerOrders?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {customerOrders && customerOrders.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customerOrders.map((order: any) => (
                        <div key={order.id} className="p-2 rounded-lg border bg-muted/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{order.esim_packages?.name || order.esim_packages?.country_name}</span>
                            <Badge variant="outline" className="text-[9px]">{order.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                            <span><Globe className="h-3 w-3 inline mr-0.5" />{order.esim_packages?.country_name}</span>
                            <span><Package className="h-3 w-3 inline mr-0.5" />{order.esim_packages?.data_amount}</span>
                            <span>{order.esim_packages?.validity_days}d validity</span>
                            <span>${order.total_amount?.toFixed(2)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {order.esim_packages?.carrier && <span>Carrier: {order.esim_packages.carrier} · </span>}
                            {order.provider && <span>Supplier: {order.provider}</span>}
                          </div>
                          <p className="text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</p>
                          {order.qr_code && (
                            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200">eSIM Active</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No orders found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality" className="space-y-3 mt-3">
              <AIScoreCard conversationId={conversationId!} />
              <AIReasoningPanel conversationId={conversationId!} />

              {/* Customer Rating */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold">Customer Rating</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {conversationRating ? (
                    <ConversationRatingDisplay rating={conversationRating.rating} feedbackText={conversationRating.feedback_text} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No rating yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Dead Air Events */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Dead Air ({deadAirEvents?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {deadAirEvents && deadAirEvents.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {deadAirEvents.map((e: any) => (
                        <div key={e.id} className="text-[11px] p-1.5 rounded bg-red-50 border border-red-100">
                          <p className="font-medium text-red-700">{e.silence_duration_seconds}s silence</p>
                          <p className="text-muted-foreground truncate">{e.bot_message_content?.slice(0, 80)}</p>
                          <p className="text-muted-foreground">{format(new Date(e.created_at), "MMM d, h:mm a")}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No dead air events</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
