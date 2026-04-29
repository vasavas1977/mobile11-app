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

    const { action, sim_card_id, plan_id, initiated_by } = await req.json();

    if (!action || !sim_card_id) {
      return new Response(JSON.stringify({ error: "action and sim_card_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validActions = ["suspend", "resume", "terminate", "change_plan", "topup"];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SIM card
    const { data: sim, error: simErr } = await supabase
      .from("telecom_sim_cards")
      .select("*")
      .eq("id", sim_card_id)
      .single();

    if (simErr || !sim) {
      return new Response(JSON.stringify({ error: "SIM card not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create provider job
    const { data: job, error: jobErr } = await supabase
      .from("telecom_provider_jobs")
      .insert([{
        job_type: action,
        sim_card_id,
        provider_id: sim.provider_id,
        request_payload: { action, plan_id, initiated_by },
        created_by: initiated_by,
      }])
      .select()
      .single();

    if (jobErr) throw jobErr;

    // Log event
    await supabase.from("telecom_event_log").insert([{
      entity_type: "sim_card",
      entity_id: sim_card_id,
      event_type: `${action}_requested`,
      event_data: { job_id: job.id, plan_id },
      actor_id: initiated_by,
      actor_type: "user",
    }]);

    // Record transaction
    await supabase.from("telecom_transactions").insert([{
      sim_card_id,
      transaction_type: action === "resume" ? "reactivation" : action,
      initiated_by,
      status: "pending",
    }]);

    return new Response(JSON.stringify({ job_id: job.id, status: "pending" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("mvno-manage error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
