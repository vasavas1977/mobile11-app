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
    const body = await req.json().catch(() => ({}));
    const clusterId = body.cluster_id; // optional: generate for specific cluster

    // 1. Get clusters needing KB review (low score, high impact)
    let clusterQuery = supabase
      .from("ai_intent_clusters")
      .select("id, cluster_name, cluster_description, average_ai_score, conversation_count, representative_questions, common_bad_responses, root_cause_hypothesis, recommended_action, language, impact_score, urgency_score")
      .order("impact_score", { ascending: false })
      .limit(10);

    if (clusterId) {
      clusterQuery = clusterQuery.eq("id", clusterId);
    } else {
      clusterQuery = clusterQuery.lt("average_ai_score", 70);
    }

    const { data: clusters, error: clusterErr } = await clusterQuery;
    if (clusterErr) throw clusterErr;
    if (!clusters || clusters.length === 0) {
      return new Response(JSON.stringify({ status: "no_clusters_to_process", generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Load all published KB articles for matching
    const { data: kbArticles } = await supabase
      .from("kb_articles")
      .select("id, title, category, content, language, slug")
      .eq("is_published", true)
      .order("category");

    const kbIndex = (kbArticles || []).map(a => ({
      id: a.id,
      title: a.title,
      category: a.category,
      language: a.language,
      content_preview: (a.content || "").substring(0, 500),
      slug: a.slug,
    }));

    // 3. Get recent failure events related to these clusters
    const clusterIds = clusters.map(c => c.id);
    const { data: existingCandidates } = await supabase
      .from("kb_improvement_candidates")
      .select("related_cluster_id, status")
      .in("related_cluster_id", clusterIds)
      .in("status", ["pending", "approved"]);

    const processedClusterIds = new Set(
      (existingCandidates || []).map(c => c.related_cluster_id)
    );

    let generated = 0;

    for (const cluster of clusters) {
      // Skip if already has a pending/approved candidate
      if (processedClusterIds.has(cluster.id)) continue;

      // 4. AI: Analyze cluster against KB and generate improvement
      const analysisPrompt = `You are a Knowledge Base optimization expert for Mobile11, an eSIM provider operating in Thai and English.

## Cluster Analysis
- Cluster: "${cluster.cluster_name}"
- Description: ${cluster.cluster_description || "N/A"}
- Average AI Score: ${cluster.average_ai_score}/100
- Conversations: ${cluster.conversation_count}
- Language: ${cluster.language || "mixed"}
- Root Cause Hypothesis: ${cluster.root_cause_hypothesis || "Unknown"}
- Representative Customer Questions: ${JSON.stringify(cluster.representative_questions || [])}
- Common Bad Bot Responses: ${JSON.stringify(cluster.common_bad_responses || [])}

## Current KB Articles (titles + previews)
${kbIndex.map(a => `- [${a.category}/${a.language}] "${a.title}" (ID: ${a.id}): ${a.content_preview}...`).join("\n")}

## Your Task
1. Identify which existing KB article(s) are most related to this cluster's issues
2. Analyze what is MISSING or WEAK in the current KB that causes the bot to fail
3. Generate a comprehensive KB article draft that would fix the identified issues
4. The draft must be clear, structured with headers, and cover all edge cases from the representative questions

Respond in this exact JSON format:
{
  "related_article_id": "uuid of most related existing article or null",
  "issue_type": "missing_article|outdated_content|incomplete_answer|conflicting_info|low_clarity|wrong_language|bad_structure|missing_facts",
  "issue_summary": "2-3 sentence summary of what's wrong",
  "weakness_analysis": "Detailed analysis of current KB weaknesses causing failures",
  "missing_facts": ["list", "of", "specific", "missing", "facts"],
  "suggested_title": "Proposed article title",
  "suggested_category": "about-mobile11|getting-started|using-esim|account|troubleshoot|affiliate",
  "suggested_language": "en or th",
  "proposed_kb_draft": "Full markdown article content with headers, structured clearly",
  "current_kb_excerpt": "Relevant excerpt from existing KB that needs improvement (or empty if new article)",
  "expected_impact": "high|medium|low",
  "confidence_level": 0.85,
  "related_failure_types": ["wrong_answer", "missing_kb"]
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
              { role: "system", content: "You are a KB optimization expert. Always respond with valid JSON only, no markdown fencing." },
              { role: "user", content: analysisPrompt },
            ],
            temperature: 0.3,
          }),
        });

        if (!aiRes.ok) {
          console.error(`[kb-generate] AI call failed for cluster ${cluster.id}: ${aiRes.status}`);
          continue;
        }

        const aiResult = await aiRes.json();
        let content = aiResult.choices?.[0]?.message?.content || "";
        // Strip markdown fencing if present
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch {
          console.error(`[kb-generate] Failed to parse AI response for cluster ${cluster.id}`);
          continue;
        }

        // Validate related_article_id exists
        const validArticleId = kbIndex.find(a => a.id === parsed.related_article_id)?.id || null;

        // Map expected_impact to priority
        const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const priority = priorityMap[parsed.expected_impact] || 1;

        // 5. Insert KB improvement candidate
        const { error: insertErr } = await supabase
          .from("kb_improvement_candidates")
          .insert({
            related_cluster_id: cluster.id,
            related_article_id: validArticleId,
            issue_type: parsed.issue_type || "missing_article",
            issue_summary: parsed.issue_summary || `Improvement needed for: ${cluster.cluster_name}`,
            weakness_analysis: parsed.weakness_analysis,
            missing_facts: parsed.missing_facts || [],
            suggested_title: parsed.suggested_title || cluster.cluster_name,
            suggested_category: parsed.suggested_category || "troubleshoot",
            suggested_language: parsed.suggested_language || "en",
            proposed_kb_draft: parsed.proposed_kb_draft,
            current_kb_excerpt: parsed.current_kb_excerpt,
            expected_impact: parsed.expected_impact || "medium",
            confidence_level: Math.min(1, Math.max(0, parsed.confidence_level || 0.5)),
            impact_score: cluster.impact_score || 0,
            related_failure_types: parsed.related_failure_types || [],
            conversation_examples: cluster.representative_questions || [],
            priority: priority,
            generated_by: "ai-kb-engine-v1",
            status: "pending",
          });

        if (insertErr) {
          console.error(`[kb-generate] Insert error for cluster ${cluster.id}:`, insertErr);
          continue;
        }

        generated++;
      } catch (err: any) {
        console.error(`[kb-generate] Error processing cluster ${cluster.id}:`, err);
      }
    }

    // 6. Log autonomous action
    await supabase.from("autonomous_actions_log").insert({
      action_type: "kb_improvements_generated",
      action_payload: { cluster_count: clusters.length },
      action_result: { generated },
      action_status: "completed",
      triggered_by: body.triggered_by || "manual",
      approval_status: "auto_approved",
    });

    console.log(`[kb-generate] Generated ${generated} KB improvement candidates`);

    return new Response(JSON.stringify({ status: "ok", generated, clusters_analyzed: clusters.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[kb-generate] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
