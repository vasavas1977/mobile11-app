import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_TEMPLATES } from "./outboundSampleData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Copy, Pencil, Eye, Mail, X, Sparkles, Check, XCircle, Save, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  template_name: string;
  campaign_type: string | null;
  channel_type: string;
  language: string;
  intent_type: string;
  tone_type: string;
  message_text: string;
  email_subject: string | null;
  cta_type: string | null;
  cta_text: string | null;
  cta_url: string | null;
  supported_variables: string[];
  version_label: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type Variant = {
  variant_key: string;
  language: string;
  style: string;
  message_text: string;
  email_subject: string | null;
  supported_variables: string[];
  approval_status: "pending" | "approved" | "rejected";
  notes: string | null;
};

type Batch = {
  id: string;
  campaign_type: string;
  channel_type: string;
  intent_type: string;
  tone_type: string;
  customer_profile_id: string | null;
  customer_context: Record<string, unknown>;
  generated_variants: Variant[];
  prompt_version: string | null;
  generation_engine: string | null;
  status: string;
  approved_template_ids: string[];
  created_by: string | null;
  created_at: string;
};

const CAMPAIGN_TYPES = ["sales_followup", "promotion", "education", "win_back", "recovery", "upsell", "cross_sell", "enterprise_outreach"];
const CHANNEL_TYPES = ["line", "email", "whatsapp", "facebook"];
const LANGUAGES = ["en", "th"];
const INTENT_TYPES = ["welcome", "followup", "reminder", "offer", "education", "recovery", "winback", "upsell", "cross_sell", "thank_you"];
const TONE_TYPES = ["friendly", "professional", "urgent", "casual", "empathetic"];
const CTA_TYPES = ["link", "reply", "button", "none"];
const STYLES = ["short", "medium", "soft_cta", "strong_cta"];
const STYLE_LABELS: Record<string, string> = { short: "Short", medium: "Medium", soft_cta: "Soft CTA", strong_cta: "Strong CTA" };

const emptyForm = (): Omit<Template, "id" | "created_at" | "updated_at"> => ({
  template_name: "",
  campaign_type: null,
  channel_type: "line",
  language: "en",
  intent_type: "followup",
  tone_type: "friendly",
  message_text: "",
  email_subject: null,
  cta_type: null,
  cta_text: null,
  cta_url: null,
  supported_variables: [],
  version_label: null,
  is_active: true,
  metadata: {},
});

function highlightVars(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{.+\}\}$/.test(p) ? (
      <span key={i} className="bg-primary/20 text-primary font-semibold rounded px-0.5">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

const channelColor: Record<string, string> = {
  line: "bg-green-500/10 text-green-700 dark:text-green-400",
  email: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  whatsapp: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  facebook: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
};

export function ContactCenterMessageTemplates() {
  const { isSampleMode } = usePartnerDataMode();
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterLang, setFilterLang] = useState("all");
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [varInput, setVarInput] = useState("");

  // AI Generate state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiForm, setAiForm] = useState({
    campaign_type: "sales_followup",
    channel_type: "line",
    intent_type: "followup",
    tone_type: "friendly",
    customer_profile_id: "",
    funnel_stage: "consideration",
    experience_stage: "neutral",
    price_sensitivity: "medium",
  });
  const [aiBatch, setAiBatch] = useState<Batch | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: liveTemplates = [], isLoading: liveLoading } = useQuery({
    queryKey: ["outbound-message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_message_templates")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Template[];
    },
    enabled: !isSampleMode,
  });

  const templates = isSampleMode ? (SAMPLE_TEMPLATES as unknown as Template[]) : liveTemplates;
  const isLoading = isSampleMode ? false : liveLoading;

  const { data: batchHistory = [] } = useQuery({
    queryKey: ["ai-message-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generated_message_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as Batch[];
    },
    enabled: aiDialogOpen,
  });

  const upsert = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editId) {
        const { error } = await supabase.from("outbound_message_templates").update(payload as any).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("outbound_message_templates").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outbound-message-templates"] });
      toast({ title: editId ? "Template updated" : "Template created" });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.template_name.toLowerCase().includes(search.toLowerCase()) && !t.message_text.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterChannel !== "all" && t.channel_type !== filterChannel) return false;
      if (filterLang !== "all" && t.language !== filterLang) return false;
      if (filterIntent !== "all" && t.intent_type !== filterIntent) return false;
      if (filterCampaign !== "all" && (filterCampaign === "universal" ? t.campaign_type !== null : t.campaign_type !== filterCampaign)) return false;
      if (filterActive !== "all" && (filterActive === "active" ? !t.is_active : t.is_active)) return false;
      return true;
    });
  }, [templates, search, filterChannel, filterLang, filterIntent, filterCampaign, filterActive]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm());
    setVarInput("");
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (tpl: Template) => {
    setEditId(tpl.id);
    setForm({
      template_name: tpl.template_name,
      campaign_type: tpl.campaign_type,
      channel_type: tpl.channel_type,
      language: tpl.language,
      intent_type: tpl.intent_type,
      tone_type: tpl.tone_type,
      message_text: tpl.message_text,
      email_subject: tpl.email_subject,
      cta_type: tpl.cta_type,
      cta_text: tpl.cta_text,
      cta_url: tpl.cta_url,
      supported_variables: (tpl.supported_variables ?? []) as string[],
      version_label: tpl.version_label,
      is_active: tpl.is_active,
      metadata: (tpl.metadata ?? {}) as Record<string, unknown>,
    });
    setDialogOpen(true);
  };

  const duplicate = (tpl: Template) => {
    setEditId(null);
    setForm({
      ...tpl,
      template_name: tpl.template_name + " (Copy)",
      version_label: null,
      is_active: false,
      supported_variables: (tpl.supported_variables ?? []) as string[],
      metadata: (tpl.metadata ?? {}) as Record<string, unknown>,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.template_name || !form.message_text) {
      toast({ title: "Missing fields", description: "Name and message are required", variant: "destructive" });
      return;
    }
    const payload: Record<string, unknown> = {
      template_name: form.template_name,
      campaign_type: form.campaign_type || null,
      channel_type: form.channel_type,
      language: form.language,
      intent_type: form.intent_type,
      tone_type: form.tone_type,
      message_text: form.message_text,
      email_subject: form.channel_type === "email" ? form.email_subject : null,
      cta_type: form.cta_type || null,
      cta_text: form.cta_text || null,
      cta_url: form.cta_url || null,
      supported_variables: form.supported_variables,
      version_label: form.version_label || null,
      is_active: form.is_active,
      metadata: form.metadata,
    };
    upsert.mutate(payload);
  };

  const addVar = () => {
    const v = varInput.trim().replace(/[{}]/g, "");
    if (v && !form.supported_variables.includes(v)) {
      setForm((f) => ({ ...f, supported_variables: [...f.supported_variables, v] }));
    }
    setVarInput("");
  };

  const removeVar = (v: string) => {
    setForm((f) => ({ ...f, supported_variables: f.supported_variables.filter((x) => x !== v) }));
  };

  // AI Generate functions
  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const body: Record<string, unknown> = {
        campaign_type: aiForm.campaign_type,
        channel_type: aiForm.channel_type,
        intent_type: aiForm.intent_type,
        tone_type: aiForm.tone_type,
      };

      if (aiForm.customer_profile_id.trim()) {
        body.customer_profile_id = aiForm.customer_profile_id.trim();
      } else {
        body.custom_context = {
          funnel_stage: aiForm.funnel_stage,
          experience_stage: aiForm.experience_stage,
          price_sensitivity: aiForm.price_sensitivity,
          preferred_language: "en",
        };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-outbound-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Error ${response.status}`);
      }

      const batch = await response.json();
      setAiBatch(batch);
      qc.invalidateQueries({ queryKey: ["ai-message-batches"] });
      toast({ title: "Variants generated", description: `${(batch.generated_variants || []).length} variants created` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const updateVariantStatus = (variantKey: string, status: "approved" | "rejected") => {
    if (!aiBatch) return;
    const updatedVariants = aiBatch.generated_variants.map((v) =>
      v.variant_key === variantKey ? { ...v, approval_status: status } : v
    );

    const allApproved = updatedVariants.every((v) => v.approval_status === "approved");
    const allRejected = updatedVariants.every((v) => v.approval_status === "rejected");
    const hasApproved = updatedVariants.some((v) => v.approval_status === "approved");
    const batchStatus = allApproved ? "approved" : allRejected ? "rejected" : hasApproved ? "partially_approved" : "generated";

    const updatedBatch = { ...aiBatch, generated_variants: updatedVariants, status: batchStatus };
    setAiBatch(updatedBatch);

    // Persist to DB
    supabase
      .from("ai_generated_message_batches")
      .update({ generated_variants: updatedVariants as any, status: batchStatus })
      .eq("id", aiBatch.id)
      .then();
  };

  const saveVariantAsTemplate = async (variant: Variant) => {
    if (!aiBatch) return;
    try {
      const { data, error } = await supabase
        .from("outbound_message_templates")
        .insert({
          template_name: `${aiBatch.campaign_type} - ${variant.style} (${variant.language.toUpperCase()})`,
          campaign_type: aiBatch.campaign_type,
          channel_type: aiBatch.channel_type,
          language: variant.language,
          intent_type: aiBatch.intent_type,
          tone_type: aiBatch.tone_type,
          message_text: variant.message_text,
          email_subject: variant.email_subject,
          supported_variables: variant.supported_variables as any,
          version_label: "ai-generated",
          is_active: false,
          metadata: {
            ai_generated: true,
            source_batch_id: aiBatch.id,
            generated_variant_key: variant.variant_key,
          },
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Update batch approved_template_ids
      const newIds = [...(aiBatch.approved_template_ids || []), data.id];
      await supabase
        .from("ai_generated_message_batches")
        .update({ approved_template_ids: newIds } as any)
        .eq("id", aiBatch.id);

      qc.invalidateQueries({ queryKey: ["outbound-message-templates"] });
      toast({ title: "Template saved", description: `${variant.variant_key} saved as inactive template` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const saveAllApproved = async () => {
    if (!aiBatch) return;
    const approved = aiBatch.generated_variants.filter((v) => v.approval_status === "approved");
    if (approved.length === 0) {
      toast({ title: "No approved variants", variant: "destructive" });
      return;
    }
    for (const v of approved) {
      await saveVariantAsTemplate(v);
    }
    toast({ title: `${approved.length} templates saved` });
  };

  const previewTpl = previewId ? templates.find((t) => t.id === previewId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Message Templates</h2>
          <p className="text-sm text-muted-foreground">Reusable outbound message content for journeys and campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAiDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> AI Generate
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Template</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {CHANNEL_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-[90px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lang</SelectItem>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterIntent} onValueChange={setFilterIntent}>
          <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All intents</SelectItem>
            {INTENT_TYPES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCampaign} onValueChange={setFilterCampaign}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            <SelectItem value="universal">Universal</SelectItem>
            {CAMPAIGN_TYPES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[100px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template list + preview */}
      <div className="flex gap-4 min-h-[400px]">
        {/* List */}
        <div className="flex-1 space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No templates found</p>
          )}
          {filtered.map((tpl) => (
            <Card
              key={tpl.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                previewId === tpl.id && "ring-2 ring-primary",
                !tpl.is_active && "opacity-60"
              )}
              onClick={() => setPreviewId(tpl.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">{tpl.template_name}</span>
                      {tpl.version_label && <Badge variant="outline" className="text-[10px] px-1">{tpl.version_label}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tpl.message_text}</p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5", channelColor[tpl.channel_type])}>{tpl.channel_type}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{tpl.language.toUpperCase()}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5">{tpl.intent_type}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5">{tpl.campaign_type?.replace(/_/g, " ") ?? "Universal"}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(tpl); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicate(tpl); }}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview panel */}
        <div className="hidden lg:block w-[340px] shrink-0">
          {previewTpl ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{previewTpl.template_name}</p>
                </div>
                {previewTpl.channel_type === "email" && previewTpl.email_subject && (
                  <div className="bg-muted/50 rounded-md p-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Subject</Label>
                    <p className="font-medium mt-0.5">{highlightVars(previewTpl.email_subject)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <div className="mt-1 p-2 bg-muted/30 rounded-md whitespace-pre-wrap text-[13px] leading-relaxed">{highlightVars(previewTpl.message_text)}</div>
                </div>
                {(previewTpl.supported_variables as unknown as string[])?.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Variables</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(previewTpl.supported_variables as unknown as string[]).map((v: string) => (
                        <Badge key={v} variant="secondary" className="text-[10px] bg-primary/10 text-primary">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {previewTpl.cta_type && previewTpl.cta_type !== "none" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">CTA</Label>
                    <p className="text-xs">{previewTpl.cta_type}: {previewTpl.cta_text}{previewTpl.cta_url ? ` → ${previewTpl.cta_url}` : ""}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="secondary" className={cn("text-[10px]", channelColor[previewTpl.channel_type])}>{previewTpl.channel_type}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{previewTpl.language.toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-[10px]">{previewTpl.tone_type}</Badge>
                  {previewTpl.is_active ? <Badge className="text-[10px] bg-green-500/10 text-green-700">Active</Badge> : <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Select a template to preview</div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: form fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Template Name *</Label>
                <Input value={form.template_name} onChange={(e) => setForm((f) => ({ ...f, template_name: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Channel *</Label>
                  <Select value={form.channel_type} onValueChange={(v) => setForm((f) => ({ ...f, channel_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{CHANNEL_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Language *</Label>
                  <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Intent *</Label>
                  <Select value={form.intent_type} onValueChange={(v) => setForm((f) => ({ ...f, intent_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{INTENT_TYPES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tone *</Label>
                  <Select value={form.tone_type} onValueChange={(v) => setForm((f) => ({ ...f, tone_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Campaign Type (optional)</Label>
                <Select value={form.campaign_type ?? "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, campaign_type: v === "__none__" ? null : v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Universal</SelectItem>
                    {CAMPAIGN_TYPES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.channel_type === "email" && (
                <div>
                  <Label className="text-xs">Email Subject</Label>
                  <Input value={form.email_subject ?? ""} onChange={(e) => setForm((f) => ({ ...f, email_subject: e.target.value }))} className="h-9 text-sm" placeholder="Subject line…" />
                </div>
              )}
              <div>
                <Label className="text-xs">Message Text *</Label>
                <Textarea value={form.message_text} onChange={(e) => setForm((f) => ({ ...f, message_text: e.target.value }))} className="text-sm min-h-[100px]" placeholder="Hi {{first_name}}, …" />
              </div>
              <div>
                <Label className="text-xs">Supported Variables</Label>
                <div className="flex gap-1 mt-1">
                  <Input value={varInput} onChange={(e) => setVarInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVar())} className="h-8 text-xs flex-1" placeholder="e.g. first_name" />
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addVar}>Add</Button>
                </div>
                {form.supported_variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {form.supported_variables.map((v) => (
                      <Badge key={v} variant="secondary" className="text-[10px] gap-0.5 bg-primary/10 text-primary">
                        {`{{${v}}}`}
                        <button onClick={() => removeVar(v)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">CTA Type</Label>
                  <Select value={form.cta_type ?? "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, cta_type: v === "__none__" ? null : v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {CTA_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">CTA Text</Label>
                  <Input value={form.cta_text ?? ""} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">CTA URL</Label>
                  <Input value={form.cta_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} className="h-9 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Version Label</Label>
                  <Input value={form.version_label ?? ""} onChange={(e) => setForm((f) => ({ ...f, version_label: e.target.value }))} className="h-9 text-xs" placeholder="e.g. v1" />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
                  <Label className="text-xs">{form.is_active ? "Active" : "Inactive"}</Label>
                </div>
              </div>
            </div>

            {/* Right: live preview */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-3 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live Preview</p>
              {form.channel_type === "email" && form.email_subject && (
                <div className="bg-muted/50 rounded-md p-2">
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Subject</Label>
                  <p className="text-sm font-medium mt-0.5">{highlightVars(form.email_subject)}</p>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {form.message_text ? highlightVars(form.message_text) : <span className="text-muted-foreground italic">Enter message text…</span>}
              </div>
              {form.supported_variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.supported_variables.map((v) => (
                    <Badge key={v} variant="secondary" className="text-[10px] bg-primary/10 text-primary">{`{{${v}}}`}</Badge>
                  ))}
                </div>
              )}
              {form.cta_type && form.cta_type !== "none" && form.cta_text && (
                <div className="pt-1">
                  <Button size="sm" variant="outline" className="text-xs">{form.cta_text}</Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Message Generator
            </DialogTitle>
          </DialogHeader>

          {!aiBatch ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate 8 message variants (short, medium, soft CTA, strong CTA) in English and Thai using AI.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Campaign Type *</Label>
                  <Select value={aiForm.campaign_type} onValueChange={(v) => setAiForm((f) => ({ ...f, campaign_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{CAMPAIGN_TYPES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Channel *</Label>
                  <Select value={aiForm.channel_type} onValueChange={(v) => setAiForm((f) => ({ ...f, channel_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{CHANNEL_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Intent *</Label>
                  <Select value={aiForm.intent_type} onValueChange={(v) => setAiForm((f) => ({ ...f, intent_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{INTENT_TYPES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tone *</Label>
                  <Select value={aiForm.tone_type} onValueChange={(v) => setAiForm((f) => ({ ...f, tone_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Customer Profile ID (optional — leave empty for archetype-based generation)</Label>
                <Input
                  value={aiForm.customer_profile_id}
                  onChange={(e) => setAiForm((f) => ({ ...f, customer_profile_id: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="UUID of specific customer profile"
                />
              </div>

              {!aiForm.customer_profile_id.trim() && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Funnel Stage</Label>
                    <Select value={aiForm.funnel_stage} onValueChange={(v) => setAiForm((f) => ({ ...f, funnel_stage: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["awareness", "consideration", "decision", "purchase", "post_purchase", "advocacy"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Experience Stage</Label>
                    <Select value={aiForm.experience_stage} onValueChange={(v) => setAiForm((f) => ({ ...f, experience_stage: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["good", "neutral", "bad", "unknown"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Price Sensitivity</Label>
                    <Select value={aiForm.price_sensitivity} onValueChange={(v) => setAiForm((f) => ({ ...f, price_sensitivity: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAiGenerate} disabled={aiGenerating}>
                  {aiGenerating ? (
                    <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1" /> Generate Variants</>
                  )}
                </Button>
              </div>

              {/* Batch history */}
              {batchHistory.length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Previous batches ({batchHistory.length})
                  </button>
                  {showHistory && (
                    <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                      {batchHistory.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs cursor-pointer hover:bg-muted/50"
                          onClick={() => setAiBatch(b)}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{b.channel_type}</Badge>
                            <span>{b.campaign_type.replace(/_/g, " ")}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{b.intent_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={b.status === "approved" ? "default" : b.status === "rejected" ? "destructive" : "secondary"}
                              className="text-[10px]"
                            >
                              {b.status}
                            </Badge>
                            <span className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className={cn("text-[10px]", channelColor[aiBatch.channel_type])}>{aiBatch.channel_type}</Badge>
                  <span className="text-muted-foreground">{aiBatch.campaign_type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{aiBatch.intent_type}</span>
                  {aiBatch.generation_engine && (
                    <Badge variant="outline" className="text-[10px]">{aiBatch.generation_engine}</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setAiBatch(null); }}>
                    ← Back
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAiGenerate} disabled={aiGenerating}>
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1", aiGenerating && "animate-spin")} /> Regenerate
                  </Button>
                  <Button size="sm" onClick={saveAllApproved}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save All Approved
                  </Button>
                </div>
              </div>

              {/* Variant grid: 4 rows × 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1">English</div>
                <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1">Thai</div>
                {STYLES.map((style) => {
                  const enVariant = aiBatch.generated_variants.find((v) => v.style === style && v.language === "en");
                  const thVariant = aiBatch.generated_variants.find((v) => v.style === style && v.language === "th");
                  return [enVariant, thVariant].map((variant, idx) => (
                    <Card key={`${style}-${idx}`} className={cn(
                      "relative",
                      variant?.approval_status === "approved" && "ring-2 ring-green-500/50",
                      variant?.approval_status === "rejected" && "ring-2 ring-destructive/50 opacity-60"
                    )}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">{STYLE_LABELS[style]}</Badge>
                          {variant && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", variant.approval_status === "approved" && "text-green-600")}
                                onClick={() => updateVariantStatus(variant.variant_key, "approved")}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", variant.approval_status === "rejected" && "text-destructive")}
                                onClick={() => updateVariantStatus(variant.variant_key, "rejected")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                              {variant.approval_status === "approved" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-primary"
                                  onClick={() => saveVariantAsTemplate(variant)}
                                  title="Save as template"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        {variant ? (
                          <>
                            {aiBatch.channel_type === "email" && variant.email_subject && (
                              <div className="bg-muted/50 rounded p-1.5">
                                <p className="text-[10px] text-muted-foreground">Subject</p>
                                <p className="text-xs font-medium">{highlightVars(variant.email_subject)}</p>
                              </div>
                            )}
                            <div className="text-xs whitespace-pre-wrap leading-relaxed">
                              {highlightVars(variant.message_text)}
                            </div>
                            {variant.supported_variables.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {variant.supported_variables.map((v) => (
                                  <Badge key={v} variant="secondary" className="text-[9px] bg-primary/10 text-primary">{`{{${v}}}`}</Badge>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No variant generated</p>
                        )}
                      </CardContent>
                    </Card>
                  ));
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
