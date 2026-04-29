import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_JOURNEYS, SAMPLE_JOURNEY_STEPS, SAMPLE_CAMPAIGNS } from "./outboundSampleData";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Route as RouteIcon, Plus, Search, ChevronDown, ChevronRight,
  Loader2, Zap, Brain, MessageSquare, ArrowRightLeft, Users,
  Clock, Trash2, GripVertical, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

const TRIGGER_TYPES = ["campaign_start", "stage_change", "event_signal", "manual", "schedule"] as const;
const JOURNEY_STATUSES = ["draft", "active", "paused", "archived"] as const;
const STEP_TYPES = ["send_message", "check_condition", "ai_decision", "handoff", "update_stage"] as const;
const CHANNEL_RULES = ["preferred", "specific", "ai_select"] as const;
const CHANNELS = ["line", "email", "whatsapp", "facebook"] as const;
const REPLY_ACTIONS = ["stop", "next_step", "branch", "hand_off"] as const;
const NO_REPLY_ACTIONS = ["stop", "next_step", "branch", "hand_off"] as const;
const CONVERTED_ACTIONS = ["stop", "next_step", "celebrate"] as const;

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  archived: "bg-stone-100 text-stone-600 dark:bg-stone-800/30 dark:text-stone-400",
};

const triggerColors: Record<string, string> = {
  campaign_start: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  stage_change: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  event_signal: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  manual: "bg-stone-100 text-stone-700 dark:bg-stone-800/30 dark:text-stone-300",
  schedule: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const stepTypeIcons: Record<string, any> = {
  send_message: MessageSquare,
  check_condition: ArrowRightLeft,
  ai_decision: Brain,
  handoff: Users,
  update_stage: RefreshCw,
};

interface JourneyStep {
  id?: string;
  step_order: number;
  step_name: string;
  step_type: string;
  delay_before_hours: number;
  channel_selection_rule: string;
  specific_channel: string | null;
  message_template_id: string | null;
  ai_generate_message: boolean;
  ai_generation_instructions: string | null;
  action_if_replied: string;
  action_if_no_reply: string;
  action_if_converted: string;
  branch_target_step: number | null;
  metadata: Record<string, any>;
}

const emptyStep = (order: number): JourneyStep => ({
  step_order: order,
  step_name: "",
  step_type: "send_message",
  delay_before_hours: 0,
  channel_selection_rule: "preferred",
  specific_channel: null,
  message_template_id: null,
  ai_generate_message: false,
  ai_generation_instructions: null,
  action_if_replied: "stop",
  action_if_no_reply: "next_step",
  action_if_converted: "stop",
  branch_target_step: null,
  metadata: {},
});

export function ContactCenterOutboundJourneys() {
  const { isSampleMode } = usePartnerDataMode();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formCampaignId, setFormCampaignId] = useState("");
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState<string>("campaign_start");
  const [formMaxSteps, setFormMaxSteps] = useState<string>("");
  const [formSteps, setFormSteps] = useState<JourneyStep[]>([emptyStep(1)]);

  // Queries
  const { data: liveJourneys = [], isLoading: liveLoading } = useQuery({
    queryKey: ["outbound-journeys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_journeys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const { data: liveSteps = [] } = useQuery({
    queryKey: ["outbound-journey-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_journey_steps")
        .select("*")
        .order("step_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const { data: liveCampaigns = [] } = useQuery({
    queryKey: ["outbound-campaigns-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_campaigns")
        .select("id, campaign_name, status")
        .order("campaign_name");
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const journeys = isSampleMode ? SAMPLE_JOURNEYS : liveJourneys;
  const isLoading = isSampleMode ? false : liveLoading;
  const steps = isSampleMode ? SAMPLE_JOURNEY_STEPS : liveSteps;
  const campaigns = isSampleMode ? SAMPLE_CAMPAIGNS.map(c => ({ id: c.id, campaign_name: c.campaign_name, status: c.status })) : liveCampaigns;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data: journey, error: jErr } = await supabase
        .from("outbound_journeys")
        .insert({
          campaign_id: formCampaignId,
          journey_name: formName,
          trigger_type: formTrigger,
          trigger_definition: {},
          stop_conditions: [{ type: "conversion" }, { type: "opt_out" }],
          max_steps: formMaxSteps ? parseInt(formMaxSteps) : null,
        })
        .select()
        .single();
      if (jErr) throw jErr;

      const validSteps = formSteps.filter((s) => s.step_name.trim());
      if (validSteps.length > 0) {
        const { error: sErr } = await supabase
          .from("outbound_journey_steps")
          .insert(
            validSteps.map((s) => ({
              journey_id: journey.id,
              step_order: s.step_order,
              step_name: s.step_name,
              step_type: s.step_type,
              delay_before_hours: s.delay_before_hours,
              channel_selection_rule: s.channel_selection_rule,
              specific_channel: s.specific_channel,
              ai_generate_message: s.ai_generate_message,
              ai_generation_instructions: s.ai_generation_instructions,
              action_if_replied: s.action_if_replied,
              action_if_no_reply: s.action_if_no_reply,
              action_if_converted: s.action_if_converted,
              branch_target_step: s.branch_target_step,
              metadata: s.metadata,
            }))
          );
        if (sErr) throw sErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-journeys"] });
      queryClient.invalidateQueries({ queryKey: ["outbound-journey-steps"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Journey created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormCampaignId("");
    setFormName("");
    setFormTrigger("campaign_start");
    setFormMaxSteps("");
    setFormSteps([emptyStep(1)]);
  };

  const addStep = () => {
    setFormSteps((prev) => [...prev, emptyStep(prev.length + 1)]);
  };

  const removeStep = (idx: number) => {
    setFormSteps((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((s, i) => ({ ...s, step_order: i + 1 }));
    });
  };

  const updateStep = (idx: number, patch: Partial<JourneyStep>) => {
    setFormSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  };

  const filtered = journeys.filter((j: any) => {
    if (tab !== "all" && j.status !== tab) return false;
    if (search && !j.journey_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStepsForJourney = (journeyId: string) =>
    steps.filter((s: any) => s.journey_id === journeyId);

  const getCampaignName = (id: string) =>
    campaigns.find((c: any) => c.id === id)?.campaign_name || "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Outbound Journeys</h2>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Journey
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search journeys..."
          className="pl-8 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {JOURNEY_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No journeys found.</CardContent></Card>
          ) : (
            filtered.map((j: any) => {
              const jSteps = getStepsForJourney(j.id);
              const expanded = expandedId === j.id;
              return (
                <Card key={j.id} className="overflow-hidden">
                  <CardHeader
                    className="py-3 px-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : j.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {expanded ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                        <CardTitle className="text-sm font-semibold truncate">{j.journey_name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={triggerColors[j.trigger_type] || ""}>
                          {j.trigger_type.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className={statusColors[j.status] || ""}>
                          {j.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {jSteps.length} step{jSteps.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Campaign: {getCampaignName(j.campaign_id)} · Created {format(new Date(j.created_at), "MMM d, yyyy")}
                    </p>
                  </CardHeader>

                  {expanded && (
                    <CardContent className="pt-0 pb-4 px-4">
                      {/* Stop conditions */}
                      <div className="mb-3">
                        <span className="text-xs font-medium text-muted-foreground">Stop conditions: </span>
                        {Array.isArray(j.stop_conditions) && j.stop_conditions.length > 0 ? (
                          j.stop_conditions.map((sc: any, i: number) => (
                            <Badge key={i} variant="outline" className="mr-1 text-xs">
                              {sc.type?.replace(/_/g, " ") || "—"}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>

                      {/* Step pipeline */}
                      {jSteps.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No steps defined.</p>
                      ) : (
                        <div className="space-y-0">
                          {jSteps.map((step: any, idx: number) => {
                            const StepIcon = stepTypeIcons[step.step_type] || Zap;
                            return (
                              <div key={step.id} className="flex gap-3">
                                {/* Vertical line connector */}
                                <div className="flex flex-col items-center w-6">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    {step.step_order}
                                  </div>
                                  {idx < jSteps.length - 1 && (
                                    <div className="w-px flex-1 bg-border min-h-[24px]" />
                                  )}
                                </div>
                                {/* Step content */}
                                <div className="flex-1 pb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <StepIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium">{step.step_name}</span>
                                    <Badge variant="outline" className="text-[10px]">{step.step_type.replace(/_/g, " ")}</Badge>
                                    {step.delay_before_hours > 0 && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <Clock className="h-3 w-3" /> {step.delay_before_hours}h delay
                                      </span>
                                    )}
                                    {step.ai_generate_message && (
                                      <Badge variant="secondary" className="text-[10px]">AI-generated</Badge>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5 space-x-3">
                                    <span>replied→{step.action_if_replied}</span>
                                    <span>no reply→{step.action_if_no_reply}</span>
                                    <span>converted→{step.action_if_converted}</span>
                                    {step.specific_channel && <span>ch: {step.specific_channel}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Journey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Journey metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Journey Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Welcome Flow" />
              </div>
              <div>
                <Label>Campaign</Label>
                <Select value={formCampaignId} onValueChange={setFormCampaignId}>
                  <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.campaign_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trigger Type</Label>
                <Select value={formTrigger} onValueChange={setFormTrigger}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Steps (optional)</Label>
                <Input type="number" value={formMaxSteps} onChange={(e) => setFormMaxSteps(e.target.value)} placeholder="Safety cap" />
              </div>
            </div>

            {/* Steps editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Steps</Label>
                <Button type="button" size="sm" variant="outline" onClick={addStep}>
                  <Plus className="h-3 w-3 mr-1" /> Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {formSteps.map((step, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground">Step {step.step_order}</span>
                      {formSteps.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeStep(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Step Name</Label>
                        <Input className="h-8 text-sm" value={step.step_name} onChange={(e) => updateStep(idx, { step_name: e.target.value })} placeholder="e.g. Send welcome LINE" />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={step.step_type} onValueChange={(v) => updateStep(idx, { step_type: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STEP_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Delay Before (hours)</Label>
                        <Input className="h-8 text-sm" type="number" min={0} value={step.delay_before_hours} onChange={(e) => updateStep(idx, { delay_before_hours: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Channel Rule</Label>
                        <Select value={step.channel_selection_rule} onValueChange={(v) => updateStep(idx, { channel_selection_rule: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CHANNEL_RULES.map((r) => (
                              <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {step.channel_selection_rule === "specific" && (
                        <div>
                          <Label className="text-xs">Specific Channel</Label>
                          <Select value={step.specific_channel || ""} onValueChange={(v) => updateStep(idx, { specific_channel: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {CHANNELS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">If Replied</Label>
                        <Select value={step.action_if_replied} onValueChange={(v) => updateStep(idx, { action_if_replied: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REPLY_ACTIONS.map((a) => (
                              <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">If No Reply</Label>
                        <Select value={step.action_if_no_reply} onValueChange={(v) => updateStep(idx, { action_if_no_reply: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {NO_REPLY_ACTIONS.map((a) => (
                              <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">If Converted</Label>
                        <Select value={step.action_if_converted} onValueChange={(v) => updateStep(idx, { action_if_converted: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONVERTED_ACTIONS.map((a) => (
                              <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        checked={step.ai_generate_message}
                        onCheckedChange={(c) => updateStep(idx, { ai_generate_message: !!c })}
                      />
                      <Label className="text-xs cursor-pointer">AI-generate message at send time</Label>
                    </div>
                    {step.ai_generate_message && (
                      <div className="mt-1">
                        <Label className="text-xs">AI Instructions</Label>
                        <Input className="h-8 text-sm" value={step.ai_generation_instructions || ""} onChange={(e) => updateStep(idx, { ai_generation_instructions: e.target.value })} placeholder="Guidance for AI content generation" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!formName.trim() || !formCampaignId || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Journey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
