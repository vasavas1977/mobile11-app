import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrchestratorRequest {
  conversation_id: string;
  customer_id?: string;
  customer_message?: string;
  detected_intent?: string;
  channel?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body: OrchestratorRequest = await req.json();
    const { conversation_id, customer_id, customer_message, detected_intent, channel } = body;

    // 1. Check for existing active journey execution
    const { data: existingExec } = await supabase
      .from("journey_executions")
      .select("*, customer_journey_templates(*)")
      .eq("conversation_id", conversation_id)
      .is("completed_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingExec) {
      // Continue existing journey
      const template = existingExec.customer_journey_templates;
      const steps = template.ideal_steps as any[];
      const completedSteps = existingExec.steps_completed as string[];
      const nextStep = steps.find((s: any) => !completedSteps.includes(s.step) && s.required);
      
      // Check handoff triggers
      const handoffNeeded = evaluateHandoffTriggers(
        template.handoff_triggers as any[],
        customer_message || "",
        completedSteps.length,
      );

      if (handoffNeeded) {
        await supabase.from("journey_executions").update({
          outcome: "handed_off",
          outcome_details: { reason: handoffNeeded.trigger, priority: handoffNeeded.priority },
          completed_at: new Date().toISOString(),
        }).eq("id", existingExec.id);

        return json({
          journey_id: template.id,
          journey_key: template.journey_key,
          execution_id: existingExec.id,
          status: "handoff_required",
          handoff_reason: handoffNeeded.trigger,
          handoff_priority: handoffNeeded.priority,
        });
      }

      // Determine available actions for this step
      const actions = (template.action_opportunities as any[])
        .filter((a: any) => a.required || completedSteps.length >= 1);

      return json({
        journey_id: template.id,
        journey_key: template.journey_key,
        execution_id: existingExec.id,
        status: "in_progress",
        current_step: nextStep || null,
        steps_completed: completedSteps,
        total_steps: steps.length,
        available_actions: actions,
        fallback_rules: template.fallback_rules,
        scoring_criteria: template.scoring_criteria,
        optimization_targets: template.optimization_targets,
      });
    }

    // 2. Match conversation to a journey template
    const { data: templates } = await supabase
      .from("customer_journey_templates")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (!templates || templates.length === 0) {
      return json({ status: "no_journey", message: "No active journey templates" });
    }

    const matched = matchJourney(templates, detected_intent, customer_message || "");

    if (!matched) {
      return json({ status: "no_match", message: "No journey matched for this conversation" });
    }

    // 3. Create journey execution
    const { data: execution, error: execErr } = await supabase
      .from("journey_executions")
      .insert({
        journey_id: matched.id,
        conversation_id,
        customer_id: customer_id || null,
        current_step: (matched.ideal_steps as any[])[0]?.step || null,
        steps_completed: [],
        actions_triggered: [],
      })
      .select()
      .single();

    if (execErr) throw execErr;

    const steps = matched.ideal_steps as any[];
    const actions = matched.action_opportunities as any[];

    return json({
      journey_id: matched.id,
      journey_key: matched.journey_key,
      journey_name: matched.journey_name,
      execution_id: execution.id,
      status: "started",
      current_step: steps[0] || null,
      total_steps: steps.length,
      ideal_steps: steps,
      available_actions: actions.filter((a: any) => a.required),
      fallback_rules: matched.fallback_rules,
      scoring_criteria: matched.scoring_criteria,
      success_outcomes: matched.success_outcomes,
      handoff_triggers: matched.handoff_triggers,
      optimization_targets: matched.optimization_targets,
    });
  } catch (e: any) {
    console.error("Journey orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function matchJourney(
  templates: any[],
  detectedIntent?: string,
  message?: string,
): any | null {
  const messageLower = (message || "").toLowerCase();
  let bestMatch: any = null;
  let bestScore = 0;

  for (const t of templates) {
    let score = 0;

    // Intent match (strongest signal)
    if (detectedIntent && (t.trigger_intents as string[]).includes(detectedIntent)) {
      score += 100;
    }

    // Keyword match
    const keywords = t.trigger_keywords as string[];
    for (const kw of keywords) {
      if (messageLower.includes(kw.toLowerCase())) {
        score += 10;
      }
    }

    // Priority bonus
    score += (t.priority || 50) / 100;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = t;
    }
  }

  return bestScore >= 10 ? bestMatch : null;
}

function evaluateHandoffTriggers(
  triggers: any[],
  message: string,
  stepsCompleted: number,
): { trigger: string; priority: string } | null {
  const msgLower = message.toLowerCase();

  for (const t of triggers) {
    const triggerText = (t.trigger || "").toLowerCase();

    if (triggerText.includes("customer requests human") &&
      (msgLower.includes("speak to human") || msgLower.includes("talk to agent") || msgLower.includes("real person"))) {
      return t;
    }
    if (triggerText.includes("frustrated") && stepsCompleted >= 4 &&
      (msgLower.includes("not working") || msgLower.includes("useless") || msgLower.includes("terrible"))) {
      return t;
    }
    if (triggerText.includes("chargeback") && msgLower.includes("chargeback")) {
      return t;
    }
    if (triggerText.includes("fraud") && msgLower.includes("fraud")) {
      return t;
    }
  }

  return null;
}
