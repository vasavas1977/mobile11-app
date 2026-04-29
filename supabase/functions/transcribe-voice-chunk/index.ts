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
    const { audio_base64, language } = await req.json();

    if (!audio_base64) {
      return new Response(JSON.stringify({ text: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_CLOUD_API_KEY not configured');
    }

    // Determine language code
    const langMap: Record<string, string> = {
      th: 'th-TH', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR',
      fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN', es: 'es-ES',
      pt: 'pt-BR', ar: 'ar-SA',
    };
    const languageCode = langMap[language] || 'en-US';

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode,
            alternativeLanguageCodes: languageCode !== 'en-US' ? ['en-US'] : ['th-TH'],
            model: 'latest_short',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audio_base64,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[transcribe-voice-chunk] Google STT error:', response.status, errText);
      return new Response(JSON.stringify({ text: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const transcript = result.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ') || '';

    return new Response(JSON.stringify({ text: transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[transcribe-voice-chunk] Error:', err);
    return new Response(JSON.stringify({ text: '', error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
