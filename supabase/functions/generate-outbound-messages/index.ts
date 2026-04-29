import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configurable defaults
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const PROMPT_VERSION = "v1.0";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      campaign_type,
      channel_type,
      intent_type,
      tone_type = "friendly",
      customer_profile_id = null,
      custom_context = null,
    } = body;

    if (!campaign_type || !channel_type || !intent_type) {
      return new Response(
        JSON.stringify({ error: "campaign_type, channel_type, and intent_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build customer context
    let customerContext: Record<string, unknown> = {};

    if (customer_profile_id) {
      // Fetch real customer data
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", customer_profile_id)
        .single();

      const { data: stageState } = await supabase
        .from("customer_stage_state")
        .select("*")
        .eq("customer_profile_id", customer_profile_id)
        .single();

      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at")
        .eq("user_id", profile?.user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      customerContext = {
        profile_id: customer_profile_id,
        preferred_language: profile?.preferred_language || "en",
        funnel_stage: stageState?.funnel_stage || "unknown",
        capability_stage: stageState?.capability_stage || "unknown",
        experience_stage: stageState?.experience_stage || "unknown",
        price_sensitivity: profile?.price_sensitivity || "unknown",
        recent_experience: profile?.last_experience_quality || "neutral",
        product_interest: profile?.primary_product_interest || null,
        purchase_count: recentOrders?.length || 0,
        has_active_order: recentOrders?.some((o: any) => o.status === "active") || false,
      };
    } else if (custom_context) {
      customerContext = custom_context;
    } else {
      customerContext = {
        funnel_stage: "consideration",
        capability_stage: "unknown",
        experience_stage: "neutral",
        preferred_language: "en",
        price_sensitivity: "medium",
      };
    }

    // Build the generation prompt
    const channelConstraint = channel_type === "line"
      ? "LINE messages should be under 500 characters. Use casual, friendly tone."
      : channel_type === "email"
      ? "Email messages can be longer (200-400 words). Include a compelling subject line for each variant."
      : channel_type === "whatsapp"
      ? "WhatsApp messages should be concise (under 300 characters). Be conversational."
      : "Facebook messages should be engaging and concise (under 400 characters).";

    const toneInstruction = ({
      friendly: "Use a warm, approachable tone like a helpful friend.",
      professional: "Use a polished, business-appropriate tone.",
      urgent: "Create urgency without being pushy. Use time-sensitive language.",
      casual: "Be relaxed and conversational, like texting a friend.",
      empathetic: "Show understanding and care. Acknowledge the customer's situation.",
    } as Record<string, string>)[tone_type] || "Use a friendly tone.";

    const systemPrompt = `You are a marketing message copywriter for Mobile11, a travel eSIM company.
You write messages that feel natural, human, and never robotic.

RULES:
- Each variant MUST use completely different opening phrases and sentence structures
- Never start two variants the same way
- Use {{first_name}}, {{package_name}}, {{country}}, {{discount_amount}} placeholders where appropriate
- ${channelConstraint}
- ${toneInstruction}
- Campaign type: ${campaign_type.replace(/_/g, " ")}
- Intent: ${intent_type}
- Customer context: ${JSON.stringify(customerContext)}

IMPORTANT: Adapt the message based on the customer's stage and experience. 
If experience is "bad", be empathetic and avoid hard sells.
If funnel_stage is "awareness", focus on education not conversion.
If price_sensitivity is "high", emphasize value and deals.`;

    const userPrompt = `Generate 8 outbound message variants for a ${campaign_type.replace(/_/g, " ")} campaign on ${channel_type}.

Generate these exact variant keys:
1. short_en - Short English version (1-2 sentences)
2. medium_en - Medium English version (2-4 sentences)
3. soft_cta_en - Soft call-to-action English version
4. strong_cta_en - Strong call-to-action English version
5. short_th - Short Thai version (1-2 sentences)
6. medium_th - Medium Thai version (2-4 sentences)
7. soft_cta_th - Soft call-to-action Thai version
8. strong_cta_th - Strong call-to-action Thai version

${channel_type === "email" ? "For each variant, also provide an email_subject line." : ""}`;

    // Call AI gateway with tool calling for structured output
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_message_variants",
              description: "Submit the generated message variants",
              parameters: {
                type: "object",
                properties: {
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        variant_key: {
                          type: "string",
                          enum: [
                            "short_en", "medium_en", "soft_cta_en", "strong_cta_en",
                            "short_th", "medium_th", "soft_cta_th", "strong_cta_th",
                          ],
                        },
                        language: { type: "string", enum: ["en", "th"] },
                        style: { type: "string", enum: ["short", "medium", "soft_cta", "strong_cta"] },
                        message_text: { type: "string" },
                        email_subject: { type: "string", description: "Required when channel is email, null otherwise" },
                        supported_variables: {
                          type: "array",
                          items: { type: "string" },
                          description: "Variable placeholders used in this variant, e.g. first_name",
                        },
                      },
                      required: ["variant_key", "language", "style", "message_text", "supported_variables"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["variants"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_message_variants" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const variants = (parsed.variants || []).map((v: any) => ({
      ...v,
      email_subject: v.email_subject || null,
      approval_status: "pending",
      notes: null,
    }));

    // Insert batch record
    const { data: batch, error: insertError } = await supabase
      .from("ai_generated_message_batches")
      .insert({
        campaign_type,
        channel_type,
        intent_type,
        tone_type,
        customer_profile_id: customer_profile_id || null,
        customer_context: customerContext,
        generated_variants: variants,
        prompt_version: PROMPT_VERSION,
        generation_engine: DEFAULT_MODEL,
        status: "generated",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(batch), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-outbound-messages error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
