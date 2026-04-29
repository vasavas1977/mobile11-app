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

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const reportDate = yesterday.toISOString().split("T")[0];

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from("ai_daily_optimization_reports")
      .select("id")
      .eq("report_date", reportDate)
      .limit(1);

    if (existingReport && existingReport.length > 0) {
      return new Response(
        JSON.stringify({ status: "report_already_exists", date: reportDate }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gte = yesterday.toISOString();
    const lt = now.toISOString();

    // ── 1. Conversations analyzed ──
    const { count: totalConversations } = await supabase
      .from("ai_conversation_events")
      .select("conversation_id", { count: "exact", head: true })
      .gte("created_at", gte)
      .lt("created_at", lt);

    // ── 2. Score distribution & channel breakdown ──
    const { data: scores } = await supabase
      .from("ai_conversation_scores")
      .select("composite_score, ai_accuracy_score, ai_resolution_score, ai_clarity_score, ai_empathy_score, ai_confidence_score, ai_policy_compliance_score, predicted_customer_satisfaction_score, business_outcome_score, channel")
      .gte("created_at", gte)
      .lt("created_at", lt);

    const channelScores: Record<string, { total: number; count: number }> = {};
    let scoreSum = 0;
    let scoreCount = 0;
    for (const s of scores || []) {
      const ch = s.channel || "unknown";
      if (!channelScores[ch]) channelScores[ch] = { total: 0, count: 0 };
      channelScores[ch].total += s.composite_score || 0;
      channelScores[ch].count += 1;
      scoreSum += s.composite_score || 0;
      scoreCount += 1;
    }
    const avgComposite = scoreCount ? Math.round(scoreSum / scoreCount) : 0;
    const avgScoreByChannel: Record<string, number> = {};
    for (const [ch, v] of Object.entries(channelScores)) {
      avgScoreByChannel[ch] = Math.round(v.total / v.count);
    }

    // ── 3. Customer ratings by channel ──
    const { data: ratings } = await supabase
      .from("conversation_ratings")
      .select("rating, channel")
      .gte("created_at", gte)
      .lt("created_at", lt);

    const channelRatings: Record<string, { total: number; count: number }> = {};
    let ratingSum = 0;
    let ratingCount = 0;
    for (const r of ratings || []) {
      const ch = r.channel || "unknown";
      if (!channelRatings[ch]) channelRatings[ch] = { total: 0, count: 0 };
      channelRatings[ch].total += r.rating || 0;
      channelRatings[ch].count += 1;
      ratingSum += r.rating || 0;
      ratingCount += 1;
    }
    const avgCustomerRating = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;
    const avgRatingByChannel: Record<string, number> = {};
    for (const [ch, v] of Object.entries(channelRatings)) {
      avgRatingByChannel[ch] = Math.round((v.total / v.count) * 10) / 10;
    }

    // ── 4. Failure events ──
    const { data: failureEvents } = await supabase
      .from("ai_failure_events")
      .select("failure_type, severity, root_cause_guess, suggested_fix_type")
      .gte("created_at", gte)
      .lt("created_at", lt);

    const totalFailures = failureEvents?.length || 0;
    const failureCounts: Record<string, number> = {};
    for (const f of failureEvents || []) {
      failureCounts[f.failure_type] = (failureCounts[f.failure_type] || 0) + 1;
    }
    const topFailures = Object.entries(failureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // ── 5. Dead air patterns ──
    const { data: deadAirEvents } = await supabase
      .from("dead_air_events")
      .select("bot_message_content, channel, silence_duration_seconds, customer_returned")
      .gte("created_at", gte)
      .lt("created_at", lt);

    const totalDeadAir = deadAirEvents?.length || 0;
    const deadAirMap: Record<string, { count: number; avgSilence: number; totalSilence: number; returnRate: number; returned: number }> = {};
    for (const d of deadAirEvents || []) {
      const key = (d.bot_message_content || "").substring(0, 120);
      if (!deadAirMap[key]) deadAirMap[key] = { count: 0, avgSilence: 0, totalSilence: 0, returnRate: 0, returned: 0 };
      deadAirMap[key].count += 1;
      deadAirMap[key].totalSilence += d.silence_duration_seconds || 0;
      if (d.customer_returned) deadAirMap[key].returned += 1;
    }
    const topDeadAirPatterns = Object.entries(deadAirMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([text, v]) => ({
        bot_text: text,
        occurrences: v.count,
        avg_silence_seconds: Math.round(v.totalSilence / v.count),
        return_rate: Math.round((v.returned / v.count) * 100),
      }));

    // ── 6. Low-score clusters (top 10) ──
    const { data: clusters } = await supabase
      .from("ai_intent_clusters")
      .select("cluster_name, average_ai_score, conversation_count, dead_air_rate, human_handoff_rate, containment_rate, impact_score, urgency_score, root_cause_hypothesis, recommended_action, representative_questions, common_bad_responses")
      .order("average_ai_score", { ascending: true })
      .limit(10);

    const lowScoreClusters = (clusters || []).map(c => ({
      name: c.cluster_name,
      score: c.average_ai_score,
      conversations: c.conversation_count,
      dead_air_rate: c.dead_air_rate,
      handoff_rate: c.human_handoff_rate,
      impact: c.impact_score,
      root_cause: c.root_cause_hypothesis,
      action: c.recommended_action,
    }));

    // ── 7. KB candidates ──
    const { data: kbCandidates } = await supabase
      .from("kb_improvement_candidates")
      .select("suggested_title, improvement_type, priority, source_cluster_id")
      .gte("created_at", gte)
      .lt("created_at", lt)
      .order("priority", { ascending: false })
      .limit(10);

    const recommendedKbImprovements = (kbCandidates || []).map(k => ({
      title: k.suggested_title,
      type: k.improvement_type,
      priority: k.priority,
    }));

    // ── 8. Derive missing knowledge, weak prompts, unresolved intents ──
    const missingKbFailures = (failureEvents || []).filter(f => f.failure_type === 'missing_kb' || f.failure_type === 'missing_knowledge');
    const weakPromptFailures = (failureEvents || []).filter(f => ['unclear_answer', 'incomplete_answer', 'weak_empathy', 'wrong_language'].includes(f.failure_type));
    const unresolvedFailures = (failureEvents || []).filter(f => ['unresolved_issue', 'failed_handoff'].includes(f.failure_type));
    const repeatedFailures = (failureEvents || []).filter(f => f.failure_type === 'repeated_contact_risk');

    const groupByRootCause = (items: typeof failureEvents) => {
      const map: Record<string, number> = {};
      for (const i of items || []) {
        const key = i.root_cause_guess || i.failure_type;
        map[key] = (map[key] || 0) + 1;
      }
      return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([cause, count]) => ({ cause, count }));
    };

    const topMissingKnowledge = groupByRootCause(missingKbFailures);
    const topWeakPrompts = groupByRootCause(weakPromptFailures);
    const topUnresolvedIntents = groupByRootCause(unresolvedFailures);
    const topRepeatedComplaints = groupByRootCause(repeatedFailures);

    // ── 9. Experiments completed ──
    const { data: experiments } = await supabase
      .from("prompt_experiments")
      .select("experiment_name, status")
      .eq("status", "completed")
      .gte("ended_at", gte);

    const winningExperiments = (experiments || []).map(e => ({
      name: e.experiment_name,
      status: e.status,
    }));

    // ── 10. Score decline (compare with previous day) ──
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const prevDate = twoDaysAgo.toISOString().split("T")[0];
    const { data: prevReport } = await supabase
      .from("ai_daily_optimization_reports")
      .select("avg_composite_score, avg_customer_rating, total_failures")
      .eq("report_date", prevDate)
      .limit(1);

    const prev = prevReport?.[0];
    const biggestScoreDecline = prev ? {
      previous_score: prev.avg_composite_score || 0,
      current_score: avgComposite,
      delta: avgComposite - (prev.avg_composite_score || 0),
      previous_rating: prev.avg_customer_rating || 0,
      current_rating: avgCustomerRating,
    } : { previous_score: 0, current_score: avgComposite, delta: 0 };

    // ── 11. Derive quick wins, high risk, highest impact ──
    const quickWins = (clusters || [])
      .filter(c => (c.impact_score || 0) > 5 && (c.average_ai_score || 100) > 40 && (c.average_ai_score || 100) < 70)
      .slice(0, 5)
      .map(c => ({
        cluster: c.cluster_name,
        score: c.average_ai_score,
        action: c.recommended_action,
        impact: c.impact_score,
      }));

    const highRiskIssues = (clusters || [])
      .filter(c => (c.average_ai_score || 100) < 40 || (c.urgency_score || 0) > 7)
      .slice(0, 5)
      .map(c => ({
        cluster: c.cluster_name,
        score: c.average_ai_score,
        urgency: c.urgency_score,
        root_cause: c.root_cause_hypothesis,
      }));

    const highestImpactCluster = (clusters || []).sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))[0];
    const highestImpactOpportunity = highestImpactCluster ? {
      cluster: highestImpactCluster.cluster_name,
      score: highestImpactCluster.average_ai_score,
      conversations: highestImpactCluster.conversation_count,
      impact: highestImpactCluster.impact_score,
      action: highestImpactCluster.recommended_action,
    } : {};

    // Recommended prompt experiments from weak prompt patterns
    const recommendedPromptExperiments = topWeakPrompts.slice(0, 5).map(wp => ({
      target: wp.cause,
      occurrences: wp.count,
      suggestion: `Test alternative prompt wording for "${wp.cause}" pattern`,
    }));

    // Recommended backend actions from missing_backend_action failures
    const backendActionFailures = (failureEvents || []).filter(f => f.failure_type === 'missing_backend_action');
    const recommendedActions = groupByRootCause(backendActionFailures).slice(0, 5).map(a => ({
      action_needed: a.cause,
      occurrences: a.count,
    }));

    // ── 12. Generate executive summary via AI ──
    let executiveSummary = `Daily Report for ${reportDate}: ${totalConversations || 0} conversations analyzed. Avg composite score: ${avgComposite}/100. Avg rating: ${avgCustomerRating}/5. ${totalFailures} failures detected. ${totalDeadAir} dead air events. ${recommendedKbImprovements.length} KB improvements suggested.`;

    if (LOVABLE_API_KEY) {
      const summaryPrompt = `Generate a concise executive summary (4-5 sentences) for the AI contact center daily optimization report:
- Date: ${reportDate}
- Conversations analyzed: ${totalConversations || 0}
- Average AI quality score: ${avgComposite}/100
- Average customer rating: ${avgCustomerRating}/5
- Score by channel: ${JSON.stringify(avgScoreByChannel)}
- Total failures: ${totalFailures}
- Total dead air events: ${totalDeadAir}
- Top failure types: ${JSON.stringify(topFailures.slice(0, 5))}
- Score trend: ${biggestScoreDecline.delta > 0 ? 'improving' : biggestScoreDecline.delta < 0 ? 'declining' : 'stable'} (${biggestScoreDecline.delta > 0 ? '+' : ''}${biggestScoreDecline.delta} points)
- Quick wins available: ${quickWins.length}
- High risk issues: ${highRiskIssues.length}
- KB improvements needed: ${recommendedKbImprovements.length}

Write in concise executive language. Focus on actionable insights and key trends. Mention the highest impact opportunity if any.`;

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
              { role: "system", content: "You are a contact center analytics expert. Write concise, data-driven executive summaries for leadership. No markdown formatting." },
              { role: "user", content: summaryPrompt },
            ],
            temperature: 0.3,
          }),
        });

        if (aiRes.ok) {
          const aiResult = await aiRes.json();
          const content = aiResult.choices?.[0]?.message?.content;
          if (content) executiveSummary = content;
        }
      } catch (aiErr) {
        console.error("[ai-daily-report] AI summary error:", aiErr);
      }
    }

    // ── 13. Insert report ──
    const { error: insertErr } = await supabase
      .from("ai_daily_optimization_reports")
      .insert({
        report_date: reportDate,
        total_conversations_analyzed: totalConversations || 0,
        avg_composite_score: avgComposite,
        avg_customer_rating: avgCustomerRating,
        total_failures: totalFailures,
        total_dead_air_events: totalDeadAir,
        avg_score_by_channel: avgScoreByChannel,
        avg_rating_by_channel: avgRatingByChannel,
        low_score_clusters: lowScoreClusters,
        top_failure_patterns: topFailures,
        top_dead_air_patterns: topDeadAirPatterns,
        top_missing_knowledge: topMissingKnowledge,
        top_weak_prompts: topWeakPrompts,
        top_unresolved_intents: topUnresolvedIntents,
        top_repeated_complaints: topRepeatedComplaints,
        recommended_kb_improvements: recommendedKbImprovements,
        recommended_prompt_experiments: recommendedPromptExperiments,
        recommended_actions: recommendedActions,
        highest_impact_opportunity: highestImpactOpportunity,
        biggest_score_decline: biggestScoreDecline,
        quick_wins: quickWins,
        high_risk_issues: highRiskIssues,
        kb_candidates_generated: recommendedKbImprovements.length,
        prompt_candidates_generated: recommendedPromptExperiments.length,
        winning_experiments: winningExperiments,
        rollback_events: [],
        executive_summary: executiveSummary,
      });

    if (insertErr) throw insertErr;

    // ── 14. Log autonomous action ──
    await supabase.from("autonomous_actions_log").insert({
      action_type: "daily_report_generated",
      action_payload: { report_date: reportDate },
      action_result: {
        conversations: totalConversations,
        avg_score: avgComposite,
        avg_rating: avgCustomerRating,
        failures: totalFailures,
        dead_air: totalDeadAir,
        quick_wins: quickWins.length,
        high_risk: highRiskIssues.length,
      },
      action_status: "completed",
      triggered_by: "cron_daily",
      approval_status: "auto_approved",
    });

    // ── 15. Mark processed events ──
    await supabase
      .from("ai_conversation_events")
      .update({ processing_status: "done" })
      .eq("processing_status", "clustered")
      .lte("created_at", lt);

    const summary = {
      report_date: reportDate,
      conversations: totalConversations || 0,
      avg_score: avgComposite,
      avg_rating: avgCustomerRating,
      failures: totalFailures,
      dead_air: totalDeadAir,
      quick_wins: quickWins.length,
      high_risk: highRiskIssues.length,
      timestamp: now.toISOString(),
    };

    console.log("[ai-daily-report] Generated:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[ai-daily-report] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
