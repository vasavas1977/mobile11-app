import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Clock,
  Zap,
  Server,
  ScrollText,
  Rocket,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HeartbeatRow {
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface BootRow {
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface ErrorRow {
  id: string;
  created_at: string;
  level: string;
  stage: string | null;
  message: string | null;
  call_sid: string | null;
}

type HealthStatus = "healthy" | "stale" | "down" | "unknown";

function pickStatus(lastHbAt: string | null): { status: HealthStatus; ageSec: number | null } {
  if (!lastHbAt) return { status: "unknown", ageSec: null };
  const ageSec = Math.round((Date.now() - new Date(lastHbAt).getTime()) / 1000);
  if (ageSec <= 90) return { status: "healthy", ageSec };
  if (ageSec <= 300) return { status: "stale", ageSec };
  return { status: "down", ageSec };
}

function formatUptime(seconds: number | null): string {
  if (seconds == null) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatAge(seconds: number | null): string {
  if (seconds == null) return "never";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

const STATUS_STYLE: Record<HealthStatus, { bg: string; text: string; label: string; Icon: typeof CheckCircle2 }> = {
  healthy: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Healthy", Icon: CheckCircle2 },
  stale: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Stale", Icon: AlertTriangle },
  down: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Down", Icon: XCircle },
  unknown: { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", label: "No data", Icon: AlertTriangle },
};

export default function VoiceBridgeHealthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lastHb, setLastHb] = useState<HeartbeatRow | null>(null);
  const [lastBoot, setLastBoot] = useState<BootRow | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorRow[]>([]);
  const [errorCountLastHour, setErrorCountLastHour] = useState(0);
  const [eventsLastHour, setEventsLastHour] = useState(0);

  async function load() {
    setLoading(true);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [hb, boot, errs, errCount, evtCount] = await Promise.all([
      supabase
        .from("voice_bridge_logs")
        .select("created_at, metadata")
        .eq("stage", "bridge_heartbeat")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("voice_bridge_logs")
        .select("created_at, metadata")
        .eq("stage", "bridge_boot")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("voice_bridge_logs")
        .select("id, created_at, level, stage, message, call_sid")
        .in("level", ["error", "warn"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("voice_bridge_logs")
        .select("*", { count: "exact", head: true })
        .eq("level", "error")
        .gte("created_at", oneHourAgo),
      supabase
        .from("voice_bridge_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo),
    ]);
    setLastHb((hb.data as HeartbeatRow) ?? null);
    setLastBoot((boot.data as BootRow) ?? null);
    setRecentErrors((errs.data as ErrorRow[]) ?? []);
    setErrorCountLastHour(errCount.count ?? 0);
    setEventsLastHour(evtCount.count ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const { status, ageSec } = pickStatus(lastHb?.created_at ?? null);
  const style = STATUS_STYLE[status];
  const StatusIcon = style.Icon;

  const hbMeta = (lastHb?.metadata ?? {}) as Record<string, unknown>;
  const bootMeta = (lastBoot?.metadata ?? {}) as Record<string, unknown>;

  const bufferSize = typeof hbMeta.buffer_size === "number" ? hbMeta.buffer_size : null;
  const dropped = typeof hbMeta.dropped === "number" ? hbMeta.dropped : null;
  const totalFlushed = typeof hbMeta.total_flushed === "number" ? hbMeta.total_flushed : null;
  const lastFlushError = typeof hbMeta.last_flush_error === "string" ? hbMeta.last_flush_error : null;
  const denoVersion = typeof bootMeta.deno_version === "string" ? bootMeta.deno_version : "—";
  const hostname = typeof bootMeta.hostname === "string" ? bootMeta.hostname : "—";
  const pid = typeof bootMeta.pid === "number" ? bootMeta.pid : null;

  const uptimeSec = lastBoot?.created_at
    ? Math.round((Date.now() - new Date(lastBoot.created_at).getTime()) / 1000)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Voice Bridge Health</h2>
          <p className="text-sm text-muted-foreground">
            Live status of the Jambonz/Gemini bridge — derived from heartbeat &amp; lifecycle logs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/voice-bridge/settings")}>
          <Settings className="h-4 w-4 mr-1" /> Settings
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/contact-center/bridge-logs")}>
          <ScrollText className="h-4 w-4 mr-1" /> Live logs
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/gemini-bridge")}>
          <Rocket className="h-4 w-4 mr-1" /> Deploy
        </Button>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status hero */}
      <div className={`flex items-start gap-4 border rounded-lg p-5 ${style.bg}`}>
        <StatusIcon className={`h-8 w-8 ${style.text}`} />
        <div className="flex-1">
          <div className={`text-lg font-semibold ${style.text}`}>{style.label}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Last heartbeat: {formatAge(ageSec)}
            {lastHb?.created_at && ` · ${new Date(lastHb.created_at).toLocaleString()}`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Heartbeats arrive every ~60s. Healthy ≤ 90s · Stale ≤ 5m · Down &gt; 5m
          </div>
        </div>
        <Badge variant="outline" className={`${style.text} ${style.bg} border-current`}>
          {status.toUpperCase()}
        </Badge>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Uptime"
          value={formatUptime(uptimeSec)}
          hint={lastBoot?.created_at ? `Booted ${new Date(lastBoot.created_at).toLocaleString()}` : "No boot event"}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="Events / hr"
          value={String(eventsLastHour)}
          hint={`${errorCountLastHour} errors in the last hour`}
          tone={errorCountLastHour > 0 ? "warn" : "ok"}
        />
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="Log buffer"
          value={bufferSize != null ? String(bufferSize) : "—"}
          hint={dropped != null ? `${dropped} dropped · ${totalFlushed ?? 0} flushed` : "—"}
          tone={dropped && dropped > 0 ? "warn" : "ok"}
        />
        <MetricCard
          icon={<Server className="h-4 w-4" />}
          label="Process"
          value={pid != null ? `pid ${pid}` : "—"}
          hint={`${hostname} · Deno ${denoVersion}`}
        />
      </div>

      {/* Flush diagnostic */}
      {lastFlushError && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-amber-900">Last log flush failed</div>
              <div className="text-amber-800 font-mono text-xs mt-1">{lastFlushError}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent issues */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Recent warnings &amp; errors</h3>
          </div>
          <Badge variant="outline">{recentErrors.length}</Badge>
        </div>
        {recentErrors.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No warnings or errors in the recent log window. ✨
          </div>
        ) : (
          <div className="divide-y">
            {recentErrors.map((r) => (
              <div key={r.id} className="py-2 flex items-start gap-3">
                <Badge
                  variant="outline"
                  className={
                    r.level === "error"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }
                >
                  {r.level}
                </Badge>
                <div className="flex-1 text-xs">
                  <div className="font-mono text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {r.stage && <> · {r.stage}</>}
                    {r.call_sid && <> · {r.call_sid}</>}
                  </div>
                  <div className="mt-0.5">{r.message ?? "(no message)"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <Card className={`p-4 ${tone === "warn" ? "border-amber-200" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}
