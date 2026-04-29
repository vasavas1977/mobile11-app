import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_PREFERENCES, SAMPLE_NBA_DECISIONS } from "./outboundSampleData";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { MetricCard } from "./shared/MetricCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ShieldCheck, UserX, Clock, AlertTriangle, FileText } from "lucide-react";

export function ContactCenterSuppressionConsent() {
  const { isSampleMode } = usePartnerDataMode();
  const [activeTab, setActiveTab] = useState("preferences");

  const { data: livePreferences, isLoading: loadingPrefsLive } = useQuery({
    queryKey: ["consent-preferences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_preferences")
        .select("*, customer_profiles!customer_preferences_customer_profile_id_fkey(id, full_name, primary_email)")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !isSampleMode,
  });

  const { data: liveSuppressions, isLoading: loadingSupLive } = useQuery({
    queryKey: ["suppression-decisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_next_best_actions")
        .select("*, customer_profiles!outbound_next_best_actions_customer_profile_id_fkey(id, full_name, primary_email)")
        .in("recommended_action", ["suppress_annoyance", "stop_messaging"])
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !isSampleMode,
  });

  const preferences = isSampleMode ? SAMPLE_PREFERENCES : livePreferences;
  const loadingPrefs = isSampleMode ? false : loadingPrefsLive;
  const suppressions = isSampleMode
    ? SAMPLE_NBA_DECISIONS.filter(d => ["suppress_annoyance", "stop_messaging"].includes(d.recommended_action))
    : liveSuppressions;
  const loadingSup = isSampleMode ? false : loadingSupLive;

  const totalOptedOut = preferences?.filter((p: any) => p.sales_followup_opt_out || p.news_promo_opt_out).length || 0;
  const totalSuppressed = suppressions?.length || 0;
  const totalActive = (preferences?.length || 0) - totalOptedOut;

  return (
    <div>
      <AdminPageHeader title="Suppression & Consent" description="Opt-out management, frequency controls, and AI suppression decisions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Active Consent" value={totalActive} icon={ShieldCheck} variant="success" />
        <MetricCard label="Opted Out" value={totalOptedOut} icon={UserX} variant="danger" />
        <MetricCard label="AI Suppressed" value={totalSuppressed} icon={AlertTriangle} variant="warning" />
        <MetricCard label="Frequency Capped" value="—" icon={Clock} variant="info" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preferences">Preferences & Opt-outs</TabsTrigger>
          <TabsTrigger value="frequency">Frequency & Limits</TabsTrigger>
          <TabsTrigger value="suppression">Suppression Decisions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Preferences & Opt-outs */}
        <TabsContent value="preferences">
          {loadingPrefs ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : !preferences?.length ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No customer preferences recorded</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px]">Customer</TableHead>
                    <TableHead className="text-[11px]">Sales Follow-up</TableHead>
                    <TableHead className="text-[11px]">News & Promos</TableHead>
                    <TableHead className="text-[11px]">Preferred Channel</TableHead>
                    <TableHead className="text-[11px]">Language</TableHead>
                    <TableHead className="text-[11px]">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferences.map((pref: any) => {
                    const customer = pref.customer_profiles;
                    return (
                      <TableRow key={pref.id}>
                        <TableCell className="py-2.5">
                          {customer ? (
                            <Link
                              to={`/admin/contact-center/outbound-customers/${customer.id}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {customer.full_name || customer.primary_email || customer.id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">{pref.customer_profile_id?.slice(0, 8)}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5">
                          {pref.sales_followup_opt_out ? (
                            <AdminStatusBadge status="opted_out" type="error" showIcon={false} />
                          ) : (
                            <AdminStatusBadge status="allowed" type="success" showIcon={false} />
                          )}
                        </TableCell>
                        <TableCell className="py-2.5">
                          {pref.news_promo_opt_out ? (
                            <AdminStatusBadge status="opted_out" type="error" showIcon={false} />
                          ) : (
                            <AdminStatusBadge status="allowed" type="success" showIcon={false} />
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                          {pref.preferred_channel || "—"}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                          {pref.preferred_language || "—"}
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px] text-muted-foreground tabular-nums">
                          {new Date(pref.updated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Frequency & Limits */}
        <TabsContent value="frequency">
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Frequency Cap Management</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                Frequency cap configuration and violation monitoring will be displayed here. Caps are enforced by the outbound scheduler based on customer preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppression Decisions */}
        <TabsContent value="suppression">
          {loadingSup ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : !suppressions?.length ? (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No active suppression decisions</p>
                <p className="text-xs text-muted-foreground/70 mt-1">AI suppression recommendations will appear here when the NBA engine flags customers at risk of annoyance.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px]">Customer</TableHead>
                    <TableHead className="text-[11px]">Action</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Confidence</TableHead>
                    <TableHead className="text-[11px]">Reason</TableHead>
                    <TableHead className="text-[11px]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppressions.map((s: any) => {
                    const customer = s.customer_profiles;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="py-2.5">
                          {customer ? (
                            <Link
                              to={`/admin/contact-center/outbound-customers/${customer.id}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {customer.full_name || customer.primary_email || customer.id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <AdminStatusBadge
                            status={s.recommended_action}
                            type="warning"
                            label={s.recommended_action?.replace(/_/g, " ")}
                            showIcon={false}
                          />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <AdminStatusBadge status={s.status} showIcon={false} />
                        </TableCell>
                        <TableCell className="py-2.5 text-xs tabular-nums">{s.confidence_score}%</TableCell>
                        <TableCell className="py-2.5 text-[11px] text-muted-foreground max-w-[200px] truncate">
                          {s.explanation || "—"}
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px] text-muted-foreground tabular-nums">
                          {new Date(s.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Consent Audit Log</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                A chronological record of all consent changes, opt-in/out events, and preference updates will be logged here for compliance and traceability.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
