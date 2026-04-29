import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_CAMPAIGNS } from "./outboundSampleData";
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
  Megaphone, Plus, Search, Calendar, Zap, Target, Users,
  ShieldCheck, BarChart3, Clock, Loader2,
} from "lucide-react";
import { format } from "date-fns";

const CAMPAIGN_TYPES = [
  "sales_followup", "promotion", "education", "win_back",
  "recovery", "upsell", "cross_sell", "enterprise_outreach",
] as const;

const STATUS_LIST = ["draft", "scheduled", "active", "paused", "completed", "archived"] as const;

const CHANNELS = ["line", "email", "whatsapp", "facebook"] as const;

const PREFERENCE_CATEGORIES = [
  { value: "sales_followup", label: "Sales Follow-up" },
  { value: "news_and_promotions", label: "News & Promotions" },
];

const GOAL_METRICS = [
  { value: "conversion_rate", label: "Conversion Rate" },
  { value: "click_rate", label: "Click Rate" },
  { value: "reply_rate", label: "Reply Rate" },
  { value: "open_rate", label: "Open Rate" },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  sales_followup: "Sales Follow-up",
  promotion: "Promotion",
  education: "Education",
  win_back: "Win Back",
  recovery: "Recovery",
  upsell: "Upsell",
  cross_sell: "Cross-sell",
  enterprise_outreach: "Enterprise",
};

interface CampaignForm {
  campaign_name: string;
  campaign_type: string;
  campaign_objective: string;
  scheduling_mode: string;
  allowed_channels: string[];
  priority: number;
  preference_category: string;
  goal_metric: string;
  is_recovery_campaign: boolean;
  start_at: string;
  end_at: string;
  max_sends: string;
}

const defaultForm: CampaignForm = {
  campaign_name: "",
  campaign_type: "promotion",
  campaign_objective: "",
  scheduling_mode: "scheduled",
  allowed_channels: ["line", "email", "whatsapp", "facebook"],
  priority: 100,
  preference_category: "",
  goal_metric: "",
  is_recovery_campaign: false,
  start_at: "",
  end_at: "",
  max_sends: "",
};

export function ContactCenterOutboundCampaigns() {
  const { user } = useAuth();
  const { isSampleMode } = usePartnerDataMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>(defaultForm);

  const { data: liveCampaigns, isLoading: liveLoading } = useQuery({
    queryKey: ["outbound-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isSampleMode,
  });

  const campaigns = isSampleMode ? SAMPLE_CAMPAIGNS : liveCampaigns;
  const isLoading = isSampleMode ? false : liveLoading;

  // Audience preview queries
  const { data: audiencePreview } = useQuery({
    queryKey: ["outbound-audience-preview"],
    queryFn: async () => {
      const { count: totalProfiles } = await supabase
        .from("customer_profiles")
        .select("*", { count: "exact", head: true });
      const { count: suppressed } = await supabase
        .from("customer_preferences")
        .select("*", { count: "exact", head: true })
        .eq("opt_out_all", true);
      return {
        totalProfiles: totalProfiles ?? 0,
        suppressed: suppressed ?? 0,
      };
    },
    enabled: !isSampleMode,
  });

  const createMutation = useMutation({
    mutationFn: async (f: CampaignForm) => {
      const payload: Record<string, unknown> = {
        campaign_name: f.campaign_name,
        campaign_type: f.campaign_type,
        campaign_objective: f.campaign_objective || null,
        scheduling_mode: f.scheduling_mode,
        allowed_channels: f.allowed_channels,
        priority: f.priority,
        preference_category: f.preference_category || null,
        goal_metric: f.goal_metric || null,
        is_recovery_campaign: f.is_recovery_campaign,
        start_at: f.start_at || null,
        end_at: f.end_at || null,
        max_sends: f.max_sends ? parseInt(f.max_sends) : null,
        created_by: user?.id,
      };
      const { error } = await supabase
        .from("outbound_campaigns")
        .insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-campaigns"] });
      setDialogOpen(false);
      setForm(defaultForm);
      toast({ title: "Campaign created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = (campaigns ?? []).filter((c: any) => {
    if (tab !== "all" && c.status !== tab) return false;
    if (search && !c.campaign_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      allowed_channels: prev.allowed_channels.includes(ch)
        ? prev.allowed_channels.filter(c => c !== ch)
        : [...prev.allowed_channels, ch],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Outbound Campaigns
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage outbound campaigns for sales, promotions, and customer engagement
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Campaign
        </Button>
      </div>

      {/* Audience Overview Cards */}
      {audiencePreview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Profiles</p>
                  <p className="text-lg font-bold text-foreground">{audiencePreview.totalProfiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Global Opt-out</p>
                  <p className="text-lg font-bold text-foreground">{audiencePreview.suppressed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Reachable</p>
                  <p className="text-lg font-bold text-foreground">
                    {audiencePreview.totalProfiles - audiencePreview.suppressed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No campaigns found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((c: any) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground truncate">{c.campaign_name}</h3>
                          <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[c.campaign_type] || c.campaign_type}
                          </Badge>
                        </div>
                        {c.campaign_objective && (
                          <p className="text-xs text-muted-foreground truncate">{c.campaign_objective}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            {c.scheduling_mode === "always_on" ? (
                              <><Zap className="h-3 w-3" /> Always-on</>
                            ) : (
                              <><Calendar className="h-3 w-3" />
                                {c.start_at ? format(new Date(c.start_at), "MMM d") : "—"}
                                {c.end_at ? ` → ${format(new Date(c.end_at), "MMM d")}` : ""}
                              </>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> P{c.priority}
                          </span>
                          {c.goal_metric && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" /> {c.goal_metric}
                            </span>
                          )}
                          {c.is_recovery_campaign && (
                            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                              Recovery
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(c.allowed_channels || []).map((ch: string) => (
                          <Badge key={ch} variant="secondary" className="text-[10px] capitalize">
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Outbound Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input
                value={form.campaign_name}
                onChange={(e) => setForm(p => ({ ...p, campaign_name: e.target.value }))}
                placeholder="e.g. Summer Promo Thailand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={form.campaign_type} onValueChange={(v) => setForm(p => ({ ...p, campaign_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduling</Label>
                <Select value={form.scheduling_mode} onValueChange={(v) => setForm(p => ({ ...p, scheduling_mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="always_on">Always-on</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Objective</Label>
              <Input
                value={form.campaign_objective}
                onChange={(e) => setForm(p => ({ ...p, campaign_objective: e.target.value }))}
                placeholder="Free-text goal description"
              />
            </div>

            <div>
              <Label>Channels</Label>
              <div className="flex gap-3 mt-1">
                {CHANNELS.map(ch => (
                  <label key={ch} className="flex items-center gap-1.5 text-sm capitalize">
                    <Checkbox
                      checked={form.allowed_channels.includes(ch)}
                      onCheckedChange={() => toggleChannel(ch)}
                    />
                    {ch}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority (lower = higher)</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 100 }))}
                />
              </div>
              <div>
                <Label>Max Sends</Label>
                <Input
                  type="number"
                  value={form.max_sends}
                  onChange={(e) => setForm(p => ({ ...p, max_sends: e.target.value }))}
                  placeholder="Optional cap"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preference Category</Label>
                <Select value={form.preference_category} onValueChange={(v) => setForm(p => ({ ...p, preference_category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {PREFERENCE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Goal Metric</Label>
                <Select value={form.goal_metric} onValueChange={(v) => setForm(p => ({ ...p, goal_metric: v }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {GOAL_METRICS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.scheduling_mode === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm(p => ({ ...p, start_at: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm(p => ({ ...p, end_at: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_recovery_campaign}
                onCheckedChange={(v) => setForm(p => ({ ...p, is_recovery_campaign: !!v }))}
              />
              Recovery campaign (bypasses bad-experience suppression)
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.campaign_name || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
