import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Pause, RotateCcw, Trophy, ArrowUp, AlertTriangle, BarChart3, Beaker } from "lucide-react";
import { format } from "date-fns";

const PROMPT_TYPES = [
  "global_system_prompt", "brand_tone_prompt", "sales_prompt", "support_prompt",
  "refund_prompt", "escalation_prompt", "dead_air_followup_prompt",
  "language_specific_prompt", "channel_specific_prompt", "voice_agent_prompt",
];
const CHANNELS = ["web_chat", "line", "whatsapp", "facebook", "instagram", "voice"];
const METRICS = [
  { value: "avg_customer_rating", label: "Customer Rating" },
  { value: "avg_ai_score", label: "AI Score" },
  { value: "dead_air_rate", label: "Dead Air Rate (lower is better)" },
  { value: "containment_rate", label: "Containment Rate" },
  { value: "repeat_contact_rate", label: "Repeat Contact Rate (lower is better)" },
  { value: "conversion_rate", label: "Conversion Rate" },
];
const STOP_LOSS_METRICS = [
  { value: "avg_customer_rating", label: "Rating drops below" },
  { value: "avg_ai_score", label: "AI Score drops below" },
  { value: "dead_air_rate", label: "Dead Air Rate exceeds" },
];

type PromptVersion = { id: string; version_name: string; prompt_type: string; is_active: boolean };
type Experiment = {
  id: string; experiment_name: string; prompt_type: string; status: string;
  control_prompt_version_id: string | null; candidate_prompt_version_id: string | null;
  target_channels: string[] | null; target_intents: string[] | null;
  rollout_percentage: number; success_metric: string | null; stop_loss_rule: string | null;
  stop_loss_metric: string | null; stop_loss_threshold: number | null;
  min_conversations: number; started_at: string | null; ended_at: string | null;
  winner_version_id: string | null; stop_loss_triggered: boolean;
  description: string | null; created_at: string;
};
type ExperimentResult = {
  id: string; experiment_id: string; prompt_version_id: string | null;
  conversations_count: number; avg_customer_rating: number | null;
  avg_ai_score: number | null; dead_air_rate: number | null;
  containment_rate: number | null; repeat_contact_rate: number | null;
  conversion_rate: number | null; human_handoff_rate: number | null;
  is_winner: boolean | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary", running: "default", paused: "outline", completed: "default", rolled_back: "destructive",
};

const emptyForm = {
  experiment_name: "", prompt_type: "global_system_prompt", description: "",
  control_prompt_version_id: "", candidate_prompt_version_id: "",
  target_channels: [] as string[], target_intents: "",
  rollout_percentage: 20, success_metric: "avg_customer_rating",
  stop_loss_metric: "", stop_loss_threshold: 0, min_conversations: 100,
};

export function ContactCenterExperiments() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ["prompt-experiments", filterStatus],
    queryFn: async () => {
      let q = supabase.from("prompt_experiments").select("*").order("created_at", { ascending: false });
      if (filterStatus !== "all") q = q.eq("status", filterStatus as any);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Experiment[];
    },
  });

  const { data: promptVersions = [] } = useQuery({
    queryKey: ["prompt-versions-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prompt_versions").select("id, version_name, prompt_type, is_active").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PromptVersion[];
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ["experiment-results", detailId],
    enabled: !!detailId,
    queryFn: async () => {
      const { data, error } = await supabase.from("prompt_experiment_results").select("*").eq("experiment_id", detailId!);
      if (error) throw error;
      return (data || []) as ExperimentResult[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        experiment_name: form.experiment_name,
        prompt_type: form.prompt_type,
        description: form.description || null,
        control_prompt_version_id: form.control_prompt_version_id || null,
        candidate_prompt_version_id: form.candidate_prompt_version_id || null,
        target_channels: form.target_channels.length > 0 ? form.target_channels : null,
        target_intents: form.target_intents ? form.target_intents.split(",").map(s => s.trim()) : null,
        rollout_percentage: form.rollout_percentage,
        success_metric: form.success_metric,
        stop_loss_metric: form.stop_loss_metric || null,
        stop_loss_threshold: form.stop_loss_threshold || null,
        stop_loss_rule: form.stop_loss_metric ? `${form.stop_loss_metric} threshold ${form.stop_loss_threshold}` : null,
        min_conversations: form.min_conversations,
        status: "draft",
      };
      const { error } = await supabase.from("prompt_experiments").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Experiment created" });
      qc.invalidateQueries({ queryKey: ["prompt-experiments"] });
      setCreatorOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, extra }: { id: string; status: string; extra?: Record<string, unknown> }) => {
      const update: Record<string, unknown> = { status, updated_at: new Date().toISOString(), ...extra };
      if (status === "running" && !experiments.find(e => e.id === id)?.started_at) update.started_at = new Date().toISOString();
      if (status === "completed" || status === "rolled_back") update.ended_at = new Date().toISOString();
      const { error } = await supabase.from("prompt_experiments").update(update as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompt-experiments"] });
      toast({ title: "Status updated" });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ experimentId, winnerId }: { experimentId: string; winnerId: string }) => {
      // Activate winner, deactivate others of same type
      const exp = experiments.find(e => e.id === experimentId);
      if (!exp) throw new Error("Experiment not found");
      // Deactivate all versions of this prompt type
      await supabase.from("prompt_versions").update({ is_active: false, updated_at: new Date().toISOString() } as any).eq("prompt_type", exp.prompt_type).eq("is_active", true);
      // Activate winner
      const { error: activateErr } = await supabase.from("prompt_versions").update({ is_active: true, updated_at: new Date().toISOString() } as any).eq("id", winnerId);
      if (activateErr) throw activateErr;
      // Mark experiment completed with winner
      const { error } = await supabase.from("prompt_experiments").update({ status: "completed", winner_version_id: winnerId, ended_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq("id", experimentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompt-experiments"] });
      qc.invalidateQueries({ queryKey: ["prompt-versions"] });
      toast({ title: "Winner promoted to active!" });
    },
  });

  const versionsForType = promptVersions.filter(v => v.prompt_type === form.prompt_type);
  const detailExp = detailId ? experiments.find(e => e.id === detailId) : null;
  const controlResult = results.find(r => r.prompt_version_id === detailExp?.control_prompt_version_id);
  const candidateResult = results.find(r => r.prompt_version_id === detailExp?.candidate_prompt_version_id);
  const controlName = promptVersions.find(v => v.id === detailExp?.control_prompt_version_id)?.version_name || "Control";
  const candidateName = promptVersions.find(v => v.id === detailExp?.candidate_prompt_version_id)?.version_name || "Candidate";

  // Winner recommendation logic
  const getRecommendation = () => {
    if (!controlResult || !candidateResult || !detailExp) return null;
    const totalConvs = controlResult.conversations_count + candidateResult.conversations_count;
    if (totalConvs < detailExp.min_conversations) return { ready: false, message: `Need ${detailExp.min_conversations - totalConvs} more conversations for statistical significance.` };

    const metric = detailExp.success_metric || "avg_customer_rating";
    const cVal = (controlResult as any)[metric] as number | null;
    const tVal = (candidateResult as any)[metric] as number | null;
    if (cVal == null || tVal == null) return { ready: false, message: "Insufficient metric data." };

    const lowerIsBetter = metric === "dead_air_rate" || metric === "repeat_contact_rate";
    const diff = lowerIsBetter ? cVal - tVal : tVal - cVal;
    const pctDiff = cVal !== 0 ? Math.abs(diff / cVal) * 100 : 0;

    if (pctDiff < 3) return { ready: true, winner: null, message: "No significant difference between versions. Consider extending the experiment." };
    const winnerId = diff > 0 ? detailExp.candidate_prompt_version_id : detailExp.control_prompt_version_id;
    const winnerLabel = diff > 0 ? candidateName : controlName;
    return { ready: true, winner: winnerId, winnerLabel, message: `${winnerLabel} outperforms by ${pctDiff.toFixed(1)}% on ${metric.replace(/_/g, " ")}.`, pctDiff };
  };

  const recommendation = detailExp ? getRecommendation() : null;
  const activeCount = experiments.filter(e => e.status === "running").length;
  const completedCount = experiments.filter(e => e.status === "completed").length;

  const MetricBar = ({ label, control, candidate, lowerBetter }: { label: string; control: number | null; candidate: number | null; lowerBetter?: boolean }) => {
    const c = control ?? 0; const t = candidate ?? 0;
    const better = lowerBetter ? t < c : t > c;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground"><span>{label}</span></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <span className="text-sm font-semibold text-foreground">{c.toFixed(2)}</span>
            <Progress value={Math.min(c * (label.includes("Rate") ? 100 : 10), 100)} className="h-2 mt-1" />
          </div>
          <div className="text-center">
            <span className={`text-sm font-semibold ${better ? "text-green-600" : "text-foreground"}`}>{t.toFixed(2)}</span>
            <Progress value={Math.min(t * (label.includes("Rate") ? 100 : 10), 100)} className="h-2 mt-1" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{experiments.length}</p><p className="text-xs text-muted-foreground">Total Experiments</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{activeCount}</p><p className="text-xs text-muted-foreground">Running</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{completedCount}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{experiments.filter(e => e.stop_loss_triggered).length}</p><p className="text-xs text-muted-foreground">Stop-Loss Triggered</p></CardContent></Card>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rolled_back">Rolled Back</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setForm(emptyForm); setCreatorOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Experiment</Button>
      </div>

      {/* Experiment List */}
      {isLoading ? <p className="text-center text-muted-foreground py-8">Loading…</p> : experiments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No experiments yet. Create your first A/B test.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {experiments.map(exp => {
            const ctrlName = promptVersions.find(v => v.id === exp.control_prompt_version_id)?.version_name || "—";
            const candName = promptVersions.find(v => v.id === exp.candidate_prompt_version_id)?.version_name || "—";
            return (
              <Card key={exp.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailId(exp.id)}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Beaker className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">{exp.experiment_name}</h3>
                      <Badge variant={STATUS_COLORS[exp.status] as any}>{exp.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline">{exp.prompt_type.replace(/_/g, " ")}</Badge>
                      {exp.stop_loss_triggered && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Stop-Loss</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{ctrlName} vs {candName} · {exp.rollout_percentage}% rollout</p>
                    {exp.started_at && <p className="text-xs text-muted-foreground">Started {format(new Date(exp.started_at), "MMM d, yyyy")}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {exp.status === "draft" && <Button size="sm" variant="default" onClick={() => statusMutation.mutate({ id: exp.id, status: "running" })} className="gap-1"><Play className="h-3 w-3" />Start</Button>}
                    {exp.status === "running" && <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: exp.id, status: "paused" })} className="gap-1"><Pause className="h-3 w-3" />Pause</Button>}
                    {exp.status === "paused" && <Button size="sm" variant="default" onClick={() => statusMutation.mutate({ id: exp.id, status: "running" })} className="gap-1"><Play className="h-3 w-3" />Resume</Button>}
                    {(exp.status === "running" || exp.status === "paused") && <Button size="sm" variant="destructive" onClick={() => statusMutation.mutate({ id: exp.id, status: "rolled_back" })} className="gap-1"><RotateCcw className="h-3 w-3" />Rollback</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Experiment Dialog */}
      <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Experiment</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experiment Name</Label>
                <Input value={form.experiment_name} onChange={e => setForm({ ...form, experiment_name: e.target.value })} placeholder="e.g. Empathy boost v2 test" />
              </div>
              <div className="space-y-2">
                <Label>Prompt Type</Label>
                <Select value={form.prompt_type} onValueChange={v => setForm({ ...form, prompt_type: v, control_prompt_version_id: "", candidate_prompt_version_id: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROMPT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What hypothesis are you testing?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Control Version (current)</Label>
                <Select value={form.control_prompt_version_id} onValueChange={v => setForm({ ...form, control_prompt_version_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select control" /></SelectTrigger>
                  <SelectContent>{versionsForType.map(v => <SelectItem key={v.id} value={v.id}>{v.version_name}{v.is_active ? " ✓" : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Candidate Version (new)</Label>
                <Select value={form.candidate_prompt_version_id} onValueChange={v => setForm({ ...form, candidate_prompt_version_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select candidate" /></SelectTrigger>
                  <SelectContent>{versionsForType.filter(v => v.id !== form.control_prompt_version_id).map(v => <SelectItem key={v.id} value={v.id}>{v.version_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rollout Percentage: {form.rollout_percentage}%</Label>
              <Slider value={[form.rollout_percentage]} onValueChange={v => setForm({ ...form, rollout_percentage: v[0] })} min={5} max={50} step={5} />
              <p className="text-xs text-muted-foreground">{form.rollout_percentage}% of matching conversations get the candidate prompt</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Success Metric</Label>
                <Select value={form.success_metric} onValueChange={v => setForm({ ...form, success_metric: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METRICS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Min. Conversations for Decision</Label>
                <Input type="number" value={form.min_conversations} onChange={e => setForm({ ...form, min_conversations: parseInt(e.target.value) || 50 })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Channels</Label>
              <div className="flex flex-wrap gap-1">
                {CHANNELS.map(ch => (
                  <Badge key={ch} variant={form.target_channels.includes(ch) ? "default" : "outline"} className="cursor-pointer text-xs"
                    onClick={() => setForm({ ...form, target_channels: form.target_channels.includes(ch) ? form.target_channels.filter(c => c !== ch) : [...form.target_channels, ch] })}>
                    {ch}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Leave empty for all channels</p>
            </div>

            <Card className="bg-muted/50">
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Stop-Loss Rule (optional)</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-4">
                  <Select value={form.stop_loss_metric} onValueChange={v => setForm({ ...form, stop_loss_metric: v })}>
                    <SelectTrigger><SelectValue placeholder="Select metric" /></SelectTrigger>
                    <SelectContent>{STOP_LOSS_METRICS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" step="0.1" value={form.stop_loss_threshold} onChange={e => setForm({ ...form, stop_loss_threshold: parseFloat(e.target.value) || 0 })} placeholder="Threshold value" />
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatorOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.experiment_name || !form.control_prompt_version_id || !form.candidate_prompt_version_id || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Experiment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experiment Detail / Results Dialog */}
      <Dialog open={!!detailExp} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailExp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {detailExp.experiment_name}
                  <Badge variant={STATUS_COLORS[detailExp.status] as any}>{detailExp.status.replace(/_/g, " ")}</Badge>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="results">
                <TabsList>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-4">
                  {/* Recommendation Banner */}
                  {recommendation && (
                    <Card className={recommendation.ready && recommendation.winner ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border"}>
                      <CardContent className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Trophy className={`h-5 w-5 ${recommendation.winner ? "text-green-600" : "text-muted-foreground"}`} />
                          <p className="text-sm font-medium text-foreground">{recommendation.message}</p>
                        </div>
                        {recommendation.winner && (detailExp.status === "running" || detailExp.status === "paused") && (
                          <Button size="sm" className="gap-1" onClick={() => promoteMutation.mutate({ experimentId: detailExp.id, winnerId: recommendation.winner! })}>
                            <ArrowUp className="h-3 w-3" /> Promote Winner
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Results comparison */}
                  {controlResult || candidateResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center"><Badge variant="outline" className="mb-2">{controlName} (Control)</Badge><p className="text-2xl font-bold text-foreground">{controlResult?.conversations_count ?? 0}</p><p className="text-xs text-muted-foreground">conversations</p></div>
                        <div className="text-center"><Badge className="mb-2">{candidateName} (Candidate)</Badge><p className="text-2xl font-bold text-foreground">{candidateResult?.conversations_count ?? 0}</p><p className="text-xs text-muted-foreground">conversations</p></div>
                      </div>

                      <div className="space-y-3">
                        <MetricBar label="Customer Rating" control={controlResult?.avg_customer_rating ?? null} candidate={candidateResult?.avg_customer_rating ?? null} />
                        <MetricBar label="AI Score" control={controlResult?.avg_ai_score ?? null} candidate={candidateResult?.avg_ai_score ?? null} />
                        <MetricBar label="Dead Air Rate" control={controlResult?.dead_air_rate ?? null} candidate={candidateResult?.dead_air_rate ?? null} lowerBetter />
                        <MetricBar label="Containment Rate" control={controlResult?.containment_rate ?? null} candidate={candidateResult?.containment_rate ?? null} />
                        <MetricBar label="Repeat Contact Rate" control={controlResult?.repeat_contact_rate ?? null} candidate={candidateResult?.repeat_contact_rate ?? null} lowerBetter />
                        <MetricBar label="Conversion Rate" control={controlResult?.conversion_rate ?? null} candidate={candidateResult?.conversion_rate ?? null} />
                      </div>
                    </div>
                  ) : (
                    <Card><CardContent className="py-8 text-center text-muted-foreground">{detailExp.status === "draft" ? "Start the experiment to begin collecting results." : "Waiting for results to accumulate…"}</CardContent></Card>
                  )}
                </TabsContent>

                <TabsContent value="config" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Prompt Type:</span> <span className="font-medium text-foreground">{detailExp.prompt_type.replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Rollout:</span> <span className="font-medium text-foreground">{detailExp.rollout_percentage}%</span></div>
                    <div><span className="text-muted-foreground">Success Metric:</span> <span className="font-medium text-foreground">{detailExp.success_metric?.replace(/_/g, " ") || "—"}</span></div>
                    <div><span className="text-muted-foreground">Min Conversations:</span> <span className="font-medium text-foreground">{detailExp.min_conversations}</span></div>
                    <div><span className="text-muted-foreground">Channels:</span> <span className="font-medium text-foreground">{detailExp.target_channels?.join(", ") || "All"}</span></div>
                    <div><span className="text-muted-foreground">Intents:</span> <span className="font-medium text-foreground">{detailExp.target_intents?.join(", ") || "All"}</span></div>
                    {detailExp.stop_loss_rule && <div className="col-span-2"><span className="text-muted-foreground">Stop-Loss:</span> <span className="font-medium text-foreground">{detailExp.stop_loss_rule}</span></div>}
                    {detailExp.description && <div className="col-span-2"><span className="text-muted-foreground">Description:</span> <span className="font-medium text-foreground">{detailExp.description}</span></div>}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-border">
                    {detailExp.status === "draft" && <Button onClick={() => { statusMutation.mutate({ id: detailExp.id, status: "running" }); setDetailId(null); }} className="gap-1"><Play className="h-4 w-4" />Start Experiment</Button>}
                    {detailExp.status === "running" && <Button variant="outline" onClick={() => statusMutation.mutate({ id: detailExp.id, status: "paused" })} className="gap-1"><Pause className="h-4 w-4" />Pause</Button>}
                    {(detailExp.status === "running" || detailExp.status === "paused") && <Button variant="destructive" onClick={() => { statusMutation.mutate({ id: detailExp.id, status: "rolled_back" }); setDetailId(null); }} className="gap-1"><RotateCcw className="h-4 w-4" />Rollback</Button>}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
