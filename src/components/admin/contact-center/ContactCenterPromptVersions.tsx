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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Eye, GitCompare, Power, PowerOff, Clock, FileText, Filter } from "lucide-react";
import { format } from "date-fns";

const PROMPT_TYPES = [
  "global_system_prompt", "brand_tone_prompt", "sales_prompt", "support_prompt",
  "refund_prompt", "escalation_prompt", "dead_air_followup_prompt",
  "language_specific_prompt", "channel_specific_prompt", "voice_agent_prompt",
] as const;

const CHANNELS = ["web_chat", "line", "whatsapp", "facebook", "instagram", "voice"] as const;
const LANGUAGES = ["en", "th", "ja", "ko", "zh", "fr", "de", "es", "pt", "ar"] as const;

type PromptVersion = {
  id: string;
  version_name: string;
  prompt_type: string;
  description: string | null;
  prompt_text: string;
  language: string | null;
  channel_scope: string[] | null;
  intent_scope: string[] | null;
  model_scope: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  version_name: "",
  prompt_type: "global_system_prompt",
  description: "",
  prompt_text: "",
  language: "",
  channel_scope: [] as string[],
  intent_scope: "",
  is_active: false,
};

export function ContactCenterPromptVersions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["prompt-versions", filterType, filterStatus],
    queryFn: async () => {
      let q = supabase.from("prompt_versions").select("*").order("created_at", { ascending: false });
      if (filterType !== "all") q = q.eq("prompt_type", filterType);
      if (filterStatus === "active") q = q.eq("is_active", true);
      if (filterStatus === "inactive") q = q.eq("is_active", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PromptVersion[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        version_name: form.version_name,
        prompt_type: form.prompt_type,
        description: form.description || null,
        prompt_text: form.prompt_text,
        language: form.language || null,
        channel_scope: form.channel_scope.length > 0 ? form.channel_scope : null,
        intent_scope: form.intent_scope ? form.intent_scope.split(",").map((s) => s.trim()) : null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from("prompt_versions").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prompt_versions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Prompt updated" : "Prompt created" });
      qc.invalidateQueries({ queryKey: ["prompt-versions"] });
      setEditorOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("prompt_versions").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompt-versions"] });
      toast({ title: "Status updated" });
    },
  });

  const openEdit = (v: PromptVersion) => {
    setEditingId(v.id);
    setForm({
      version_name: v.version_name,
      prompt_type: v.prompt_type,
      description: v.description || "",
      prompt_text: v.prompt_text,
      language: v.language || "",
      channel_scope: v.channel_scope || [],
      intent_scope: v.intent_scope?.join(", ") || "",
      is_active: v.is_active,
    });
    setEditorOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  // Compare modal data
  const compareA = compareIds ? versions.find((v) => v.id === compareIds[0]) : null;
  const compareB = compareIds ? versions.find((v) => v.id === compareIds[1]) : null;
  const previewVersion = previewId ? versions.find((v) => v.id === previewId) : null;

  // Group by type for stats
  const activeCount = versions.filter((v) => v.is_active).length;
  const typeGroups = PROMPT_TYPES.map((t) => ({ type: t, count: versions.filter((v) => v.prompt_type === t).length })).filter((g) => g.count > 0);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{versions.length}</p><p className="text-xs text-muted-foreground">Total Versions</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{activeCount}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{versions.length - activeCount}</p><p className="text-xs text-muted-foreground">Inactive</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{typeGroups.length}</p><p className="text-xs text-muted-foreground">Prompt Types Used</p></CardContent></Card>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROMPT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New Version</Button>
      </div>

      {/* Version List */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Loading…</p>
      ) : versions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No prompt versions found. Create your first one.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{v.version_name}</h3>
                    <Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "Active" : "Inactive"}</Badge>
                    <Badge variant="outline">{v.prompt_type.replace(/_/g, " ")}</Badge>
                    {v.language && <Badge variant="outline" className="text-xs">{v.language.toUpperCase()}</Badge>}
                    {v.channel_scope?.map((ch) => <Badge key={ch} variant="outline" className="text-xs">{ch}</Badge>)}
                  </div>
                  {v.description && <p className="text-sm text-muted-foreground truncate">{v.description}</p>}
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(v.created_at), "MMM d, yyyy HH:mm")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setPreviewId(v.id)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const others = versions.filter((o) => o.prompt_type === v.prompt_type && o.id !== v.id);
                    if (others.length > 0) setCompareIds([v.id, others[0].id]);
                    else toast({ title: "No other version of this type to compare" });
                  }}><GitCompare className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: v.id, active: !v.is_active })}>
                    {v.is_active ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-green-600" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Prompt Version" : "New Prompt Version"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Version Name</Label>
                <Input value={form.version_name} onChange={(e) => setForm({ ...form, version_name: e.target.value })} placeholder="e.g. v2.1-empathy-boost" />
              </div>
              <div className="space-y-2">
                <Label>Prompt Type</Label>
                <Select value={form.prompt_type} onValueChange={(v) => setForm({ ...form, prompt_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROMPT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What changed in this version" />
            </div>
            <div className="space-y-2">
              <Label>Prompt Text</Label>
              <Textarea value={form.prompt_text} onChange={(e) => setForm({ ...form, prompt_text: e.target.value })} rows={12} className="font-mono text-sm" placeholder="Enter prompt text…" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={form.language || "any"} onValueChange={(v) => setForm({ ...form, language: v === "any" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Language</SelectItem>
                    {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel Scope</Label>
                <div className="flex flex-wrap gap-1">
                  {CHANNELS.map((ch) => (
                    <Badge key={ch} variant={form.channel_scope.includes(ch) ? "default" : "outline"} className="cursor-pointer text-xs"
                      onClick={() => setForm({ ...form, channel_scope: form.channel_scope.includes(ch) ? form.channel_scope.filter((c) => c !== ch) : [...form.channel_scope, ch] })}>
                      {ch}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Intent Scope (comma-sep)</Label>
                <Input value={form.intent_scope} onChange={(e) => setForm({ ...form, intent_scope: e.target.value })} placeholder="sales, refund" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active in production</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.version_name || !form.prompt_text || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewVersion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> {previewVersion.version_name}
                  <Badge variant={previewVersion.is_active ? "default" : "secondary"}>{previewVersion.is_active ? "Active" : "Inactive"}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{previewVersion.prompt_type.replace(/_/g, " ")}</Badge>
                  {previewVersion.language && <Badge variant="outline">{previewVersion.language.toUpperCase()}</Badge>}
                  {previewVersion.channel_scope?.map((ch) => <Badge key={ch} variant="outline">{ch}</Badge>)}
                  {previewVersion.intent_scope?.map((i) => <Badge key={i} variant="outline">{i}</Badge>)}
                </div>
                {previewVersion.description && <p className="text-sm text-muted-foreground">{previewVersion.description}</p>}
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-foreground">{previewVersion.prompt_text}</pre>
                </div>
                <p className="text-xs text-muted-foreground">Created: {format(new Date(previewVersion.created_at), "MMM d, yyyy HH:mm")}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={!!compareIds} onOpenChange={() => setCompareIds(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Compare Versions</DialogTitle></DialogHeader>
          {compareIds && (
            <div className="space-y-3">
              {/* Version selector for B side */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Compare with:</span>
                <Select value={compareIds[1]} onValueChange={(v) => setCompareIds([compareIds[0], v])}>
                  <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {versions.filter((o) => o.id !== compareIds[0]).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.version_name} ({o.prompt_type.replace(/_/g, " ")})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[compareA, compareB].map((v, i) => v && (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{v.version_name}</h4>
                      <Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(v.created_at), "MMM d, yyyy HH:mm")}</p>
                    <div className="bg-muted p-3 rounded-lg max-h-[50vh] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">{v.prompt_text}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
