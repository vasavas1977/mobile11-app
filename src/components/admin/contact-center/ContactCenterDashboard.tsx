import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle, Users, AlertCircle, Mail, Globe, MessageCircle, Facebook, Phone, Instagram, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_DASHBOARD_STATS, SAMPLE_RECENT_CONVERSATIONS } from "./inboundSampleData";

export function ContactCenterDashboard() {
  const navigate = useNavigate();
  const { isSampleMode } = usePartnerDataMode();

  // Fetch conversation stats
  const { data: liveStats } = useQuery({
    queryKey: ["contact-center-stats"],
    queryFn: async () => {
      const [conversationsResult, agentsResult] = await Promise.all([
        supabase.from("conversations").select("status, channel, priority"),
        supabase.from("agent_status").select("status, active_conversations, user_id"),
      ]);

      const conversations = conversationsResult.data || [];
      const agents = agentsResult.data || [];

      return {
        open: conversations.filter((c) => c.status === "open").length,
        pending: conversations.filter((c) => c.status === "pending").length,
        resolved: conversations.filter((c) => c.status === "resolved").length,
        urgent: conversations.filter((c) => c.priority === "urgent").length,
        channels: {
          web: conversations.filter((c) => c.channel === "web").length,
          email: conversations.filter((c) => c.channel === "email").length,
          line: conversations.filter((c) => c.channel === "line").length,
          facebook: conversations.filter((c) => c.channel === "facebook").length,
          whatsapp: conversations.filter((c) => c.channel === "whatsapp").length,
          instagram: conversations.filter((c) => c.channel === "instagram").length,
          voice: conversations.filter((c) => c.channel === "voice").length,
        },
        onlineAgents: agents.filter((a) => a.status === "online").length,
        busyAgents: agents.filter((a) => a.status === "busy").length,
        totalAgents: agents.length,
      };
    },
    refetchInterval: 30000,
    enabled: !isSampleMode,
  });

  const stats = isSampleMode ? SAMPLE_DASHBOARD_STATS : liveStats;

  const { data: liveRecentConversations } = useQuery({
    queryKey: ["recent-conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select(`
          *,
          contact:contacts(name, email, facebook_display_name, facebook_picture_url, facebook_id),
          messages:conversation_messages(content, created_at)
        `)
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !isSampleMode,
  });

  const recentConversations = isSampleMode ? SAMPLE_RECENT_CONVERSATIONS : liveRecentConversations;

  const statCards = [
    { title: "Open", value: stats?.open || 0, icon: MessageSquare, color: "text-blue-500" },
    { title: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-yellow-500" },
    { title: "Resolved", value: stats?.resolved || 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Urgent", value: stats?.urgent || 0, icon: AlertCircle, color: "text-destructive" },
  ];

  const channelCards = [
    { title: "Web Chat", value: stats?.channels?.web || 0, icon: Globe },
    { title: "Email", value: stats?.channels?.email || 0, icon: Mail },
    { title: "LINE", value: stats?.channels?.line || 0, icon: MessageCircle },
    { title: "Facebook", value: stats?.channels?.facebook || 0, icon: Facebook },
    { title: "WhatsApp", value: stats?.channels?.whatsapp || 0, icon: Phone },
    { title: "Instagram", value: stats?.channels?.instagram || 0, icon: Instagram },
    { title: "Voice", value: stats?.channels?.voice || 0, icon: Phone },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Agent Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Online</span>
                <Badge variant="default" className="bg-green-500">
                  {stats?.onlineAgents || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Busy</span>
                <Badge variant="secondary">
                  {stats?.busyAgents || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Agents</span>
                <Badge variant="outline">
                  {stats?.totalAgents || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card>
          <CardHeader>
            <CardTitle>By Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelCards.map((channel) => (
                <div key={channel.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <channel.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{channel.title}</span>
                  </div>
                  <span className="font-medium">{channel.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentConversations?.map((conv: any) => (
              <div 
                key={conv.id} 
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => navigate(`/admin/contact-center/conversations/${conv.id}`)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {conv.contact?.facebook_picture_url && (
                      <img 
                        src={conv.contact.facebook_picture_url} 
                        alt="" 
                        className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span className="font-medium">
                      {conv.contact?.facebook_display_name ||
                       (conv.contact?.name && !conv.contact.name.startsWith('Facebook User') && !conv.contact.name.startsWith('Messenger Contact') ? conv.contact.name : null) ||
                       (conv.contact?.facebook_id ? `Messenger Contact` : null) ||
                       conv.contact?.email || 'Unknown'}
                    </span>
                    <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                      {conv.status}
                    </Badge>
                    <Badge variant="outline">{conv.channel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {conv.contact?.facebook_id
                      ? `User ID: ${conv.contact.facebook_id}`
                      : conv.subject || conv.messages?.[0]?.content || "No subject"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {(!recentConversations || recentConversations.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No conversations yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
