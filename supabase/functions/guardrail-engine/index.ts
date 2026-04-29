import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChangeRequest {
  domain: string;
  change_type: string;
  change_title: string;
  change_description?: string;
  change_payload?: Record<string, unknown>;
  reference_id?: string;
  reference_table?: string;
  previous_version_id?: string;
  created_by?: string;
}

interface RollbackCheckRequest {
  change_request_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const action = body.action || "evaluate";

    if (action === "evaluate") {
      return await evaluateChange(supabase, body as ChangeRequest);
    } else if (action === "check_rollback") {
      return await checkRollback(supabase, body as RollbackCheckRequest);
    } else if (action === "promote") {
      return await promoteChange(supabase, body);
    } else if (action === "revert") {
      return await revertChange(supabase, body);
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Guardrail engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Evaluate a proposed change against guardrail rules
async function evaluateChange(supabase: ReturnType<typeof createClient>, req: ChangeRequest) {
  const { domain, change_type, change_title, change_description, change_payload, reference_id, reference_table, previous_version_id, created_by } = req;

  // Find matching guardrail rule
  const { data: rules } = await supabase
    .from("guardrail_rules")
    .select("*")
    .eq("domain", domain)
    .eq("is_active", true)
    .order("risk_level", { ascending: false });

  // Pick highest applicable rule, or default to medium
  const rule = (rules || [])[0];
  const riskLevel = rule?.risk_level || "medium";
  const requiresApproval = rule?.requires_approval ?? true;
  const maxRollout = rule?.max_rollout_pct ?? 100;
  const canary = rule?.canary_enabled ?? false;
  const shadow = rule?.shadow_test_enabled ?? false;

  // Determine initial status and rollout mode
  let status = "pending";
  let rolloutMode = "full";
  let rolloutPct = 0;

  if (!requiresApproval && riskLevel === "low") {
    status = "auto_approved";
    rolloutPct = maxRollout;
    rolloutMode = "full";
  } else if (canary) {
    rolloutMode = "canary";
    rolloutPct = Math.min(10, maxRollout);
  } else if (shadow) {
    rolloutMode = "shadow";
    rolloutPct = 0;
  }

  // Create the change request
  const { data: cr, error } = await supabase
    .from("guardrail_change_requests")
    .insert({
      domain,
      risk_level: riskLevel,
      change_type,
      change_title,
      change_description,
      change_payload: change_payload || {},
      reference_id: reference_id || null,
      reference_table: reference_table || null,
      status,
      rollout_pct: rolloutPct,
      rollout_mode: rolloutMode,
      approval_required: requiresApproval,
      previous_version_id: previous_version_id || null,
      created_by: created_by || null,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    change_request_id: cr.id,
    risk_level: riskLevel,
    status,
    rollout_mode: rolloutMode,
    rollout_pct: rolloutPct,
    requires_approval: requiresApproval,
    canary_enabled: canary,
    shadow_enabled: shadow,
    rule_applied: rule?.rule_name || "default",
    auto_rollback: rule?.auto_rollback_enabled ?? true,
    rollback_thresholds: {
      score_drop: rule?.rollback_score_drop_threshold || 5,
      dead_air_rise: rule?.rollback_dead_air_rise_threshold || 10,
      low_rating_rise: rule?.rollback_low_rating_threshold || 15,
    },
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Check if a live change should be rolled back
async function checkRollback(supabase: ReturnType<typeof createClient>, req: RollbackCheckRequest) {
  const { change_request_id } = req;

  const { data: cr } = await supabase
    .from("guardrail_change_requests")
    .select("*")
    .eq("id", change_request_id)
    .single();

  if (!cr || !["canary", "promoted", "auto_approved"].includes(cr.status)) {
    return new Response(JSON.stringify({ rollback: false, reason: "Not in active state" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get the matching rule
  const { data: rules } = await supabase
    .from("guardrail_rules")
    .select("*")
    .eq("domain", cr.domain)
    .eq("is_active", true)
    .order("risk_level", { ascending: false })
    .limit(1);

  const rule = rules?.[0];
  if (!rule?.auto_rollback_enabled) {
    return new Response(JSON.stringify({ rollback: false, reason: "Auto-rollback disabled" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check metrics since canary/promotion started
  const sinceDate = cr.canary_started_at || cr.promoted_at || cr.created_at;
  const beforeDate = new Date(new Date(sinceDate).getTime() - 7 * 86400000).toISOString();

  // Get current period scores
  const { data: currentScores } = await supabase
    .from("ai_conversation_scores")
    .select("composite_score")
    .gte("created_at", sinceDate)
    .limit(500);

  // Get baseline scores
  const { data: baselineScores } = await supabase
    .from("ai_conversation_scores")
    .select("composite_score")
    .gte("created_at", beforeDate)
    .lt("created_at", sinceDate)
    .limit(500);

  const avgCurrent = avg(currentScores?.map((s: any) => s.composite_score) || []);
  const avgBaseline = avg(baselineScores?.map((s: any) => s.composite_score) || []);
  const scoreDrop = avgBaseline - avgCurrent;

  // Check dead air rise
  const { count: currentDeadAir } = await supabase
    .from("dead_air_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceDate);

  const { count: baselineDeadAir } = await supabase
    .from("dead_air_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", beforeDate)
    .lt("created_at", sinceDate);

  const deadAirRise = baselineDeadAir ? ((currentDeadAir || 0) - baselineDeadAir) / baselineDeadAir * 100 : 0;

  // Check low rating rise
  const { count: currentLowRatings } = await supabase
    .from("conversation_ratings")
    .select("id", { count: "exact", head: true })
    .lte("rating", 2)
    .gte("created_at", sinceDate);

  const { count: baselineLowRatings } = await supabase
    .from("conversation_ratings")
    .select("id", { count: "exact", head: true })
    .lte("rating", 2)
    .gte("created_at", beforeDate)
    .lt("created_at", sinceDate);

  const lowRatingRise = baselineLowRatings ? ((currentLowRatings || 0) - baselineLowRatings) / baselineLowRatings * 100 : 0;

  // Evaluate thresholds
  const triggers: string[] = [];
  if (scoreDrop > (rule.rollback_score_drop_threshold || 5)) {
    triggers.push(`Score dropped by ${scoreDrop.toFixed(1)} (threshold: ${rule.rollback_score_drop_threshold})`);
  }
  if (deadAirRise > (rule.rollback_dead_air_rise_threshold || 10)) {
    triggers.push(`Dead air rose ${deadAirRise.toFixed(1)}% (threshold: ${rule.rollback_dead_air_rise_threshold}%)`);
  }
  if (lowRatingRise > (rule.rollback_low_rating_threshold || 15)) {
    triggers.push(`Low ratings rose ${lowRatingRise.toFixed(1)}% (threshold: ${rule.rollback_low_rating_threshold}%)`);
  }

  if (triggers.length > 0) {
    // Execute rollback
    await supabase.from("guardrail_change_requests").update({
      status: "reverted",
      reverted_at: new Date().toISOString(),
      reverted_by: null,
      revert_reason: triggers.join("; "),
      updated_at: new Date().toISOString(),
    }).eq("id", change_request_id);

    // Log rollback event
    for (const trigger of triggers) {
      const metricName = trigger.includes("Score") ? "composite_score" : trigger.includes("Dead air") ? "dead_air_count" : "low_rating_count";
      const value = trigger.includes("Score") ? scoreDrop : trigger.includes("Dead air") ? deadAirRise : lowRatingRise;
      const threshold = trigger.includes("Score") ? rule.rollback_score_drop_threshold : trigger.includes("Dead air") ? rule.rollback_dead_air_rise_threshold : rule.rollback_low_rating_threshold;

      await supabase.from("guardrail_rollback_events").insert({
        change_request_id,
        trigger_type: "auto",
        trigger_metric: metricName,
        trigger_value: value,
        threshold_value: threshold,
        rolled_back_to: cr.previous_version_id,
        rolled_back_by: "system",
        reason: trigger,
      });
    }

    // If it was a prompt change, revert to previous version
    if (cr.domain === "prompt_rollout" && cr.previous_version_id) {
      await supabase.from("prompt_versions")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", cr.previous_version_id);
      if (cr.reference_id) {
        await supabase.from("prompt_versions")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", cr.reference_id);
      }
    }

    return new Response(JSON.stringify({
      rollback: true,
      triggers,
      metrics: { score_drop: scoreDrop, dead_air_rise: deadAirRise, low_rating_rise: lowRatingRise },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    rollback: false,
    metrics: { score_drop: scoreDrop, dead_air_rise: deadAirRise, low_rating_rise: lowRatingRise },
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Promote a change to full rollout
async function promoteChange(supabase: ReturnType<typeof createClient>, body: any) {
  const { change_request_id, promoted_by } = body;

  await supabase.from("guardrail_change_requests").update({
    status: "promoted",
    rollout_pct: 100,
    promoted_at: new Date().toISOString(),
    promoted_by,
    updated_at: new Date().toISOString(),
  }).eq("id", change_request_id);

  return new Response(JSON.stringify({ status: "promoted" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Manual revert
async function revertChange(supabase: ReturnType<typeof createClient>, body: any) {
  const { change_request_id, reverted_by, reason } = body;

  const { data: cr } = await supabase
    .from("guardrail_change_requests")
    .select("*")
    .eq("id", change_request_id)
    .single();

  await supabase.from("guardrail_change_requests").update({
    status: "reverted",
    reverted_at: new Date().toISOString(),
    reverted_by: reverted_by,
    revert_reason: reason || "Manual revert",
    updated_at: new Date().toISOString(),
  }).eq("id", change_request_id);

  await supabase.from("guardrail_rollback_events").insert({
    change_request_id,
    trigger_type: "manual",
    trigger_metric: null,
    rolled_back_to: cr?.previous_version_id || null,
    rolled_back_by: reverted_by || "admin",
    reason: reason || "Manual revert by admin",
  });

  // Revert prompt if applicable
  if (cr?.domain === "prompt_rollout" && cr.previous_version_id) {
    await supabase.from("prompt_versions")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", cr.previous_version_id);
    if (cr.reference_id) {
      await supabase.from("prompt_versions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", cr.reference_id);
    }
  }

  return new Response(JSON.stringify({ status: "reverted" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
