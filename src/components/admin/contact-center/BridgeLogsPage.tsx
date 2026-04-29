import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Radio, Filter, AlertTriangle, CheckCircle2, Rocket, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BridgeLogRow {
  id: string;
  created_at: string;
  call_sid: string | null;
  cid: string | null;
  caller_number: string | null;
  did_number: string | null;
  level: string;
  stage: string | null;
  message: string | null;
  elapsed_ms: number | null;
  metadata: Record<string, unknown> | null;
}

const LEVEL_COLOR: Record<string, string> = {
  stage: "bg-blue-100 text-blue-700 border-blue-200",
  info: "bg-gray-100 text-gray-700 border-gray-200",
  warn: "bg-amber-100 text-amber-800 border-amber-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

export function BridgeLogsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BridgeLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(true);
  const [callSidFilter, setCallSidFilter] = useState("");
  const [didFilter, setDidFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [diag, setDiag] = useState<{
    lastBootAt: string | null;
    lastHeartbeatAt: string | null;
    lastAnyAt: string | null;
    countLastHour: number;
  }>({ lastBootAt: null, lastHeartbeatAt: null, lastAnyAt: null, countLastHour: 0 });

  async function fetchLogs() {
    setLoading(true);
    let q = supabase
      .from("voice_bridge_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (callSidFilter) q = q.ilike("call_sid", `%${callSidFilter}%`);
    if (didFilter) q = q.ilike("did_number", `%${didFilter}%`);
    if (levelFilter !== "all") q = q.eq("level", levelFilter);
    const { data, error } = await q;
    if (!error && data) setRows(data as BridgeLogRow[]);
    setLoading(false);
  }

  async function fetchDiagnostics() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [{ data: lastAny }, { data: lastBoot }, { data: lastHb }, { count }] =
      await Promise.all([
        supabase.from("voice_bridge_logs").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("voice_bridge_logs").select("created_at").eq("stage", "bridge_boot").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("voice_bridge_logs").select("created_at").eq("stage", "bridge_heartbeat").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("voice_bridge_logs").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo),
      ]);
    setDiag({
      lastBootAt: lastBoot?.created_at ?? null,
      lastHeartbeatAt: lastHb?.created_at ?? null,
      lastAnyAt: lastAny?.created_at ?? null,
      countLastHour: count ?? 0,
    });
  }

  useEffect(() => {
    fetchLogs();
    fetchDiagnostics();
    const t = setInterval(fetchDiagnostics, 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSidFilter, didFilter, levelFilter]);

  // Realtime subscription
  useEffect(() => {
    if (!live) return;
    const channel = supabase
      .channel("voice_bridge_logs-tail")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "voice_bridge_logs" },
        (payload) => {
          const newRow = payload.new as BridgeLogRow;
          // Apply current filters
          if (callSidFilter && !newRow.call_sid?.includes(callSidFilter)) return;
          if (didFilter && !newRow.did_number?.includes(didFilter)) return;
          if (levelFilter !== "all" && newRow.level !== levelFilter) return;
          setRows((prev) => [newRow, ...prev].slice(0, 300));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [live, callSidFilter, didFilter, levelFilter]);

  const grouped = useMemo(() => {
    const m = new Map<string, BridgeLogRow[]>();
    for (const r of rows) {
      const key = r.call_sid || "(no callSid)";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    return m;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Voice Bridge Logs</h2>
          <p className="text-sm text-muted-foreground">
            Live lifecycle events from the Jambonz/Gemini bridge — no SSH needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="live-toggle" checked={live} onCheckedChange={setLive} />
          <Label htmlFor="live-toggle" className="flex items-center gap-1 text-sm">
            <Radio className={`h-4 w-4 ${live ? "text-green-600 animate-pulse" : "text-gray-400"}`} />
            Live tail
          </Label>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/voice-bridge/health")}>
            <Activity className="h-4 w-4 mr-1" />
            Health
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Diagnostics banner */}
      <DiagnosticsBanner diag={diag} navigate={navigate} />

      <div className="flex flex-wrap gap-2 items-center bg-white border rounded-lg p-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by call SID…"
          value={callSidFilter}
          onChange={(e) => setCallSidFilter(e.target.value)}
          className="w-56"
        />
        <Input
          placeholder="Filter by DID…"
          value={didFilter}
          onChange={(e) => setDidFilter(e.target.value)}
          className="w-44"
        />
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="stage">Stage</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warn</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {rows.length} events · {grouped.size} call(s)
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Time</TableHead>
              <TableHead className="w-[80px]">Level</TableHead>
              <TableHead className="w-[180px]">Stage</TableHead>
              <TableHead className="w-[80px]">Elapsed</TableHead>
              <TableHead>Call SID / CID</TableHead>
              <TableHead>From → DID</TableHead>
              <TableHead>Message / Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No bridge logs yet. Place a call to your DID — events will appear here within ~2 seconds.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-mono">
                  {new Date(r.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={LEVEL_COLOR[r.level] || ""}>
                    {r.level}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">{r.stage || "—"}</TableCell>
                <TableCell className="text-xs font-mono">
                  {r.elapsed_ms != null ? `${r.elapsed_ms}ms` : "—"}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  <div className="truncate max-w-[200px]" title={r.call_sid || ""}>
                    {r.call_sid || "—"}
                  </div>
                  {r.cid && <div className="text-muted-foreground">cid={r.cid}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  {r.caller_number || "—"} → {r.did_number || "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {r.message && <div className="mb-1">{r.message}</div>}
                  {r.metadata && Object.keys(r.metadata).length > 0 && (
                    <details>
                      <summary className="cursor-pointer text-muted-foreground">
                        metadata ({Object.keys(r.metadata).length})
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-[10px] overflow-x-auto max-w-md">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface DiagProps {
  diag: {
    lastBootAt: string | null;
    lastHeartbeatAt: string | null;
    lastAnyAt: string | null;
    countLastHour: number;
  };
  navigate: ReturnType<typeof useNavigate>;
}

function DiagnosticsBanner({ diag, navigate }: DiagProps) {
  const now = Date.now();
  const lastAnyMs = diag.lastAnyAt ? new Date(diag.lastAnyAt).getTime() : 0;
  const lastHbMs = diag.lastHeartbeatAt ? new Date(diag.lastHeartbeatAt).getTime() : 0;
  const ageMin = lastAnyMs ? Math.round((now - lastAnyMs) / 60000) : Infinity;
  const hbAgeSec = lastHbMs ? Math.round((now - lastHbMs) / 1000) : Infinity;

  const neverSeen = !diag.lastAnyAt;
  const stale = ageMin > 10;
  const hbAlive = hbAgeSec < 180; // heartbeat within last 3 min

  let tone: "ok" | "warn" | "danger" = "ok";
  let icon = <CheckCircle2 className="h-5 w-5" />;
  let title = "Bridge logging is healthy";
  let detail = `${diag.countLastHour} events in the last hour. Last event ${ageMin === 0 ? "just now" : `${ageMin} min ago`}.`;

  if (neverSeen) {
    tone = "danger";
    icon = <AlertTriangle className="h-5 w-5" />;
    title = "No bridge logs have ever been received";
    detail = "The bridge logger is not live on the VPS yet. If Auto-Deploy looked successful, the remote deploy agent may be outdated and skipping bridge-logger.ts.";
  } else if (stale && !hbAlive) {
    tone = "warn";
    icon = <AlertTriangle className="h-5 w-5" />;
    title = `No events for ${ageMin} minutes`;
    detail = "The bridge process may be down or still running an older bundle. If deploys keep succeeding without logs, update the VPS deploy agent and retry.";
  } else if (stale && hbAlive) {
    tone = "ok";
    icon = <CheckCircle2 className="h-5 w-5" />;
    title = "Bridge is alive (heartbeat received)";
    detail = `Heartbeat ${hbAgeSec}s ago — bridge is running but no calls have come in for ${ageMin} min.`;
  }

  const bgClass = tone === "danger"
    ? "bg-red-50 border-red-200 text-red-900"
    : tone === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-emerald-50 border-emerald-200 text-emerald-900";

  return (
    <div className={`flex items-start gap-3 border rounded-lg p-4 ${bgClass}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm opacity-90">{detail}</div>
        <div className="text-xs mt-2 opacity-75 font-mono">
          last_event={diag.lastAnyAt ? new Date(diag.lastAnyAt).toLocaleString() : "never"} ·
          last_boot={diag.lastBootAt ? new Date(diag.lastBootAt).toLocaleString() : "never"} ·
          last_heartbeat={diag.lastHeartbeatAt ? new Date(diag.lastHeartbeatAt).toLocaleString() : "never"}
        </div>
      </div>
      {(neverSeen || (stale && !hbAlive)) && (
        <Button
          size="sm"
          onClick={() => navigate("/admin/gemini-bridge")}
          className="shrink-0"
        >
          <Rocket className="h-4 w-4 mr-1" />
          Go to Auto-Deploy
        </Button>
      )}
    </div>
  );
}
