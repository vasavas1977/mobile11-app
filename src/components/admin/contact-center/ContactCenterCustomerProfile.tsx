import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Mail, Phone, MessageSquare, Send, ShieldCheck,
  TrendingUp, Clock, Brain, Route as RouteIcon, ChevronRight,
} from "lucide-react";

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

function StageBadge({ stage, label }: { stage: string | null; label: string }) {
  if (!stage) return <span className="text-xs text-muted-foreground">—</span>;
  const colors = STAGE_COLORS[stage] || "bg-muted text-muted-foreground border-border";
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${colors}`}>
        {stage.replace(/_/g, " ")}
      </span>
    </div>
  );
}

const NBA_COLORS: Record<string, string> = {
  send_sales_followup: "bg-blue-50 text-blue-700 border-blue-200",
  send_promotion: "bg-violet-50 text-violet-700 border-violet-200",
  send_educational: "bg-indigo-50 text-indigo-700 border-indigo-200",
  send_recovery: "bg-amber-50 text-amber-700 border-amber-200",
  wait: "bg-slate-100 text-slate-700 border-slate-200",
  switch_channel: "bg-sky-50 text-sky-700 border-sky-200",
  stop_messaging: "bg-red-50 text-red-700 border-red-200",
  suppress_annoyance: "bg-red-50 text-red-700 border-red-200",
  move_to_upsell: "bg-emerald-50 text-emerald-700 border-emerald-200",
  move_to_crosssell: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function ContactCenterCustomerProfile() {
  const { customerId } = useParams<{ customerId: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["customer-profile", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*, customer_stage_state(*), customer_preferences(*)")
        .eq("id", customerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: stageHistory } = useQuery({
    queryKey: ["customer-stage-history", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_stage_history")
        .select("*")
        .eq("customer_profile_id", customerId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  const { data: nbaDecisions } = useQuery({
    queryKey: ["customer-nba", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_next_best_actions")
        .select("*")
        .eq("customer_profile_id", customerId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  const { data: sendLogs } = useQuery({
    queryKey: ["customer-send-logs", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_send_logs")
        .select("*")
        .eq("customer_profile_id", customerId!)
        .order("sent_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Loading customer profile...</div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">Customer not found</p>
        <Link to="/admin/contact-center/outbound-customers">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  const stage = profile.customer_stage_state?.[0];
  const prefs = profile.customer_preferences?.[0];
  const channelBadges: { label: string; icon: typeof Mail }[] = [];
  if (profile.primary_email) channelBadges.push({ label: "Email", icon: Mail });
  if (profile.primary_phone) channelBadges.push({ label: "Phone", icon: Phone });
  if ((profile as any).line_user_id) channelBadges.push({ label: "LINE", icon: MessageSquare });

  const sends30d = sendLogs?.length || 0;
  const delivered = sendLogs?.filter((l: any) => l.delivery_status === "delivered").length || 0;
  const replied = sendLogs?.filter((l: any) => l.reply_status === "replied").length || 0;

  return (
    <div>
      {/* Back link */}
      <Link to="/admin/contact-center/outbound-customers" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> Back to Customers
      </Link>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{profile.full_name || "Unknown Customer"}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.primary_email || profile.id}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {channelBadges.map((ch) => (
                  <Badge key={ch.label} variant="outline" className="text-[10px] px-2 py-0 h-5 gap-1 font-medium">
                    <ch.icon className="h-2.5 w-2.5" /> {ch.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {prefs?.sales_followup_opt_out ? (
                <AdminStatusBadge status="opted_out" type="error" label="Sales opt-out" size="md" />
              ) : (
                <AdminStatusBadge status="consented" type="success" label="Consent active" size="md" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT — Context */}
        <div className="space-y-5">
          {/* Stages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" /> Lifecycle Stages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <StageBadge stage={stage?.funnel_stage} label="Funnel" />
              <StageBadge stage={stage?.capability_stage} label="Capability" />
              <StageBadge stage={stage?.experience_stage} label="Experience" />

              {/* Stage History Timeline */}
              {stageHistory && stageHistory.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Recent Stage Changes</p>
                  <div className="space-y-2">
                    {stageHistory.slice(0, 5).map((h: any) => (
                      <div key={h.id} className="flex items-center gap-2 text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                        <span className="text-muted-foreground capitalize">{h.stage_dimension}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{h.new_stage?.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground ml-auto tabular-nums">
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consent & Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Consent & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prefs ? (
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sales follow-up</span>
                    {prefs.sales_followup_opt_out ? (
                      <AdminStatusBadge status="opted_out" type="error" showIcon={false} />
                    ) : (
                      <AdminStatusBadge status="allowed" type="success" showIcon={false} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">News & promos</span>
                    {prefs.news_promo_opt_out ? (
                      <AdminStatusBadge status="opted_out" type="error" showIcon={false} />
                    ) : (
                      <AdminStatusBadge status="allowed" type="success" showIcon={false} />
                    )}
                  </div>
                  {prefs.preferred_channel && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Preferred channel</span>
                      <span className="font-medium">{prefs.preferred_channel}</span>
                    </div>
                  )}
                  {prefs.preferred_language && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Preferred language</span>
                      <span className="font-medium">{prefs.preferred_language}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No preferences recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Outbound */}
        <div className="space-y-5">
          {/* Outbound Performance Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" /> Outbound Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Sends (30d)</p>
                  <p className="text-lg font-bold mt-0.5 tabular-nums">{sends30d}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Delivered</p>
                  <p className="text-lg font-bold mt-0.5 tabular-nums">{delivered}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Replied</p>
                  <p className="text-lg font-bold mt-0.5 tabular-nums">{replied}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Outbound Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sendLogs && sendLogs.length > 0 ? (
                <div className="space-y-2">
                  {sendLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">{log.channel_type || "—"}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <AdminStatusBadge status={log.delivery_status || "unknown"} showIcon={false} />
                        {log.reply_status === "replied" && (
                          <AdminStatusBadge status="replied" type="info" showIcon={false} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No outbound messages yet.</p>
              )}
            </CardContent>
          </Card>

          {/* AI Next Best Action */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" /> AI Next Best Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nbaDecisions && nbaDecisions.length > 0 ? (
                <div className="space-y-3">
                  {nbaDecisions.map((nba: any) => {
                    const actionColors = NBA_COLORS[nba.recommended_action] || "bg-muted text-muted-foreground border-border";
                    return (
                      <div key={nba.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${actionColors}`}>
                            {nba.recommended_action?.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {nba.confidence_score}% confidence
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{nba.explanation}</p>
                        {nba.recommended_channel && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Channel: <span className="font-medium">{nba.recommended_channel}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No pending NBA decisions for this customer.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
