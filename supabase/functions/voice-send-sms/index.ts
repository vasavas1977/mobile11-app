/**
 * voice-send-sms
 *
 * Server-side SMS send via Alaris Labs HTTP API for the voice bot.
 * Called ONLY by the bridge (service-role auth) — never by the browser.
 *
 * Security:
 *  - Service-role bearer required.
 *  - Alaris credentials live in env vars; never returned to caller.
 *  - URL is redacted in every log line (username/password/apikey stripped).
 *  - URL is NOT persisted to the DB (avoid credential leak via metadata).
 *
 * Behaviour:
 *  - GET to ALARIS_SMS_URL with command=submit&longMessageMode=spilt.
 *  - 3s timeout via AbortController.
 *  - Inserts conversation_messages row { type:'sms_link_sent', ok }.
 *  - Returns { ok: false, reason: 'not_configured' } if any ALARIS_* missing.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  conversation_id: z.string().uuid().optional(),
  to: z
    .string()
    .min(6)
    .max(20)
    .regex(/^\+?[0-9]+$/, "to must be digits, optionally with leading +"),
  message: z.string().min(1).max(1000),
});

/** Strip credentials from any URL we might log. */
function redactUrl(raw: string): string {
  try {
    const u = new URL(raw);
    for (const k of ["username", "password", "apikey", "api_key", "token"]) {
      if (u.searchParams.has(k)) u.searchParams.set(k, "***");
    }
    return u.toString();
  } catch {
    return raw.replace(/(password|username|apikey|api_key|token)=[^&]+/gi, "$1=***");
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  // ── Auth: service-role bearer only ─────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (
    !serviceKey ||
    !authHeader.startsWith("Bearer ") ||
    authHeader.slice("Bearer ".length).trim() !== serviceKey
  ) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  // ── Validate body ──────────────────────────────────────────────────────────
  let parsed: z.infer<typeof BodySchema>;
  try {
    const body = await req.json();
    const result = BodySchema.safeParse(body);
    if (!result.success) {
      return json(400, { ok: false, error: result.error.flatten().fieldErrors });
    }
    parsed = result.data;
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  // ── Config check ───────────────────────────────────────────────────────────
  const ALARIS_URL = Deno.env.get("ALARIS_SMS_URL") || "";
  const ALARIS_USERNAME = Deno.env.get("ALARIS_SMS_USERNAME") || "";
  const ALARIS_PASSWORD = Deno.env.get("ALARIS_SMS_PASSWORD") || "";
  const ALARIS_ANI = Deno.env.get("ALARIS_SMS_ANI") || "";
  if (!ALARIS_URL || !ALARIS_USERNAME || !ALARIS_PASSWORD || !ALARIS_ANI) {
    console.warn("[voice-send-sms] not_configured (ALARIS_SMS_* env missing)");
    return json(200, { ok: false, reason: "not_configured" });
  }

  // ── Build Alaris GET URL ───────────────────────────────────────────────────
  const dnis = parsed.to.replace(/^\+/, "");
  const url = new URL(ALARIS_URL);
  url.searchParams.set("username", ALARIS_USERNAME);
  url.searchParams.set("password", ALARIS_PASSWORD);
  url.searchParams.set("ani", ALARIS_ANI);
  url.searchParams.set("dnis", dnis);
  url.searchParams.set("message", parsed.message);
  url.searchParams.set("command", "submit");
  url.searchParams.set("longMessageMode", "spilt");

  const redacted = redactUrl(url.toString());

  // ── Send (3s timeout) ──────────────────────────────────────────────────────
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 3000);
  let ok = false;
  let providerStatus: number | null = null;
  let providerBody = "";
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });
    providerStatus = res.status;
    providerBody = (await res.text()).slice(0, 500);
    // Alaris returns 200 with a body containing "OK" or an error code on success.
    ok = res.ok && /\bOK\b|messageid|message_id/i.test(providerBody);
    console.log(
      `[voice-send-sms] sent url=${redacted} status=${providerStatus} ok=${ok} body=${providerBody.slice(0, 120)}`,
    );
  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[voice-send-sms] send failed url=${redacted} err=${msg}`);
    ok = false;
    providerBody = msg;
  } finally {
    clearTimeout(t);
  }

  // ── Log to conversation_messages (best-effort, NEVER store the URL) ────────
  if (parsed.conversation_id) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        serviceKey,
      );
      await supabase.from("conversation_messages").insert({
        conversation_id: parsed.conversation_id,
        sender_type: "ai",
        content: ok
          ? `Sent SMS link to ${parsed.to}`
          : `Failed to send SMS to ${parsed.to}`,
        is_internal_note: true,
        metadata: {
          type: "sms_link_sent",
          ok,
          to: parsed.to,
          provider_status: providerStatus,
        },
      });
    } catch (err) {
      console.warn(`[voice-send-sms] log insert failed: ${(err as Error).message}`);
    }
  }

  return json(200, { ok, provider_status: providerStatus });
});
