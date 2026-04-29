import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, PhoneCall, Settings, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";

export function VoiceChannelCard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["voice-bot-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_bot_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: callStats } = useQuery({
    queryKey: ["voice-call-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_call_logs")
        .select("status, duration_seconds")
        .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      const logs = data || [];
      return {
        total: logs.length,
        completed: logs.filter((l: any) => l.status === "completed").length,
        escalated: logs.filter((l: any) => l.status === "escalated").length,
        avgDuration: logs.length > 0
          ? Math.round(logs.reduce((sum: number, l: any) => sum + (l.duration_seconds || 0), 0) / logs.length)
          : 0,
      };
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!config?.id) return;
      const { error } = await supabase
        .from("voice_bot_config")
        .update(updates)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-bot-config"] });
      toast.success("Voice bot settings updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [form, setForm] = useState<Record<string, any>>({});

  const startEditing = () => {
    setForm({
      did_number: config?.did_number || "",
      sip_trunk_host: config?.sip_trunk_host || "",
      greeting_message: config?.greeting_message || "",
      mode: config?.mode || "ai",
      forward_number: config?.forward_number || "",
      max_call_duration_seconds: config?.max_call_duration_seconds || 300,
    });
    setIsEditing(true);
  };

  const saveConfig = () => {
    updateConfig.mutate(form);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Phone className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-base">Voice Bot</CardTitle>
              <CardDescription>Not configured or no permission. Please log in again.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Phone className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-base">Voice Bot</CardTitle>
              <CardDescription>AI-powered phone support with STT/TTS</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={config?.is_enabled ? "default" : "secondary"}>
              {config ? (config.is_enabled ? "Active" : "Inactive") : "No Config"}
            </Badge>
            <Switch
              checked={config?.is_enabled || false}
              disabled={!config}
              onCheckedChange={(checked) => updateConfig.mutate({ is_enabled: checked })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        {callStats && callStats.total > 0 && (
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{callStats.total}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{callStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{callStats.escalated}</p>
              <p className="text-xs text-muted-foreground">Escalated</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{callStats.avgDuration}s</p>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </div>
          </div>
        )}

        {/* Config display / edit */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">DID Number</Label>
                <Input
                  value={form.did_number}
                  onChange={(e) => setForm({ ...form, did_number: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SIP Trunk Host</Label>
                <Input
                  value={form.sip_trunk_host}
                  onChange={(e) => setForm({ ...form, sip_trunk_host: e.target.value })}
                  placeholder="sip.provider.com"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mode</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_live">AI Live (Gemini Real-Time)</SelectItem>
                  <SelectItem value="ai">AI Bot (STT → LLM → TTS)</SelectItem>
                  <SelectItem value="ivr">IVR Menu</SelectItem>
                  <SelectItem value="forward">Forward to Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.mode === "forward" && (
              <div className="space-y-1">
                <Label className="text-xs">Forward Number</Label>
                <Input
                  value={form.forward_number}
                  onChange={(e) => setForm({ ...form, forward_number: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Greeting Message</Label>
              <Input
                value={form.greeting_message}
                onChange={(e) => setForm({ ...form, greeting_message: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveConfig} disabled={updateConfig.isPending}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">DID Number</span>
              <span className="font-medium">{config?.did_number || "Not configured"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mode</span>
              <Badge variant="outline">{config?.mode || "ai"}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Webhook</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-webhook`}
              </code>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={startEditing}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-1"
              onClick={() => navigate("/admin/contact-center/voice-test")}
            >
              <Mic className="h-4 w-4 mr-2" />
              Test Voice Bot (Live)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-1"
              onClick={() => navigate("/admin/contact-center/bridge-logs")}
            >
              📡 View Bridge Logs (Live)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
