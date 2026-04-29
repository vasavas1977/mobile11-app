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

    const body = await req.json();
    const { event_type, sim_reference, data } = body;

    console.log(`MNO webhook received: ${event_type} for ${sim_reference}`);

    if (!event_type || !sim_reference) {
      return new Response(JSON.stringify({ error: "event_type and sim_reference required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find SIM by MNO reference
    const { data: sim } = await supabase
      .from("telecom_sim_cards")
      .select("id")
      .eq("mno_reference_id", sim_reference)
      .single();

    if (!sim) {
      console.warn(`SIM not found for MNO reference: ${sim_reference}`);
      return new Response(JSON.stringify({ error: "SIM not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the webhook event
    await supabase.from("telecom_event_log").insert([{
      entity_type: "sim_card",
      entity_id: sim.id,
      event_type: `webhook_${event_type}`,
      event_data: data || {},
      actor_type: "webhook",
    }]);

    // Handle specific event types
    if (event_type === "status_change" && data?.new_status) {
      const statusMap: Record<string, string> = {
        activated: "active",
        suspended: "suspended",
        deactivated: "deactivated",
      };
      const mappedStatus = statusMap[data.new_status];
      if (mappedStatus) {
        await supabase
          .from("telecom_sim_cards")
          .update({ status: mappedStatus })
          .eq("id", sim.id);
      }
    }

    if (event_type === "usage_update" && data) {
      await supabase.from("telecom_usage_records").insert([{
        sim_card_id: sim.id,
        data_used_mb: data.data_used_mb || 0,
        data_remaining_mb: data.data_remaining_mb,
        voice_used_minutes: data.voice_used_minutes || 0,
        sms_used: data.sms_used || 0,
        sync_source: "webhook",
        mno_sync_id: data.sync_id,
      }]);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("mvno-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
