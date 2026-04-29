/**
 * Remote Config — Phase 4
 *
 * Polls the `voice-bridge-config` Supabase Edge Function and merges the
 * returned settings with hardcoded defaults and explicit env overrides.
 *
 * Precedence (last wins):
 *   1. Hardcoded default (from config.ts)
 *   2. Remote config   (only if USE_REMOTE_CONFIG=1 and last fetch succeeded)
 *   3. Env override    (only if env var is explicitly set; empty = not set)
 *
 * Env wins per-setting → ops can pin any value regardless of the admin UI.
 * Bridge keeps last-known-good if the endpoint is unreachable; never crashes.
 *
 * The `envExplicit` snapshot is captured ONCE at module load. If env vars
 * change later in the process, behavior does not drift mid-run.
 */

import { config } from "./config.ts";
import { logEvent } from "./supabase-logger.ts";

const SCHEMA_VERSION = 1;

export interface EffectiveVoiceConfig {
  voice_name: string;
  sms_enabled: boolean;
  rating_enabled: boolean;
  memory_enabled: boolean;
  silence_probe_guard_enabled: boolean;
  rating_window_ms: number;
  silence_probe_guard_ms: number;
}

interface RemoteConfigPayload {
  schema_version: number;
  config_hash: string;
  updated_at: string;
  config: {
    gemini_voice: string;
    voice_sms_enabled: boolean;
    voice_rating_enabled: boolean;
    voice_memory_enabled: boolean;
    voice_silence_probe_guard_enabled: boolean;
    voice_rating_window_ms: number;
    voice_silence_probe_guard_ms: number;
  };
}

// ── Capture which envs were explicitly set at startup ────────────────────────
function envSet(name: string): boolean {
  const v = Deno.env.get(name);
  return v !== undefined && v !== "";
}

const envExplicit = {
  GEMINI_VOICE: envSet("GEMINI_VOICE"),
  VOICE_SMS_ENABLED: envSet("VOICE_SMS_ENABLED"),
  VOICE_RATING_ENABLED: envSet("VOICE_RATING_ENABLED"),
  VOICE_MEMORY_ENABLED: envSet("VOICE_MEMORY_ENABLED"),
  VOICE_SILENCE_PROBE_GUARD_ENABLED: envSet("VOICE_SILENCE_PROBE_GUARD_ENABLED"),
  VOICE_RATING_WINDOW_MS: envSet("VOICE_RATING_WINDOW_MS"),
  VOICE_SILENCE_PROBE_GUARD_MS: envSet("VOICE_SILENCE_PROBE_GUARD_MS"),
} as const;

// Snapshot of the env-derived values from config.ts (these were already parsed
// with defaults). When envExplicit[X] === true we keep them, otherwise remote
// (or default) takes over.
const envValues: EffectiveVoiceConfig = {
  voice_name: config.voiceName,
  sms_enabled: config.smsEnabled,
  rating_enabled: config.ratingEnabled,
  memory_enabled: config.memoryEnabled,
  silence_probe_guard_enabled: config.silenceProbeGuardEnabled,
  rating_window_ms: config.ratingWindowMs,
  silence_probe_guard_ms: config.silenceProbeGuardMs,
};

// Hardcoded defaults — used when env not explicit AND no remote config.
const DEFAULTS: EffectiveVoiceConfig = {
  voice_name: "Aoede",
  sms_enabled: false,
  rating_enabled: false,
  memory_enabled: false,
  silence_probe_guard_enabled: false,
  rating_window_ms: 60000,
  silence_probe_guard_ms: 5000,
};

// ── Remote state ─────────────────────────────────────────────────────────────
let remoteValues: EffectiveVoiceConfig | null = null;
let remoteHash: string | null = null;
let lastFetchAt = 0;
let lastFetchOk = false;
let pollTimer: number | null = null;

function mergeRemoteIntoEffective(
  remote: RemoteConfigPayload,
): EffectiveVoiceConfig {
  return {
    voice_name: remote.config.gemini_voice,
    sms_enabled: remote.config.voice_sms_enabled,
    rating_enabled: remote.config.voice_rating_enabled,
    memory_enabled: remote.config.voice_memory_enabled,
    silence_probe_guard_enabled:
      remote.config.voice_silence_probe_guard_enabled,
    rating_window_ms: remote.config.voice_rating_window_ms,
    silence_probe_guard_ms: remote.config.voice_silence_probe_guard_ms,
  };
}

/**
 * Returns the effective config for the bridge to use right now.
 * Always safe to call — never throws, never blocks.
 */
export function getEffectiveConfig(): EffectiveVoiceConfig {
  // Floor: defaults
  const out: EffectiveVoiceConfig = { ...DEFAULTS };

  // Layer 2: remote (if enabled and we have a snapshot)
  if (config.useRemoteConfig && remoteValues) {
    Object.assign(out, remoteValues);
  }

  // Layer 3: env overrides (per-key, only if explicitly set)
  if (envExplicit.GEMINI_VOICE) out.voice_name = envValues.voice_name;
  if (envExplicit.VOICE_SMS_ENABLED) out.sms_enabled = envValues.sms_enabled;
  if (envExplicit.VOICE_RATING_ENABLED) {
    out.rating_enabled = envValues.rating_enabled;
  }
  if (envExplicit.VOICE_MEMORY_ENABLED) {
    out.memory_enabled = envValues.memory_enabled;
  }
  if (envExplicit.VOICE_SILENCE_PROBE_GUARD_ENABLED) {
    out.silence_probe_guard_enabled = envValues.silence_probe_guard_enabled;
  }
  if (envExplicit.VOICE_RATING_WINDOW_MS) {
    out.rating_window_ms = envValues.rating_window_ms;
  }
  if (envExplicit.VOICE_SILENCE_PROBE_GUARD_MS) {
    out.silence_probe_guard_ms = envValues.silence_probe_guard_ms;
  }

  return out;
}

export function getRemoteConfigStatus(): {
  enabled: boolean;
  ok: boolean;
  hash: string | null;
  last_fetch_at: number;
} {
  return {
    enabled: config.useRemoteConfig,
    ok: lastFetchOk,
    hash: remoteHash,
    last_fetch_at: lastFetchAt,
  };
}

async function fetchOnce(): Promise<void> {
  const url = `${config.supabaseUrl}/functions/v1/voice-bridge-config`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.supabaseServiceKey}`,
    apikey: config.supabaseServiceKey,
  };
  if (remoteHash) headers["If-None-Match"] = `"${remoteHash}"`;

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers });
  } catch (e) {
    lastFetchAt = Date.now();
    lastFetchOk = false;
    console.warn(
      `[remote-config] fetch failed: ${e instanceof Error ? e.message : e}`,
    );
    return;
  }

  lastFetchAt = Date.now();

  if (res.status === 304) {
    lastFetchOk = true;
    // No change — drain body to free conn
    await res.body?.cancel();
    return;
  }

  if (!res.ok) {
    lastFetchOk = false;
    const body = await res.text().catch(() => "");
    console.warn(
      `[remote-config] non-OK status=${res.status} body=${body.slice(0, 200)}`,
    );
    return;
  }

  let payload: RemoteConfigPayload;
  try {
    payload = await res.json();
  } catch (e) {
    lastFetchOk = false;
    console.warn(
      `[remote-config] invalid JSON: ${e instanceof Error ? e.message : e}`,
    );
    return;
  }

  if (payload.schema_version !== SCHEMA_VERSION) {
    lastFetchOk = false;
    console.warn(
      `[remote-config] schema_version mismatch: got=${payload.schema_version} want=${SCHEMA_VERSION} — keeping last-known-good`,
    );
    return;
  }

  const oldHash = remoteHash;
  const oldEffective = getEffectiveConfig();

  remoteValues = mergeRemoteIntoEffective(payload);
  remoteHash = payload.config_hash;
  lastFetchOk = true;

  if (oldHash !== payload.config_hash) {
    const newEffective = getEffectiveConfig();
    const changedKeys: string[] = [];
    for (const k of Object.keys(newEffective) as (keyof EffectiveVoiceConfig)[]) {
      if (oldEffective[k] !== newEffective[k]) changedKeys.push(k);
    }
    console.log(
      `[remote-config] updated old_hash=${oldHash ?? "none"} new_hash=${payload.config_hash} changed=${changedKeys.join(",") || "(none-effective)"}`,
    );
    try {
      logEvent("info", {}, "voice_config_updated", {
        old_hash: oldHash,
        new_hash: payload.config_hash,
        updated_at: payload.updated_at,
        changed_effective_keys: changedKeys,
      });
    } catch {
      // best-effort
    }
  }
}

/**
 * Initialize remote config polling. Awaits the first fetch (with timeout)
 * so the bridge can start with the right config when possible. If the first
 * fetch fails, the bridge still starts — using defaults+env.
 */
export async function startRemoteConfigPoller(): Promise<void> {
  if (!config.useRemoteConfig) {
    console.log("[remote-config] DISABLED (USE_REMOTE_CONFIG != 1)");
    return;
  }

  const pollMs = config.remoteConfigPollMs;
  console.log(
    `[remote-config] ENABLED — endpoint=${config.supabaseUrl}/functions/v1/voice-bridge-config poll_ms=${pollMs}`,
  );

  // First fetch with a short timeout so we don't block boot indefinitely.
  await Promise.race([
    fetchOnce(),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);

  if (lastFetchOk) {
    console.log(
      `[remote-config] initial fetch OK hash=${remoteHash}`,
    );
  } else {
    console.warn(
      "[remote-config] initial fetch did not succeed — continuing with env+defaults; will keep retrying",
    );
  }

  if (pollTimer !== null) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    void fetchOnce();
  }, pollMs) as unknown as number;
}
