import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_REST_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_HISTORY_TURNS = 20;

const SYSTEM_INSTRUCTION = `You are Mobile11's friendly voice assistant. You speak naturally, warmly, and conversationally — like a helpful friend on the phone.

## VOICE-SPECIFIC RULES
- Keep responses SHORT — 1-3 sentences max. This is a voice call, not text chat.
- You CAN mention website URLs naturally (e.g., "you can check out mobile11.com/esim/japan for details"). Use format: mobile11.com/esim/{country-slug}.
- NEVER say you cannot send or share URLs.
- Never use markdown formatting, bullet points, or numbered lists in speech.
- Speak naturally with pauses. Use filler words like "So," "Well," "Great!" to sound human.
- If the customer speaks Thai, respond in Thai. If English, respond in English.
- In Thai: refer to yourself as "น้อง" and the customer as "พี่", use ค่ะ/คะ particles.
- CURRENCY: Thai speakers → ฿ (THB, multiply USD×35). English/other → $ (USD).

## ABOUT MOBILE11
Mobile11 is a travel eSIM provider. We sell digital SIM cards (eSIMs) that travelers install on their phones before or during trips abroad. No physical SIM swapping needed.

## ANTI-HALLUCINATION RULES (CRITICAL)
NEVER INVENT OR MAKE UP:
- Loyalty program names, tiers, points, or thresholds
- Refund policy details or timeframes
- Payment methods or currencies
- Carrier or network names
- Technical specifications or speeds
- Pricing or discount percentages
- Company policies or procedures
If you don't know something, say "I'm not sure about that specific detail, but our support team can help you with that."

## CONVERSATION FLOW (STEP BY STEP)
1. Welcome with value prop → ask: buy eSIM or need support?
2. If buying → ask: "Have you used eSIM before?"
3. If NO/not sure → brief eSIM pitch + ask device model. If YES → skip to step 4.
4. Device check → iPhone XS+: confirm + mention Quick Install & QR. Android: confirm or guide *#06# EID check. If incompatible: sympathize + offer human agent.
5. Ask destination AND trip duration together in one message.
6. Show price per day (Value starting ~$2/day + Unlimited ~$4/day for their duration). Do NOT show links yet. Ask if interested.
7. If customer says yes → provide country page URL: mobile11.com/esim/{country-slug}
8. Only recommend specific plan if customer explicitly asks "which should I pick?"
   - Heavy usage → Unlimited. Regular → Value. Only mention Lite if asked for cheapest.

## ESCALATION
When customer asks to speak with a human agent:
1. Say: "Our live representative will get back to you as soon as possible. Could you please tell me your name and phone number?"
   Thai: "เจ้าหน้าที่ของเราจะติดต่อกลับโดยเร็วที่สุดค่ะ ช่วยบอกชื่อและเบอร์โทรได้ไหมคะ"
2. Wait for name and phone number, repeat back to confirm.
3. After confirmation, say thank you and stop talking.`;

const ESCALATION_KEYWORDS = [
  "transfer you to",
  "connect you with an agent",
  "let me transfer",
  "speak to a human",
  "transfer to agent",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { action, call_id, audio_base64, conversation_id } = body;

    console.log(`[voice-live] Action: ${action}, Call ID: ${call_id}`);

    const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_CLOUD_API_KEY not configured");
    }

    switch (action) {
      case "init": {
        // Insert session row into DB
        const { error } = await supabase
          .from("voice_live_sessions")
          .upsert({
            call_id,
            conversation_id: conversation_id || null,
            conversation_history: [],
            status: "active",
            last_activity_at: new Date().toISOString(),
          }, { onConflict: "call_id" });

        if (error) {
          console.error("[voice-live] Init DB error:", error);
          throw new Error(`Failed to init session: ${error.message}`);
        }

        console.log(`[voice-live] Session initialized in DB for ${call_id}`);
        return new Response(JSON.stringify({ status: "ready" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "audio": {
        // Load session from DB
        const { data: session, error: fetchError } = await supabase
          .from("voice_live_sessions")
          .select("*")
          .eq("call_id", call_id)
          .eq("status", "active")
          .single();

        if (fetchError || !session) {
          // Auto-init if not found
          console.log(`[voice-live] Auto-init for ${call_id}`);
          await supabase.from("voice_live_sessions").upsert({
            call_id,
            conversation_id: conversation_id || null,
            conversation_history: [],
            status: "active",
            last_activity_at: new Date().toISOString(),
          }, { onConflict: "call_id" });
        }

        const history: Array<{ role: string; parts: any[] }> = session?.conversation_history || [];

        // Build Gemini request with conversation history + new audio
        const contents = [
          // System instruction as first user turn if no history
          ...(history.length === 0
            ? [{ role: "user", parts: [{ text: SYSTEM_INSTRUCTION }] }, { role: "model", parts: [{ text: "Understood. I'm ready to help customers as a Mobile11 voice assistant." }] }]
            : []),
          // Previous conversation history
          ...history.slice(-MAX_HISTORY_TURNS),
          // New user audio input
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "audio/pcm;rate=16000",
                  data: audio_base64,
                },
              },
            ],
          },
        ];

        const geminiResponse = await fetch(`${GEMINI_REST_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseModalities: ["AUDIO", "TEXT"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede",
                  },
                },
              },
            },
          }),
        });

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text();
          console.error(`[voice-live] Gemini API error ${geminiResponse.status}:`, errText);
          return new Response(JSON.stringify({ error: "AI processing failed", details: errText }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const geminiData = await geminiResponse.json();
        const candidate = geminiData.candidates?.[0];
        const responseParts = candidate?.content?.parts || [];

        // Extract audio and text from response
        let responseAudio = "";
        let transcript = "";

        for (const part of responseParts) {
          if (part.inlineData?.data) {
            responseAudio += part.inlineData.data;
          }
          if (part.text) {
            transcript += part.text;
          }
        }

        console.log(`[voice-live] Response for ${call_id}: transcript="${transcript.substring(0, 100)}", hasAudio=${!!responseAudio}`);

        // Update conversation history in DB (append user input + model response)
        const updatedHistory = [
          ...history,
          { role: "user", parts: [{ text: "[audio input]" }] },
          { role: "model", parts: [{ text: transcript || "[audio response]" }] },
        ].slice(-MAX_HISTORY_TURNS);

        await supabase
          .from("voice_live_sessions")
          .update({
            conversation_history: updatedHistory,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("call_id", call_id);

        // Log transcript to conversation messages
        const activeConversationId = session?.conversation_id || conversation_id;
        if (activeConversationId && transcript) {
          await supabase.from("conversation_messages").insert({
            conversation_id: activeConversationId,
            content: transcript,
            sender_type: "bot",
            metadata: { type: "voice_ai_live", call_id },
          });
        }

        // Check for escalation
        const shouldEscalate = ESCALATION_KEYWORDS.some((kw) =>
          transcript.toLowerCase().includes(kw.toLowerCase())
        );

        if (shouldEscalate) {
          return new Response(
            JSON.stringify({
              action: "escalate",
              audio_base64: responseAudio,
              transcript,
              reason: "AI detected escalation request",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!responseAudio && !transcript) {
          return new Response(JSON.stringify({ action: "wait" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            action: "audio",
            audio_base64: responseAudio,
            transcript,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "end": {
        await supabase
          .from("voice_live_sessions")
          .update({ status: "closed", updated_at: new Date().toISOString() })
          .eq("call_id", call_id);

        console.log(`[voice-live] Session ended for ${call_id}`);
        return new Response(JSON.stringify({ status: "closed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("[voice-live] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
