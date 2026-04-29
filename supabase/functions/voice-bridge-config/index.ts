// voice-bridge-config
// Phase 3 of the voice-bridge control plane.
// Returns the current voice_settings row + config_hash for the bridge to consume.
// Bridge is NOT yet wired to call this — that's Phase 4 behind USE_REMOTE_CONFIG.
//
// Auth model:
//   - Bridge calls with Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
//   - Admin UI "test" button calls with the user's JWT; we verify admin role.
//   - Anything else → 401/403.
//
// Caching:
//   - Returns ETag = config_hash.
//   - Honors If-None-Match → 304 Not Modified (enables stale-while-revalidate in Phase 4).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SCHEMA_VERSION = 1;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, if-none-match",
  "Access-Control-Expose-Headers": "ETag",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Server misconfigured", schema_version: SCHEMA_VERSION },
        { status: 500 },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length).trim();

    // Admin client (always service role internally — used to read voice_settings,
    // bypassing RLS once we've verified the caller).
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Caller is either the bridge (service role token) or an admin user JWT.
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userData?.user) {
        return jsonResponse({ error: "Invalid token" }, { status: 401 });
      }
      const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (roleErr || !isAdmin) {
        return jsonResponse({ error: "Admin role required" }, { status: 403 });
      }
    }

    // Read the singleton settings row.
    const { data, error } = await admin
      .from("voice_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return jsonResponse(
        {
          error: "voice_settings row missing",
          detail: error?.message ?? null,
          schema_version: SCHEMA_VERSION,
        },
        { status: 500 },
      );
    }

    const etag = `"${data.config_hash}"`;
    const ifNoneMatch = req.headers.get("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { ...corsHeaders, ETag: etag },
      });
    }

    // Shape returned to consumers. Documented as schema_version 1.
    const body = {
      schema_version: SCHEMA_VERSION,
      config_hash: data.config_hash,
      updated_at: data.updated_at,
      config: {
        gemini_voice: data.gemini_voice,
        voice_sms_enabled: data.voice_sms_enabled,
        voice_rating_enabled: data.voice_rating_enabled,
        voice_memory_enabled: data.voice_memory_enabled,
        voice_silence_probe_guard_enabled:
          data.voice_silence_probe_guard_enabled,
        voice_rating_window_ms: data.voice_rating_window_ms,
        voice_silence_probe_guard_ms: data.voice_silence_probe_guard_ms,
      },
    };

    return jsonResponse(body, {
      status: 200,
      headers: { ETag: etag, "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return jsonResponse(
      {
        error: "Unhandled error",
        detail: e instanceof Error ? e.message : String(e),
        schema_version: SCHEMA_VERSION,
      },
      { status: 500 },
    );
  }
});
