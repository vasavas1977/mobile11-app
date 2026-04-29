import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Circle, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ContactCenterAgents() {
  // Fetch agent statuses with profiles
  const { data: agents, isLoading } = useQuery({
    queryKey: ["admin-agents-status"],
    queryFn: async () => {
      const { data: agentStatuses } = await supabase
        .from("agent_status")
        .select("*")
        .order("last_activity_at", { ascending: false });

      if (!agentStatuses) return [];

      // Get profiles for agents
      const userIds = agentStatuses.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name")
        .in("user_id", userIds);

      // Get today's metrics
      const today = new Date().toISOString().split("T")[0];
      const { data: metrics } = await supabase
        .from("agent_metrics_daily")
        .select("*")
        .eq("date", today)
        .in("agent_id", userIds);

      return agentStatuses.map((agent) => {
        const profile = profiles?.find((p) => p.user_id === agent.user_id);
        const metric = metrics?.find((m) => m.agent_id === agent.user_id);
        return {
          ...agent,
          profile,
          todayMetrics: metric,
        };
      });
    },
    refetchInterval: 30000,
  });

  // Summary stats
  const stats = {
    online: agents?.filter((a) => a.status === "online").length || 0,
    busy: agents?.filter((a) => a.status === "busy").length || 0,
    offline: agents?.filter((a) => a.status === "offline").length || 0,
    totalConversations: agents?.reduce((sum, a) => sum + (a.active_conversations || 0), 0) || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-yellow-500";
      case "offline": return "bg-muted";
      default: return "bg-muted";
    }
  };

  const getAgentName = (agent: any) => {
    if (!agent.profile) return "Unknown Agent";
    return agent.profile.first_name 
      ? `${agent.profile.first_name} ${agent.profile.last_name || ""}`.trim()
      : agent.profile.email;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="h-4 w-4 fill-green-500 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.online}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.busy}</p>
                <p className="text-sm text-muted-foreground">Busy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="h-4 w-4 fill-muted text-muted" />
              <div>
                <p className="text-2xl font-bold">{stats.offline}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
                <p className="text-sm text-muted-foreground">Active Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading agents...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Chats</TableHead>
                    <TableHead>Max Capacity</TableHead>
                    <TableHead>Today's Handled</TableHead>
                    <TableHead>Today's Resolved</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents?.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getAgentName(agent)}</p>
                          <p className="text-xs text-muted-foreground">{agent.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          {agent.active_conversations}
                        </div>
                      </TableCell>
                      <TableCell>{agent.max_conversations}</TableCell>
                      <TableCell>{agent.todayMetrics?.conversations_handled || 0}</TableCell>
                      <TableCell>{agent.todayMetrics?.conversations_resolved || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {agent.last_activity_at 
                          ? formatDistanceToNow(new Date(agent.last_activity_at), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!agents || agents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No agents found
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
