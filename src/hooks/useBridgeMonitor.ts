import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BridgeLogRow {
  id: string;
  created_at: string;
  call_sid: string | null;
  level: string;
  stage: string | null;
  message: string | null;
  elapsed_ms: number | null;
  metadata: Record<string, any> | null;
}

const SETUP_FIX_MARKER = "3.1-setup-fix";

function getBuildVersion(row: BridgeLogRow): string | null {
  return (row.metadata?.build_version as string) ?? null;
}

function getCloseCode(row: BridgeLogRow): number | null {
  const c = row.metadata?.code ?? row.metadata?.close_code ?? row.metadata?.gemini_ws_closecode;
  return typeof c === "number" ? c : null;
}

function getCloseReason(row: BridgeLogRow): string | null {
  return (row.metadata?.reason as string) ?? (row.metadata?.close_reason as string) ?? null;
}

export function useBridgeLogs(windowMinutes: number) {
  const [rows, setRows] = useState<BridgeLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("voice_bridge_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    setRows((data as BridgeLogRow[]) ?? []);
    setLoading(false);
  }, [windowMinutes]);

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel("bridge-monitor")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "voice_bridge_logs" },
        (payload) => {
          setRows((prev) => [payload.new as BridgeLogRow, ...prev].slice(0, 2000));
        }
      )
      .subscribe();
    const interval = setInterval(fetchRows, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchRows]);

  return { rows, loading, refetch: fetchRows };
}

export interface CallSummary {
  callSid: string;
  buildVersion: string | null;
  startedAt: string;
  status: "success" | "failed" | "in_progress" | "stalled";
  failReason?: string;
  stages: BridgeLogRow[];
}

// PR 1: a call is "stalled" when a user_turn_start has fired but no
// model_first_audio arrives within STALLED_MS. Default 10s, matches
// waiting_for_model_too_long server-side alert.
const STALLED_MS = 10_000;

export function summarizeCalls(rows: BridgeLogRow[]): CallSummary[] {
  const byCall = new Map<string, BridgeLogRow[]>();
  for (const r of rows) {
    if (!r.call_sid) continue;
    const arr = byCall.get(r.call_sid) ?? [];
    arr.push(r);
    byCall.set(r.call_sid, arr);
  }
  const out: CallSummary[] = [];
  for (const [callSid, stages] of byCall) {
    stages.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const buildVersion = stages.map(getBuildVersion).find((v) => v) ?? null;
    const startedAt = stages[0].created_at;
    const stageNames = new Set(stages.map((s) => s.stage));
    const closeRow = stages.find((s) => s.stage === "gemini_ws_close");
    const closeCode = closeRow ? getCloseCode(closeRow) : null;
    const closeReason = closeRow ? getCloseReason(closeRow) : null;
    let status: CallSummary["status"] = "in_progress";
    let failReason: string | undefined;
    const reachedModelAudio =
      stageNames.has("model_first_audio") || stageNames.has("first_gemini_audio");
    const reachedOutboundAudio =
      stageNames.has("first_outbound_audio") || stageNames.has("first_pstn_forward");
    const reachedAudio = reachedModelAudio && reachedOutboundAudio;

    // PR 1: detect stall — last user_turn_start with no following model_first_audio.
    const userStarts = stages.filter((s) => s.stage === "user_turn_start");
    const lastUserStart = userStarts[userStarts.length - 1];
    const modelAudioAfterLastUser = lastUserStart
      ? stages.some(
          (s) =>
            s.stage === "model_first_audio" &&
            +new Date(s.created_at) > +new Date(lastUserStart.created_at),
        )
      : true;
    const lastTs = +new Date(stages[stages.length - 1].created_at);
    const stalled =
      !!lastUserStart &&
      !modelAudioAfterLastUser &&
      lastTs - +new Date(lastUserStart.created_at) >= STALLED_MS;

    if (closeCode === 1008 || stageNames.has("no_audio_after_ready")) {
      status = "failed";
      failReason = closeReason ?? "no_audio_after_ready";
    } else if (stalled && !stageNames.has("call_hangup")) {
      status = "stalled";
      failReason = "user_turn_without_model_reply";
    } else if (reachedAudio && stageNames.has("greeting_send_ok")) {
      status = stalled ? "stalled" : "success";
      if (stalled) failReason = "user_turn_without_model_reply";
    } else if (stageNames.has("call_hangup") || stageNames.has("gemini_session_end")) {
      status = reachedAudio ? "success" : "failed";
      if (!reachedAudio) {
        failReason = closeReason
          ?? (reachedModelAudio && !reachedOutboundAudio ? "model_audio_not_relayed" : "ended without audio");
      }
    }
    out.push({ callSid, buildVersion, startedAt, status, failReason, stages });
  }
  out.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  return out;
}

export function computeHealthKPIs(calls: CallSummary[]) {
  const setupFixCalls = calls.filter((c) => c.buildVersion?.includes(SETUP_FIX_MARKER));
  const eligible = setupFixCalls.filter((c) => c.status !== "in_progress");
  const successCount = eligible.filter((c) => c.status === "success").length;
  const successRate = eligible.length ? (successCount / eligible.length) * 100 : null;
  return {
    successRate,
    setupFixTotal: setupFixCalls.length,
    setupFixEligible: eligible.length,
  };
}

export function computeGreetingLatencies(rows: BridgeLogRow[]): number[] {
  const byCall = new Map<string, BridgeLogRow[]>();
  for (const r of rows) {
    if (!r.call_sid) continue;
    const arr = byCall.get(r.call_sid) ?? [];
    arr.push(r);
    byCall.set(r.call_sid, arr);
  }
  const latencies: number[] = [];
  for (const stages of byCall.values()) {
    stages.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const greet = stages.find((s) => s.stage === "greeting_send_ok");
    if (!greet) continue;
    const audio = stages.find(
      (s) =>
        +new Date(s.created_at) >= +new Date(greet.created_at) &&
        (s.stage === "gemini_first_server_event" || s.stage === "first_inbound_audio")
    );
    if (!audio) continue;
    latencies.push(+new Date(audio.created_at) - +new Date(greet.created_at));
  }
  return latencies;
}

export function bucketLatencies(latencies: number[]) {
  const buckets = [0, 200, 400, 600, 800, 1000, 1200, 1400];
  const counts = buckets.map((min, i) => ({
    label: i === buckets.length - 1 ? "1400+" : `${min}-${buckets[i + 1]}`,
    min,
    max: i === buckets.length - 1 ? Infinity : buckets[i + 1],
    count: 0,
    danger: i === buckets.length - 1,
  }));
  for (const ms of latencies) {
    const b = counts.find((c) => ms >= c.min && ms < c.max);
    if (b) b.count++;
  }
  return counts;
}

export function computeCloseReasons(rows: BridgeLogRow[]) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.stage !== "gemini_ws_close") continue;
    const reason = getCloseReason(r) ?? `code ${getCloseCode(r) ?? "unknown"}`;
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 6).map(([name, value]) => ({ name, value }));
  const other = sorted.slice(6).reduce((sum, [, v]) => sum + v, 0);
  if (other > 0) top.push({ name: "other", value: other });
  return top;
}

export function getActivePayloadShape(rows: BridgeLogRow[]) {
  const sessionStarts = rows
    .filter((r) => r.stage === "gemini_session_start")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const latest = sessionStarts[0];
  if (!latest) return null;
  return {
    shape: (latest.metadata?.setup_payload_shape as string) ?? "unknown",
    buildVersion: getBuildVersion(latest),
    at: latest.created_at,
  };
}

export function computeAvgGreetingLatency(latencies: number[]) {
  if (!latencies.length) return null;
  return latencies.reduce((a, b) => a + b, 0) / latencies.length;
}

export function isLiveStatus(rows: BridgeLogRow[]) {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recent = rows.filter((r) => +new Date(r.created_at) >= fiveMinAgo);
  if (!recent.length) return "idle" as const;
  const errors = recent.filter(
    (r) => r.level === "error" || (r.stage === "gemini_ws_close" && getCloseCode(r) === 1008)
  ).length;
  const ratio = errors / recent.length;
  if (ratio > 0.3) return "degraded" as const;
  return "healthy" as const;
}

export { getBuildVersion, getCloseCode, getCloseReason };
