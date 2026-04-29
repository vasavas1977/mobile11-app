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

    // Fetch pending/retrying jobs
    const { data: jobs, error: fetchErr } = await supabase
      .from("telecom_provider_jobs")
      .select("*, telecom_sim_cards(*)")
      .in("status", ["pending", "retrying"])
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchErr) throw fetchErr;
    if (!jobs?.length) {
      return new Response(JSON.stringify({ message: "No pending jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const job of jobs) {
      // Mark as processing
      await supabase
        .from("telecom_provider_jobs")
        .update({ status: "processing", attempts: job.attempts + 1 })
        .eq("id", job.id);

      try {
        // TODO: Route to actual MNO API based on job.job_type and provider config
        // For now, log the job and mark as completed stub
        console.log(`Processing job ${job.id}: ${job.job_type} for SIM ${job.telecom_sim_cards?.iccid}`);

        // Placeholder: When MNO API is wired in, the actual API call goes here
        // const mnoResult = await callMNOApi(job);

        await supabase
          .from("telecom_provider_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            response_payload: { stub: true, message: "MNO API not yet configured" },
          })
          .eq("id", job.id);

        // Log event
        await supabase.from("telecom_event_log").insert([{
          entity_type: "job",
          entity_id: job.id,
          event_type: `job_${job.job_type}_completed`,
          event_data: { sim_card_id: job.sim_card_id, attempts: job.attempts + 1 },
          actor_type: "system",
        }]);

        results.push({ job_id: job.id, status: "completed" });
      } catch (err: any) {
        const shouldRetry = job.attempts + 1 < job.max_attempts;
        await supabase
          .from("telecom_provider_jobs")
          .update({
            status: shouldRetry ? "retrying" : "failed",
            error_message: err.message,
            next_retry_at: shouldRetry ? new Date(Date.now() + 60000 * (job.attempts + 1)).toISOString() : null,
          })
          .eq("id", job.id);

        results.push({ job_id: job.id, status: shouldRetry ? "retrying" : "failed", error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("mvno-provision error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
