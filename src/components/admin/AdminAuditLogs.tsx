import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollText, Search, Filter, Clock, Eye } from "lucide-react";
import { format, subDays } from "date-fns";

const ACTION_TYPES = [
  "create", "update", "delete", "approve", "reject",
  "login", "export", "import", "assign", "revoke",
];

const ENTITY_TYPES = [
  "order", "package", "user", "role", "promo_code",
  "affiliate", "partner", "conversation", "kb_article",
  "refund", "wallet", "settlement", "setting",
];

type AuditLog = {
  id: string;
  admin_user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  old_value: any;
  new_value: any;
  metadata: any;
  created_at: string;
};

export function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("30");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", search, actionFilter, entityFilter, periodFilter],
    queryFn: async () => {
      const since = subDays(new Date(), parseInt(periodFilter)).toISOString();

      let query = supabase
        .from("admin_activity_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);

      if (actionFilter !== "all") query = query.eq("action_type", actionFilter);
      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
      if (search) query = query.or(`description.ilike.%${search}%,entity_id.ilike.%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Fetch profiles for admin names
  const { data: profiles } = useQuery({
    queryKey: ["audit-profiles", data],
    enabled: !!data?.length,
    queryFn: async () => {
      const ids = [...new Set(data?.map(d => d.admin_user_id) || [])];
      if (!ids.length) return [];
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name")
        .in("user_id", ids);
      return p || [];
    },
  });

  const getAdminName = (userId: string) => {
    const p = profiles?.find(pr => pr.user_id === userId);
    if (!p) return userId.slice(0, 8) + "...";
    return `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || userId.slice(0, 8);
  };

  const getActionBadge = (type: string) => {
    const colors: Record<string, string> = {
      create: "bg-emerald-50 text-emerald-700 border-emerald-200",
      update: "bg-blue-50 text-blue-700 border-blue-200",
      delete: "bg-red-50 text-red-700 border-red-200",
      approve: "bg-green-50 text-green-700 border-green-200",
      reject: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return <Badge className={`text-[10px] border ${colors[type] || "bg-muted text-muted-foreground"}`}>{type}</Badge>;
  };

  const totalByAction = data?.reduce((acc, log) => {
    acc[log.action_type] = (acc[log.action_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
          <ScrollText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Audit Logs</h2>
          <p className="text-xs text-muted-foreground">Admin activity history and security event trail</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{data?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        {["create", "update", "delete"].map(type => (
          <Card key={type} className="border-border/60">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{totalByAction[type] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{type}s</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search description or entity ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[130px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTION_TYPES.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_TYPES.map(e => <SelectItem key={e} value={e} className="capitalize">{e.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[130px]"><Clock className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24h</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No audit logs found for this period.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="w-[90px]">Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="max-w-[300px]">Description</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {format(new Date(log.created_at), "MMM dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{getAdminName(log.admin_user_id)}</TableCell>
                    <TableCell>{getActionBadge(log.action_type)}</TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="text-[10px] capitalize">{log.entity_type.replace(/_/g, " ")}</Badge>
                        {log.entity_id && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{log.entity_id.slice(0, 12)}...</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {log.description}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Audit Log Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Timestamp", value: format(new Date(selectedLog.created_at), "MMM dd, yyyy HH:mm:ss") },
                  { label: "Admin", value: getAdminName(selectedLog.admin_user_id) },
                  { label: "Action", value: selectedLog.action_type },
                  { label: "Entity Type", value: selectedLog.entity_type.replace(/_/g, " ") },
                  { label: "Entity ID", value: selectedLog.entity_id || "—" },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-muted-foreground font-medium">{f.label}</p>
                    <p className="text-sm font-medium mt-0.5 capitalize">{f.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedLog.description}</p>
              </div>

              {selectedLog.old_value && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Before</p>
                  <pre className="text-xs bg-red-50 text-red-800 rounded-lg p-3 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">After</p>
                  <pre className="text-xs bg-emerald-50 text-emerald-800 rounded-lg p-3 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Metadata</p>
                  <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
