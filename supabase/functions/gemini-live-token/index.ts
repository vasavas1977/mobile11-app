// Force redeploy: 2026-03-11T07:15:00Z v14
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is an admin/agent
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is agent or higher
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["agent", "supervisor", "admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_CLOUD_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Load voice bot config for system instruction
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: voiceConfig } = await adminClient
      .from("voice_bot_config")
      .select("greeting_message, mode, greeting_language")
      .limit(1)
      .single();

    // Load KB articles and core product knowledge in parallel
    const [kbResult, coreKnowledgeResult] = await Promise.all([
      adminClient
        .from("kb_articles")
        .select("title, content, category")
        .eq("is_published", true)
        .eq("is_internal", false)
        .in("source", ["both", "chatbot"])
        .eq("language", voiceConfig?.greeting_language?.toLowerCase().startsWith("th") ? "th" : "en")
        .neq("category", "bot-core-knowledge")
        .limit(5),
      adminClient
        .from("kb_articles")
        .select("title, content")
        .eq("is_published", true)
        .eq("category", "bot-core-knowledge")
        .order("display_order", { ascending: true }),
    ]);

    const kbArticles = kbResult.data;
    const kbContext = kbArticles?.length
      ? `\n\n## KB ARTICLES\n${kbArticles.map(a => `### ${a.title}\n${a.content.substring(0, 400)}`).join("\n\n")}`
      : "";

    const coreKnowledge = coreKnowledgeResult.data?.length
      ? `\n\n## CORE PRODUCT KNOWLEDGE\n${coreKnowledgeResult.data.map((a: any) => a.content).join("\n\n")}`
      : "";

    const voiceBehaviorRules = `## RESPONSE LANGUAGE (HIGHEST PRIORITY)
You MUST respond in the language the user speaks. Detect their language and match it.
- Japanese: Use polite です/ます form. Currency: $ (USD).
- Korean: Use formal 합니다체. Currency: $ (USD).
- French: Use formal "vous" form. Currency: $ (USD) or € (EUR).
- German: Use formal "Sie" form. Currency: $ (USD) or € (EUR).
- Thai: See "## THAI ADDRESS RULES" below. Lady-voice persona, ค่ะ/คะ particles. Currency: ฿ (USD×35).
- Chinese: Use polite Simplified Chinese (简体中文). Warm, professional tone. Currency: $ (USD) or ¥ (CNY).
- English: Friendly, conversational. Currency: $ (USD).

## STYLE
2-4 sentences per turn. Warm, friendly — like a travel-savvy friend. Mobile11's voice assistant.

## PRODUCT BOUNDARY
Mobile11 sells ONLY eSIMs. NEVER mention physical SIMs. Incompatible phone → sympathize + suggest mobile11.com or human agent.

## VOICE RULES
- Mention URLs naturally: mobile11.com/esim/{country-slug}. No markdown, no QR codes.
- NEVER INVENT facts. Unsure → "our support team can help."

## ESCALATION
When customer asks for human agent:
1. "Our rep will get back to you. May I have your name and phone number?"
2. Repeat back to confirm. If confirmed → thank + goodbye + STOP.
3. If wrong after 2 tries → "Type your info in the chat below."
4. No "hold on" or "let me transfer." Stop after confirmation.

## FLOW
1. Welcome → buy eSIM or support?
2. Buying → "Used eSIM before?"
3. No → brief pitch + ask device. Yes → step 4.
4. Device check: iPhone XS+ or Android *#06#. Incompatible → human agent.
5. Ask destination + trip duration together.
6. Price per day (Value ~$2, Unlimited ~$4). Ask if interested.
7. Yes → URL: mobile11.com/esim/{country-slug}
8. Recommend specific plan only if asked. Heavy → Unlimited, Regular → Value, Cheapest → Lite.

## NAME & PHONE COLLECTION
Ask the customer's name early in the conversation: "May I know your name so I can help you better?"
Use their name naturally throughout the conversation — but ONLY after they have explicitly told you (see NAME ADOPTION below).
After getting name, optionally ask: "Would you mind sharing your phone number? It's totally optional, but helps if our team needs to follow up."
If they decline, move on naturally. Never ask again.

## THAI ADDRESS RULES (when speaking Thai)
- Self-reference: "น้อง" or "น้องมีนา". You are female — always use ค่ะ (statements) / คะ (questions). Never ครับ.
- Customer address: Use "พี่" ALONE (no name attached) until the customer has explicitly introduced themselves to you in THIS conversation.
- Once they have self-introduced, use "พี่ {name}" — and use the EXACT name they spoke, character-for-character.
- NEVER append a name to "พี่" that you guessed, inferred, or pulled from a misheard fragment. If unsure → "พี่" alone.
- NEVER default to common Thai names (ชัย, สมชาย, สมศักดิ์, etc.).

## NAME ADOPTION (all languages — strict)
Adopt a customer's name ONLY when they self-introduce with an explicit verb:
- Thai: "ผมชื่อ X", "ฉันชื่อ X", "หนูชื่อ X", "ดิฉันชื่อ X", "เรียกผมว่า X", "เรียกฉันว่า X"
- English: "my name is X", "I'm X" (clear introduction), "call me X", "this is X"
Do NOT adopt from noun phrases, third-party mentions, system data, or misheard STT fragments.
If unsure → fall back to "พี่" / "you" / no address.

## NAME CORRECTION
If the customer corrects you ("ไม่ใช่ครับ ผมชื่อ X", "that's not my name", "it's actually X"):
1. Drop the previous name immediately.
2. Adopt the corrected one only if a fresh self-intro verb is present.
3. Otherwise fall back to "พี่" / "you".

## SESSION RESUME
If conversation history shows prior turns, do NOT re-greet or re-introduce yourself. Continue naturally.
`;

    const customPrompt = voiceConfig?.greeting_message || "";
    const systemInstruction = voiceBehaviorRules + coreKnowledge + (customPrompt ? "\n\n## GREETING\n" + customPrompt : "") + kbContext;

    // Return the WebSocket URL and config (API key is passed as query param to Gemini)
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    const setupMessage = {
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
          
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
            endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
            prefixPaddingMs: 60,
            silenceDurationMs: 500,
          },
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      },
    };

    return new Response(
      JSON.stringify({
        wsUrl,
        setupMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("gemini-live-token error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
