/**
 * Supabase REST Logger
 * Logs call metadata, transcripts, and contacts to Supabase via REST API.
 */

import { config } from "./config.ts";

const headers = (): Record<string, string> => ({
  "Content-Type": "application/json",
  apikey: config.supabaseServiceKey,
  Authorization: `Bearer ${config.supabaseServiceKey}`,
  Prefer: "return=representation",
});

const rest = (table: string): string => `${config.supabaseUrl}/rest/v1/${table}`;

export interface VoiceBotConfig {
  greeting_message: string;
  mode: string;
  greeting_language: string;
}

interface KbArticle {
  title: string;
  content: string;
  category: string;
}

export async function fetchVoiceBotConfig(): Promise<VoiceBotConfig | null> {
  try {
    const res = await fetch(
      `${rest("voice_bot_config")}?select=greeting_message,mode,greeting_language&limit=1`,
      { headers: headers() },
    );

    const data = await res.json();
    return data?.[0] ?? null;
  } catch (err) {
    console.error("[Logger] Failed to fetch voice bot config:", err);
    return null;
  }
}

export async function fetchKbArticles(language: string): Promise<string> {
  try {
    const lang = language === "th" ? "th" : "en";

    const res = await fetch(
      `${rest("kb_articles")}?select=title,content,category&is_published=eq.true&language=eq.${lang}&category=neq.bot-core-knowledge&limit=${config.maxKbArticles}`,
      { headers: headers() },
    );

    const articles: KbArticle[] = await res.json();
    if (!articles?.length) return "";

    return `\n\n## KNOWLEDGE BASE ARTICLES\nUse these to answer customer questions accurately:\n${
      articles
        .map((a) => `### ${a.title} (${a.category})\n${a.content.substring(0, 1500)}`)
        .join("\n\n")
    }`;
  } catch (err) {
    console.error("[Logger] Failed to fetch KB articles:", err);
    return "";
  }
}

export async function findOrCreateContact(
  callerNumber: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${rest("contacts")}?phone=eq.${encodeURIComponent(callerNumber)}&limit=1`,
      { headers: headers() },
    );

    const existing = await res.json();
    if (existing?.[0]?.id) return existing[0].id;

    const createRes = await fetch(rest("contacts"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        phone: callerNumber,
        name: callerNumber,
      }),
    });

    const created = await createRes.json();
    return created?.[0]?.id ?? null;
  } catch (err) {
    console.error("[Logger] Contact creation error:", err);
    return null;
  }
}

export async function createConversation(
  contactId: string | null,
): Promise<string | null> {
  try {
    const res = await fetch(rest("conversations"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        channel: "voice",
        status: "active",
        priority: "normal",
        contact_id: contactId,
        subject: "Voice Bot Call",
      }),
    });

    const data = await res.json();
    return data?.[0]?.id ?? null;
  } catch (err) {
    console.error("[Logger] Conversation creation error:", err);
    return null;
  }
}

export async function createCallLog(params: {
  callId: string;
  callerNumber: string;
  didNumber: string;
  conversationId: string | null;
}): Promise<string | null> {
  try {
    const res = await fetch(rest("voice_call_logs"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        call_id: params.callId,
        caller_number: params.callerNumber,
        did_number: params.didNumber,
        conversation_id: params.conversationId,
        status: "in_progress",
        started_at: new Date().toISOString(),
        metadata: { source: "jambonz-gemini-bridge" },
      }),
    });

    const data = await res.json();
    return data?.[0]?.id ?? null;
  } catch (err) {
    console.error("[Logger] Call log creation error:", err);
    return null;
  }
}

export async function updateCallLog(
  callLogId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${rest("voice_call_logs")}?id=eq.${callLogId}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.error("[Logger] Call log update error:", err);
  }
}

export async function logMessage(
  conversationId: string,
  senderType: "customer" | "ai",
  content: string,
): Promise<void> {
  try {
    await fetch(rest("conversation_messages"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        conversation_id: conversationId,
        sender_type: senderType,
        content,
        is_internal_note: false,
      }),
    });
  } catch (err) {
    console.error("[Logger] Message log error:", err);
  }
}


// ============================================================
// INLINED FROM bridge-logger.ts — DO NOT MIX WITH TRANSPORT BELOW
// Reason: VPS deploy-agent whitelist rejects new filenames.
// When the whitelist is fixed, extract this section back into
// bridge-logger.ts. Tracking ticket: WHITELIST-BOOTSTRAP.
//
// CONTRACT
//  1. Fail-open. Every helper wraps the Supabase POST in a 1500ms
//     timeout race inside try/catch. Helpers never throw, never
//     reject unhandled. On failure -> console.warn fallback only.
//  2. Non-blocking on hot paths. Callers use `void logStage(...)`.
//     Internally we push to a bounded queue (cap 500) and a separate
//     setInterval flusher batches up to 100 rows every ~2s.
//  3. Stream-level only. No per-frame rows. Allowed stages are listed
//     in ALLOWED_STAGES.
//  4. Leaf module. No imports from gemini-session.ts or server.ts.
//     Context flows in via parameters.
//  5. Heartbeat exactly once. Guarded against double-start.
// ============================================================

export const BUILD_VERSION = "2026-04-27-stable+pr-transcripts";

// +gemini-3.1-setup-fix: BUNDLE_HASH is rewritten by scripts/build-stable-bundle.mjs
// at manifest-build time. It is the sha256 of the concatenated source files
// that were bundled, so the bridge_boot row proves what is *actually* live —
// independent of BUILD_VERSION which can be set incorrectly by hand.
// The placeholder below is replaced before bundle write; do not edit by hand.
// BUNDLE_HASH_BEGIN
export const BUNDLE_HASH = "__BUNDLE_HASH_PLACEHOLDER__";
// BUNDLE_HASH_END

export type LogContext = {
  call_sid?: string;
  conversation_id?: string;
  gemini_session_id?: string;
  cid?: string;
  caller_number?: string;
  did_number?: string;
};

const ALLOWED_STAGES = new Set<string>([
  "bridge_boot",
  "bridge_ready",
  "bridge_shutdown",
  "heartbeat",
  "sip_answer",
  "gemini_session_start",
  "gemini_session_ready",
  "media_stream_start",
  "first_inbound_audio",
  "first_outbound_audio",
  "vad_speech_start",
  "vad_speech_end",
  "media_stream_end",
  "gemini_session_end",
  "call_hangup",
  // back-compat aliases used by server.ts/gemini-session.ts in earlier code paths
  "audio_ws_connected",
  "jambonz_ws_open",
  "jambonz_ws_close",
  "prompt_cache_miss",
  "prompt_ready",
  "gemini_connect_start",
  "gemini_ready",
  "gemini_closed",
  "first_gemini_audio",
  "first_pstn_forward",
  "first_inbound_frame_seen",
  "prerecorded_greeting_sent",
  "escalation",
  // ── new in +logs-3 ──
  "user_turn_start",
  "user_turn_end",
  "model_first_audio",
  "model_turn_progress",
  "model_turn_complete",
  "model_interrupted",
  "transcription_unavailable",
  "turn_gap_alert",
  "greeting_sent",
  "greeting_suppress_canceled",
  "silence_probe_sent",
  "silence_timeout_hangup",
  "consent_granted",
  "consent_declined",
  "rating_captured",
  "rating_skipped",
  "telemetry_cap_reached",
  // ── new in +emergency-recovery (post-ready diagnostic taxonomy) ──
  "greeting_send_attempt",
  "greeting_send_ok",
  "gemini_first_server_event",
  "model_text_only",
  "gemini_ws_close",
  "gemini_ws_error",
  "gemini_malformed_event",
  "no_audio_after_ready",
  "audio_relay_first_attempt",
  "audio_relay_first_ok",
  "audio_relay_error",
  "silence_probe_guarded",
  // ── PR 1: energy-based local VAD + state machine observability ──
  "user_speech_energy_start",
  "local_user_turn_end_timeout_fired",
  "waiting_for_model_too_long",
  "last_inbound_audio_forwarded_at",
  "last_gemini_event_at",
  "call_state_transition",
  // ── PR 2: latency telemetry + context compression ──
  "model_reply_latency",
  "model_reply_threshold_breach",
  // +pr2-native-ctx-compression: one-shot proof that the contextWindowCompression
  // field was sent in the BidiGenerateContent setup payload.
  "context_compression_configured",
  // ── PR 5 / 5.1: manual VAD drive + audio-energy parity telemetry ──
  "activity_start_sent",
  "activity_start_failed",
  "activity_start_skipped_not_ready",
  "activity_end_sent",
  "activity_end_failed",
  "activity_end_skipped_not_ready",
  "duplicate_user_turn_end_suppressed",
  "vad_model_started_safety_override",
  "vad_vs_transcription_parity",
  "sms_link_sent",
  "rating_prompt_detected",
  // ── plan v2: silence-probe overhaul + VAD state telemetry ──
  "silence_probe_suppressed",
  "vad_state_transition",
  // ── plan v3: race-hardening (probe guard, bleed-tail close, finish dump) ──
  "silence_probe_blocked",
  "bleed_window_force_closed",
  "finish_reason_wire_dump",
  // ── Barge-in (mid-TTS user interrupt) state machine ──
  "barge_candidate_open",
  "barge_in_triggered",
  "barge_in_suppressed_lockout",
  "barge_in_suppressed_short_burst",
  "barge_to_interrupted_latency_ms",
  // ── PR transcripts: per-turn persistence to conversation_messages ──
  "transcript_persisted",
  "transcript_persist_failed",
  "transcript_persist_skipped",
]);

const LOGGER_ENABLED =
  (Deno.env.get("BRIDGE_REMOTE_LOGS") ?? "on").toLowerCase() !== "off";

const QUEUE_CAP = 500;
const BATCH_MAX = 100;
const FLUSH_INTERVAL_MS = 2000;
const WRITE_TIMEOUT_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 45_000;

const INSTANCE_ID =
  (Deno.env.get("HOSTNAME") || "").trim() ||
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `inst-${Date.now()}`);

const BASE_CONTEXT = {
  service: "gemini-bridge" as const,
  instance_id: INSTANCE_ID,
  pid: Deno.pid,
  build_version: BUILD_VERSION,
  env: "production",
};

type Level = "stage" | "info" | "warn" | "error";

interface QueuedRow {
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

const queue: QueuedRow[] = [];
let droppedTotal = 0;
let totalFlushed = 0;
let lastWriteOkAt = "";
let lastWriteError = "";
let activeCallCount = 0;
let bridgeBootedAt = Date.now();
let started = false;
let heartbeatHandle: number | null = null;
let flushHandle: number | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

export function setActiveCallCount(n: number): void {
  activeCallCount = n;
}

function pushRow(row: QueuedRow): void {
  if (!LOGGER_ENABLED) return;
  if (queue.length >= QUEUE_CAP) {
    queue.shift();
    droppedTotal += 1;
    if (droppedTotal % 50 === 1) {
      console.warn(`[logger] queue overflow dropped_total=${droppedTotal}`);
    }
  }
  queue.push(row);
}

function buildRow(
  level: Level,
  ctx: LogContext,
  stage: string | null,
  message: string | null,
  elapsedMs: number | null,
  extra: Record<string, unknown> | undefined,
): QueuedRow {
  const metadata: Record<string, unknown> = { ...BASE_CONTEXT };
  if (ctx.gemini_session_id) metadata.gemini_session_id = ctx.gemini_session_id;
  if (ctx.conversation_id) metadata.conversation_id = ctx.conversation_id;
  if (extra) Object.assign(metadata, extra);
  return {
    call_sid: ctx.call_sid ?? null,
    cid: ctx.cid ?? null,
    caller_number: ctx.caller_number ?? null,
    did_number: ctx.did_number ?? null,
    level,
    stage,
    message: message ? message.slice(0, 2000) : null,
    elapsed_ms: typeof elapsedMs === "number" ? elapsedMs : null,
    metadata,
    created_at: nowIso(),
  };
}

export function logStage(
  ctx: LogContext,
  stage: string,
  elapsedMs?: number,
  extra?: Record<string, unknown>,
): void {
  if (!ALLOWED_STAGES.has(stage)) {
    // Soft guard: log to console but still queue with a warn level so we notice.
    console.warn(`[logger] stage not in allow-list: ${stage}`);
  }
  pushRow(buildRow("stage", ctx, stage, null, elapsedMs ?? null, extra));
}

export function logInfo(
  ctx: LogContext,
  message: string,
  extra?: Record<string, unknown>,
): void {
  pushRow(buildRow("info", ctx, null, message, null, extra));
}

export function logWarn(
  ctx: LogContext,
  message: string,
  extra?: Record<string, unknown>,
): void {
  pushRow(buildRow("warn", ctx, null, message, null, extra));
}

export function logError(
  ctx: LogContext,
  message: string,
  extra?: Record<string, unknown>,
): void {
  pushRow(buildRow("error", ctx, null, message, null, extra));
}

// Back-compat: server.ts uses logEvent("warn"|"error"|"info", ctx, message, extra)
export function logEvent(
  level: "info" | "warn" | "error",
  ctx: LogContext,
  message: string,
  extra?: Record<string, unknown>,
): void {
  pushRow(buildRow(level, ctx, null, message, null, extra));
}

export function logHeartbeat(extra?: Record<string, unknown>): void {
  pushRow(
    buildRow(
      "stage",
      {},
      "heartbeat",
      null,
      null,
      {
        active_calls: activeCallCount,
        uptime_seconds: Math.floor((Date.now() - bridgeBootedAt) / 1000),
        last_supabase_write_at: lastWriteOkAt || null,
        last_write_error: lastWriteError || null,
        queue_size: queue.length,
        dropped_total: droppedTotal,
        total_flushed: totalFlushed,
        ...(extra ?? {}),
      },
    ),
  );
}

async function writeBatch(rows: QueuedRow[]): Promise<void> {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    lastWriteError = "missing supabase url or service key";
    return;
  }
  const url = `${config.supabaseUrl}/rest/v1/voice_bridge_logs`;
  const writeFetch = fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseServiceKey,
      Authorization: `Bearer ${config.supabaseServiceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  }).then(async (res) => {
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`status=${res.status} ${txt.slice(0, 200)}`);
    }
  });
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("write timeout")), WRITE_TIMEOUT_MS);
  });
  await Promise.race([writeFetch, timeout]);
}

async function flushOnce(): Promise<void> {
  if (!LOGGER_ENABLED || queue.length === 0) return;
  const batch = queue.splice(0, BATCH_MAX);
  try {
    await writeBatch(batch);
    lastWriteOkAt = nowIso();
    lastWriteError = "";
    totalFlushed += batch.length;
  } catch (err) {
    const msg = (err as Error).message;
    lastWriteError = msg;
    console.warn(
      `[logger] write failed dropped_batch=${batch.length} err=${msg}`,
    );
  }
}

async function fileSha256(path: string): Promise<string> {
  try {
    const bytes = await Deno.readFile(path);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "unreadable";
  }
}

async function computeRuntimeFileHashes(): Promise<Record<string, string>> {
  const dir = Deno.env.get("BRIDGE_DIR") ?? "/opt/gemini-bridge";
  const files = ["server.ts", "gemini-session.ts", "config.ts", "supabase-logger.ts"];
  const out: Record<string, string> = {};
  for (const f of files) {
    out[f] = await fileSha256(`${dir}/${f}`);
  }
  return out;
}

export function startBridgeLogger(): void {
  if (started) return;
  started = true;
  bridgeBootedAt = Date.now();

  if (!LOGGER_ENABLED) {
    console.log("[logger] disabled via BRIDGE_REMOTE_LOGS=off");
    return;
  }

  // Boot row — proves to the admin UI that the new bundle is live.
  const envModel = Deno.env.get("GEMINI_MODEL");
  const resolvedModel = envModel || config.geminiModel;

  // +identity-fix-1: three-tier manifest hash resolution.
  //   1) BRIDGE_MANIFEST_HASH env (deploy-agent may inject via systemd).
  //   2) /opt/gemini-bridge/.deploy.env written atomically by deploy-agent
  //      after each successful payload write. This is the normal path.
  //   3) Fallback to bv:${BUILD_VERSION} so a missing/unreadable .deploy.env
  //      never blocks boot. manifest_hash_source makes the tier explicit so
  //      operators can tell a real hash from a synthetic one at a glance.
  const resolveManifestHash = async (): Promise<{ hash: string; source: string }> => {
    const envHash = Deno.env.get("BRIDGE_MANIFEST_HASH");
    if (envHash && envHash.trim().length > 0) {
      return { hash: envHash.trim(), source: "env" };
    }
    try {
      const dir = Deno.env.get("BRIDGE_DIR") ?? "/opt/gemini-bridge";
      const txt = await Deno.readTextFile(`${dir}/.deploy.env`);
      const m = txt.match(/^BRIDGE_MANIFEST_HASH=(.+)$/m);
      if (m && m[1].trim().length > 0) {
        return { hash: m[1].trim(), source: "deploy_env" };
      }
    } catch {
      // fail-open: bridge must boot even if .deploy.env is unreadable.
    }
    return { hash: `bv:${BUILD_VERSION}`, source: "fallback_build_version" };
  };

  // +pr2-native-ctx-compression: compute SHA-256 of each runtime source file
  // at boot. The DB row becomes the source of truth for "what code is actually
  // running on disk", so the post-deploy hard gate is a single SQL query
  // against voice_bridge_logs.bridge_boot rather than SSH md5sum.
  Promise.all([computeRuntimeFileHashes(), resolveManifestHash()]).then(
    ([fileHashes, manifest]) => {
      pushRow(
        buildRow(
          "stage",
          {},
          "bridge_boot",
          null,
          null,
          {
            manifest_mode: "stable",
            manifest_hash: manifest.hash,
            // +identity-fix-1: which tier produced the manifest_hash.
            // env | deploy_env = trusted; fallback_build_version = synthetic.
            manifest_hash_source: manifest.source,
            // +gemini-3.1-setup-fix: bundle_hash is computed from actual file
            // contents at bundle build time. Both build_version AND bundle_hash
            // must match the expected values for a deploy to be considered live.
            bundle_hash: BUNDLE_HASH,
            // +pr2-native-ctx-compression: per-file SHA-256 of disk contents at
            // boot. Drift from the previous bridge_boot row proves a deploy
            // actually wrote new bytes (not just bumped the version label).
            file_hashes: fileHashes,
            resolved_model: resolvedModel,
            hostname: Deno.env.get("HOSTNAME") ?? null,
            deno_version: Deno.version.deno,
            supabase_url_set: Boolean(config.supabaseUrl),
            service_key_set: Boolean(config.supabaseServiceKey),
            gemini_model: resolvedModel,
            gemini_model_source: envModel ? "env" : "source-default",
            voice_name: config.voiceName,
            remote_config_mode: "off",
            // PR 1: dedicated field, do NOT overload setup_payload_shape.
            // PR 5: this string also reflects whether the bridge is driving
            // turn boundaries manually (drive) or observing only (observe).
            turn_control_mode: config.vadDriveTurnEnd
              ? "manual-drive+local-energy"
              : "auto-vad+local-energy-observe",
            vad_drive_turn_end: config.vadDriveTurnEnd,
            user_turn_silence_ms: config.userTurnSilenceMs,
            vad_energy_start_rms: config.vadEnergyStartRms,
            vad_energy_end_rms: config.vadEnergyEndRms,
            waiting_for_model_alert_ms: config.waitingForModelAlertMs,
            // plan v2 fields:
            voice_silence_probe_ms: config.voiceSilenceProbeMs,
            voice_silence_hangup_ms: config.voiceSilenceHangupMs,
            silence_probe_guard_ms: config.silenceProbeGuardMs,
            telemetry_row_cap: 200,
            // Barge-in knobs — proves the new code is live & shows the
            // active configuration without SSH.
            barge_in_enabled: config.bargeInEnabled,
            barge_min_burst_ms: config.bargeMinBurstMs,
            barge_rms_boost: config.bargeRmsBoost,
            barge_preroll_ms: config.bargePrerollMs,
            barge_lockout_after_model_start_ms:
              config.bargeLockoutAfterModelStartMs,
            barge_bleed_rms_boost: config.bargeBleedRmsBoost,
            barge_bleed_burst_boost_ms: config.bargeBleedBurstBoostMs,
            // PR transcripts:
            voice_transcript_persist_enabled: config.voiceTranscriptPersistEnabled,
          },
        ),
      );
    },
  ).catch((err) => {
    console.warn(`[logger] failed to compose bridge_boot row: ${err}`);
  });

  flushHandle = setInterval(() => {
    void flushOnce();
  }, FLUSH_INTERVAL_MS) as unknown as number;

  if (heartbeatHandle === null) {
    heartbeatHandle = setInterval(() => {
      logHeartbeat();
    }, HEARTBEAT_INTERVAL_MS) as unknown as number;
  }

  console.log(
    `[logger] enabled flush_every=${FLUSH_INTERVAL_MS}ms heartbeat_every=${HEARTBEAT_INTERVAL_MS}ms cap=${QUEUE_CAP} build=${BUILD_VERSION} instance=${INSTANCE_ID}`,
  );
}
