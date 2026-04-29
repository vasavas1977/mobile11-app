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

  try {
    const body = await req.json();
    const { event, call_id, caller_number, did_number, audio_base64 } = body;

    console.log(`[voice-webhook] Event: ${event}, Call ID: ${call_id}`);

    // Get voice bot config
    const { data: config } = await supabase
      .from("voice_bot_config")
      .select("*")
      .limit(1)
      .single();

    if (!config?.is_enabled) {
      return new Response(JSON.stringify({ action: "reject", reason: "Voice bot disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (event) {
      case "call.started": {
        // Create a contact for the caller
        const { data: contact } = await supabase
          .from("contacts")
          .upsert({ phone: caller_number, name: caller_number }, { onConflict: "phone" })
          .select()
          .single();

        // Create conversation
        const { data: conversation } = await supabase
          .from("conversations")
          .insert({
            channel: "voice",
            contact_id: contact?.id,
            status: "open",
            subject: `Voice call from ${caller_number}`,
            metadata: { call_id, did_number, caller_number },
          })
          .select()
          .single();

        // Log the call
        await supabase.from("voice_call_logs").insert({
          call_id,
          caller_number,
          did_number,
          conversation_id: conversation?.id,
          status: "in_progress",
        });

        // For ai_live mode, initialize Gemini Live session
        if (config.mode === "ai_live") {
          const liveSessionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-live-session`;
          try {
            await fetch(liveSessionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                action: "init",
                call_id,
                conversation_id: conversation?.id,
              }),
            });
            console.log(`[voice-webhook] Gemini Live session initialized for ${call_id}`);
          } catch (err: any) {
            console.error(`[voice-webhook] Failed to init live session:`, err);
          }

          // No separate greeting TTS needed — Gemini will handle the first turn
          // But we can still send a greeting by providing initial text
          return new Response(
            JSON.stringify({
              action: "answer",
              call_id,
              conversation_id: conversation?.id,
              audio_base64: "", // Gemini handles audio
              mode: "ai_live",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Standard mode: Generate greeting audio via Google TTS
        const greetingAudio = await generateTTS(
          config.greeting_message,
          config.greeting_language,
          config.voice_name
        );

        // Log greeting as a conversation message
        if (conversation?.id) {
          await supabase.from("conversation_messages").insert({
            conversation_id: conversation.id,
            content: config.greeting_message,
            sender_type: "bot",
            metadata: { type: "voice_greeting" },
          });
        }

        return new Response(
          JSON.stringify({
            action: "answer",
            call_id,
            conversation_id: conversation?.id,
            audio_base64: greetingAudio,
            mode: config.mode,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "call.audio": {
        // Route based on mode
        const isLiveMode = config.mode === "ai_live";
        const sessionUrl = isLiveMode
          ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-live-session`
          : `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-bot-session`;

        const sessionBody = isLiveMode
          ? { action: "audio", call_id, audio_base64, conversation_id: body.conversation_id }
          : { call_id, audio_base64, conversation_id: body.conversation_id };

        const sessionResponse = await fetch(sessionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify(sessionBody),
        });

        const sessionData = await sessionResponse.json();
        return new Response(JSON.stringify(sessionData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "call.escalate": {
        // Update call log
        await supabase
          .from("voice_call_logs")
          .update({
            status: "escalated",
            escalation_reason: body.reason || "Customer requested agent",
          })
          .eq("call_id", call_id);

        // Generate escalation audio
        const escalationAudio = await generateTTS(
          config.escalation_message,
          config.greeting_language,
          config.voice_name
        );

        return new Response(
          JSON.stringify({
            action: "transfer",
            audio_base64: escalationAudio,
            message: config.escalation_message,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "call.ended": {
        const duration = body.duration_seconds || 0;

        // Tear down Gemini Live session if active
        if (config.mode === "ai_live") {
          try {
            const liveSessionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-live-session`;
            await fetch(liveSessionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({ action: "end", call_id }),
            });
          } catch (err: any) {
            console.error(`[voice-webhook] Failed to end live session:`, err);
          }
        }

        await supabase
          .from("voice_call_logs")
          .update({
            status: "completed",
            duration_seconds: duration,
            ended_at: new Date().toISOString(),
            transcript: body.transcript || null,
          })
          .eq("call_id", call_id);

        // Close conversation if it exists
        if (body.conversation_id) {
          await supabase
            .from("conversations")
            .update({ status: "resolved", resolved_at: new Date().toISOString() })
            .eq("id", body.conversation_id);
        }

        return new Response(JSON.stringify({ action: "ok" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown event" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("[voice-webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateTTS(
  text: string,
  languageCode: string,
  voiceName: string
): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
  if (!apiKey) {
    console.error("GOOGLE_CLOUD_API_KEY not set");
    return "";
  }

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode, name: voiceName },
          audioConfig: {
            audioEncoding: "LINEAR16",
            sampleRateHertz: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("TTS error:", await response.text());
      return "";
    }

    const data = await response.json();
    return data.audioContent || "";
  } catch (err: any) {
    console.error("TTS fetch error:", err);
    return "";
  }
}
