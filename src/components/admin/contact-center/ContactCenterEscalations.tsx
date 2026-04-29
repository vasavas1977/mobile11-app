import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ExternalLink, Bell, Clock, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export function ContactCenterEscalations() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("open");

  // Fetch escalated conversations (high/urgent priority, open/pending, or assigned_to != null with high priority)
  const { data: escalations, isLoading } = useQuery({
    queryKey: ["admin-escalations", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("conversations")
        .select(`
          *,
          contact:contacts(name, email, phone, facebook_display_name, facebook_picture_url, line_display_name, whatsapp_phone)
        `)
        .in("priority", ["urgent", "high"])
        .order("updated_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent autonomous actions needing approval
  const { data: pendingActions } = useQuery({
    queryKey: ["pending-escalation-actions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("autonomous_actions_log")
        .select("*")
        .eq("approval_status", "pending_approval")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: agents } = useQuery({
    queryKey: ["admin-agents-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, email, first_name, last_name");
      return data || [];
    },
  });

  const getAgentName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const agent = agents?.find((a: any) => a.user_id === userId);
    if (!agent) return "Unknown";
    return agent.first_name ? `${agent.first_name} ${agent.last_name || ""}`.trim() : agent.email;
  };

  const getContactName = (conv: any) => {
    const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact;
    return contact?.facebook_display_name || contact?.line_display_name || contact?.name || contact?.email || contact?.whatsapp_phone || "Unknown";
  };

  const urgentCount = escalations?.filter((e: any) => e.priority === "urgent").length || 0;
  const unassignedCount = escalations?.filter((e: any) => !e.assigned_to).length || 0;

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Escalated</p>
              <p className="text-2xl font-bold text-red-700">{escalations?.length || 0}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Urgent</p>
              <p className="text-2xl font-bold text-orange-700">{urgentCount}</p>
            </div>
            <Bell className="h-5 w-5 text-orange-400" />
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Unassigned</p>
              <p className="text-2xl font-bold text-amber-700">{unassignedCount}</p>
            </div>
            <User className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>
      </div>

      {/* Pending AI Actions */}
      {pendingActions && pendingActions.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-500" />
              Pending AI Actions ({pendingActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {pendingActions.slice(0, 5).map((action: any) => (
                <div key={action.id} className="flex items-center justify-between p-2 rounded bg-purple-50 text-xs">
                  <div>
                    <p className="font-medium">{action.action_type?.replace(/_/g, " ")}</p>
                    <p className="text-muted-foreground">{action.action_summary?.slice(0, 60)}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{action.action_status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escalated Conversations Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Escalated Conversations
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Assigned</TableHead>
                  <TableHead className="text-xs">Escalated</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalations?.map((conv: any) => (
                  <TableRow key={conv.id} className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate(`/admin/contact-center/conversations/${conv.id}`)}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{getContactName(conv)}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{conv.subject || "No subject"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{conv.channel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={conv.priority === "urgent" ? "destructive" : "default"} className="text-[10px]">
                        {conv.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{conv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{getAgentName(conv.assigned_to)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!escalations || escalations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      No escalated conversations
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
