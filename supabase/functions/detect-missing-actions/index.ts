import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known action types from the catalog
const KNOWN_ACTIONS = [
  "check_order_status", "check_payment_status", "resend_payment_link",
  "resend_esim_qr", "check_activation_status", "check_package_details",
  "create_refund_request", "create_escalation_ticket", "schedule_followup",
  "send_recovery_message", "create_sales_lead", "human_handoff",
];

// Intent patterns that imply the customer wanted an ACTION, not just an answer
const ACTION_INTENT_PATTERNS = [
  { pattern: /resend.*(qr|code|email|link|esim)/i, intent: "resend_esim_qr", action: "resend_esim_qr" },
  { pattern: /resend.*(payment|pay|invoice)/i, intent: "resend_payment_link", action: "resend_payment_link" },
  { pattern: /(refund|money back|cancel.*order|return)/i, intent: "request_refund", action: "create_refund_request" },
  { pattern: /(order|purchase).*(status|where|track)/i, intent: "check_order", action: "check_order_status" },
  { pattern: /(payment|paid|charge).*(status|check|confirm|fail|problem)/i, intent: "check_payment", action: "check_payment_status" },
  { pattern: /(activat|install|setup|connect).*(check|status|not work|fail|problem)/i, intent: "check_activation", action: "check_activation_status" },
  { pattern: /(package|plan|data).*(detail|info|price|compare)/i, intent: "check_packages", action: "check_package_details" },
  { pattern: /(speak|talk|human|agent|person|staff|manager)/i, intent: "human_handoff", action: "human_handoff" },
  { pattern: /(follow.?up|call.?back|contact.?later)/i, intent: "schedule_followup", action: "schedule_followup" },
  { pattern: /(top.?up|add.?data|extend|renew)/i, intent: "topup_data", action: null },
  { pattern: /(change|swap|switch).*(plan|package|number)/i, intent: "change_plan", action: null },
  { pattern: /(cancel|stop|terminate).*(subscription|plan|service)/i, intent: "cancel_service", action: null },
  { pattern: /(transfer|port|move).*(number|esim)/i, intent: "transfer_esim", action: null },
  { pattern: /(invoice|receipt|billing|tax)/i, intent: "get_invoice", action: null },
  { pattern: /(compatible|support|device|phone).*(check|work)/i, intent: "device_compatibility", action: null },
  { pattern: /(coverage|signal|network).*(check|map|area)/i, intent: "coverage_check", action: null },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const lookbackDays = body.lookback_days || 7;
    const minOccurrences = body.min_occurrences || 3;

    const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();

    // 1. Get recent failure events of type missing_backend_action
    const { data: existingFailures } = await supabase
      .from("ai_failure_events")
      .select("id, conversation_id, customer_last_message, bot_response_excerpt, created_at")
      .eq("failure_type", "missing_backend_action")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    // 2. Get recent conversations where bot replied but customer was unsatisfied
    //    (low ratings or dead air after bot response)
    const { data: lowRatedConvos } = await supabase
      .from("conversation_ratings")
      .select("conversation_id, rating, feedback_text")
      .lte("rating", 2)
      .gte("created_at", since)
      .limit(300);

    const lowRatedIds = (lowRatedConvos || []).map((r: any) => r.conversation_id).filter(Boolean);

    // 3. Get dead air events (bot responded but customer went silent)
    const { data: deadAirEvents } = await supabase
      .from("dead_air_events")
      .select("conversation_id, bot_message_content, silence_duration_seconds")
      .gte("created_at", since)
      .gte("silence_duration_seconds", 300)
      .limit(300);

    // 4. Collect all conversation IDs to check
    const allConvoIds = new Set<string>();
    (existingFailures || []).forEach((f: any) => f.conversation_id && allConvoIds.add(f.conversation_id));
    lowRatedIds.forEach((id: string) => allConvoIds.add(id));
    (deadAirEvents || []).forEach((d: any) => allConvoIds.add(d.conversation_id));

    if (allConvoIds.size === 0) {
      return new Response(JSON.stringify({ detected: 0, message: "No candidates found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Get customer messages from these conversations
    const convoIdArray = Array.from(allConvoIds).slice(0, 200);
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("conversation_id, content, sender_type, created_at")
      .in("conversation_id", convoIdArray)
      .eq("sender_type", "customer")
      .order("created_at", { ascending: true })
      .limit(2000);

    // 6. Detect action intents in customer messages
    const intentMap: Record<string, {
      intent: string;
      existingAction: string | null;
      messages: string[];
      conversationIds: Set<string>;
    }> = {};

    for (const msg of (messages || [])) {
      const text = msg.content || "";
      for (const p of ACTION_INTENT_PATTERNS) {
        if (p.pattern.test(text)) {
          const key = p.intent;
          if (!intentMap[key]) {
            intentMap[key] = {
              intent: p.intent,
              existingAction: p.action,
              messages: [],
              conversationIds: new Set(),
            };
          }
          if (intentMap[key].messages.length < 10) {
            intentMap[key].messages.push(text.slice(0, 300));
          }
          intentMap[key].conversationIds.add(msg.conversation_id);
          break;
        }
      }
    }

    // 7. Filter to only intents where no action exists or action wasn't triggered
    const { data: catalogActions } = await supabase
      .from("action_catalog")
      .select("action_type, is_enabled")
      .eq("is_enabled", true);

    const enabledActions = new Set((catalogActions || []).map((a: any) => a.action_type));

    // Check which intents resulted in actual action executions
    const { data: executedActions } = await supabase
      .from("autonomous_actions_log")
      .select("action_type, conversation_id")
      .in("conversation_id", convoIdArray)
      .gte("created_at", since)
      .limit(1000);

    const executedByConvo: Record<string, Set<string>> = {};
    for (const ea of (executedActions || [])) {
      if (!executedByConvo[ea.conversation_id]) executedByConvo[ea.conversation_id] = new Set();
      executedByConvo[ea.conversation_id].add(ea.action_type);
    }

    // 8. Identify missing actions
    const missingActions: Array<{
      intent: string;
      actionName: string;
      description: string;
      messages: string[];
      conversationIds: string[];
      occurrences: number;
      isMissing: boolean;
      isDisabled: boolean;
    }> = [];

    for (const [key, data] of Object.entries(intentMap)) {
      const convos = Array.from(data.conversationIds);
      if (convos.length < minOccurrences) continue;

      // Count how many conversations had the intent but NO action executed
      let missedCount = 0;
      for (const cid of convos) {
        const executed = executedByConvo[cid];
        if (!executed || (data.existingAction && !executed.has(data.existingAction))) {
          missedCount++;
        }
      }

      if (missedCount < minOccurrences) continue;

      const noActionExists = !data.existingAction || !enabledActions.has(data.existingAction);

      missingActions.push({
        intent: data.intent,
        actionName: data.existingAction || `auto_${key}`,
        description: noActionExists
          ? `No backend action exists for "${key}" intent. Customers asked but bot could only explain.`
          : `Action "${data.existingAction}" exists but was not triggered in ${missedCount}/${convos.length} conversations.`,
        messages: data.messages,
        conversationIds: convos.slice(0, 20),
        occurrences: missedCount,
        isMissing: noActionExists,
        isDisabled: data.existingAction ? !enabledActions.has(data.existingAction) : false,
      });
    }

    // 9. Create failure events and missing action candidates
    let failuresCreated = 0;
    let candidatesCreated = 0;

    for (const ma of missingActions) {
      // Create ai_failure_events for conversations that don't already have one
      const existingFailureConvos = new Set(
        (existingFailures || []).map((f: any) => f.conversation_id)
      );

      for (const cid of ma.conversationIds.slice(0, 5)) {
        if (existingFailureConvos.has(cid)) continue;
        await supabase.from("ai_failure_events").insert({
          conversation_id: cid,
          failure_type: "missing_backend_action",
          failure_subtype: ma.intent,
          severity: ma.occurrences >= 10 ? "high" : "medium",
          detected_by: "detect-missing-actions",
          root_cause_guess: ma.isMissing ? "no_action_implemented" : "action_not_triggered",
          suggested_fix_type: "new_action",
          bot_response_excerpt: ma.description,
          customer_last_message: ma.messages[0] || null,
        });
        failuresCreated++;
      }

      // Calculate impact score: volume * lift potential
      const monthlyVolume = Math.round(ma.occurrences * (30 / (body.lookback_days || 7)));
      const containmentLift = ma.isMissing ? 15 : 8;
      const csatLift = ma.isMissing ? 10 : 5;
      const impactScore = Math.min(100, Math.round(
        (monthlyVolume * 0.4) + (containmentLift * 2) + (csatLift * 2)
      ));

      // Upsert missing_action_candidate
      const { data: existing } = await supabase
        .from("missing_action_candidates")
        .select("id, occurrence_count")
        .eq("detected_intent", ma.intent)
        .eq("status", "detected")
        .maybeSingle();

      if (existing) {
        await supabase.from("missing_action_candidates").update({
          occurrence_count: existing.occurrence_count + ma.occurrences,
          estimated_monthly_volume: monthlyVolume,
          estimated_containment_lift: containmentLift,
          estimated_csat_lift: csatLift,
          impact_score: impactScore,
          example_customer_messages: ma.messages,
          example_conversation_ids: ma.conversationIds.slice(0, 20),
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("missing_action_candidates").insert({
          action_name: ma.actionName,
          action_description: ma.description,
          detected_intent: ma.intent,
          example_customer_messages: ma.messages,
          example_conversation_ids: ma.conversationIds.slice(0, 20),
          occurrence_count: ma.occurrences,
          estimated_monthly_volume: monthlyVolume,
          estimated_containment_lift: containmentLift,
          estimated_csat_lift: csatLift,
          impact_score: impactScore,
          suggested_approval_required: ["request_refund", "cancel_service"].includes(ma.intent),
          status: "detected",
        });
        candidatesCreated++;
      }
    }

    return new Response(JSON.stringify({
      analyzed_conversations: allConvoIds.size,
      intents_detected: Object.keys(intentMap).length,
      missing_actions: missingActions.length,
      failures_created: failuresCreated,
      candidates_created: candidatesCreated,
      details: missingActions.map(ma => ({
        intent: ma.intent,
        occurrences: ma.occurrences,
        is_missing: ma.isMissing,
      })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("detect-missing-actions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
