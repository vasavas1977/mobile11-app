/**
 * Bridge Remote Logger
 *
 * Pushes bridge lifecycle events into Supabase `voice_bridge_logs`
 * so admins can see them in the Mobile11 admin UI without SSH-ing
 * into the EC2 instance.
 *
 * Latency safety:
 *  - `pushLog()` is synchronous (Array.push). Never awaited on the audio path.
 *  - Events are batched and flushed off-thread every FLUSH_INTERVAL_MS.
 *  - Buffer is capped (BUFFER_CAP). Oldest dropped, drop count surfaced via console.
 *  - All POST failures are swallowed — audio path is never affected.
 *  - Disable instantly with env BRIDGE_REMOTE_LOGS=off (no redeploy needed).
 */

import { config } from "./config.ts";

type Level = "info" | "warn" | "error" | "stage";

export interface BridgeLogContext {
  callSid?: string;
  cid?: string;
  callerNumber?: string;
  didNumber?: string;
}

interface LogRow {
  call_sid: string | null;
  cid: string | null;
  caller_number: string | null;
  did_number: string | null;
  level: Level;
  stage: string | null;
  message: string | null;
  elapsed_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ENABLED = (Deno.env.get("BRIDGE_REMOTE_LOGS") ?? "on").toLowerCase() !== "off";
const BUFFER_CAP = 500;
const FLUSH_INTERVAL_MS = 2000;
const MAX_BATCH = 100;

const buffer: LogRow[] = [];
let dropped = 0;
let started = false;
let lastFlushError: string | null = null;
let lastFlushOkAt: string | null = null;
let totalFlushed = 0;

function nowIso(): string {
  return new Date().toISOString();
}

function pushRow(row: LogRow): void {
  if (!ENABLED) return;
  if (buffer.length >= BUFFER_CAP) {
    buffer.shift();
    dropped += 1;
    if (dropped % 50 === 1) {
      console.warn(`[bridge-logger] buffer overflow, dropped=${dropped}`);
    }
  }
  buffer.push(row);
}

/** Stage marker (preserves the existing `[stage]` log convention). */
export function logStage(
  ctx: BridgeLogContext,
  stage: string,
  elapsedMs?: number,
  metadata?: Record<string, unknown>,
): void {
  pushRow({
    call_sid: ctx.callSid ?? null,
    cid: ctx.cid ?? null,
    caller_number: ctx.callerNumber ?? null,
    did_number: ctx.didNumber ?? null,
    level: "stage",
    stage,
    message: null,
    elapsed_ms: typeof elapsedMs === "number" ? elapsedMs : null,
    metadata: metadata ?? {},
    created_at: nowIso(),
  });
}

/** Generic event (info / warn / error). */
export function logEvent(
  level: Exclude<Level, "stage">,
  ctx: BridgeLogContext,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  pushRow({
    call_sid: ctx.callSid ?? null,
    cid: ctx.cid ?? null,
    caller_number: ctx.callerNumber ?? null,
    did_number: ctx.didNumber ?? null,
    level,
    stage: null,
    message: message.slice(0, 2000),
    elapsed_ms: null,
    metadata: metadata ?? {},
    created_at: nowIso(),
  });
}

async function flush(): Promise<void> {
  if (!ENABLED || buffer.length === 0) return;
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    lastFlushError = "missing supabase url or service key";
    return;
  }

  const batch = buffer.splice(0, MAX_BATCH);
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/voice_bridge_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      lastFlushError = `status=${res.status} ${txt.slice(0, 200)}`;
      console.warn(
        `[bridge-logger] flush failed status=${res.status} dropped_batch=${batch.length} err=${txt.slice(0, 200)}`,
      );
    } else {
      lastFlushError = null;
      lastFlushOkAt = nowIso();
      totalFlushed += batch.length;
    }
  } catch (err) {
    lastFlushError = (err as Error).message;
    console.warn(
      `[bridge-logger] flush error dropped_batch=${batch.length} err=${(err as Error).message}`,
    );
  }
}

/** Idempotent. Call once at boot. */
export function startBridgeLogger(): void {
  if (started) return;
  started = true;
  if (!ENABLED) {
    console.log("[bridge-logger] disabled via BRIDGE_REMOTE_LOGS=off");
    return;
  }

  // Boot self-test event — proves to the admin UI that the new code is live.
  pushRow({
    call_sid: null,
    cid: null,
    caller_number: null,
    did_number: null,
    level: "stage",
    stage: "bridge_boot",
    message: "Bridge logger started",
    elapsed_ms: null,
    metadata: {
      hostname: Deno.env.get("HOSTNAME") ?? "unknown",
      remote_logs_enabled: ENABLED,
      flush_interval_ms: FLUSH_INTERVAL_MS,
      buffer_cap: BUFFER_CAP,
      supabase_url_set: Boolean(config.supabaseUrl),
      service_key_set: Boolean(config.supabaseServiceKey),
      pid: Deno.pid,
      deno_version: Deno.version.deno,
    },
    created_at: nowIso(),
  });

  setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);

  // Heartbeat every 60s so the UI can confirm the bridge is alive even
  // when there are no calls.
  setInterval(() => {
    pushRow({
      call_sid: null,
      cid: null,
      caller_number: null,
      did_number: null,
      level: "info",
      stage: "bridge_heartbeat",
      message: null,
      elapsed_ms: null,
      metadata: {
        buffer_size: buffer.length,
        dropped,
        total_flushed: totalFlushed,
        last_flush_ok_at: lastFlushOkAt,
        last_flush_error: lastFlushError,
      },
      created_at: nowIso(),
    });
  }, 60_000);

  console.log(
    `[bridge-logger] enabled, flush_every=${FLUSH_INTERVAL_MS}ms cap=${BUFFER_CAP}`,
  );
}

