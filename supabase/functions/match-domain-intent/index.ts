import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { conversation_id, messages } = await req.json();

    if (!conversation_id || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "conversation_id and messages required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active intents
    const { data: intents } = await supabase
      .from("domain_intent_library")
      .select("*")
      .eq("is_active", true);

    if (!intents || intents.length === 0) {
      return new Response(
        JSON.stringify({ matched_intents: [], message: "No active intents" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combine all customer messages into searchable text
    const customerText = messages
      .filter((m: any) => m.sender_type === "customer")
      .map((m: any) => m.content?.toLowerCase() || "")
      .join(" ");

    const allText = messages
      .map((m: any) => m.content?.toLowerCase() || "")
      .join(" ");

    // Score each intent against conversation content
    const matchedIntents: any[] = [];

    for (const intent of intents) {
      let score = 0;
      const matchedKeywords: string[] = [];

      // Keyword matching
      const keywords = intent.matching_keywords || [];
      for (const kw of keywords) {
        if (customerText.includes(kw.toLowerCase())) {
          score += 10;
          matchedKeywords.push(kw);
        }
      }

      // Pattern matching
      const patterns = intent.matching_patterns || [];
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern, "i");
          if (regex.test(customerText)) {
            score += 15;
          }
        } catch {
          // Skip invalid patterns
        }
      }

      // Normalize to 0-1 confidence
      const maxPossible = keywords.length * 10 + patterns.length * 15;
      const confidence = maxPossible > 0 ? Math.min(score / maxPossible, 1) : 0;

      if (confidence >= 0.15) {
        matchedIntents.push({
          intent_id: intent.id,
          intent_key: intent.intent_key,
          display_name: intent.display_name,
          confidence,
          matched_keywords: matchedKeywords,
          score_expectations: intent.score_expectations,
          ideal_actions: intent.ideal_actions,
          resolution_criteria: intent.resolution_criteria,
        });
      }
    }

    // Sort by confidence descending
    matchedIntents.sort((a, b) => b.confidence - a.confidence);

    // Take top 3 matches
    const topMatches = matchedIntents.slice(0, 3);

    // Fetch AI scores for this conversation to compare against expectations
    const { data: scores } = await supabase
      .from("ai_conversation_scores")
      .select("*")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const aiScore = scores?.[0];

    // Build score comparisons and improvement suggestions for each match
    for (const match of topMatches) {
      const expectations = match.score_expectations || {};
      const scoreComparison: any = {};
      const suggestions: string[] = [];

      if (aiScore) {
        const dimensionMap: Record<string, string> = {
          min_accuracy: "ai_accuracy_score",
          min_resolution: "ai_resolution_score",
          min_clarity: "ai_clarity_score",
          min_empathy: "ai_empathy_score",
          min_policy_compliance: "ai_policy_compliance_score",
          min_confidence: "ai_confidence_score",
          min_business_outcome: "business_outcome_score",
        };

        for (const [expKey, dbCol] of Object.entries(dimensionMap)) {
          const expected = expectations[expKey];
          const actual = aiScore[dbCol];
          if (expected != null && actual != null) {
            const gap = actual - expected;
            scoreComparison[expKey] = {
              expected,
              actual,
              gap: Math.round(gap * 10) / 10,
              status: gap >= 0 ? "met" : gap >= -2 ? "close" : "below",
            };
            if (gap < -2) {
              const dimension = expKey.replace("min_", "").replace(/_/g, " ");
              suggestions.push(
                `${dimension} score (${actual.toFixed(1)}) is significantly below target (${expected})`
              );
            }
          }
        }
      }

      // Check which ideal actions were triggered
      const { data: actions } = await supabase
        .from("autonomous_actions_log")
        .select("action_type, action_status")
        .eq("conversation_id", conversation_id);

      const triggeredActions = new Set(
        (actions || []).map((a: any) => a.action_type)
      );
      const missingActions: string[] = [];
      for (const idealAction of match.ideal_actions || []) {
        if (idealAction.required && !triggeredActions.has(idealAction.action_type)) {
          missingActions.push(idealAction.action_type);
          suggestions.push(
            `Required action "${idealAction.action_type.replace(/_/g, " ")}" was not triggered`
          );
        }
      }

      const behaviorCompliance = {
        actions_triggered: Array.from(triggeredActions),
        missing_required_actions: missingActions,
        all_required_met: missingActions.length === 0,
      };

      // Upsert match record
      await supabase.from("conversation_intent_matches").upsert(
        {
          conversation_id,
          intent_id: match.intent_id,
          confidence: match.confidence,
          matched_keywords: match.matched_keywords,
          score_vs_expectation: scoreComparison,
          behavior_compliance: behaviorCompliance,
          improvement_suggestions: suggestions,
        },
        { onConflict: "conversation_id,intent_id" }
      );

      match.score_vs_expectation = scoreComparison;
      match.behavior_compliance = behaviorCompliance;
      match.improvement_suggestions = suggestions;
    }

    // Update conversation counts on intents
    for (const match of topMatches) {
      await supabase.rpc("", {}).catch(() => {});
      // Simple increment via update
      const { data: current } = await supabase
        .from("domain_intent_library")
        .select("total_conversations")
        .eq("id", match.intent_id)
        .single();

      if (current) {
        await supabase
          .from("domain_intent_library")
          .update({
            total_conversations: (current.total_conversations || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", match.intent_id);
      }
    }

    return new Response(
      JSON.stringify({
        conversation_id,
        matched_intents: topMatches,
        total_checked: intents.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Intent matching error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
