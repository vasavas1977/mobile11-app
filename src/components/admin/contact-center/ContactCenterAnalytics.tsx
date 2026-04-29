import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle, Users, TrendingUp, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6"];

export function ContactCenterAnalytics() {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["contact-center-analytics"],
    queryFn: async () => {
      const today = new Date();
      const last7Days = subDays(today, 7);
      const last30Days = subDays(today, 30);

      // Get conversations from last 30 days
      const { data: conversations } = await supabase
        .from("conversations")
        .select("created_at, resolved_at, first_response_at, status, channel, priority")
        .gte("created_at", last30Days.toISOString());

      // Get agent metrics from last 7 days
      const { data: agentMetrics } = await supabase
        .from("agent_metrics_daily")
        .select("*")
        .gte("date", format(last7Days, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      // Calculate daily volume for last 7 days
      const dailyVolume = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const count = conversations?.filter((c) => {
          const created = new Date(c.created_at);
          return created >= dayStart && created <= dayEnd;
        }).length || 0;

        dailyVolume.push({
          date: format(date, "EEE"),
          conversations: count,
        });
      }

      // Channel distribution
      const channelData = [
        { name: "Web", value: conversations?.filter((c) => c.channel === "web").length || 0 },
        { name: "Email", value: conversations?.filter((c) => c.channel === "email").length || 0 },
        { name: "LINE", value: conversations?.filter((c) => c.channel === "line").length || 0 },
      ].filter((c) => c.value > 0);

      // Priority distribution
      const priorityData = [
        { name: "Low", value: conversations?.filter((c) => c.priority === "low").length || 0 },
        { name: "Medium", value: conversations?.filter((c) => c.priority === "medium").length || 0 },
        { name: "High", value: conversations?.filter((c) => c.priority === "high").length || 0 },
        { name: "Urgent", value: conversations?.filter((c) => c.priority === "urgent").length || 0 },
      ].filter((c) => c.value > 0);

      // Calculate average metrics
      const resolvedConvs = conversations?.filter((c) => c.resolved_at && c.first_response_at) || [];
      const avgResponseTime = resolvedConvs.length > 0
        ? resolvedConvs.reduce((sum, c) => {
            const diff = new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime();
            return sum + diff;
          }, 0) / resolvedConvs.length / 60000 // Convert to minutes
        : 0;

      const avgResolutionTime = resolvedConvs.length > 0
        ? resolvedConvs.reduce((sum, c) => {
            const diff = new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime();
            return sum + diff;
          }, 0) / resolvedConvs.length / 3600000 // Convert to hours
        : 0;

      const resolutionRate = conversations?.length 
        ? (conversations.filter((c) => c.status === "resolved").length / conversations.length) * 100
        : 0;

      return {
        dailyVolume,
        channelData,
        priorityData,
        totalConversations: conversations?.length || 0,
        resolvedCount: conversations?.filter((c) => c.status === "resolved").length || 0,
        avgResponseTime: avgResponseTime.toFixed(1),
        avgResolutionTime: avgResolutionTime.toFixed(1),
        resolutionRate: resolutionRate.toFixed(1),
      };
    },
  });

  const statCards = [
    { 
      title: "Total Conversations (30d)", 
      value: analytics?.totalConversations || 0, 
      icon: MessageSquare,
    },
    { 
      title: "Resolved", 
      value: analytics?.resolvedCount || 0, 
      icon: CheckCircle,
    },
    { 
      title: "Avg Response Time", 
      value: `${analytics?.avgResponseTime || 0} min`, 
      icon: Clock,
    },
    { 
      title: "Resolution Rate", 
      value: `${analytics?.resolutionRate || 0}%`, 
      icon: TrendingUp,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

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
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Conversation Volume (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.dailyVolume || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="conversations" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics?.channelData && analytics.channelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {analytics.channelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {analytics?.priorityData && analytics.priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
