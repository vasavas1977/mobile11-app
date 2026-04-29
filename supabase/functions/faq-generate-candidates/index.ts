import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Get clusters with repeated questions, low scores, or high dead-air
    const { data: clusters } = await supabase
      .from("ai_intent_clusters")
      .select("id, cluster_name, cluster_description, average_ai_score, conversation_count, representative_questions, common_bad_responses, dead_air_rate, human_handoff_rate, containment_rate, language, impact_score, root_cause_hypothesis")
      .or("average_ai_score.lt.70,dead_air_rate.gt.0.2,human_handoff_rate.gt.0.3")
      .gt("conversation_count", 2)
      .order("conversation_count", { ascending: false })
      .limit(15);

    if (!clusters || clusters.length === 0) {
      return new Response(JSON.stringify({ status: "no_clusters", generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check which clusters already have FAQ candidates
    const clusterIds = clusters.map(c => c.id);
    const { data: existing } = await supabase
      .from("faq_candidates")
      .select("source_cluster_id")
      .in("source_cluster_id", clusterIds)
      .in("status", ["pending", "approved", "published"]);

    const existingSet = new Set((existing || []).map(e => e.source_cluster_id));

    // 3. Load existing KB for dedup
    const { data: kbArticles } = await supabase
      .from("kb_articles")
      .select("id, title, category, language, content")
      .eq("is_published", true);

    const kbTitles = (kbArticles || []).map(a => a.title.toLowerCase());

    let generated = 0;

    for (const cluster of clusters) {
      if (existingSet.has(cluster.id)) continue;

      const questions = cluster.representative_questions || [];
      if (questions.length === 0) continue;

      // 4. AI: Generate FAQ candidate
      const prompt = `You are a FAQ content specialist for Mobile11, an eSIM provider serving customers in Thai and English.

## Context
Cluster: "${cluster.cluster_name}"
Description: ${cluster.cluster_description || "N/A"}
Average AI Score: ${cluster.average_ai_score}/100
Conversations: ${cluster.conversation_count}
Dead Air Rate: ${(cluster.dead_air_rate || 0) * 100}%
Handoff Rate: ${(cluster.human_handoff_rate || 0) * 100}%
Language: ${cluster.language || "mixed"}
Root Cause: ${cluster.root_cause_hypothesis || "Unknown"}

Representative customer questions:
${(questions as string[]).map((q, i) => `${i + 1}. "${q}"`).join("\n")}

Common bad bot responses:
${((cluster.common_bad_responses || []) as string[]).map((r, i) => `${i + 1}. "${r}"`).join("\n")}

Existing KB article titles (for dedup):
${kbTitles.slice(0, 50).join(", ")}

## Task
Generate a FAQ that would prevent these failures. Respond in JSON:
{
  "faq_title": "Clear FAQ title (max 80 chars)",
  "canonical_question": "The most natural way a customer would ask this",
  "customer_phrasings": ["3-5 alternative ways customers ask this"],
  "short_answer": "Concise 2-3 sentence answer for bot/chatbot use",
  "long_answer": "Detailed help-center article (3-5 paragraphs with headers, markdown formatted, covers edge cases)",
  "intent_tag": "e.g. esim_activation, payment_issue, compatibility_check",
  "language": "en or th (based on dominant cluster language)",
  "category": "about-mobile11|getting-started|using-esim|account|troubleshoot|affiliate",
  "frequency_score": 0.0-1.0,
  "confusion_score": 0.0-1.0,
  "expected_support_reduction": 0.0-1.0,
  "confidence": 0.0-1.0
}`;

      try {
        const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a FAQ generation expert. Respond with valid JSON only, no markdown fencing." },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (!aiRes.ok) {
          console.error(`[faq-generate] AI call failed for cluster ${cluster.id}: ${aiRes.status}`);
          continue;
        }

        const aiResult = await aiRes.json();
        let content = aiResult.choices?.[0]?.message?.content || "";
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        let parsed: any;
        try { parsed = JSON.parse(content); } catch {
          console.error(`[faq-generate] Parse error for cluster ${cluster.id}`);
          continue;
        }

        // Dedup: skip if title already exists in KB
        if (kbTitles.includes((parsed.faq_title || "").toLowerCase())) {
          console.log(`[faq-generate] Skipping duplicate title: ${parsed.faq_title}`);
          continue;
        }

        // Priority: high frequency + high confusion = high priority
        const freq = Math.min(1, parsed.frequency_score || 0);
        const conf = Math.min(1, parsed.confusion_score || 0);
        const priority = Math.round((freq * 0.4 + conf * 0.3 + (parsed.expected_support_reduction || 0) * 0.3) * 10);

        // Get failure types from cluster's failure events
        const { data: failures } = await supabase
          .from("ai_failure_events")
          .select("failure_type")
          .eq("conversation_id", cluster.id)
          .limit(20);

        const failureTypes = [...new Set((failures || []).map(f => f.failure_type))];

        const { error: insertErr } = await supabase
          .from("faq_candidates")
          .insert({
            canonical_question: parsed.canonical_question || cluster.cluster_name,
            customer_phrasings: parsed.customer_phrasings || [],
            short_answer: parsed.short_answer,
            long_answer: parsed.long_answer,
            faq_title: parsed.faq_title,
            intent_tag: parsed.intent_tag,
            language: parsed.language || "en",
            category: parsed.category || "troubleshoot",
            source_cluster_id: cluster.id,
            source_failure_types: failureTypes,
            conversation_count: cluster.conversation_count,
            frequency_score: freq,
            confusion_score: conf,
            expected_support_reduction: Math.min(1, parsed.expected_support_reduction || 0),
            confidence: Math.min(1, parsed.confidence || 0.5),
            priority,
          });

        if (insertErr) {
          console.error(`[faq-generate] Insert error:`, insertErr);
          continue;
        }
        generated++;
      } catch (err: any) {
        console.error(`[faq-generate] Error for cluster ${cluster.id}:`, err);
      }
    }

    // Log action
    await supabase.from("autonomous_actions_log").insert({
      action_type: "faq_candidates_generated",
      action_payload: { clusters_analyzed: clusters.length },
      action_result: { generated },
      action_status: "completed",
      triggered_by: "manual",
      approval_status: "auto_approved",
    });

    console.log(`[faq-generate] Generated ${generated} FAQ candidates`);

    return new Response(JSON.stringify({ status: "ok", generated, clusters_analyzed: clusters.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[faq-generate] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
