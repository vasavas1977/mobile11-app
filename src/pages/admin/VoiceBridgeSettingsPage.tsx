import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Info,
  PlugZap,
  RotateCcw,
  Save,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  useVoiceSettings,
  type EditableVoiceSettings,
  type VoiceSettings,
  type VoiceSettingsHistoryRow,
} from "@/hooks/useVoiceSettings";

const ALLOWED_VOICES = ["Aoede", "Charon", "Fenrir", "Kore", "Puck"];
const FIELD_LABELS: Record<keyof EditableVoiceSettings, string> = {
  gemini_voice: "Gemini voice",
  voice_sms_enabled: "Voice SMS enabled",
  voice_rating_enabled: "Voice rating enabled",
  voice_memory_enabled: "Voice memory enabled",
  voice_silence_probe_guard_enabled: "Silence probe guard enabled",
  voice_rating_window_ms: "Rating window (ms)",
  voice_silence_probe_guard_ms: "Silence probe guard (ms)",
};

function toEditable(s: VoiceSettings): EditableVoiceSettings {
  return {
    gemini_voice: s.gemini_voice,
    voice_sms_enabled: s.voice_sms_enabled,
    voice_rating_enabled: s.voice_rating_enabled,
    voice_memory_enabled: s.voice_memory_enabled,
    voice_silence_probe_guard_enabled: s.voice_silence_probe_guard_enabled,
    voice_rating_window_ms: s.voice_rating_window_ms,
    voice_silence_probe_guard_ms: s.voice_silence_probe_guard_ms,
  };
}

function shallowEqual(a: EditableVoiceSettings, b: EditableVoiceSettings) {
  return (Object.keys(a) as (keyof EditableVoiceSettings)[]).every(
    (k) => a[k] === b[k],
  );
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function diffFields(
  oldSnap: Record<string, unknown> | null,
  newSnap: Record<string, unknown>,
): Array<{ field: string; from: unknown; to: unknown }> {
  if (!oldSnap) return [];
  const keys = Object.keys(FIELD_LABELS) as (keyof EditableVoiceSettings)[];
  const out: Array<{ field: string; from: unknown; to: unknown }> = [];
  for (const k of keys) {
    if (oldSnap[k] !== newSnap[k]) {
      out.push({ field: FIELD_LABELS[k], from: oldSnap[k], to: newSnap[k] });
    }
  }
  return out;
}

function HistoryItem({ row }: { row: VoiceSettingsHistoryRow }) {
  const [expanded, setExpanded] = useState(false);
  const diffs = diffFields(row.snapshot, row.new_snapshot);
  return (
    <div className="border rounded-md p-3 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={row.change_type === "create" ? "secondary" : "default"}>
          {row.change_type}
        </Badge>
        <span
          className="text-muted-foreground"
          title={new Date(row.changed_at).toLocaleString()}
        >
          {formatRelative(row.changed_at)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          by {row.changed_by ? row.changed_by.slice(0, 8) : "system"}
        </span>
        <span className="text-muted-foreground">·</span>
        <code
          className="text-xs text-muted-foreground"
          title={row.config_hash}
        >
          {row.config_hash.slice(0, 10)}
        </code>
        <button
          className="ml-auto inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          {expanded ? "Hide JSON" : "Show JSON"}
        </button>
      </div>
      {row.reason && (
        <div className="mt-2 text-xs italic text-muted-foreground">
          Reason: {row.reason}
        </div>
      )}
      {row.change_type === "update" && diffs.length > 0 && (
        <ul className="mt-2 space-y-1">
          {diffs.map((d) => (
            <li key={d.field} className="text-xs">
              <span className="font-medium">{d.field}</span>:{" "}
              <code className="bg-muted px-1 rounded">{String(d.from)}</code>
              {" → "}
              <code className="bg-muted px-1 rounded">{String(d.to)}</code>
            </li>
          ))}
        </ul>
      )}
      {expanded && (
        <pre className="mt-2 text-[11px] bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(
            { snapshot: row.snapshot, new_snapshot: row.new_snapshot, config_hash: row.config_hash },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}

export default function VoiceBridgeSettingsPage() {
  const navigate = useNavigate();
  const { settings, history, isLoading, isError, error, save, isSaving, refetch } =
    useVoiceSettings();

  const [draft, setDraft] = useState<EditableVoiceSettings | null>(null);
  const [reason, setReason] = useState("");
  const [endpointResult, setEndpointResult] = useState<{
    ok: boolean;
    status: number;
    body: unknown;
    etag?: string | null;
  } | null>(null);
  const [endpointTesting, setEndpointTesting] = useState(false);

  const testEndpoint = async () => {
    setEndpointTesting(true);
    setEndpointResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("voice-bridge-config", {
        method: "GET",
      });
      if (error) {
        setEndpointResult({ ok: false, status: 0, body: { error: error.message } });
        toast.error("Endpoint test failed");
      } else {
        setEndpointResult({ ok: true, status: 200, body: data });
        const liveHash = (data as any)?.config_hash;
        if (liveHash && settings && liveHash === settings.config_hash) {
          toast.success("Endpoint OK · hash matches DB");
        } else {
          toast.warning("Endpoint OK but hash differs from current DB row");
        }
      }
    } catch (e: any) {
      setEndpointResult({ ok: false, status: 0, body: { error: String(e?.message ?? e) } });
      toast.error("Endpoint test error");
    } finally {
      setEndpointTesting(false);
    }
  };


  useEffect(() => {
    if (settings && !draft) setDraft(toEditable(settings));
  }, [settings, draft]);

  const isDirty = useMemo(() => {
    if (!settings || !draft) return false;
    return !shallowEqual(toEditable(settings), draft);
  }, [settings, draft]);

  const onDiscard = () => {
    if (settings) setDraft(toEditable(settings));
    setReason("");
  };

  const onSave = async () => {
    if (!settings || !draft) return;
    if (draft.voice_rating_window_ms <= 0 || draft.voice_silence_probe_guard_ms <= 0) {
      toast.error("Timing values must be greater than 0");
      return;
    }
    if (!draft.gemini_voice.trim()) {
      toast.error("Voice name cannot be empty");
      return;
    }
    try {
      await save({
        values: draft,
        originalUpdatedAt: settings.updated_at,
        reason: reason.trim() || null,
      });
      toast.success("Voice settings saved");
      setReason("");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  };

  if (isLoading || !settings || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">
            Failed to load settings: {error?.message ?? "unknown error"}
          </p>
          <Button variant="outline" className="mt-3" onClick={refetch}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Voice Bridge Settings</h2>
          <p className="text-sm text-muted-foreground">
            Last updated{" "}
            <span title={new Date(settings.updated_at).toLocaleString()}>
              {formatRelative(settings.updated_at)}
            </span>{" "}
            by {settings.updated_by ? settings.updated_by.slice(0, 8) : "system"}
            {" · "}
            <code className="text-xs">{settings.config_hash.slice(0, 10)}</code>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/voice-bridge/health")}>
          <Activity className="h-4 w-4 mr-1" /> Health
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/contact-center/bridge-logs")}>
          <ScrollText className="h-4 w-4 mr-1" /> Live logs
        </Button>
        <Button variant="outline" size="sm" onClick={testEndpoint} disabled={endpointTesting}>
          <PlugZap className="h-4 w-4 mr-1" />
          {endpointTesting ? "Testing…" : "Test endpoint"}
        </Button>
      </div>

      {/* Phase 4 banner */}
      <div className="flex gap-3 border rounded-lg p-4 bg-muted/40">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm space-y-2">
          <p className="font-medium">
            Phase 4: Bridge polls this config every 60s when{" "}
            <code className="text-xs">USE_REMOTE_CONFIG=1</code> is set on EC2.
          </p>
          <p className="text-muted-foreground">
            <strong>Precedence (last wins):</strong> hardcoded defaults &lt;
            remote config (this page) &lt; env overrides on EC2. If a setting
            is pinned by an env var (e.g.{" "}
            <code className="text-xs">VOICE_SMS_ENABLED=0</code>), changes here
            will not affect the live bridge until that env var is removed.
            Unset env vars (the production default today, except{" "}
            <code className="text-xs">GEMINI_VOICE</code>) let this page take
            over.
          </p>
          <p className="text-muted-foreground">
            Voice changes apply to the <em>next</em> call (Gemini setup is
            per-session). Use <strong>Test endpoint</strong> above to verify
            what the bridge will see on its next poll.
          </p>
        </div>
      </div>

      {/* Endpoint test result */}
      {endpointResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PlugZap className="h-4 w-4" />
              Endpoint response
              <Badge variant={endpointResult.ok ? "default" : "destructive"}>
                {endpointResult.ok ? "OK" : "FAIL"}
              </Badge>
            </CardTitle>
            <CardDescription>
              GET /functions/v1/voice-bridge-config
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-[11px] bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(endpointResult.body, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}


      {/* Feature flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
          <CardDescription>Toggle voice-bridge add-ons.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["voice_sms_enabled", "Voice SMS", "Allow the bot to send SMS during a call."],
              ["voice_rating_enabled", "Voice rating", "Capture a post-call rating."],
              ["voice_memory_enabled", "Voice memory", "Persist customer memory across calls."],
              [
                "voice_silence_probe_guard_enabled",
                "Silence probe guard",
                "Suppress repeated silence probes within the configured window.",
              ],
            ] as Array<[keyof EditableVoiceSettings, string, string]>
          ).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={Boolean(draft[key])}
                onCheckedChange={(v) => setDraft({ ...draft, [key]: v } as EditableVoiceSettings)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Voice & timing */}
      <Card>
        <CardHeader>
          <CardTitle>Voice & timing</CardTitle>
          <CardDescription>Gemini voice and timing windows (in milliseconds).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gemini_voice">Gemini voice</Label>
            <Input
              id="gemini_voice"
              value={draft.gemini_voice}
              onChange={(e) => setDraft({ ...draft, gemini_voice: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Allowed values (per Gemini Live): {ALLOWED_VOICES.join(", ")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating_window">Rating window (ms)</Label>
              <Input
                id="rating_window"
                type="number"
                min={1}
                value={draft.voice_rating_window_ms}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    voice_rating_window_ms: Number(e.target.value || 0),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suggested: 30 000 – 120 000
              </p>
            </div>
            <div>
              <Label htmlFor="probe_guard">Silence probe guard (ms)</Label>
              <Input
                id="probe_guard"
                type="number"
                min={1}
                value={draft.voice_silence_probe_guard_ms}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    voice_silence_probe_guard_ms: Number(e.target.value || 0),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suggested: 1 000 – 10 000
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit history */}
      <Card>
        <CardHeader>
          <CardTitle>Audit history</CardTitle>
          <CardDescription>Last 20 changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          )}
          {history.map((row) => (
            <HistoryItem key={row.id} row={row} />
          ))}
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur p-3 flex items-center gap-3 z-40">
          <div className="flex-1 max-w-md">
            <Textarea
              placeholder="Reason for change (optional, recommended)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={1}
              className="min-h-[40px]"
            />
          </div>
          <Button variant="outline" onClick={onDiscard} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-1" /> Discard
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
