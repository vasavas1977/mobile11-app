import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { TicketStats } from "./tickets/TicketStats";
import { TicketFilters } from "./tickets/TicketFilters";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  user_id: string | null;
  email: string;
  name: string;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

export const AdminTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAdmins();
    fetchTickets();
    subscribeToTickets();
  }, []);

  const fetchAdmins = async () => {
    try {
      // First get admin user IDs
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      const adminUserIds = adminRoles?.map(r => r.user_id) || [];

      if (adminUserIds.length === 0) {
        setAdmins([]);
        return;
      }

      // Then get profiles for those users
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", adminUserIds);

      if (error) throw error;

      setAdmins(
        (data || []).map((admin: any) => ({
          id: admin.user_id,
          name: `${admin.first_name} ${admin.last_name}`.trim(),
          email: admin.email,
        }))
      );
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTickets = () => {
    const channel = supabase
      .channel("admin-tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    
    if (assignedFilter !== "all") {
      if (assignedFilter === "unassigned" && ticket.assigned_to !== null) return false;
      if (assignedFilter === "mine" && ticket.assigned_to !== user?.id) return false;
      if (assignedFilter !== "unassigned" && assignedFilter !== "mine" && ticket.assigned_to !== assignedFilter) return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.email.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const stats = {
    totalOpen: tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length,
    unassigned: tickets.filter((t) => t.assigned_to === null).length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
    myTickets: tickets.filter((t) => t.assigned_to === user?.id).length,
  };

  const getAssignedAdminName = (assignedTo: string | null) => {
    if (!assignedTo) return "Unassigned";
    const admin = admins.find((a) => a.id === assignedTo);
    return admin ? admin.name : "Unknown";
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignedFilter("all");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage and respond to customer support tickets</p>
      </div>

      <TicketStats {...stats} />

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TicketFilters
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            assignedFilter={assignedFilter}
            searchQuery={searchQuery}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onAssignedChange={setAssignedFilter}
            onSearchChange={setSearchQuery}
            onClearFilters={handleClearFilters}
            admins={admins}
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.name}</div>
                          <div className="text-sm text-muted-foreground">{ticket.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <TicketPriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell className="capitalize">{ticket.category}</TableCell>
                      <TableCell>{getAssignedAdminName(ticket.assigned_to)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.updated_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        </CardContent>
      </Card>
    </div>
  );
};