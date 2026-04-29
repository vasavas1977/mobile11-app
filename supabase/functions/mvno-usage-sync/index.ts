import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active SIMs
    const { data: sims, error: simsErr } = await supabase
      .from("telecom_sim_cards")
      .select("id, iccid, msisdn, provider_id, mno_reference_id")
      .eq("status", "active")
      .limit(500);

    if (simsErr) throw simsErr;
    if (!sims?.length) {
      return new Response(JSON.stringify({ message: "No active SIMs to sync" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TODO: Replace with actual MNO API calls to fetch usage
    // For now, this is a stub that logs the intent
    const synced = [];
    for (const sim of sims) {
      console.log(`Would sync usage for SIM ${sim.iccid || sim.msisdn} (MNO ref: ${sim.mno_reference_id})`);
      
      // Placeholder: When MNO API is wired in:
      // const usage = await fetchMNOUsage(sim.mno_reference_id);
      // await supabase.from("telecom_usage_records").insert([{
      //   sim_card_id: sim.id,
      //   data_used_mb: usage.data_used,
      //   data_remaining_mb: usage.data_remaining,
      //   voice_used_minutes: usage.voice_used,
      //   sms_used: usage.sms_used,
      //   sync_source: "api_poll",
      //   mno_sync_id: usage.sync_id,
      // }]);

      synced.push(sim.id);
    }

    return new Response(JSON.stringify({ synced_count: synced.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("mvno-usage-sync error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
