import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
    // 1. Fetch scored events not yet clustered
    const { data: scoredEvents, error: fetchErr } = await supabase
      .from("ai_conversation_events")
      .select("*")
      .eq("processing_status", "scored")
      .in("event_type", ["customer_message", "bot_reply", "rating_received", "dead_air", "human_handoff", "conversation_resolved"])
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) throw fetchErr;
    if (!scoredEvents || scoredEvents.length === 0) {
      return new Response(
        JSON.stringify({ status: "no_scored_events" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group events by conversation
    const convGroups: Record<string, typeof scoredEvents> = {};
    for (const evt of scoredEvents) {
      if (!convGroups[evt.conversation_id]) convGroups[evt.conversation_id] = [];
      convGroups[evt.conversation_id].push(evt);
    }
    const convIds = Object.keys(convGroups);

    // 2. Fetch scores and failures for these conversations
    const { data: convScores } = await supabase
      .from("ai_conversation_scores")
      .select("conversation_id, composite_score, channel, language")
      .in("conversation_id", convIds);

    const { data: convFailures } = await supabase
      .from("ai_failure_events")
      .select("conversation_id, failure_type, severity, root_cause_guess, bot_response_excerpt, customer_last_message")
      .in("conversation_id", convIds);

    const { data: convRatings } = await supabase
      .from("conversation_ratings")
      .select("conversation_id, rating")
      .in("conversation_id", convIds);

    const { data: deadAirs } = await supabase
      .from("dead_air_events")
      .select("conversation_id")
      .in("conversation_id", convIds);

    // Build per-conversation summaries for AI clustering
    const convSummaries = convIds.map(cid => {
      const events = convGroups[cid];
      const customerMsgs = events
        .filter(e => e.event_type === "customer_message" && e.payload?.customer_text)
        .map(e => e.payload.customer_text);
      const botMsgs = events
        .filter(e => e.event_type === "bot_reply" && e.payload?.bot_text)
        .map(e => e.payload.bot_text);
      const score = convScores?.find(s => s.conversation_id === cid);
      const failures = convFailures?.filter(f => f.conversation_id === cid) || [];
      const rating = convRatings?.find(r => r.conversation_id === cid);
      const hasDeadAir = deadAirs?.some(d => d.conversation_id === cid);
      const hadHandoff = events.some(e => e.event_type === "human_handoff");
      const wasResolved = events.some(e => e.event_type === "conversation_resolved");
      const channel = score?.channel || events[0]?.channel || "unknown";
      const language = score?.language || events[0]?.language || "unknown";

      return {
        id: cid,
        customer_messages: customerMsgs.slice(0, 5),
        bot_responses: botMsgs.slice(0, 3),
        composite_score: score?.composite_score ?? null,
        rating: rating?.rating ?? null,
        channel,
        language,
        has_dead_air: hasDeadAir || false,
        had_handoff: hadHandoff,
        was_resolved: wasResolved,
        failure_types: failures.map(f => f.failure_type),
        root_causes: failures.map(f => f.root_cause_guess).filter(Boolean),
        bad_bot_excerpts: failures.map(f => f.bot_response_excerpt).filter(Boolean).slice(0, 2),
      };
    });

    // 3. Get existing clusters for context
    const { data: existingClusters } = await supabase
      .from("ai_intent_clusters")
      .select("id, cluster_name, cluster_description, representative_questions, average_ai_score, conversation_count")
      .order("conversation_count", { ascending: false })
      .limit(50);

    const existingClusterInfo = (existingClusters || []).map(c => ({
      id: c.id,
      name: c.cluster_name,
      description: c.cluster_description,
      examples: c.representative_questions,
      avg_score: c.average_ai_score,
      count: c.conversation_count,
    }));

    // 4. AI clustering
    const clusterPrompt = `You are an AI failure clustering engine for Mobile11, a multilingual eSIM customer support platform.

## EXISTING CLUSTERS
${JSON.stringify(existingClusterInfo, null, 2)}

## CONVERSATIONS TO CLUSTER
${JSON.stringify(convSummaries.slice(0, 40), null, 2)}

## TASK
For each conversation, assign it to an existing cluster (by id) or propose a new cluster.
Focus on clustering by ISSUE PATTERN, not just topic. Consider:
- What went wrong (failure types, low scores)
- Customer intent patterns
- Bot response quality patterns
- Channel and language patterns

For new clusters, provide rich analysis. For existing clusters, update their metrics.

## OUTPUT FORMAT (strict JSON)
{
  "assignments": [
    { "conversation_id": "uuid", "cluster_id": "existing-uuid-or-null", "new_cluster_index": 0 }
  ],
  "new_clusters": [
    {
      "name": "short cluster name",
      "description": "what issue pattern this cluster represents",
      "language": "th|en|mixed",
      "representative_questions": ["q1", "q2", "q3"],
      "common_bad_responses": ["bad response pattern 1", "bad response pattern 2"],
      "root_cause_hypothesis": "why this is happening",
      "recommended_action": "specific next step to fix this",
      "channel_distribution": { "line": 2, "web_chat": 1 },
      "language_distribution": { "th": 2, "en": 1 }
    }
  ],
  "cluster_metric_updates": [
    {
      "cluster_id": "uuid",
      "additional_conversations": 3,
      "new_representative_questions": ["q1"],
      "new_bad_responses": ["excerpt"],
      "channel_additions": { "whatsapp": 1 },
      "language_additions": { "th": 1 }
    }
  ],
  "kb_improvements": [
    { "cluster_name": "name", "issue_type": "missing_article|outdated_content|incomplete_answer|wrong_answer", "issue_summary": "what's wrong", "proposed_kb_draft": "suggested content" }
  ]
}`;

    let clusterData: any = null;

    if (LOVABLE_API_KEY) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an intent clustering engine. Always respond in valid JSON." },
            { role: "user", content: clusterPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (aiRes.ok) {
        const aiResult = await aiRes.json();
        const content = aiResult.choices?.[0]?.message?.content;
        if (content) {
          try {
            clusterData = JSON.parse(content);
          } catch (e: any) {
            console.error("[ai-cluster] JSON parse error:", e);
          }
        }
      } else {
        console.error(`[ai-cluster] AI API error: ${aiRes.status}`);
      }
    }

    let newClusters = 0;
    let updatedClusters = 0;
    let kbCandidates = 0;

    if (clusterData) {
      // Compute aggregate metrics from conversation summaries
      const computeMetrics = (convs: typeof convSummaries) => {
        const total = convs.length || 1;
        const ratings = convs.filter(c => c.rating !== null).map(c => c.rating!);
        const scores = convs.filter(c => c.composite_score !== null).map(c => c.composite_score!);
        return {
          avg_rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
          avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          dead_air_rate: Math.round((convs.filter(c => c.has_dead_air).length / total) * 100) / 100,
          handoff_rate: Math.round((convs.filter(c => c.had_handoff).length / total) * 100) / 100,
          containment_rate: Math.round((convs.filter(c => c.was_resolved && !c.had_handoff).length / total) * 100) / 100,
        };
      };

      // Create new clusters
      if (clusterData.new_clusters) {
        for (let i = 0; i < clusterData.new_clusters.length; i++) {
          const nc = clusterData.new_clusters[i];
          // Find conversations assigned to this new cluster
          const assignedConvIds = (clusterData.assignments || [])
            .filter((a: any) => a.new_cluster_index === i)
            .map((a: any) => a.conversation_id);
          const assignedConvs = convSummaries.filter(c => assignedConvIds.includes(c.id));
          const metrics = computeMetrics(assignedConvs);

          // Calculate impact = conversations * (100 - avg_score) / 100
          const impactScore = assignedConvs.length * (100 - (metrics.avg_score || 50)) / 100;
          // Urgency = weighted by dead air rate and handoff rate
          const urgencyScore = impactScore * (1 + metrics.dead_air_rate + metrics.handoff_rate);

          const { error: insertErr } = await supabase.from("ai_intent_clusters").insert({
            cluster_name: nc.name,
            cluster_description: nc.description || null,
            language: nc.language || null,
            representative_questions: nc.representative_questions || [],
            common_bad_responses: nc.common_bad_responses || [],
            conversation_count: assignedConvs.length || 1,
            average_ai_score: metrics.avg_score,
            average_customer_rating: metrics.avg_rating,
            dead_air_rate: metrics.dead_air_rate,
            human_handoff_rate: metrics.handoff_rate,
            containment_rate: metrics.containment_rate,
            resolved_without_human_rate: metrics.containment_rate,
            channel_distribution: nc.channel_distribution || {},
            language_distribution: nc.language_distribution || {},
            root_cause_hypothesis: nc.root_cause_hypothesis || null,
            recommended_action: nc.recommended_action || null,
            impact_score: Math.round(impactScore * 10) / 10,
            urgency_score: Math.round(urgencyScore * 10) / 10,
          });
          if (!insertErr) newClusters++;
        }
      }

      // Update existing clusters with new data
      if (clusterData.cluster_metric_updates) {
        for (const upd of clusterData.cluster_metric_updates) {
          if (!upd.cluster_id) continue;
          const { data: existing } = await supabase
            .from("ai_intent_clusters")
            .select("conversation_count, representative_questions, common_bad_responses, channel_distribution, language_distribution, average_ai_score")
            .eq("id", upd.cluster_id)
            .single();

          if (!existing) continue;

          // Merge representative questions (deduplicate, max 10)
          const existingQs = Array.isArray(existing.representative_questions) ? existing.representative_questions : [];
          const newQs = upd.new_representative_questions || [];
          const mergedQs = [...new Set([...existingQs, ...newQs])].slice(0, 10);

          // Merge bad responses
          const existingBad = Array.isArray(existing.common_bad_responses) ? existing.common_bad_responses : [];
          const newBad = upd.new_bad_responses || [];
          const mergedBad = [...new Set([...existingBad, ...newBad])].slice(0, 10);

          // Merge channel distribution
          const existingCh = (existing.channel_distribution as Record<string, number>) || {};
          const newCh = upd.channel_additions || {};
          const mergedCh = { ...existingCh };
          for (const [ch, cnt] of Object.entries(newCh)) {
            mergedCh[ch] = (mergedCh[ch] || 0) + (cnt as number);
          }

          // Merge language distribution
          const existingLang = (existing.language_distribution as Record<string, number>) || {};
          const newLang = upd.language_additions || {};
          const mergedLang = { ...existingLang };
          for (const [lang, cnt] of Object.entries(newLang)) {
            mergedLang[lang] = (mergedLang[lang] || 0) + (cnt as number);
          }

          // Recalculate scores from assigned conversations
          const assignedConvIds = (clusterData.assignments || [])
            .filter((a: any) => a.cluster_id === upd.cluster_id)
            .map((a: any) => a.conversation_id);
          const assignedConvs = convSummaries.filter(c => assignedConvIds.includes(c.id));
          const newScores = assignedConvs.filter(c => c.composite_score !== null).map(c => c.composite_score!);

          // Weighted average with existing
          let newAvgScore = existing.average_ai_score;
          if (newScores.length > 0) {
            const existingWeight = existing.conversation_count || 0;
            const existingTotal = (existing.average_ai_score || 0) * existingWeight;
            const newTotal = newScores.reduce((a, b) => a + b, 0);
            newAvgScore = Math.round((existingTotal + newTotal) / (existingWeight + newScores.length));
          }

          const newCount = (existing.conversation_count || 0) + (upd.additional_conversations || assignedConvs.length);
          const impactScore = newCount * (100 - (newAvgScore || 50)) / 100;

          await supabase
            .from("ai_intent_clusters")
            .update({
              conversation_count: newCount,
              representative_questions: mergedQs,
              common_bad_responses: mergedBad,
              channel_distribution: mergedCh,
              language_distribution: mergedLang,
              average_ai_score: newAvgScore,
              impact_score: Math.round(impactScore * 10) / 10,
              urgency_score: Math.round(impactScore * 1.2 * 10) / 10,
              updated_at: new Date().toISOString(),
            })
            .eq("id", upd.cluster_id);
          updatedClusters++;
        }
      }

      // Generate KB improvement candidates
      if (clusterData.kb_improvements) {
        for (const kb of clusterData.kb_improvements) {
          const validIssueTypes = ['missing_article', 'outdated_content', 'incomplete_answer', 'wrong_answer'];
          const issueType = validIssueTypes.includes(kb.issue_type) ? kb.issue_type : 'missing_article';

          await supabase.from("kb_improvement_candidates").insert({
            issue_type: issueType,
            issue_summary: kb.issue_summary || "Auto-detected improvement opportunity",
            proposed_kb_draft: kb.proposed_kb_draft || null,
            status: "pending",
            generated_by: "ai_cluster_engine",
          });
          kbCandidates++;
        }
      }
    }

    // 5. Mark all processed events as clustered
    const allEventIds = scoredEvents.map(e => e.id);
    await supabase
      .from("ai_conversation_events")
      .update({
        processing_status: "clustered",
        clustered_at: new Date().toISOString(),
      })
      .in("id", allEventIds);

    const summary = {
      events_processed: allEventIds.length,
      conversations_analyzed: convIds.length,
      new_clusters: newClusters,
      updated_clusters: updatedClusters,
      kb_candidates: kbCandidates,
      timestamp: new Date().toISOString(),
    };

    console.log("[ai-cluster] Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[ai-cluster] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
