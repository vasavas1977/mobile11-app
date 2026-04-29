import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Zap, Clock, Search, RefreshCw, Users, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Ban, HelpCircle, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const RESULT_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  enrolled: { variant: "default", icon: CheckCircle2 },
  suppressed: { variant: "destructive", icon: Ban },
  consent_denied: { variant: "destructive", icon: ShieldCheck },
  already_enrolled: { variant: "secondary", icon: Users },
  no_matching_journey: { variant: "outline", icon: HelpCircle },
  trigger_disabled: { variant: "outline", icon: XCircle },
  journey_inactive: { variant: "outline", icon: XCircle },
  invalid_context: { variant: "outline", icon: AlertTriangle },
  error: { variant: "destructive", icon: AlertTriangle },
};

const MODE_BADGES: Record<string, { label: string; icon: any }> = {
  realtime: { label: "Realtime", icon: Zap },
  scheduled: { label: "Scheduled", icon: Clock },
  both: { label: "Both", icon: Activity },
};

export function ContactCenterTriggerEngine() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("catalog");

  // Fetch trigger catalog
  const { data: triggers = [], isLoading: loadingTriggers } = useQuery({
    queryKey: ["trigger-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trigger_catalog")
        .select("*")
        .order("trigger_key");
      if (error) throw error;
      return data;
    },
  });

  // Fetch evaluation logs
  const { data: evalLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["trigger-eval-logs", resultFilter],
    queryFn: async () => {
      let query = supabase
        .from("trigger_evaluation_logs")
        .select("*")
        .order("evaluated_at", { ascending: false })
        .limit(200);
      if (resultFilter !== "all") {
        query = query.eq("evaluation_result", resultFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch active enrollments
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["journey-enrollments-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_enrollments")
        .select("*, outbound_journeys(journey_name)")
        .eq("status", "active")
        .order("enrolled_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Toggle trigger enabled
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("trigger_catalog")
        .update({ is_enabled: enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trigger-catalog"] });
      toast.success("Trigger updated");
    },
  });

  const filteredTriggers = triggers.filter(
    (t: any) =>
      t.trigger_key.toLowerCase().includes(search.toLowerCase()) ||
      t.display_name.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const enrolledCount = evalLogs.filter((l: any) => l.evaluation_result === "enrolled").length;
  const suppressedCount = evalLogs.filter((l: any) => ["suppressed", "consent_denied"].includes(l.evaluation_result)).length;
  const totalCount = evalLogs.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Trigger Engine</h2>
        <p className="text-sm text-muted-foreground">
          Manage triggers that automatically enroll customers into outbound journeys
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Triggers</p>
            <p className="text-2xl font-bold text-foreground">
              {triggers.filter((t: any) => t.is_enabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Enrollments</p>
            <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Recent Enrolled</p>
            <p className="text-2xl font-bold text-primary">{enrolledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Recent Suppressed</p>
            <p className="text-2xl font-bold text-destructive">{suppressedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Trigger Catalog</TabsTrigger>
          <TabsTrigger value="logs">Evaluation Logs</TabsTrigger>
          <TabsTrigger value="enrollments">Active Enrollments</TabsTrigger>
        </TabsList>

        {/* CATALOG TAB */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search triggers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            {loadingTriggers ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : filteredTriggers.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No triggers found</CardContent></Card>
            ) : (
              filteredTriggers.map((trigger: any) => {
                const modeInfo = MODE_BADGES[trigger.evaluation_mode] || MODE_BADGES.realtime;
                const ModeIcon = modeInfo.icon;
                return (
                  <Card key={trigger.id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">{trigger.display_name}</span>
                          <Badge variant="outline" className="text-xs gap-1">
                            <ModeIcon className="h-3 w-3" />
                            {modeInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{trigger.description}</p>
                        <code className="text-[11px] text-muted-foreground/70 font-mono">{trigger.trigger_key}</code>
                      </div>
                      <Switch
                        checked={trigger.is_enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: trigger.id, enabled: checked })
                        }
                      />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* LOGS TAB */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="consent_denied">Consent Denied</SelectItem>
                <SelectItem value="already_enrolled">Already Enrolled</SelectItem>
                <SelectItem value="no_matching_journey">No Matching Journey</SelectItem>
                <SelectItem value="trigger_disabled">Trigger Disabled</SelectItem>
                <SelectItem value="journey_inactive">Journey Inactive</SelectItem>
                <SelectItem value="invalid_context">Invalid Context</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["trigger-eval-logs"] })}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="hidden lg:table-cell">Customer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : evalLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No evaluation logs yet</TableCell>
                  </TableRow>
                ) : (
                  evalLogs.map((log: any) => {
                    const badge = RESULT_BADGES[log.evaluation_result] || RESULT_BADGES.error;
                    const BadgeIcon = badge.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.evaluated_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono">{log.trigger_key}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="text-xs gap-1">
                            <BadgeIcon className="h-3 w-3" />
                            {log.evaluation_result}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {log.suppression_reason || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <code className="text-[11px] text-muted-foreground font-mono">
                            {log.customer_profile_id?.slice(0, 8)}...
                          </code>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ENROLLMENTS TAB */}
        <TabsContent value="enrollments" className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Journey</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEnrollments ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No active enrollments</TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-sm">
                        {(e as any).outbound_journeys?.journey_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Step {e.current_step_order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono">{e.enrollment_trigger_key}</code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(e.enrolled_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-[11px] text-muted-foreground font-mono">
                          {e.customer_profile_id?.slice(0, 8)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
