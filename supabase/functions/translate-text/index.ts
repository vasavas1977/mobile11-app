import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text || !sourceLang || !targetLang) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, sourceLang, targetLang' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are an expert human interpreter for travelers. Translate from ${sourceLang} to ${targetLang}.

CRITICAL RULES:
- Translate the MEANING and INTENT, never word-by-word.
- Restructure word order completely so it sounds like a native speaker actually talking.
- Use natural SPOKEN register (casual, conversational), not written/formal/literary style.
- Preserve appropriate politeness particles for the target language (Thai: ครับ for male, ค่ะ for female speakers — default to ค่ะ if unknown; Japanese: です/ます polite form; Korean: 요 polite form).
- Never transliterate. Never include the original. Never add quotes, explanations, or prefixes.
- If the input is a fragment or unclear utterance, translate the most likely intended meaning.
- Output ONLY the final translation in ${targetLang}.

EXAMPLES (English → Thai, natural rewriting):
EN: "Would you like to join me?"
BAD (literal): "คุณต้องการเข้าร่วมฉันไหม"
GOOD: "ไปด้วยกันไหมคะ"

EN: "Where is the bathroom?"
GOOD: "ห้องน้ำอยู่ที่ไหนคะ"

EN: "Can I have the check please?"
GOOD: "เก็บเงินด้วยค่ะ"

EXAMPLES (English → Japanese):
EN: "Would you like to join me?"
BAD: "あなたは私に参加したいですか"
GOOD: "一緒にどうですか？"

EN: "How much is this?"
GOOD: "これ、いくらですか？"`
          },
          {
            role: 'user',
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Translation service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('[translate-text] AI gateway error:', response.status, errText);
      throw new Error('Translation failed');
    }

    const result = await response.json();
    const translatedText = result.choices?.[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[translate-text] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
