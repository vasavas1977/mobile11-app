import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, transcript } = await req.json();

    if (!conversation_id || !Array.isArray(transcript) || transcript.length === 0) {
      return new Response(
        JSON.stringify({ error: "conversation_id and non-empty transcript array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map transcript entries to conversation_messages rows
    const rows = transcript.map((entry: { role: string; text: string; timestamp: string }) => ({
      conversation_id,
      content: entry.text,
      sender_type: entry.role === "customer" ? "customer" : "bot",
      created_at: entry.timestamp,
      is_internal_note: false,
      metadata: {
        source: "voice",
        voice_session: true,
      },
    }));

    // Idempotency guard: drop rows that already exist for this conversation
    // with the same sender_type + content within ±2s of the supplied
    // created_at. Prevents the historical double-insert bug from ever
    // reproducing — even if a future caller sends the same payload twice.
    const rowsToInsert: typeof rows = [];
    for (const row of rows) {
      const ts = new Date(row.created_at).getTime();
      const lo = new Date(ts - 2000).toISOString();
      const hi = new Date(ts + 2000).toISOString();
      const { data: existing, error: lookupErr } = await supabase
        .from("conversation_messages")
        .select("id")
        .eq("conversation_id", row.conversation_id)
        .eq("sender_type", row.sender_type)
        .eq("content", row.content)
        .gte("created_at", lo)
        .lte("created_at", hi)
        .limit(1);
      if (lookupErr) {
        console.warn("[save-voice-transcript] dedup lookup failed:", lookupErr);
      }
      if (!existing || existing.length === 0) {
        rowsToInsert.push(row);
      } else {
        console.log("[save-voice-transcript] skip duplicate", {
          conversation_id: row.conversation_id,
          sender_type: row.sender_type,
          len: row.content.length,
        });
      }
    }

    if (rowsToInsert.length === 0) {
      return new Response(
        JSON.stringify({ success: true, saved: 0, skipped: rows.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("conversation_messages")
      .insert(rowsToInsert);

    if (error) {
      console.error("[save-voice-transcript] Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[save-voice-transcript] Saved ${rowsToInsert.length}/${rows.length} transcript entries for conversation ${conversation_id}`);

    return new Response(
      JSON.stringify({ success: true, saved: rowsToInsert.length, skipped: rows.length - rowsToInsert.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[save-voice-transcript] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
