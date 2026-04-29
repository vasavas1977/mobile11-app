// Voice bot Phase 0 diagnostic ingestion endpoint.
// Gated by X-Diag-Secret header (must equal VOICE_DIAG_SECRET).
// Writes to public.voice_diagnostic_events using the service role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-diag-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DIAG_SECRET = Deno.env.get("VOICE_DIAG_SECRET") ?? "";

const ALLOWED_REFRESH = new Set(["none", "turn_count", "timer", "reconnect"]);
const ALLOWED_CHANNEL = new Set(["webchat", "pstn"]);

function isUuid(s: unknown): s is string {
  return typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function clampInt(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const v = Math.trunc(n);
  if (v < min || v > max) return null;
  return v;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!DIAG_SECRET) {
    return new Response(JSON.stringify({ error: "diag_disabled" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const provided = req.headers.get("x-diag-secret") ?? "";
  if (provided !== DIAG_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const events = Array.isArray(body) ? body : [body];
  if (events.length === 0 || events.length > 50) {
    return new Response(JSON.stringify({ error: "batch_size_invalid" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < events.length; i++) {
    const e = events[i] ?? {};

    if (!isUuid(e.client_event_id)) {
      errors.push({ i, field: "client_event_id" });
      continue;
    }
    if (!isUuid(e.live_session_id)) {
      errors.push({ i, field: "live_session_id" });
      continue;
    }
    if (e.conversation_id != null && !isUuid(e.conversation_id)) {
      errors.push({ i, field: "conversation_id" });
      continue;
    }
    const turn_id = clampInt(e.turn_id, 0, 100000);
    const conversation_turn_count = clampInt(e.conversation_turn_count, 0, 100000);
    if (turn_id == null || conversation_turn_count == null) {
      errors.push({ i, field: "turn_id/conversation_turn_count" });
      continue;
    }
    const refresh_trigger = typeof e.refresh_trigger === "string" &&
        ALLOWED_REFRESH.has(e.refresh_trigger)
      ? e.refresh_trigger
      : "none";
    const channel = typeof e.channel === "string" && ALLOWED_CHANNEL.has(e.channel)
      ? e.channel
      : null;
    if (!channel) {
      errors.push({ i, field: "channel" });
      continue;
    }
    const ts_client = typeof e.ts_client === "number" && Number.isFinite(e.ts_client)
      ? Math.trunc(e.ts_client)
      : null;
    if (ts_client == null) {
      errors.push({ i, field: "ts_client" });
      continue;
    }
    const vad_ms = e.vad_commit_to_first_audio_ms == null
      ? null
      : clampInt(e.vad_commit_to_first_audio_ms, 0, 600000);
    const name_adoption_state = typeof e.name_adoption_state === "string"
      ? e.name_adoption_state.slice(0, 64)
      : "unknown";

    rows.push({
      client_event_id: e.client_event_id,
      live_session_id: e.live_session_id,
      conversation_id: e.conversation_id ?? null,
      turn_id,
      conversation_turn_count,
      refresh_trigger,
      refreshed_this_turn: !!e.refreshed_this_turn,
      server_prompt_had_history: !!e.server_prompt_had_history,
      vad_commit_to_first_audio_ms: vad_ms,
      name_adoption_state,
      channel,
      ts_client,
      extra: e.extra && typeof e.extra === "object" ? e.extra : {},
    });
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ inserted: 0, errors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // upsert on client_event_id for dedup
  const { error, count } = await supabase
    .from("voice_diagnostic_events")
    .upsert(rows, { onConflict: "client_event_id", ignoreDuplicates: true, count: "exact" });

  if (error) {
    console.error("[voice-diag] insert error", error);
    return new Response(JSON.stringify({ error: "db_error", message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ inserted: count ?? rows.length, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
