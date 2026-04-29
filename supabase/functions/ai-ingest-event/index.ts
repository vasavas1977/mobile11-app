import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const {
      conversation_id,
      message_id,
      customer_id,
      channel,
      language,
      event_type,
      payload,
    } = body;

    if (!conversation_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "conversation_id and event_type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTypes = [
      "bot_reply", "customer_message", "rating_received",
      "dead_air", "human_handoff", "conversation_resolved", "customer_returned"
    ];
    if (!validTypes.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid event_type: ${event_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase.from("ai_conversation_events").insert({
      conversation_id,
      message_id: message_id || null,
      customer_id: customer_id || null,
      channel: channel || null,
      language: language || null,
      event_type,
      payload: payload || {},
      processing_status: "pending",
    });

    if (error) {
      // Duplicate is fine — just log and return success
      if (error.code === "23505") {
        console.log(`[ai-ingest] Duplicate event skipped: ${event_type} for ${conversation_id}`);
        return new Response(
          JSON.stringify({ status: "duplicate_skipped" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    console.log(`[ai-ingest] Event ingested: ${event_type} for conv ${conversation_id}`);

    return new Response(
      JSON.stringify({ status: "ok" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ai-ingest] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
