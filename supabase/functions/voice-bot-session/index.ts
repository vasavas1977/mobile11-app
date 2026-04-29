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
    const { call_id, audio_base64, conversation_id } = await req.json();

    if (!audio_base64) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Speech-to-Text
    const transcript = await speechToText(audio_base64);
    if (!transcript) {
      return new Response(
        JSON.stringify({ action: "silence", message: "Could not understand audio" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[voice-bot-session] Transcript: "${transcript}"`);

    // Log user message in conversation
    if (conversation_id) {
      await supabase.from("conversation_messages").insert({
        conversation_id,
        content: transcript,
        sender_type: "customer",
        metadata: { type: "voice_transcript", call_id },
      });
    }

    // Step 2: Check for escalation keywords
    const escalationKeywords = ["agent", "human", "operator", "representative", "person", "help me", "transfer"];
    const lowerTranscript = transcript.toLowerCase();
    if (escalationKeywords.some((kw) => lowerTranscript.includes(kw))) {
      return new Response(
        JSON.stringify({ action: "escalate", reason: "Customer requested human agent", transcript }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Search KB articles for a quick answer
    const { data: kbArticles } = await supabase
      .from("kb_articles")
      .select("title, content")
      .eq("is_published", true)
      .eq("is_internal", false)
      .textSearch("content", transcript.split(" ").slice(0, 5).join(" & "), { type: "websearch" })
      .limit(3);

    // Step 4: Generate response via Lovable AI (Gemini)
    const kbContext = kbArticles?.length
      ? `\n\nRelevant knowledge base articles:\n${kbArticles.map((a) => `- ${a.title}: ${a.content.substring(0, 500)}`).join("\n")}`
      : "";

    const aiResponse = await generateAIResponse(transcript, kbContext);

    // Log bot response
    if (conversation_id) {
      await supabase.from("conversation_messages").insert({
        conversation_id,
        content: aiResponse,
        sender_type: "bot",
        metadata: { type: "voice_ai_response", call_id },
      });
    }

    // Update call log with transcript
    await supabase
      .from("voice_call_logs")
      .update({
        ai_responses: undefined as any, // We'll append via metadata
        metadata: { last_transcript: transcript, last_response: aiResponse },
      })
      .eq("call_id", call_id);

    // Step 5: Text-to-Speech
    const { data: config } = await supabase
      .from("voice_bot_config")
      .select("greeting_language, voice_name")
      .limit(1)
      .single();

    const responseAudio = await textToSpeech(
      aiResponse,
      config?.greeting_language || "en-US",
      config?.voice_name || "en-US-Neural2-F"
    );

    return new Response(
      JSON.stringify({
        action: "respond",
        transcript,
        response_text: aiResponse,
        audio_base64: responseAudio,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[voice-bot-session] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function speechToText(audioBase64: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_CLOUD_API_KEY not configured");

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 8000,
          languageCode: "en-US",
          alternativeLanguageCodes: ["th-TH", "zh-CN", "ja-JP"],
          enableAutomaticPunctuation: true,
        },
        audio: { content: audioBase64 },
      }),
    }
  );

  if (!response.ok) {
    console.error("STT error:", await response.text());
    return "";
  }

  const data = await response.json();
  return data.results?.[0]?.alternatives?.[0]?.transcript || "";
}

async function generateAIResponse(userMessage: string, kbContext: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt = `You are a helpful voice assistant for Mobile11, an eSIM provider. 
You help customers with:
- eSIM package information and recommendations
- Installation and setup guidance
- Troubleshooting connectivity issues
- Order status inquiries
- General questions about eSIM technology

Keep responses concise (2-3 sentences max) since they will be spoken aloud.
Be friendly and professional. If you cannot help, suggest transferring to a human agent.
${kbContext}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error:", response.status, await response.text());
    return "I'm sorry, I'm having trouble processing your request. Would you like me to transfer you to a human agent?";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, could you please repeat that?";
}

async function textToSpeech(text: string, languageCode: string, voiceName: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_CLOUD_API_KEY not configured");

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
}
