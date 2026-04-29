import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ENGINE_VERSION = "v1.0";
const EXPIRES_HOURS = 48;
const DEDUP_HOURS = 24;
const MIN_SENDS_FOR_SIGNAL = 5;

// Risk classification
const ACTION_RISK: Record<string, string> = {
  wait: "low",
  send_educational: "low",
  send_promotion: "low",
  send_sales_followup: "medium",
  switch_channel: "medium",
  send_recovery: "medium",
  stop_messaging: "high",
  suppress_annoyance: "high",
  move_to_upsell: "high",
  move_to_crosssell: "high",
};

interface ActionScore {
  action: string;
  score: number;
  factors: Record<string, any>;
  channel?: string;
  delay_hours?: number;
  journey_id?: string;
  campaign_id?: string;
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
    const mode = body.mode || "targeted";
    let customerProfileIds: string[] = body.customer_profile_ids || [];

    // Batch mode: find all customers with recent outbound activity
    if (mode === "batch") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: activeCustomers } = await supabase
        .from("outbound_learning_events")
        .select("customer_profile_id")
        .gte("created_at", thirtyDaysAgo)
        .not("customer_profile_id", "is", null);

      if (activeCustomers) {
        const unique = new Set(activeCustomers.map((r: any) => r.customer_profile_id));
        customerProfileIds = [...unique];
      }
    }

    if (!customerProfileIds.length) {
      return new Response(
        JSON.stringify({ message: "No customers to evaluate", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check dedup: skip customers with pending NBA in last 24h
    const dedupCutoff = new Date(Date.now() - DEDUP_HOURS * 3600000).toISOString();
    const { data: existingNBAs } = await supabase
      .from("outbound_next_best_actions")
      .select("customer_profile_id")
      .eq("status", "pending")
      .gte("created_at", dedupCutoff)
      .in("customer_profile_id", customerProfileIds);

    const skipSet = new Set((existingNBAs || []).map((r: any) => r.customer_profile_id));
    const toProcess = customerProfileIds.filter((id) => !skipSet.has(id));

    let generated = 0;

    for (const cpId of toProcess) {
      try {
        const nba = await evaluateCustomer(supabase, cpId);
        if (nba) {
          const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 3600000).toISOString();
          await supabase.from("outbound_next_best_actions").insert({
            customer_profile_id: cpId,
            recommended_action: nba.action,
            confidence_score: nba.confidence,
            explanation: nba.explanation,
            reasoning_factors: nba.factors,
            recommended_channel: nba.channel || null,
            current_channel: nba.currentChannel || null,
            recommended_delay_hours: nba.delayHours || null,
            recommended_journey_id: nba.journeyId || null,
            recommended_campaign_id: nba.campaignId || null,
            funnel_stage: nba.funnelStage || null,
            capability_stage: nba.capabilityStage || null,
            experience_stage: nba.experienceStage || null,
            recent_sentiment: nba.sentiment || null,
            sends_last_7d: nba.sends7d ?? null,
            complaints_last_30d: nba.complaints30d ?? null,
            expires_at: expiresAt,
            engine_version: ENGINE_VERSION,
          });
          generated++;
        }
      } catch (e: any) {
        console.error(`Error evaluating customer ${cpId}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Generated ${generated} NBA decisions`,
        generated,
        skipped_dedup: skipSet.size,
        total_candidates: customerProfileIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("NBA engine error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function evaluateCustomer(supabase: any, cpId: string) {
  // 1. Load stage state
  const { data: stageState } = await supabase
    .from("customer_stage_state")
    .select("*")
    .eq("customer_profile_id", cpId)
    .maybeSingle();

  const funnel = stageState?.funnel_stage || "new_lead";
  const capability = stageState?.capability_stage || null;
  const experience = stageState?.experience_stage || null;

  // 2. Load preferences
  const { data: prefs } = await supabase
    .from("customer_preferences")
    .select("*")
    .eq("customer_profile_id", cpId)
    .maybeSingle();

  const salesConsent = prefs?.prefers_sales_followup ?? false;
  const promoConsent = prefs?.prefers_news_and_promotions ?? false;
  const optOutAll = prefs?.opt_out_all ?? false;
  const optOutLine = prefs?.opt_out_line ?? false;
  const optOutEmail = prefs?.opt_out_email ?? false;
  const maxSends7d = prefs?.max_sends_7d ?? 5;
  const preferredChannel = prefs?.preferred_channel || "line";

  // 3. Load recent learning events (30d)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: events30d } = await supabase
    .from("outbound_learning_events")
    .select("delivery_status, opt_out_status, complaint_flag, reply_sentiment, channel_type, created_at")
    .eq("customer_profile_id", cpId)
    .gte("created_at", thirtyDaysAgo);

  const allEvents = events30d || [];
  const sends7d = allEvents.filter((e: any) => e.created_at >= sevenDaysAgo).length;
  const complaints30d = allEvents.filter((e: any) => e.complaint_flag === true).length;
  const optOuts30d = allEvents.filter((e: any) => e.opt_out_status === "opted_out").length;
  const negSentiment = allEvents.filter((e: any) => e.reply_sentiment === "negative").length;

  // 4. Load last send timing
  const { data: lastSend } = await supabase
    .from("outbound_send_logs")
    .select("sent_at, channel_type")
    .eq("customer_profile_id", cpId)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hoursSinceLastSend = lastSend?.sent_at
    ? (Date.now() - new Date(lastSend.sent_at).getTime()) / 3600000
    : 999;
  const currentChannel = lastSend?.channel_type || preferredChannel;

  // 5. Load recent ratings for sentiment
  const { data: ratings } = await supabase
    .from("conversation_ratings")
    .select("rating")
    .gte("created_at", thirtyDaysAgo)
    .limit(10);

  const avgRating = ratings?.length
    ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length
    : null;
  const sentiment = avgRating !== null
    ? avgRating >= 4 ? "positive" : avgRating >= 3 ? "neutral" : "negative"
    : allEvents.length > 0
      ? negSentiment > allEvents.length * 0.3 ? "negative" : "neutral"
      : null;

  // Score each action
  const scores: ActionScore[] = [];
  const factors: Record<string, any> = {};

  // --- SUPPRESSION ---
  if (optOutAll || (optOutLine && optOutEmail)) {
    scores.push({
      action: "stop_messaging",
      score: 100,
      factors: { reason: "opted_out_all", opt_out_all: optOutAll },
    });
  }

  const freqCapHit = sends7d >= maxSends7d;
  if (freqCapHit) {
    scores.push({
      action: "stop_messaging",
      score: 95,
      factors: { reason: "frequency_cap_exceeded", sends_last_7d: sends7d, max_sends_7d: maxSends7d },
    });
  }

  if (sentiment === "negative" && sends7d >= maxSends7d - 1) {
    scores.push({
      action: "suppress_annoyance",
      score: 85,
      factors: { reason: "negative_sentiment_high_frequency", sentiment, sends_last_7d: sends7d },
    });
  }

  // --- DELAY ---
  if (hoursSinceLastSend < 24 && !freqCapHit) {
    scores.push({
      action: "wait",
      score: 60,
      factors: { reason: "recent_send", hours_since_last: Math.round(hoursSinceLastSend) },
      delay_hours: Math.max(24 - Math.round(hoursSinceLastSend), 6),
    });
  }

  // --- SEND: RECOVERY ---
  const needsRecovery = ["bad_experience_customer", "unresolved_issue_customer", "support_heavy_customer"];
  if (experience && needsRecovery.includes(experience) && !optOutAll) {
    scores.push({
      action: "send_recovery",
      score: 75,
      factors: { reason: "negative_experience", experience_stage: experience },
    });
  }

  // --- SEND: EDUCATIONAL ---
  const needsEducation = ["never_used_esim", "first_time_esim_user", "phone_not_compatible"];
  if (capability && needsEducation.includes(capability) && promoConsent) {
    scores.push({
      action: "send_educational",
      score: 70,
      factors: { reason: "capability_gap", capability_stage: capability },
    });
  }

  // --- SEND: PROMOTION ---
  const promoResponsive = ["promo_responsive_customer", "price_sensitive_customer"];
  if (experience && promoResponsive.includes(experience) && promoConsent) {
    scores.push({
      action: "send_promotion",
      score: 65,
      factors: { reason: "promo_responsive", experience_stage: experience },
    });
  }

  // --- SEND: SALES FOLLOWUP ---
  const salesReady = ["qualified_lead", "follow_up_needed", "purchase_intent_high"];
  if (salesReady.includes(funnel) && salesConsent) {
    scores.push({
      action: "send_sales_followup",
      score: 72,
      factors: { reason: "sales_qualified", funnel_stage: funnel },
    });
  }

  // --- ROUTING: SWITCH CHANNEL ---
  if (allEvents.length >= MIN_SENDS_FOR_SIGNAL) {
    const byChannel: Record<string, { total: number; delivered: number }> = {};
    for (const e of allEvents) {
      const ch = e.channel_type || "line";
      if (!byChannel[ch]) byChannel[ch] = { total: 0, delivered: 0 };
      byChannel[ch].total++;
      if (e.delivery_status === "delivered") byChannel[ch].delivered++;
    }
    const currentStats = byChannel[currentChannel];
    if (currentStats && currentStats.total >= 3) {
      const currentRate = currentStats.delivered / currentStats.total;
      if (currentRate < 0.5) {
        const altChannel = currentChannel === "line" ? "email" : "line";
        const altStats = byChannel[altChannel];
        const altRate = altStats ? altStats.delivered / altStats.total : 0;
        if (altRate > currentRate) {
          scores.push({
            action: "switch_channel",
            score: 68,
            factors: {
              reason: "low_delivery_rate",
              current_channel: currentChannel,
              current_delivery_rate: Math.round(currentRate * 100),
              alt_channel: altChannel,
              alt_delivery_rate: Math.round(altRate * 100),
            },
            channel: altChannel,
          });
        }
      }
    }
  }

  // --- JOURNEY REASSIGNMENT ---
  if (experience === "good_experience_customer" && funnel === "converted_customer") {
    scores.push({
      action: "move_to_upsell",
      score: 55,
      factors: { reason: "positive_experience_converted", funnel_stage: funnel, experience_stage: experience },
    });
  }

  if (funnel === "repeat_customer" && experience && ["good_experience_customer", "high_value_customer"].includes(experience)) {
    scores.push({
      action: "move_to_crosssell",
      score: 52,
      factors: { reason: "repeat_buyer_positive", funnel_stage: funnel, experience_stage: experience },
    });
  }

  // If no action scored, default to wait
  if (scores.length === 0) {
    scores.push({
      action: "wait",
      score: 40,
      factors: { reason: "no_strong_signal" },
      delay_hours: 48,
    });
  }

  // Pick highest scoring action
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];

  // Compute confidence based on data completeness
  let confidence = 50;
  if (stageState) confidence += 15;
  if (prefs) confidence += 10;
  if (allEvents.length >= MIN_SENDS_FOR_SIGNAL) confidence += 15;
  if (ratings?.length) confidence += 10;
  confidence = Math.min(confidence, 100);

  // Generate explanation
  const riskLabel = ACTION_RISK[winner.action] || "medium";
  const explanation = generateExplanation(winner, { funnel, capability, experience, sentiment, sends7d, complaints30d, riskLabel });

  return {
    action: winner.action,
    confidence,
    explanation,
    factors: {
      winner: winner.factors,
      all_scores: scores.map((s) => ({ action: s.action, score: s.score })),
      risk_level: riskLabel,
    },
    channel: winner.channel,
    currentChannel,
    delayHours: winner.delay_hours,
    journeyId: winner.factors?.journey_id,
    campaignId: winner.factors?.campaign_id,
    funnelStage: funnel,
    capabilityStage: capability,
    experienceStage: experience,
    sentiment,
    sends7d,
    complaints30d,
  };
}

function generateExplanation(
  winner: ActionScore,
  ctx: { funnel: string; capability: string | null; experience: string | null; sentiment: string | null; sends7d: number; complaints30d: number; riskLabel: string }
): string {
  const parts: string[] = [];

  switch (winner.action) {
    case "stop_messaging":
      parts.push("Customer should not receive messages.");
      if (winner.factors.reason === "opted_out_all") parts.push("They have opted out of all communications.");
      if (winner.factors.reason === "frequency_cap_exceeded") parts.push(`Frequency cap reached: ${ctx.sends7d} sends in the last 7 days.`);
      break;
    case "suppress_annoyance":
      parts.push(`Soft suppression recommended. Recent sentiment is ${ctx.sentiment} with ${ctx.sends7d} sends in 7 days.`);
      break;
    case "wait":
      parts.push("No immediate action needed.");
      if (winner.factors.reason === "recent_send") parts.push(`Last send was ${winner.factors.hours_since_last}h ago.`);
      break;
    case "send_recovery":
      parts.push(`Recovery message recommended. Customer experience stage: ${ctx.experience}.`);
      break;
    case "send_educational":
      parts.push(`Educational content recommended. Capability stage: ${ctx.capability}.`);
      break;
    case "send_promotion":
      parts.push(`Promotional content recommended. Experience profile: ${ctx.experience}.`);
      break;
    case "send_sales_followup":
      parts.push(`Sales follow-up recommended. Funnel stage: ${ctx.funnel}.`);
      break;
    case "switch_channel":
      parts.push(`Channel switch recommended from ${winner.factors.current_channel} to ${winner.channel}.`);
      parts.push(`Current delivery rate: ${winner.factors.current_delivery_rate}%, alternative: ${winner.factors.alt_delivery_rate}%.`);
      break;
    case "move_to_upsell":
      parts.push("Upsell journey recommended. Customer has positive experience and is a converted buyer.");
      break;
    case "move_to_crosssell":
      parts.push("Cross-sell journey recommended. Repeat customer with positive experience.");
      break;
  }

  parts.push(`Risk level: ${ctx.riskLabel}.`);
  return parts.join(" ");
}
