import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluateRequest {
  action: "evaluate";
  domain: string;
  action_type: string;
  risk_level?: string;
  channel?: string;
  language?: string;
  customer_tier?: string;
  intent?: string;
  amount?: number;
  reference_id?: string;
  reference_table?: string;
  context?: Record<string, unknown>;
}

interface ApproveRejectRequest {
  action: "approve" | "reject";
  audit_id: string;
  user_id?: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();

    if (body.action === "evaluate") {
      return await evaluate(supabase, body as EvaluateRequest);
    } else if (body.action === "approve") {
      return await approveOrReject(supabase, body as ApproveRejectRequest, true);
    } else if (body.action === "reject") {
      return await approveOrReject(supabase, body as ApproveRejectRequest, false);
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Approval policy engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function evaluate(supabase: ReturnType<typeof createClient>, req: EvaluateRequest) {
  const { domain, action_type, risk_level, channel, language, customer_tier, intent, amount, reference_id, reference_table, context } = req;

  // Load all active policies ordered by priority DESC (highest priority = most specific)
  const { data: policies } = await supabase
    .from("approval_policies")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  let matchedPolicy: any = null;
  let decision = "require_approval"; // default safe

  for (const policy of (policies || [])) {
    // Domain must match
    if (policy.domain !== domain) continue;

    // Action type pattern matching (supports wildcard * and prefix*)
    if (policy.action_type_pattern !== "*") {
      if (policy.action_type_pattern.endsWith("*")) {
        const prefix = policy.action_type_pattern.slice(0, -1);
        if (!action_type.startsWith(prefix)) continue;
      } else if (policy.action_type_pattern !== action_type) {
        continue;
      }
    }

    // Risk level match
    if (policy.risk_level !== "*" && risk_level && policy.risk_level !== risk_level) continue;

    // Channel scope (empty = all channels)
    if (policy.channel_scope?.length > 0 && channel && !policy.channel_scope.includes(channel)) continue;

    // Language scope
    if (policy.language_scope?.length > 0 && language && !policy.language_scope.includes(language)) continue;

    // Customer tier scope
    if (policy.customer_tier_scope?.length > 0 && customer_tier && !policy.customer_tier_scope.includes(customer_tier)) continue;

    // Intent scope
    if (policy.intent_scope?.length > 0 && intent && !policy.intent_scope.includes(intent)) continue;

    // Amount threshold (for auto-approve with limit)
    if (policy.max_auto_amount > 0 && amount && amount > policy.max_auto_amount) {
      // Amount exceeds auto-approve threshold, escalate
      matchedPolicy = policy;
      decision = "require_approval";
      break;
    }

    matchedPolicy = policy;
    decision = policy.decision;
    break;
  }

  const decisionReason = matchedPolicy
    ? `Matched policy "${matchedPolicy.policy_name}" (priority ${matchedPolicy.priority})`
    : "No matching policy found; defaulting to require_approval";

  // Log to audit
  const { data: auditEntry, error: auditErr } = await supabase
    .from("approval_audit_log")
    .insert({
      policy_id: matchedPolicy?.id || null,
      domain,
      action_type,
      reference_id: reference_id || null,
      reference_table: reference_table || null,
      input_context: { ...context, amount, intent },
      decision,
      decision_reason: decisionReason,
      matched_policy_name: matchedPolicy?.policy_name || null,
      risk_level: risk_level || null,
      channel: channel || null,
      language: language || null,
      customer_tier: customer_tier || null,
      decided_by: "system",
      execution_status: decision === "auto_approve" ? "approved" : decision === "auto_test" ? "testing" : "pending",
    })
    .select()
    .single();

  if (auditErr) throw auditErr;

  // If the decision is for autonomous_actions_log, update approval_status there too
  if (domain === "backend_action" && reference_id) {
    const approvalStatus = decision === "auto_approve" ? "auto_approved" : "pending_approval";
    await supabase.from("autonomous_actions_log")
      .update({ approval_status: approvalStatus, updated_at: new Date().toISOString() })
      .eq("id", reference_id);
  }

  return new Response(JSON.stringify({
    audit_id: auditEntry.id,
    decision,
    decision_reason: decisionReason,
    matched_policy: matchedPolicy?.policy_name || null,
    risk_level: risk_level || "unknown",
    approval_roles: matchedPolicy?.approval_roles || ["supervisor", "admin"],
    auto_test_allowed: matchedPolicy?.auto_test_allowed || false,
    canary_rollout_pct: matchedPolicy?.canary_rollout_pct || 0,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function approveOrReject(supabase: ReturnType<typeof createClient>, req: ApproveRejectRequest, isApprove: boolean) {
  const { audit_id, user_id, reason } = req;

  const updates: Record<string, unknown> = {
    execution_status: isApprove ? "approved" : "rejected",
  };

  if (isApprove) {
    updates.approved_by = user_id || null;
    updates.approved_at = new Date().toISOString();
  } else {
    updates.rejected_by = user_id || null;
    updates.rejected_at = new Date().toISOString();
    updates.rejection_reason = reason || "Rejected by admin";
  }

  const { data: audit, error } = await supabase
    .from("approval_audit_log")
    .update(updates)
    .eq("id", audit_id)
    .select()
    .single();

  if (error) throw error;

  // Propagate decision to source tables
  if (audit.domain === "backend_action" && audit.reference_id) {
    await supabase.from("autonomous_actions_log").update({
      approval_status: isApprove ? "approved" : "rejected",
      approved_by: isApprove ? user_id : null,
      approved_at: isApprove ? new Date().toISOString() : null,
      action_status: isApprove ? "executing" : "rejected",
      updated_at: new Date().toISOString(),
    }).eq("id", audit.reference_id);
  }

  if (audit.domain === "kb_improvement" && audit.reference_id) {
    await supabase.from("kb_improvement_candidates").update({
      status: isApprove ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    }).eq("id", audit.reference_id);
  }

  if (audit.domain === "prompt_experiment" && audit.reference_id) {
    await supabase.from("prompt_experiments").update({
      status: isApprove ? "active" : "cancelled",
      updated_at: new Date().toISOString(),
    }).eq("id", audit.reference_id);
  }

  return new Response(JSON.stringify({
    audit_id: audit.id,
    status: isApprove ? "approved" : "rejected",
    propagated_to: audit.reference_table || audit.domain,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
