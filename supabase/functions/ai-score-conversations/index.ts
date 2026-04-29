import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 15;
const SCORING_MODEL_VERSION = "v2.0";

// Weighted composite formula
const DIMENSION_WEIGHTS = {
  accuracy: 0.20,
  resolution: 0.20,
  clarity: 0.12,
  empathy: 0.10,
  policy_compliance: 0.10,
  confidence: 0.08,
  predicted_csat: 0.10,
  business_outcome: 0.10,
};

function computeComposite(scores: Record<string, number>): number {
  let total = 0;
  for (const [dim, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    total += (scores[dim] || 0) * weight;
  }
  return Math.round(total);
}

// Confidence calibration: adjust predicted_csat based on known signals
function calibrateConfidence(
  scores: Record<string, number>,
  hadRating: boolean,
  actualRating: number | null,
  hadHandoff: boolean,
  hadDeadAir: boolean,
): Record<string, number> {
  const calibrated = { ...scores };

  // If customer rated and we predicted far off, penalize confidence
  if (hadRating && actualRating !== null) {
    const actualCsat = actualRating * 20; // 1-5 → 0-100
    const diff = Math.abs(calibrated.predicted_csat - actualCsat);
    if (diff > 30) {
      calibrated.confidence = Math.max(0, calibrated.confidence - Math.round(diff * 0.3));
    }
  }

  // Dead air is a strong negative signal
  if (hadDeadAir) {
    calibrated.clarity = Math.min(calibrated.clarity, 60);
    calibrated.predicted_csat = Math.min(calibrated.predicted_csat, 55);
  }

  // Handoff implies bot couldn't resolve alone
  if (hadHandoff) {
    calibrated.resolution = Math.min(calibrated.resolution, 50);
  }

  return calibrated;
}

function buildScoringPrompt(
  transcript: string,
  channel: string,
  language: string,
  hadHandoff: boolean,
  wasResolved: boolean,
  rating: number | null,
  hadDeadAir: boolean,
  deadAirSeconds: number | null,
  messageCount: number,
): string {
  return `You are an enterprise-grade conversation quality evaluator for Mobile11, a multilingual eSIM customer support platform operating across web chat, LINE, WhatsApp, Facebook Messenger, email, and voice.

## SCORING TASK

Analyze this customer-bot conversation transcript and produce a structured quality assessment. The conversation may be in Thai (ภาษาไทย) or English — evaluate in the language used. Your analysis must be language-aware: Thai conversations should be evaluated with Thai cultural norms (politeness particles คะ/ค่ะ/ครับ, น้อง/พี่ pronouns, appropriate empathy expressions).

## DIMENSIONS (Score 0-100 each)

1. **accuracy** (0-100): Did the bot provide factually correct information about eSIM packages, pricing, installation, compatibility, coverage, and policies? Deduct heavily for hallucinated details, wrong prices, or incorrect country coverage.

2. **resolution** (0-100): Was the customer's core issue actually resolved? Consider: Did the bot answer the question? Did the customer get what they needed? Did the conversation reach a natural conclusion? Score 0-30 if unresolved, 30-60 if partially addressed, 60-100 if fully resolved.

3. **clarity** (0-100): Were bot responses clear, well-structured, and easy to follow? Consider: proper formatting, logical flow, appropriate length (not too verbose, not too terse), correct use of links/instructions.

4. **empathy** (0-100): Did the bot show appropriate emotional intelligence? For Thai: proper use of softening particles (คะ/ค่ะ), น้อง self-reference, acknowledgment phrases. For English: warm tone, acknowledgment of frustration/confusion, appropriate use of emojis.

5. **policy_compliance** (0-100): Did the bot follow Mobile11 policies? No unauthorized discounts, correct refund procedures, proper escalation triggers, appropriate privacy handling, no sharing of internal system details.

6. **confidence** (0-100): How confident and authoritative were the bot's responses? Deduct for hedging language ("I think maybe..."), contradictions between messages, or admitting uncertainty about core product info.

7. **predicted_csat** (0-100): Predict what the customer would rate this interaction (mapped to 0-100). Base this on: resolution success, tone of final customer message, whether they thanked the bot, whether they seemed frustrated.

8. **business_outcome** (0-100): Did the conversation lead toward a positive business outcome? Consider: purchase intent, cart link clicked, successful upsell/cross-sell, retention of frustrated customer, referral generated. Score 50 for neutral (informational query answered).

## BEHAVIORAL DETECTION

Detect customer emotional state:
- **confused**: Customer asked the same question multiple ways, or said they didn't understand
- **frustrated**: Negative language, complaints, demands to speak to human
- **silent**: Customer stopped responding (dead air occurred)
- **satisfied**: Positive language, thanks, completed purchase

Detect bot failure modes:
- **wrong_answer**: Factually incorrect information
- **hallucination**: Made up product details, prices, or features
- **language_mismatch**: Responded in wrong language or mixed inappropriately
- **dead_air**: Response likely caused customer to stop engaging
- **loop_detected**: Repeated same response or got stuck in circular logic
- **missed_escalation**: Should have escalated to human but didn't
- **policy_violation**: Broke company policy
- **incomplete_answer**: Didn't fully address the question
- **tone_mismatch**: Tone was inappropriate for the situation (too casual for complaint, etc.)

Detect root causes:
- **missing_kb**: Knowledge Base doesn't cover this topic
- **bad_prompt**: System prompt caused incorrect behavior
- **wrong_intent**: Misclassified the customer's intent
- **missing_action**: Bot lacked capability to take needed action (e.g., modify order)

## CONTEXT

- Channel: ${channel}
- Detected language: ${language}
- Human handoff occurred: ${hadHandoff ? "YES" : "NO"}
- Conversation resolved: ${wasResolved ? "YES" : "NO"}
- Customer rating: ${rating !== null ? `${rating}/5` : "NOT PROVIDED"}
- Dead air detected: ${hadDeadAir ? `YES (${deadAirSeconds || "unknown"} seconds)` : "NO"}
- Total messages: ${messageCount}

## TRANSCRIPT

${transcript}

## OUTPUT FORMAT (strict JSON)

{
  "scores": {
    "accuracy": <0-100>,
    "resolution": <0-100>,
    "clarity": <0-100>,
    "empathy": <0-100>,
    "policy_compliance": <0-100>,
    "confidence": <0-100>,
    "predicted_csat": <0-100>,
    "business_outcome": <0-100>
  },
  "reasoning": {
    "summary": "<2-3 sentence overall assessment>",
    "accuracy_note": "<why this score>",
    "resolution_note": "<why this score>",
    "clarity_note": "<why this score>",
    "empathy_note": "<why this score>",
    "policy_note": "<why this score>",
    "confidence_note": "<why this score>",
    "csat_note": "<why this score>",
    "business_note": "<why this score>"
  },
  "customer_state": "<confused|frustrated|silent|satisfied|neutral>",
  "issue_resolved": <true|false>,
  "likely_caused_dead_air": <true|false>,
  "failures": [
    {
      "type": "<failure_type_enum>",
      "severity": "<low|medium|high|critical>",
      "subtype": "<optional detail>",
      "bot_response": "<excerpt of problematic bot response, max 200 chars>",
      "customer_message": "<what customer said that triggered the issue, max 200 chars>",
      "root_cause": "<missing_kb|bad_prompt|wrong_intent|missing_action|other>",
      "suggested_fix": "<kb_update|prompt_change|escalation_rule|training_data|action_capability>"
    }
  ]
}`;
}

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
    const body = await req.json().catch(() => ({}));

    // Support single-conversation re-scoring
    const singleConvId = body.conversation_id;
    const forceRescore = body.force_rescore === true;

    let conversationIds: string[] = [];
    let eventIdMap: Record<string, string[]> = {};

    if (singleConvId) {
      // Direct single conversation scoring
      conversationIds = [singleConvId];
    } else {
      // Batch: fetch pending events from queue
      const { data: pendingEvents, error: fetchErr } = await supabase
        .from("ai_conversation_events")
        .select("*")
        .eq("processing_status", "pending")
        .order("created_at", { ascending: true })
        .limit(200);

      if (fetchErr) throw fetchErr;
      if (!pendingEvents || pendingEvents.length === 0) {
        return new Response(
          JSON.stringify({ status: "no_pending_events" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Group by conversation
      const convGroups: Record<string, typeof pendingEvents> = {};
      for (const evt of pendingEvents) {
        if (!convGroups[evt.conversation_id]) {
          convGroups[evt.conversation_id] = [];
        }
        convGroups[evt.conversation_id].push(evt);
      }

      conversationIds = Object.keys(convGroups).slice(0, BATCH_SIZE);
      for (const cid of conversationIds) {
        eventIdMap[cid] = convGroups[cid].map(e => e.id);
      }

      // Mark as scoring
      const allEventIds = conversationIds.flatMap(cid => eventIdMap[cid]);
      if (allEventIds.length > 0) {
        await supabase
          .from("ai_conversation_events")
          .update({ processing_status: "scoring" })
          .in("id", allEventIds);
      }
    }

    let scored = 0;
    let failures = 0;
    const results: any[] = [];

    for (const convId of conversationIds) {
      try {
        // Check if already scored with current version (skip unless force)
        if (!forceRescore && !singleConvId) {
          const { data: existingScore } = await supabase
            .from("ai_conversation_scores")
            .select("id")
            .eq("conversation_id", convId)
            .eq("scoring_model_version", SCORING_MODEL_VERSION)
            .limit(1);

          if (existingScore && existingScore.length > 0) {
            // Already scored with this version, mark events done
            if (eventIdMap[convId]) {
              await supabase
                .from("ai_conversation_events")
                .update({ processing_status: "scored", scored_at: new Date().toISOString() })
                .in("id", eventIdMap[convId]);
            }
            continue;
          }
        }

        // Fetch conversation messages
        const { data: messages } = await supabase
          .from("conversation_messages")
          .select("content, sender_type, created_at, metadata")
          .eq("conversation_id", convId)
          .eq("is_internal_note", false)
          .order("created_at", { ascending: true })
          .limit(50);

        if (!messages || messages.length === 0) {
          if (eventIdMap[convId]) {
            await supabase
              .from("ai_conversation_events")
              .update({ processing_status: "scored", scored_at: new Date().toISOString() })
              .in("id", eventIdMap[convId]);
          }
          continue;
        }

        // Get conversation metadata
        const { data: conv } = await supabase
          .from("conversations")
          .select("channel, contact_id, status, assigned_to, resolved_at, metadata")
          .eq("id", convId)
          .single();

        // Get rating
        const { data: ratings } = await supabase
          .from("conversation_ratings")
          .select("rating, feedback_text")
          .eq("conversation_id", convId)
          .limit(1);

        // Get dead air events
        const { data: deadAirEvents } = await supabase
          .from("dead_air_events")
          .select("silence_duration_seconds, customer_returned")
          .eq("conversation_id", convId);

        const hadHandoff = conv?.assigned_to !== null;
        const wasResolved = conv?.status === "resolved";
        const rating = ratings?.[0]?.rating ?? null;
        const hadDeadAir = deadAirEvents && deadAirEvents.length > 0;
        const maxDeadAirSeconds = hadDeadAir
          ? Math.max(...deadAirEvents.map(d => d.silence_duration_seconds))
          : null;

        // Detect language from messages
        const customerMessages = messages.filter(m => m.sender_type === "customer");
        const hasThaiChars = customerMessages.some(m =>
          m.content?.match(/[\u0E00-\u0E7F]/)
        );
        const detectedLang = hasThaiChars ? "th" : "en";

        // Build transcript with timestamps
        const transcript = messages
          .map(m => {
            const time = new Date(m.created_at).toISOString().substring(11, 19);
            const role = m.sender_type === "customer" ? "Customer" : m.sender_type === "bot" ? "Bot" : "Agent";
            return `[${time}] ${role}: ${m.content}`;
          })
          .join("\n");

        // Build scoring prompt
        const scoringPrompt = buildScoringPrompt(
          transcript,
          conv?.channel || "unknown",
          detectedLang,
          hadHandoff,
          wasResolved,
          rating,
          hadDeadAir || false,
          maxDeadAirSeconds,
          messages.length,
        );

        let scoreData: any = null;

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
                {
                  role: "system",
                  content: "You are an enterprise conversation quality evaluator. You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.",
                },
                { role: "user", content: scoringPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.05,
            }),
          });

          if (aiRes.ok) {
            const aiResult = await aiRes.json();
            const content = aiResult.choices?.[0]?.message?.content;
            if (content) {
              try {
                scoreData = JSON.parse(content);
              } catch (e: any) {
                console.error(`[ai-score] JSON parse error for conv ${convId}:`, e);
                console.error(`[ai-score] Raw content:`, content.substring(0, 500));
              }
            }
          } else {
            const errText = await aiRes.text();
            console.error(`[ai-score] AI API error ${aiRes.status}:`, errText.substring(0, 300));
            
            if (aiRes.status === 429 || aiRes.status === 402) {
              // Rate limit or payment — reset events and bail
              if (eventIdMap[convId]) {
                await supabase
                  .from("ai_conversation_events")
                  .update({ processing_status: "pending" })
                  .in("id", eventIdMap[convId]);
              }
              return new Response(
                JSON.stringify({
                  error: aiRes.status === 429 ? "Rate limited" : "Payment required",
                  status: aiRes.status,
                }),
                { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }

        if (scoreData?.scores) {
          // Apply confidence calibration
          const rawScores = scoreData.scores;
          const calibrated = calibrateConfidence(
            rawScores,
            rating !== null,
            rating,
            hadHandoff,
            hadDeadAir || false,
          );

          const composite = computeComposite(calibrated);

          // Build reasoning summary
          const reasoning = scoreData.reasoning;
          const reasoningSummary = typeof reasoning === "string"
            ? reasoning
            : typeof reasoning === "object"
              ? [
                  reasoning.summary,
                  `Accuracy: ${reasoning.accuracy_note}`,
                  `Resolution: ${reasoning.resolution_note}`,
                  `Clarity: ${reasoning.clarity_note}`,
                  `Empathy: ${reasoning.empathy_note}`,
                  `Policy: ${reasoning.policy_note}`,
                  `Confidence: ${reasoning.confidence_note}`,
                  `CSAT: ${reasoning.csat_note}`,
                  `Business: ${reasoning.business_note}`,
                ].filter(Boolean).join(" | ")
              : null;

          // If re-scoring, delete old score for this version
          if (forceRescore) {
            await supabase
              .from("ai_conversation_scores")
              .delete()
              .eq("conversation_id", convId)
              .eq("scoring_model_version", SCORING_MODEL_VERSION);
          }

          const scoreRecord = {
            conversation_id: convId,
            customer_id: conv?.contact_id || null,
            channel: conv?.channel || null,
            language: detectedLang,
            ai_accuracy_score: Math.round(calibrated.accuracy || 0),
            ai_resolution_score: Math.round(calibrated.resolution || 0),
            ai_clarity_score: Math.round(calibrated.clarity || 0),
            ai_empathy_score: Math.round(calibrated.empathy || 0),
            ai_policy_compliance_score: Math.round(calibrated.policy_compliance || 0),
            ai_confidence_score: Math.round(calibrated.confidence || 0),
            predicted_customer_satisfaction_score: Math.round(calibrated.predicted_csat || 0),
            business_outcome_score: Math.round(calibrated.business_outcome || 0),
            composite_score: composite,
            scoring_model_version: SCORING_MODEL_VERSION,
            score_reasoning_summary: reasoningSummary,
          };

          await supabase.from("ai_conversation_scores").insert(scoreRecord);
          scored++;

          // Store detailed reasoning as metadata in the score
          const convResult: any = {
            conversation_id: convId,
            composite_score: composite,
            scores: calibrated,
            customer_state: scoreData.customer_state,
            issue_resolved: scoreData.issue_resolved,
          };
          results.push(convResult);

          // Insert AI-detected failure events
          if (scoreData.failures && Array.isArray(scoreData.failures)) {
            const validFailureTypes = [
              "wrong_answer", "hallucination", "language_mismatch", "dead_air",
              "loop_detected", "missed_escalation", "policy_violation",
              "incomplete_answer", "tone_mismatch", "unclear_answer",
              "wrong_language", "weak_empathy", "policy_risk", "dead_air_trigger",
              "unresolved_issue", "repeated_contact_risk", "missing_backend_action",
              "missing_kb", "missing_knowledge", "wrong_intent_classification",
              "failed_handoff", "timeout", "unknown", "other",
            ];
            const validSeverities = ["low", "medium", "high", "critical"];

            for (const f of scoreData.failures) {
              const failureType = validFailureTypes.includes(f.type) ? f.type : "unknown";
              const severity = validSeverities.includes(f.severity) ? f.severity : "medium";

              await supabase.from("ai_failure_events").insert({
                conversation_id: convId,
                customer_id: conv?.contact_id || null,
                failure_type: failureType,
                failure_subtype: f.subtype || null,
                severity,
                detected_by: "ai_scorer_" + SCORING_MODEL_VERSION,
                bot_response_excerpt: (f.bot_response || "").substring(0, 500),
                customer_last_message: (f.customer_message || "").substring(0, 500),
                root_cause_guess: f.root_cause || null,
                suggested_fix_type: f.suggested_fix || null,
              });
              failures++;
            }
          }

          // Threshold-based auto-failure creation
          try {
            const { data: thresholds } = await supabase
              .from("ai_score_thresholds")
              .select("*")
              .eq("auto_create_failure", true);

            if (thresholds && thresholds.length > 0) {
              const dimensionScoreMap: Record<string, number> = {
                composite,
                accuracy: calibrated.accuracy || 0,
                resolution: calibrated.resolution || 0,
                clarity: calibrated.clarity || 0,
                empathy: calibrated.empathy || 0,
                policy_compliance: calibrated.policy_compliance || 0,
                confidence: calibrated.confidence || 0,
                predicted_csat: calibrated.predicted_csat || 0,
                business_outcome: calibrated.business_outcome || 0,
                customer_rating: rating !== null ? rating * 20 : 100,
              };

              const fixTypeMap: Record<string, string> = {
                accuracy: "kb_update",
                resolution: "escalation_rule",
                clarity: "prompt_change",
                empathy: "prompt_change",
                policy_compliance: "prompt_change",
                confidence: "kb_update",
                predicted_csat: "prompt_change",
                composite: "prompt_change",
                customer_rating: "prompt_change",
                business_outcome: "training_data",
              };

              const failureTypeMap: Record<string, string> = {
                accuracy: "wrong_answer",
                resolution: "unresolved_issue",
                clarity: "unclear_answer",
                empathy: "weak_empathy",
                policy_compliance: "policy_risk",
                confidence: "unclear_answer",
                predicted_csat: "weak_empathy",
                composite: "incomplete_answer",
                customer_rating: "incomplete_answer",
                business_outcome: "incomplete_answer",
              };

              for (const t of thresholds) {
                const score = dimensionScoreMap[t.dimension];
                if (score === undefined) continue;

                const isCritical = score < (t.critical_threshold ?? 40);
                const isWarning = !isCritical && score < (t.warning_threshold ?? 60);

                if (isCritical || isWarning) {
                  const fType = t.failure_type_override || failureTypeMap[t.dimension] || "unknown";
                  await supabase.from("ai_failure_events").insert({
                    conversation_id: convId,
                    customer_id: conv?.contact_id || null,
                    failure_type: fType,
                    failure_subtype: `${t.dimension}_below_threshold`,
                    severity: isCritical ? "critical" : "medium",
                    detected_by: "threshold_" + SCORING_MODEL_VERSION,
                    root_cause_guess: score < 30 ? "missing_kb" : "bad_prompt",
                    suggested_fix_type: fixTypeMap[t.dimension] || "prompt_change",
                  });
                  failures++;
                }
              }
            }
          } catch (threshErr) {
            console.error(`[ai-score] Threshold check error for conv ${convId}:`, threshErr);
          }
        }

        // Mark events as scored
        if (eventIdMap[convId]) {
          await supabase
            .from("ai_conversation_events")
            .update({ processing_status: "scored", scored_at: new Date().toISOString() })
            .in("id", eventIdMap[convId]);
        }
      } catch (convErr) {
        console.error(`[ai-score] Error scoring conv ${convId}:`, convErr);
        if (eventIdMap[convId]) {
          await supabase
            .from("ai_conversation_events")
            .update({ processing_status: "pending" })
            .in("id", eventIdMap[convId]);
        }
      }
    }

    const summary = {
      conversations_processed: conversationIds.length,
      scores_created: scored,
      failures_detected: failures,
      scoring_model_version: SCORING_MODEL_VERSION,
      results: singleConvId ? results : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log("[ai-score] Summary:", JSON.stringify({
      ...summary,
      results: undefined,
    }));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[ai-score] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
