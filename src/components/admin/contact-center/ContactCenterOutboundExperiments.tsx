import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_EXPERIMENTS, SAMPLE_EXPERIMENT_RESULTS, SAMPLE_EXPERIMENT_VARIANTS_MAP, SAMPLE_MESSAGE_VARIANTS } from "./outboundSampleData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Beaker, TrendingUp, AlertTriangle, Trophy, FlaskConical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  stopped: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function ContactCenterOutboundExperiments() {
  const { t } = useLanguage();
  const { isSampleMode } = usePartnerDataMode();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: liveExperiments, isLoading: loadingExperimentsLive } = useQuery({
    queryKey: ["outbound-experiments", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("outbound_experiments")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const { data: liveResults } = useQuery({
    queryKey: ["outbound-experiment-results"],
    queryFn: async () => {
      const { data, error } = await supabase.from("outbound_experiment_results").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const { data: liveExpVariants } = useQuery({
    queryKey: ["outbound-experiment-variants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_experiment_variants")
        .select("*, outbound_message_variants(variant_label, style, language, channel_type)");
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const { data: liveVariants, isLoading: loadingVariantsLive } = useQuery({
    queryKey: ["outbound-message-variants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_message_variants")
        .select("*, outbound_message_templates(template_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const experiments = isSampleMode
    ? SAMPLE_EXPERIMENTS.filter(e => statusFilter === "all" || e.status === statusFilter)
    : liveExperiments;
  const loadingExperiments = isSampleMode ? false : loadingExperimentsLive;
  const results = isSampleMode ? SAMPLE_EXPERIMENT_RESULTS : liveResults;
  const expVariants = isSampleMode ? SAMPLE_EXPERIMENT_VARIANTS_MAP : liveExpVariants;
  const variants = isSampleMode ? SAMPLE_MESSAGE_VARIANTS : liveVariants;
  const loadingVariants = isSampleMode ? false : loadingVariantsLive;

  const activeCount = experiments?.filter((e) => e.status === "active").length ?? 0;
  const stoppedCount = experiments?.filter((e) => e.status === "stopped").length ?? 0;
  const completedWithWinner = experiments?.filter((e) => e.status === "completed" && e.winner_variant_id).length ?? 0;

  const getResultsForExperiment = (expId: string) =>
    results?.filter((r) => r.experiment_id === expId) ?? [];

  const getVariantsForExperiment = (expId: string) =>
    expVariants?.filter((v) => v.experiment_id === expId) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Outbound Experiments</h2>
        <p className="text-sm text-muted-foreground">A/B and multi-variant testing for outbound messages</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <FlaskConical className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Experiments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedWithWinner}</p>
                <p className="text-xs text-muted-foreground">Winners Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stoppedCount}</p>
                <p className="text-xs text-muted-foreground">Stopped (Stop-Loss)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="experiments">
        <TabsList>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="variants">Message Variants</TabsTrigger>
        </TabsList>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingExperiments ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading experiments…</p>
          ) : !experiments?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Beaker className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No experiments yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => {
                const isExpanded = expandedId === exp.id;
                const expResults = getResultsForExperiment(exp.id);
                const expVars = getVariantsForExperiment(exp.id);
                const controlResult = expResults.find((r) =>
                  expVars.find((v) => v.variant_id === r.variant_id && v.role === "control")
                );

                return (
                  <Card key={exp.id} className="overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
                      onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-sm font-medium">{exp.experiment_name}</CardTitle>
                          <Badge className={statusColors[exp.status] ?? ""} variant="outline">
                            {exp.status}
                          </Badge>
                          {exp.winner_variant_id && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" variant="outline">
                              <Trophy className="h-3 w-3 mr-1" /> Winner
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{exp.experiment_type.toUpperCase()}</span>
                          <span>{exp.channel_type}</span>
                          <span>Rollout: {exp.rollout_percentage}%</span>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="border-t pt-4">
                        {exp.description && (
                          <p className="text-sm text-muted-foreground mb-4">{exp.description}</p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Success Metric</span>
                            <p className="font-medium text-foreground">{exp.success_metric}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Improvement</span>
                            <p className="font-medium text-foreground">{Number(exp.min_improvement_pct)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Sends/Variant</span>
                            <p className="font-medium text-foreground">{exp.min_sends_per_variant}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stop-Loss</span>
                            <p className="font-medium text-foreground">
                              {exp.stop_loss_threshold ? `${Number(exp.stop_loss_threshold)}pp on ${exp.stop_loss_metric}` : "—"}
                            </p>
                          </div>
                        </div>

                        {expResults.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Variant</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Sends</TableHead>
                                <TableHead className="text-right">Delivery</TableHead>
                                <TableHead className="text-right">Reply</TableHead>
                                <TableHead className="text-right">Click</TableHead>
                                <TableHead className="text-right">Conversion</TableHead>
                                <TableHead className="text-right">Δ vs Control</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {expResults.map((r) => {
                                const ev = expVars.find((v) => v.variant_id === r.variant_id);
                                const variantInfo = ev?.outbound_message_variants as any;
                                const role = ev?.role ?? "—";
                                const controlConv = controlResult?.conversion_rate ? Number(controlResult.conversion_rate) : null;
                                const delta = role === "candidate" && controlConv !== null && r.conversion_rate !== null
                                  ? (Number(r.conversion_rate) - controlConv).toFixed(1)
                                  : null;

                                return (
                                  <TableRow key={r.id}>
                                    <TableCell className="font-medium text-sm">
                                      {variantInfo?.variant_label ?? r.variant_id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={role === "control" ? "secondary" : "outline"} className="text-xs">
                                        {role}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{r.sends_count}</TableCell>
                                    <TableCell className="text-right">{r.delivery_rate ? `${Number(r.delivery_rate)}%` : "—"}</TableCell>
                                    <TableCell className="text-right">{r.reply_rate ? `${Number(r.reply_rate)}%` : "—"}</TableCell>
                                    <TableCell className="text-right">{r.click_rate ? `${Number(r.click_rate)}%` : "—"}</TableCell>
                                    <TableCell className="text-right">{r.conversion_rate ? `${Number(r.conversion_rate)}%` : "—"}</TableCell>
                                    <TableCell className="text-right">
                                      {delta !== null ? (
                                        <span className={Number(delta) > 0 ? "text-green-600" : Number(delta) < 0 ? "text-red-600" : ""}>
                                          {Number(delta) > 0 ? "+" : ""}{delta}pp
                                        </span>
                                      ) : "—"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No results yet</p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          {loadingVariants ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading variants…</p>
          ) : !variants?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Beaker className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No message variants yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>CTA</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{v.variant_label}</p>
                          <p className="text-xs text-muted-foreground">{v.variant_key}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {(v.outbound_message_templates as any)?.template_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{v.style}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{v.language}</TableCell>
                      <TableCell className="text-sm">{v.channel_type}</TableCell>
                      <TableCell className="text-sm">{v.cta_type ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={v.is_active ? "default" : "secondary"} className="text-xs">
                          {v.is_active ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
