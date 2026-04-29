import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_CUSTOMERS } from "./outboundSampleData";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { MetricCard } from "./shared/MetricCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, UserX, Crown, Search, Layers } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  visitor: "bg-slate-100 text-slate-700 border-slate-200",
  lead: "bg-blue-50 text-blue-700 border-blue-200",
  trial: "bg-indigo-50 text-indigo-700 border-indigo-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  churned: "bg-red-50 text-red-700 border-red-200",
  dormant: "bg-amber-50 text-amber-700 border-amber-200",
  beginner: "bg-sky-50 text-sky-700 border-sky-200",
  intermediate: "bg-violet-50 text-violet-700 border-violet-200",
  advanced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  new_user: "bg-slate-100 text-slate-700 border-slate-200",
  satisfied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  frustrated: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-amber-50 text-amber-700 border-amber-200",
};

function StageBadge({ stage }: { stage: string | null }) {
  if (!stage) return <span className="text-xs text-muted-foreground">—</span>;
  const colors = STAGE_COLORS[stage] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${colors}`}>
      {stage.replace(/_/g, " ")}
    </span>
  );
}

export function ContactCenterOutboundCustomers() {
  const navigate = useNavigate();
  const { isSampleMode } = usePartnerDataMode();
  const [search, setSearch] = useState("");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [consentFilter, setConsentFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("customers");

  const { data: liveProfiles, isLoading: liveLoading } = useQuery({
    queryKey: ["outbound-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*, customer_stage_state(*), customer_preferences(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !isSampleMode,
  });

  const profiles = isSampleMode ? SAMPLE_CUSTOMERS : liveProfiles;
  const isLoading = isSampleMode ? false : liveLoading;

  const filtered = (profiles || []).filter((p: any) => {
    if (search) {
      const s = search.toLowerCase();
      const name = (p.full_name || p.primary_email || p.id || "").toLowerCase();
      if (!name.includes(s)) return false;
    }
    if (funnelFilter !== "all") {
      const stage = p.customer_stage_state?.[0]?.funnel_stage;
      if (stage !== funnelFilter) return false;
    }
    if (consentFilter === "opted_out") {
      const prefs = p.customer_preferences?.[0];
      if (!prefs?.sales_followup_opt_out) return false;
    }
    if (consentFilter === "opted_in") {
      const prefs = p.customer_preferences?.[0];
      if (prefs?.sales_followup_opt_out) return false;
    }
    return true;
  });

  const totalCustomers = profiles?.length || 0;
  const optedOut = profiles?.filter((p: any) => p.customer_preferences?.[0]?.sales_followup_opt_out).length || 0;

  return (
    <div>
      <AdminPageHeader title="Outbound Customers" description="Customer profiles, lifecycle stages, and outbound readiness" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Customers" value={totalCustomers} icon={Users} />
        <MetricCard label="Active in Journeys" value="—" icon={UserCheck} variant="info" />
        <MetricCard label="Opted Out" value={optedOut} icon={UserX} variant="danger" />
        <MetricCard label="High Value" value="—" icon={Crown} variant="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="segments">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={funnelFilter} onValueChange={setFunnelFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Funnel stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={consentFilter} onValueChange={setConsentFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Consent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All consent</SelectItem>
                <SelectItem value="opted_in">Opted in</SelectItem>
                <SelectItem value="opted_out">Opted out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading customers...</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No customers found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Customer profiles will appear here as they are created.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px]">Customer</TableHead>
                    <TableHead className="text-[11px]">Funnel</TableHead>
                    <TableHead className="text-[11px]">Capability</TableHead>
                    <TableHead className="text-[11px]">Experience</TableHead>
                    <TableHead className="text-[11px]">Consent</TableHead>
                    <TableHead className="text-[11px]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => {
                    const stage = p.customer_stage_state?.[0];
                    const prefs = p.customer_preferences?.[0];
                    const optedOut = prefs?.sales_followup_opt_out;
                    return (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/contact-center/outbound-customers/${p.id}`)}
                      >
                        <TableCell className="py-2.5">
                          <div>
                            <p className="text-xs font-medium">{p.full_name || "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground">{p.primary_email || p.id.slice(0, 8)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5"><StageBadge stage={stage?.funnel_stage} /></TableCell>
                        <TableCell className="py-2.5"><StageBadge stage={stage?.capability_stage} /></TableCell>
                        <TableCell className="py-2.5"><StageBadge stage={stage?.experience_stage} /></TableCell>
                        <TableCell className="py-2.5">
                          {optedOut ? (
                            <AdminStatusBadge status="opted_out" type="error" label="Opted out" showIcon={false} />
                          ) : (
                            <AdminStatusBadge status="active" type="success" label="Active" showIcon={false} />
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px] text-muted-foreground tabular-nums">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardContent className="py-16 text-center">
              <Layers className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Segment Builder Coming Soon</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                Dynamic and static customer segments will be configurable here. Segments can be used to target campaigns, journeys, and suppression rules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
