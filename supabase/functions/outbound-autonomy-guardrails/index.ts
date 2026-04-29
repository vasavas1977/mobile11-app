import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const action = body.action;

    if (action === "evaluate") return await evaluate(supabase, body);
    if (action === "check_rollback") return await checkRollback(supabase, body);
    if (action === "approve") return await approve(supabase, body);
    if (action === "reject") return await reject(supabase, body);
    if (action === "complete") return await complete(supabase, body);

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("Outbound autonomy guardrails error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Evaluate a proposed change against autonomy rules
async function evaluate(supabase: ReturnType<typeof createClient>, body: any) {
  const {
    change_category, title, description, change_payload,
    campaign_id, journey_id, journey_step_id, template_id, experiment_id,
    recommendation_id, created_by_type, created_by_user_id,
  } = body;

  // Find matching rule
  const { data: rules } = await supabase
    .from("outbound_autonomy_rules")
    .select("*")
    .eq("change_category", change_category)
    .eq("is_active", true)
    .limit(1);

  const rule = rules?.[0];
  const riskLevel = rule?.risk_level || "medium_risk";
  const autoTestAllowed = rule?.auto_test_allowed ?? false;
  const controlledRolloutAllowed = rule?.controlled_rollout_allowed ?? false;
  const manualApprovalRequired = rule?.manual_approval_required ?? true;
  const maxRolloutPct = rule?.max_rollout_pct ?? 100;

  // Check for duplicate active requests
  const { data: existing } = await supabase
    .from("outbound_autonomy_requests")
    .select("id")
    .eq("change_category", change_category)
    .not("status", "in", '("rejected","rolled_back","completed")')
    .eq("campaign_id", campaign_id || null)
    .eq("journey_id", journey_id || null)
    .limit(1);

  if (existing && existing.length > 0) {
    return json({ error: "Duplicate active request exists for this scope and category", existing_id: existing[0].id }, 409);
  }

  // Determine initial status
  let status = "pending";
  let rolloutPct = 0;

  if (autoTestAllowed && !manualApprovalRequired) {
    status = "auto_testing";
    rolloutPct = Math.min(10, maxRolloutPct);
  } else if (controlledRolloutAllowed && !manualApprovalRequired) {
    status = "controlled_rollout";
    rolloutPct = Math.min(30, maxRolloutPct);
  }
  // Otherwise stays pending (requires approval)

  // Snapshot baseline metrics from learning events
  const baselineMetrics = await snapshotMetrics(supabase, { campaign_id, journey_id, journey_step_id });

  const { data: cr, error } = await supabase
    .from("outbound_autonomy_requests")
    .insert({
      rule_id: rule?.id || null,
      recommendation_id: recommendation_id || null,
      change_category,
      risk_level: riskLevel,
      title,
      description: description || null,
      change_payload: change_payload || {},
      campaign_id: campaign_id || null,
      journey_id: journey_id || null,
      journey_step_id: journey_step_id || null,
      template_id: template_id || null,
      experiment_id: experiment_id || null,
      status,
      rollout_pct: rolloutPct,
      rollout_started_at: status !== "pending" ? new Date().toISOString() : null,
      baseline_metrics: baselineMetrics,
      created_by_type: created_by_type || "system",
      created_by_user_id: created_by_user_id || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Audit log
  await supabase.from("outbound_autonomy_audit_log").insert({
    request_id: cr.id,
    action: status === "auto_testing" ? "auto_test_started" : status === "controlled_rollout" ? "rollout_started" : "created",
    actor_type: created_by_type || "system",
    actor_user_id: created_by_user_id || null,
    details: { rule_applied: rule?.rule_name || "default", risk_level: riskLevel },
  });

  return json({
    request_id: cr.id,
    status,
    risk_level: riskLevel,
    rollout_pct: rolloutPct,
    requires_approval: manualApprovalRequired && status === "pending",
    rule_applied: rule?.rule_name || "default",
  });
}

// Check if an active request should be rolled back
async function checkRollback(supabase: ReturnType<typeof createClient>, body: any) {
  const { request_id } = body;

  const { data: req } = await supabase
    .from("outbound_autonomy_requests")
    .select("*, outbound_autonomy_rules(*)")
    .eq("id", request_id)
    .single();

  if (!req || !["auto_testing", "controlled_rollout", "approved"].includes(req.status)) {
    return json({ rollback: false, reason: "Not in active state" });
  }

  const rule = req.outbound_autonomy_rules;
  const currentMetrics = await snapshotMetrics(supabase, {
    campaign_id: req.campaign_id,
    journey_id: req.journey_id,
    journey_step_id: req.journey_step_id,
    since: req.rollout_started_at,
  });

  const baseline = req.baseline_metrics || {};
  const triggers: string[] = [];

  // Check opt-out rise
  if (baseline.opt_out_rate !== undefined && currentMetrics.opt_out_rate !== undefined) {
    const rise = currentMetrics.opt_out_rate - baseline.opt_out_rate;
    const threshold = rule?.rollback_opt_out_rise_pct ?? 20;
    if (rise > threshold) triggers.push(`Opt-out rate rose by ${rise.toFixed(1)}pp (threshold: ${threshold}pp)`);
  }

  // Check complaint rise
  if (baseline.complaint_rate !== undefined && currentMetrics.complaint_rate !== undefined) {
    const rise = currentMetrics.complaint_rate - baseline.complaint_rate;
    const threshold = rule?.rollback_complaint_rise_pct ?? 15;
    if (rise > threshold) triggers.push(`Complaint rate rose by ${rise.toFixed(1)}pp (threshold: ${threshold}pp)`);
  }

  // Check ticket rise
  if (baseline.ticket_rate !== undefined && currentMetrics.ticket_rate !== undefined) {
    const rise = currentMetrics.ticket_rate - baseline.ticket_rate;
    const threshold = rule?.rollback_ticket_rise_pct ?? 25;
    if (rise > threshold) triggers.push(`Ticket rate rose by ${rise.toFixed(1)}pp (threshold: ${threshold}pp)`);
  }

  // Check conversion drop
  if (baseline.conversion_rate !== undefined && currentMetrics.conversion_rate !== undefined) {
    const drop = baseline.conversion_rate - currentMetrics.conversion_rate;
    const threshold = rule?.rollback_conversion_drop_pct ?? 10;
    if (drop > threshold) triggers.push(`Conversion rate dropped by ${drop.toFixed(1)}pp (threshold: ${threshold}pp)`);
  }

  // Update current metrics
  await supabase.from("outbound_autonomy_requests")
    .update({ current_metrics: currentMetrics })
    .eq("id", request_id);

  if (triggers.length > 0) {
    await supabase.from("outbound_autonomy_requests").update({
      status: "rolled_back",
      rolled_back_at: new Date().toISOString(),
      rolled_back_by_type: "system",
      rollback_triggered_by: triggers[0].includes("Opt-out") ? "opt_out_rise" : triggers[0].includes("Complaint") ? "complaint_rise" : triggers[0].includes("Ticket") ? "ticket_rise" : "conversion_drop",
      rollback_evidence: { triggers, current_metrics: currentMetrics, baseline_metrics: baseline },
    }).eq("id", request_id);

    await supabase.from("outbound_autonomy_audit_log").insert({
      request_id,
      action: "rollback_executed",
      actor_type: "system",
      details: { triggers, current_metrics: currentMetrics },
    });

    return json({ rollback: true, triggers, metrics: currentMetrics });
  }

  return json({ rollback: false, metrics: currentMetrics });
}

// Approve a pending request
async function approve(supabase: ReturnType<typeof createClient>, body: any) {
  const { request_id, approved_by, rollout_pct } = body;

  const { data: req } = await supabase
    .from("outbound_autonomy_requests")
    .select("*, outbound_autonomy_rules(max_rollout_pct)")
    .eq("id", request_id)
    .single();

  if (!req || req.status !== "pending") {
    return json({ error: "Request not found or not pending" }, 400);
  }

  const maxPct = req.outbound_autonomy_rules?.max_rollout_pct ?? 100;
  const finalPct = Math.min(rollout_pct || maxPct, maxPct);

  await supabase.from("outbound_autonomy_requests").update({
    status: "approved",
    approved_by,
    approved_at: new Date().toISOString(),
    rollout_pct: finalPct,
    rollout_started_at: new Date().toISOString(),
  }).eq("id", request_id);

  await supabase.from("outbound_autonomy_audit_log").insert({
    request_id,
    action: "approved",
    actor_type: "user",
    actor_user_id: approved_by,
    details: { rollout_pct: finalPct },
  });

  return json({ status: "approved", rollout_pct: finalPct });
}

// Reject a pending request
async function reject(supabase: ReturnType<typeof createClient>, body: any) {
  const { request_id, rejected_by, rejection_reason } = body;

  await supabase.from("outbound_autonomy_requests").update({
    status: "rejected",
    rejected_by,
    rejected_at: new Date().toISOString(),
    rejection_reason: rejection_reason || "Rejected by supervisor",
  }).eq("id", request_id);

  await supabase.from("outbound_autonomy_audit_log").insert({
    request_id,
    action: "rejected",
    actor_type: "user",
    actor_user_id: rejected_by,
    details: { reason: rejection_reason },
  });

  return json({ status: "rejected" });
}

// Complete a request after monitoring window
async function complete(supabase: ReturnType<typeof createClient>, body: any) {
  const { request_id, completed_by } = body;

  await supabase.from("outbound_autonomy_requests").update({
    status: "completed",
  }).eq("id", request_id);

  await supabase.from("outbound_autonomy_audit_log").insert({
    request_id,
    action: "completed",
    actor_type: completed_by ? "user" : "system",
    actor_user_id: completed_by || null,
  });

  return json({ status: "completed" });
}

// Snapshot metrics from outbound_learning_events
async function snapshotMetrics(
  supabase: ReturnType<typeof createClient>,
  scope: { campaign_id?: string; journey_id?: string; journey_step_id?: string; since?: string }
) {
  const since = scope.since || new Date(Date.now() - 7 * 86400000).toISOString();

  let query = supabase
    .from("outbound_learning_events")
    .select("delivery_status, opt_out_status, complaint_flag, support_ticket_created, conversion_status")
    .gte("created_at", since);

  if (scope.campaign_id) query = query.eq("campaign_id", scope.campaign_id);
  if (scope.journey_id) query = query.eq("journey_id", scope.journey_id);
  if (scope.journey_step_id) query = query.eq("journey_step_id", scope.journey_step_id);

  const { data: events } = await query.limit(1000);

  if (!events || events.length === 0) {
    return { sample_size: 0, opt_out_rate: 0, complaint_rate: 0, ticket_rate: 0, conversion_rate: 0, delivery_rate: 0, measured_at: new Date().toISOString() };
  }

  const total = events.length;
  const delivered = events.filter((e: any) => e.delivery_status === "delivered").length;
  const optedOut = events.filter((e: any) => e.opt_out_status === "opted_out").length;
  const complaints = events.filter((e: any) => e.complaint_flag === true).length;
  const tickets = events.filter((e: any) => e.support_ticket_created === true).length;
  const conversions = events.filter((e: any) => e.conversion_status === "converted").length;

  return {
    sample_size: total,
    opt_out_rate: +(optedOut / total * 100).toFixed(2),
    complaint_rate: +(complaints / total * 100).toFixed(2),
    ticket_rate: +(tickets / total * 100).toFixed(2),
    conversion_rate: +(conversions / total * 100).toFixed(2),
    delivery_rate: +(delivered / total * 100).toFixed(2),
    measured_at: new Date().toISOString(),
  };
}
