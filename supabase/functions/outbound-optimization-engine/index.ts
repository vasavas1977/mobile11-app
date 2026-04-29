import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENGINE_VERSION = "v1.0";
const MIN_SAMPLE = 50;

interface Recommendation {
  recommendation_type: string;
  severity: string;
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
  current_value: Record<string, unknown> | null;
  recommended_value: Record<string, unknown> | null;
  campaign_id: string | null;
  journey_id: string | null;
  journey_step_id: string | null;
  template_id: string | null;
  experiment_id: string | null;
  impact_score: number | null;
  confidence_score: number | null;
  engine_version: string;
  analysis_window_days: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const analysisDays = body.analysis_window_days ?? 30;

    const recommendations: Recommendation[] = [];

    // ── 1. Channel order analysis ──
    const { data: channelData } = await supabase
      .from("outbound_learning_events")
      .select("channel_type, journey_id, delivery_status, conversion_status")
      .gte("created_at", new Date(Date.now() - analysisDays * 86400000).toISOString());

    if (channelData && channelData.length >= MIN_SAMPLE) {
      const byJourneyChannel: Record<string, Record<string, { sends: number; delivered: number; converted: number }>> = {};
      for (const e of channelData) {
        const jid = e.journey_id ?? "global";
        if (!byJourneyChannel[jid]) byJourneyChannel[jid] = {};
        if (!byJourneyChannel[jid][e.channel_type]) byJourneyChannel[jid][e.channel_type] = { sends: 0, delivered: 0, converted: 0 };
        const bucket = byJourneyChannel[jid][e.channel_type];
        bucket.sends++;
        if (e.delivery_status === "delivered") bucket.delivered++;
        if (e.conversion_status === "converted") bucket.converted++;
      }

      for (const [jid, channels] of Object.entries(byJourneyChannel)) {
        const entries = Object.entries(channels).filter(([, v]) => v.sends >= MIN_SAMPLE);
        if (entries.length < 2) continue;
        entries.sort((a, b) => (b[1].converted / b[1].sends) - (a[1].converted / a[1].sends));
        const best = entries[0];
        const worst = entries[entries.length - 1];
        const bestRate = (best[1].converted / best[1].sends) * 100;
        const worstRate = (worst[1].converted / worst[1].sends) * 100;
        const delta = bestRate - worstRate;
        if (delta > 2) {
          const confidence = Math.min(100, Math.round((Math.min(...entries.map(([, v]) => v.sends)) / 200) * 100));
          recommendations.push({
            recommendation_type: "channel_order",
            severity: delta > 10 ? "high" : "medium",
            title: `Reorder channels: ${best[0]} outperforms ${worst[0]}`,
            explanation: `${best[0]} has a ${bestRate.toFixed(1)}% conversion rate vs ${worstRate.toFixed(1)}% for ${worst[0]} over the last ${analysisDays} days. Consider prioritizing ${best[0]}.`,
            evidence: { best_channel: best[0], best_rate: bestRate, worst_channel: worst[0], worst_rate: worstRate, delta, sample_sizes: Object.fromEntries(entries.map(([k, v]) => [k, v.sends])), time_window_days: analysisDays },
            current_value: { channel_sequence: entries.map(([k]) => k) },
            recommended_value: { channel_sequence: entries.map(([k]) => k) },
            campaign_id: null,
            journey_id: jid === "global" ? null : jid,
            journey_step_id: null,
            template_id: null,
            experiment_id: null,
            impact_score: Math.min(100, Math.round(delta * 3)),
            confidence_score: confidence,
            engine_version: ENGINE_VERSION,
            analysis_window_days: analysisDays,
          });
        }
      }
    }

    // ── 2. Send timing analysis ──
    const { data: timingData } = await supabase
      .from("outbound_learning_events")
      .select("sent_at, conversion_status, campaign_id")
      .not("sent_at", "is", null)
      .gte("created_at", new Date(Date.now() - analysisDays * 86400000).toISOString());

    if (timingData && timingData.length >= MIN_SAMPLE) {
      const byHour: Record<number, { sends: number; converted: number }> = {};
      for (const e of timingData) {
        const hour = new Date(e.sent_at).getUTCHours();
        if (!byHour[hour]) byHour[hour] = { sends: 0, converted: 0 };
        byHour[hour].sends++;
        if (e.conversion_status === "converted") byHour[hour].converted++;
      }

      const hourEntries = Object.entries(byHour)
        .filter(([, v]) => v.sends >= 20)
        .map(([h, v]) => ({ hour: Number(h), rate: (v.converted / v.sends) * 100, sends: v.sends }))
        .sort((a, b) => b.rate - a.rate);

      if (hourEntries.length >= 2) {
        const best = hourEntries[0];
        const worst = hourEntries[hourEntries.length - 1];
        const delta = best.rate - worst.rate;
        if (delta > 3) {
          recommendations.push({
            recommendation_type: "send_timing",
            severity: delta > 15 ? "high" : "medium",
            title: `Best send time: ${best.hour}:00 UTC`,
            explanation: `Hour ${best.hour}:00 UTC shows ${best.rate.toFixed(1)}% conversion vs ${worst.rate.toFixed(1)}% at ${worst.hour}:00 UTC. Shifting sends to peak hours could improve results.`,
            evidence: { best_hour: best.hour, best_rate: best.rate, worst_hour: worst.hour, worst_rate: worst.rate, delta, hourly_breakdown: hourEntries.slice(0, 5), time_window_days: analysisDays },
            current_value: null,
            recommended_value: { preferred_send_hour_utc: best.hour },
            campaign_id: null, journey_id: null, journey_step_id: null, template_id: null, experiment_id: null,
            impact_score: Math.min(100, Math.round(delta * 2.5)),
            confidence_score: Math.min(100, Math.round((Math.min(best.sends, worst.sends) / 100) * 100)),
            engine_version: ENGINE_VERSION,
            analysis_window_days: analysisDays,
          });
        }
      }
    }

    // ── 3. Journey health / pause recommendations ──
    const { data: journeyHealth } = await supabase
      .from("outbound_learning_events")
      .select("journey_id, conversion_status, complaint_flag, opt_out_status")
      .not("journey_id", "is", null)
      .gte("created_at", new Date(Date.now() - analysisDays * 86400000).toISOString());

    if (journeyHealth) {
      const byJourney: Record<string, { sends: number; converted: number; complaints: number; optouts: number }> = {};
      for (const e of journeyHealth) {
        if (!e.journey_id) continue;
        if (!byJourney[e.journey_id]) byJourney[e.journey_id] = { sends: 0, converted: 0, complaints: 0, optouts: 0 };
        const b = byJourney[e.journey_id];
        b.sends++;
        if (e.conversion_status === "converted") b.converted++;
        if (e.complaint_flag === true) b.complaints++;
        if (e.opt_out_status === "opted_out") b.optouts++;
      }

      for (const [jid, stats] of Object.entries(byJourney)) {
        if (stats.sends < MIN_SAMPLE) continue;
        const convRate = (stats.converted / stats.sends) * 100;
        const complaintRate = (stats.complaints / stats.sends) * 100;
        const optoutRate = (stats.optouts / stats.sends) * 100;

        if (convRate < 1 && complaintRate > 3) {
          recommendations.push({
            recommendation_type: "journey_pause",
            severity: "critical",
            title: `Consider pausing journey: low conversion, high complaints`,
            explanation: `This journey has ${convRate.toFixed(1)}% conversion and ${complaintRate.toFixed(1)}% complaint rate over ${stats.sends} sends. Consider pausing for review.`,
            evidence: { conversion_rate: convRate, complaint_rate: complaintRate, optout_rate: optoutRate, sample_size: stats.sends, time_window_days: analysisDays },
            current_value: { status: "active" },
            recommended_value: { status: "paused", reason: `conversion ${convRate.toFixed(1)}% < 1%, complaints ${complaintRate.toFixed(1)}% > 3%` },
            campaign_id: null, journey_id: jid, journey_step_id: null, template_id: null, experiment_id: null,
            impact_score: Math.min(100, Math.round(complaintRate * 10 + (100 - convRate))),
            confidence_score: Math.min(100, Math.round((stats.sends / 200) * 100)),
            engine_version: ENGINE_VERSION,
            analysis_window_days: analysisDays,
          });
        }

        // Suppression rule for high opt-out
        if (optoutRate > 5) {
          recommendations.push({
            recommendation_type: "suppression_rule",
            severity: "high",
            title: `High opt-out rate detected: ${optoutRate.toFixed(1)}%`,
            explanation: `${optoutRate.toFixed(1)}% opt-out rate over ${stats.sends} sends suggests audience fatigue or poor targeting. Consider adding suppression rules.`,
            evidence: { optout_rate: optoutRate, complaint_rate: complaintRate, sample_size: stats.sends, time_window_days: analysisDays },
            current_value: null,
            recommended_value: { suppress_after_optout: true, cooldown_days: 30 },
            campaign_id: null, journey_id: jid, journey_step_id: null, template_id: null, experiment_id: null,
            impact_score: Math.min(100, Math.round(optoutRate * 8)),
            confidence_score: Math.min(100, Math.round((stats.sends / 200) * 100)),
            engine_version: ENGINE_VERSION,
            analysis_window_days: analysisDays,
          });
        }
      }
    }

    // ── 4. CTA type analysis ──
    const { data: ctaData } = await supabase
      .from("outbound_learning_events")
      .select("message_template_id, click_status, conversion_status")
      .gte("created_at", new Date(Date.now() - analysisDays * 86400000).toISOString());

    if (ctaData && ctaData.length >= MIN_SAMPLE) {
      // Get template CTA info
      const templateIds = [...new Set(ctaData.filter(e => e.message_template_id).map(e => e.message_template_id))];
      if (templateIds.length > 0) {
        const { data: templates } = await supabase
          .from("outbound_message_templates")
          .select("id, cta_type")
          .in("id", templateIds);

        if (templates) {
          const templateCta: Record<string, string> = {};
          for (const t of templates) {
            if (t.cta_type) templateCta[t.id] = t.cta_type;
          }

          const byCta: Record<string, { sends: number; clicked: number; converted: number }> = {};
          for (const e of ctaData) {
            const cta = templateCta[e.message_template_id] ?? "unknown";
            if (cta === "unknown") continue;
            if (!byCta[cta]) byCta[cta] = { sends: 0, clicked: 0, converted: 0 };
            byCta[cta].sends++;
            if (e.click_status === "clicked") byCta[cta].clicked++;
            if (e.conversion_status === "converted") byCta[cta].converted++;
          }

          const ctaEntries = Object.entries(byCta)
            .filter(([, v]) => v.sends >= MIN_SAMPLE)
            .map(([type, v]) => ({ type, clickRate: (v.clicked / v.sends) * 100, convRate: (v.converted / v.sends) * 100, sends: v.sends }))
            .sort((a, b) => b.convRate - a.convRate);

          if (ctaEntries.length >= 2) {
            const best = ctaEntries[0];
            const worst = ctaEntries[ctaEntries.length - 1];
            const delta = best.convRate - worst.convRate;
            if (delta > 2) {
              recommendations.push({
                recommendation_type: "cta_type",
                severity: delta > 10 ? "high" : "medium",
                title: `CTA "${best.type}" outperforms "${worst.type}"`,
                explanation: `"${best.type}" CTA achieves ${best.convRate.toFixed(1)}% conversion vs ${worst.convRate.toFixed(1)}% for "${worst.type}". Consider switching underperforming templates.`,
                evidence: { best_cta: best.type, best_rate: best.convRate, worst_cta: worst.type, worst_rate: worst.convRate, delta, breakdown: ctaEntries, time_window_days: analysisDays },
                current_value: { cta_type: worst.type },
                recommended_value: { cta_type: best.type },
                campaign_id: null, journey_id: null, journey_step_id: null, template_id: null, experiment_id: null,
                impact_score: Math.min(100, Math.round(delta * 3)),
                confidence_score: Math.min(100, Math.round((Math.min(best.sends, worst.sends) / 200) * 100)),
                engine_version: ENGINE_VERSION,
                analysis_window_days: analysisDays,
              });
            }
          }
        }
      }
    }

    // ── 5. Message tone analysis from experiment results ──
    const { data: toneData } = await supabase
      .from("outbound_experiment_results")
      .select("experiment_id, variant_id, sends_count, conversion_rate, click_rate, reply_rate")
      .gte("sends_count", MIN_SAMPLE);

    if (toneData && toneData.length > 0) {
      const variantIds = [...new Set(toneData.map(r => r.variant_id))];
      const { data: variants } = await supabase
        .from("outbound_message_variants")
        .select("id, style, template_id")
        .in("id", variantIds);

      if (variants) {
        const variantStyle: Record<string, string> = {};
        for (const v of variants) variantStyle[v.id] = v.style;

        const byStyle: Record<string, { totalConv: number; count: number; sends: number }> = {};
        for (const r of toneData) {
          const style = variantStyle[r.variant_id];
          if (!style || !r.conversion_rate) continue;
          if (!byStyle[style]) byStyle[style] = { totalConv: 0, count: 0, sends: 0 };
          byStyle[style].totalConv += Number(r.conversion_rate);
          byStyle[style].count++;
          byStyle[style].sends += r.sends_count;
        }

        const styleEntries = Object.entries(byStyle)
          .filter(([, v]) => v.count >= 2)
          .map(([style, v]) => ({ style, avgConv: v.totalConv / v.count, sends: v.sends }))
          .sort((a, b) => b.avgConv - a.avgConv);

        if (styleEntries.length >= 2) {
          const best = styleEntries[0];
          const worst = styleEntries[styleEntries.length - 1];
          const delta = best.avgConv - worst.avgConv;
          if (delta > 2) {
            recommendations.push({
              recommendation_type: "message_tone",
              severity: delta > 10 ? "high" : "medium",
              title: `"${best.style}" tone outperforms "${worst.style}"`,
              explanation: `Across experiments, "${best.style}" averages ${best.avgConv.toFixed(1)}% conversion vs ${worst.avgConv.toFixed(1)}% for "${worst.style}".`,
              evidence: { best_style: best.style, best_avg_conversion: best.avgConv, worst_style: worst.style, worst_avg_conversion: worst.avgConv, delta, breakdown: styleEntries, time_window_days: analysisDays },
              current_value: { style: worst.style },
              recommended_value: { style: best.style },
              campaign_id: null, journey_id: null, journey_step_id: null, template_id: null, experiment_id: null,
              impact_score: Math.min(100, Math.round(delta * 3)),
              confidence_score: Math.min(100, Math.round((Math.min(best.sends, worst.sends) / 500) * 100)),
              engine_version: ENGINE_VERSION,
              analysis_window_days: analysisDays,
            });
          }
        }
      }
    }

    // ── Dedup and insert ──
    let inserted = 0;
    for (const rec of recommendations) {
      // Check for existing pending recommendation with same type + scope
      const { data: existing } = await supabase
        .from("outbound_optimization_recommendations")
        .select("id")
        .eq("recommendation_type", rec.recommendation_type)
        .eq("status", "pending")
        .is("campaign_id", rec.campaign_id)
        .is("journey_id", rec.journey_id)
        .is("journey_step_id", rec.journey_step_id)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error } = await supabase
        .from("outbound_optimization_recommendations")
        .insert(rec);

      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendations_generated: recommendations.length,
        recommendations_inserted: inserted,
        engine_version: ENGINE_VERSION,
        analysis_window_days: analysisDays,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
