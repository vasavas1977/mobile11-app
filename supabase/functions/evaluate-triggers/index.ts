import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TriggerRequest {
  trigger_key?: string;
  customer_profile_id?: string;
  context?: Record<string, unknown>;
  mode?: "realtime" | "scheduled";
}

interface TriggerCatalogEntry {
  trigger_key: string;
  evaluation_mode: string;
  is_enabled: boolean;
  default_config: Record<string, unknown>;
}

interface EvaluationOutcome {
  customer_profile_id: string;
  trigger_key: string;
  journey_id: string | null;
  result: string;
  suppression_reason: string | null;
  details: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: TriggerRequest = req.method === "POST"
      ? await req.json()
      : {};

    const mode = body.mode || "scheduled";
    const outcomes: EvaluationOutcome[] = [];

    // ──────────────────────────────────────────────
    // PHASE 1: DETECT — load triggers & find candidates
    // ──────────────────────────────────────────────

    if (mode === "realtime" && body.trigger_key && body.customer_profile_id) {
      // Realtime: single trigger + single customer
      const { data: trigger } = await supabase
        .from("trigger_catalog")
        .select("*")
        .eq("trigger_key", body.trigger_key)
        .single();

      if (!trigger) {
        const outcome: EvaluationOutcome = {
          customer_profile_id: body.customer_profile_id,
          trigger_key: body.trigger_key,
          journey_id: null,
          result: "invalid_context",
          suppression_reason: null,
          details: { reason: "Unknown trigger_key" },
        };
        outcomes.push(outcome);
      } else if (!trigger.is_enabled) {
        const outcome: EvaluationOutcome = {
          customer_profile_id: body.customer_profile_id,
          trigger_key: body.trigger_key,
          journey_id: null,
          result: "trigger_disabled",
          suppression_reason: null,
          details: {},
        };
        outcomes.push(outcome);
      } else {
        await evaluateCustomerForTrigger(
          supabase, body.customer_profile_id, trigger, outcomes, body.context || {}
        );
      }
    } else {
      // Scheduled: process all scheduled/both triggers
      const { data: triggers } = await supabase
        .from("trigger_catalog")
        .select("*")
        .in("evaluation_mode", ["scheduled", "both"])
        .eq("is_enabled", true);

      if (triggers && triggers.length > 0) {
        for (const trigger of triggers) {
          // For scheduled mode, we find matching customers per trigger
          const candidates = await detectCandidates(supabase, trigger);
          for (const customerId of candidates) {
            await evaluateCustomerForTrigger(
              supabase, customerId, trigger, outcomes, {}
            );
          }
        }
      }
    }

    // ──────────────────────────────────────────────
    // PHASE 4: AUDIT — write all evaluation logs
    // ──────────────────────────────────────────────

    if (outcomes.length > 0) {
      const evalLogs = outcomes.map((o) => ({
        customer_profile_id: o.customer_profile_id,
        trigger_key: o.trigger_key,
        journey_id: o.journey_id,
        evaluation_result: o.result,
        suppression_reason: o.suppression_reason,
        evaluation_details: o.details,
      }));

      await supabase.from("trigger_evaluation_logs").insert(evalLogs);

      // Write outbound_suppression_logs ONLY for true suppression cases
      const suppressions = outcomes.filter(
        (o) => o.result === "suppressed" || o.result === "consent_denied"
      );
      if (suppressions.length > 0) {
        const suppressionLogs = suppressions.map((o) => ({
          customer_profile_id: o.customer_profile_id,
          suppression_reason: o.suppression_reason || o.result,
          channel_type: "all",
        }));
        await supabase.from("outbound_suppression_logs").insert(suppressionLogs);
      }
    }

    const summary = {
      total_evaluated: outcomes.length,
      enrolled: outcomes.filter((o) => o.result === "enrolled").length,
      suppressed: outcomes.filter((o) => o.result === "suppressed").length,
      consent_denied: outcomes.filter((o) => o.result === "consent_denied").length,
      already_enrolled: outcomes.filter((o) => o.result === "already_enrolled").length,
      other: outcomes.filter((o) =>
        !["enrolled", "suppressed", "consent_denied", "already_enrolled"].includes(o.result)
      ).length,
    };

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("evaluate-triggers error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ──────────────────────────────────────────────
// PHASE 2 & 3: ELIGIBLE + ENROLL
// ──────────────────────────────────────────────

async function evaluateCustomerForTrigger(
  supabase: any,
  customerId: string,
  trigger: TriggerCatalogEntry,
  outcomes: EvaluationOutcome[],
  context: Record<string, unknown>
) {
  // Find matching active journeys for this trigger
  const { data: journeys } = await supabase
    .from("outbound_journeys")
    .select("id, journey_name, campaign_id")
    .eq("status", "active")
    .contains("trigger_definition", { trigger_key: trigger.trigger_key });

  if (!journeys || journeys.length === 0) {
    outcomes.push({
      customer_profile_id: customerId,
      trigger_key: trigger.trigger_key,
      journey_id: null,
      result: "no_matching_journey",
      suppression_reason: null,
      details: { context },
    });
    return;
  }

  for (const journey of journeys) {
    // Check duplicate enrollment
    const { data: existing } = await supabase
      .from("journey_enrollments")
      .select("id")
      .eq("customer_profile_id", customerId)
      .eq("journey_id", journey.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      outcomes.push({
        customer_profile_id: customerId,
        trigger_key: trigger.trigger_key,
        journey_id: journey.id,
        result: "already_enrolled",
        suppression_reason: null,
        details: { existing_enrollment_id: existing.id },
      });
      continue;
    }

    // Check consent / preferences
    const { data: prefs } = await supabase
      .from("customer_preferences")
      .select("*")
      .eq("customer_profile_id", customerId)
      .maybeSingle();

    if (prefs) {
      if (prefs.opt_out_all) {
        outcomes.push({
          customer_profile_id: customerId,
          trigger_key: trigger.trigger_key,
          journey_id: journey.id,
          result: "consent_denied",
          suppression_reason: "global_opt_out",
          details: {},
        });
        continue;
      }

      if (prefs.manual_suppressed_until && new Date(prefs.manual_suppressed_until) > new Date()) {
        outcomes.push({
          customer_profile_id: customerId,
          trigger_key: trigger.trigger_key,
          journey_id: journey.id,
          result: "suppressed",
          suppression_reason: `manual_suppression: ${prefs.manual_suppression_reason || "no reason"}`,
          details: { suppressed_until: prefs.manual_suppressed_until },
        });
        continue;
      }

      // Check preference category alignment
      const triggerKey = trigger.trigger_key;
      const isSales = ["qualified_lead_detected", "repeat_buyer_opportunity", "cross_sell_opportunity", "promo_click_no_conversion"].includes(triggerKey);
      const isPromo = ["abandoned_checkout", "package_inquiry_no_purchase"].includes(triggerKey);

      if (isSales && prefs.prefers_sales_followup === false) {
        outcomes.push({
          customer_profile_id: customerId,
          trigger_key: trigger.trigger_key,
          journey_id: journey.id,
          result: "consent_denied",
          suppression_reason: "preference_sales_followup_off",
          details: {},
        });
        continue;
      }

      if (isPromo && prefs.prefers_news_and_promotions === false) {
        outcomes.push({
          customer_profile_id: customerId,
          trigger_key: trigger.trigger_key,
          journey_id: journey.id,
          result: "consent_denied",
          suppression_reason: "preference_news_promotions_off",
          details: {},
        });
        continue;
      }

      // Frequency cap check
      if (prefs.max_sends_7d) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("outbound_suppression_logs")
          .select("id", { count: "exact", head: true })
          .eq("customer_profile_id", customerId)
          .gte("created_at", sevenDaysAgo);

        // Rough proxy: count recent enrollments as sends
        const { count: recentEnrollments } = await supabase
          .from("journey_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("customer_profile_id", customerId)
          .gte("enrolled_at", sevenDaysAgo);

        if ((recentEnrollments || 0) >= prefs.max_sends_7d) {
          outcomes.push({
            customer_profile_id: customerId,
            trigger_key: trigger.trigger_key,
            journey_id: journey.id,
            result: "suppressed",
            suppression_reason: "frequency_cap_7d",
            details: { cap: prefs.max_sends_7d, current: recentEnrollments },
          });
          continue;
        }
      }
    }

    // PHASE 3: ENROLL
    const { error: enrollError } = await supabase
      .from("journey_enrollments")
      .insert({
        customer_profile_id: customerId,
        journey_id: journey.id,
        current_step_order: 0,
        status: "active",
        enrollment_source: "trigger_engine",
        enrollment_trigger_key: trigger.trigger_key,
        enrollment_reason: `Auto-enrolled by trigger: ${trigger.trigger_key}`,
        metadata: context,
      });

    if (enrollError) {
      // Likely dedup constraint violation
      outcomes.push({
        customer_profile_id: customerId,
        trigger_key: trigger.trigger_key,
        journey_id: journey.id,
        result: enrollError.code === "23505" ? "already_enrolled" : "error",
        suppression_reason: null,
        details: { error: enrollError.message },
      });
    } else {
      outcomes.push({
        customer_profile_id: customerId,
        trigger_key: trigger.trigger_key,
        journey_id: journey.id,
        result: "enrolled",
        suppression_reason: null,
        details: { context },
      });
    }
  }
}

// Scheduled trigger candidate detection (extensible per trigger_key)
async function detectCandidates(
  supabase: any,
  trigger: TriggerCatalogEntry
): Promise<string[]> {
  const key = trigger.trigger_key;
  const config = trigger.default_config as Record<string, any>;

  try {
    switch (key) {
      case "inactive_x_days": {
        const days = config.inactive_days || 30;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("customer_profiles")
          .select("id")
          .lt("last_active_at", cutoff)
          .limit(100);
        return (data || []).map((r: any) => r.id);
      }

      case "abandoned_checkout": {
        // Placeholder: would query orders with status = 'pending_payment' older than threshold
        const { data } = await supabase
          .from("orders")
          .select("user_id")
          .eq("status", "pending_payment")
          .lt("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .limit(100);
        if (!data || data.length === 0) return [];
        // Map user_id to customer_profile_id
        const userIds = [...new Set(data.map((r: any) => r.user_id).filter(Boolean))];
        if (userIds.length === 0) return [];
        const { data: profiles } = await supabase
          .from("customer_profiles")
          .select("id")
          .in("user_id", userIds);
        return (profiles || []).map((r: any) => r.id);
      }

      default:
        // Other scheduled triggers return empty for now — extend as needed
        return [];
    }
  } catch (err: any) {
    console.error(`detectCandidates error for ${key}:`, err);
    return [];
  }
}
