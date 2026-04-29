import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Gender = 'male' | 'female';

/**
 * Gender-aware TTS voice selection.
 * Gemini Live preset voices (approximate gender):
 *   Masculine: Puck, Charon, Fenrir, Orus
 *   Feminine:  Aoede, Kore, Leda, Zephyr
 */
function getVoiceForLangAndGender(langCode: string, gender: Gender): string {
  const code = langCode.split('-')[0].toLowerCase();
  // CJK
  if (['ja', 'ko', 'zh'].includes(code)) {
    return gender === 'male' ? 'Charon' : 'Kore';
  }
  // SEA — Thai/Vietnamese/Indo/Malay/Filipino
  if (['th', 'vi', 'id', 'ms', 'fil'].includes(code)) {
    return gender === 'male' ? 'Puck' : 'Aoede';
  }
  // Semitic / South Asian / Turkic
  if (['ar', 'he', 'tr', 'hi'].includes(code)) {
    return gender === 'male' ? 'Orus' : 'Leda';
  }
  // Default (Latin-script)
  return gender === 'male' ? 'Fenrir' : 'Aoede';
}

function getLanguageHints(sourceCode: string, targetCode: string, bidirectional: boolean): string[] {
  const normalize = (c: string) => {
    const prefix = c.split('-')[0].toLowerCase();
    const map: Record<string, string> = {
      th: 'th-TH', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR',
      zh: 'zh-CN', fr: 'fr-FR', de: 'de-DE', es: 'es-ES',
      pt: 'pt-BR', ar: 'ar-SA', id: 'id-ID', ms: 'ms-MY',
      ru: 'ru-RU', it: 'it-IT', nl: 'nl-NL', vi: 'vi-VN',
      tr: 'tr-TR', pl: 'pl-PL', hi: 'hi-IN', he: 'he-IL',
    };
    return map[prefix] || c;
  };

  if (bidirectional) {
    return [normalize(sourceCode), normalize(targetCode)];
  }
  return [normalize(sourceCode)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Voice service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const sourceLang = body.sourceLang;
    const targetLang = body.targetLang;
    const sourceCode = body.sourceCode || '';
    const targetCode = body.targetCode || '';
    const outputMode = body.outputMode || 'voice';
    // Default bidirectional: lets either side speak; prompt + script gating prevent drift
    const bidirectional = body.bidirectional ?? true;
    const sourceGender: Gender = body.sourceGender === 'male' ? 'male' : 'female';
    const targetGender: Gender = body.targetGender === 'male' ? 'male' : 'female';
    const summary = body.summary || '';

    if (!sourceLang || !targetLang) {
      return new Response(
        JSON.stringify({ error: "sourceLang and targetLang are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isTextOnly = outputMode === 'text-only';
    // In bidirectional mode the target voice depends on which side spoke; we still
    // pick one TTS voice — use targetGender (fallback to female) since most interactions
    // go source→target.
    const voiceName = getVoiceForLangAndGender(targetCode || targetLang, targetGender);

    const srcHint = sourceCode ? ` (${sourceCode})` : '';
    const tgtHint = targetCode ? ` (${targetCode})` : '';

    const srcPrefix = sourceCode.split('-')[0].toLowerCase();
    const tgtPrefix = targetCode.split('-')[0].toLowerCase();
    const hasThai = srcPrefix === 'th' || tgtPrefix === 'th';
    const hasJapanese = srcPrefix === 'ja' || tgtPrefix === 'ja';
    const hasKorean = srcPrefix === 'ko' || tgtPrefix === 'ko';
    const hasFrench = srcPrefix === 'fr' || tgtPrefix === 'fr';
    const hasGerman = srcPrefix === 'de' || tgtPrefix === 'de';
    const hasChinese = srcPrefix === 'zh' || tgtPrefix === 'zh';
    const isThaiEnglish = (srcPrefix === 'th' && tgtPrefix === 'en') || (srcPrefix === 'en' && tgtPrefix === 'th');

    let sttGuidance = '';
    if (isThaiEnglish) {
      sttGuidance = `
Note: Thai speakers commonly mix English words/phrases into Thai speech (code-switching). 
Transcribe English loanwords as English, not phonetic Thai. 
Common mixed terms: WiFi, SIM, eSIM, data, roaming, top-up, package, GB, unlimited.`;
    }

    // --- Gender-locked register rules ---
    // In uni-directional mode the speaker on the target side is identified by targetGender.
    // In bidirectional mode either side might speak — lock both sides to their declared gender.
    let registerRules = '';
    if (hasThai) {
      const thaiTargetIsMale = (tgtPrefix === 'th' ? targetGender : sourceGender) === 'male';
      const particleRule = thaiTargetIsMale
        ? `- ALWAYS end statements with the masculine particle ครับ. NEVER use ค่ะ, คะ, จ้ะ, จ้า, or any feminine particle. The speaker is MALE.`
        : `- ALWAYS end statements with the feminine particle ค่ะ (statements) or คะ (questions). NEVER use ครับ. The speaker is FEMALE.`;
      registerRules += `
THAI REGISTER RULES (when translating into Thai):
- Pronoun for "I": ${thaiTargetIsMale ? 'ผม' : 'ฉัน'} only. NEVER กู, หนู, or เรา unless quoting someone.
- Pronoun for "you": คุณ. NEVER มึง.
${particleRule}
- Tone: natural, friendly spoken Thai — like texting a polite friend. Not robotic, not academic.
`;
    }
    if (hasJapanese) {
      const jaTargetIsMale = (tgtPrefix === 'ja' ? targetGender : sourceGender) === 'male';
      registerRules += `
JAPANESE REGISTER RULES (when translating into Japanese):
- Use polite です/ます form. Avoid casual だ/じゃん unless source is very informal.
- Use ${jaTargetIsMale ? '僕 (boku)' : '私 (watashi)'} for "I". ${jaTargetIsMale ? 'NEVER use あたし or feminine sentence-final わ/かしら.' : 'NEVER use 俺 (ore) or masculine ぞ/ぜ.'}
`;
    }
    if (hasKorean) {
      registerRules += `
KOREAN REGISTER RULES (when translating into Korean):
- Use formal 합니다체 (hapnida-che) by default.
- Use 저 (jeo) for "I", not 나 (na), unless source is very casual.
`;
    }
    if (hasFrench) {
      registerRules += `
FRENCH REGISTER RULES (when translating into French):
- Use formal "vous" form by default. Only use "tu" if source is clearly intimate/casual.
`;
    }
    if (hasGerman) {
      registerRules += `
GERMAN REGISTER RULES (when translating into German):
- Use formal "Sie" form by default. Only use "du" if source is clearly intimate/casual.
`;
    }
    if (hasChinese) {
      registerRules += `
CHINESE REGISTER RULES (when translating into Chinese):
- Use polite Simplified Chinese (简体中文). Warm and professional tone.
- Use 我 for "I", 您 for "you" in formal contexts, 你 in casual contexts.
`;
    }

    const accuracyGuard = `
STRICT TRANSLATOR RULES — follow exactly:
- Translate ONLY between ${sourceLang}${srcHint} and ${targetLang}${tgtHint}. Never any other language.
- If the audio is silent, unclear, an echo of your own voice, a tiny fragment, or in any language other than the two above → output NOTHING. Stay completely silent.
- Never initiate a turn. Never ask for clarification. Never ask "could you repeat". Never greet. Never explain. Never continue or elaborate.
- One user utterance in → one translation out → stop.
- Translate only what was said. Never add, remove, or invent content.
- Match the formality of the source.`;

    let systemInstruction: string;

    if (bidirectional) {
      systemInstruction = `You are a real-time spoken conversation translator between ${sourceLang}${srcHint} and ${targetLang}${tgtHint}.

Auto-detect which of the two languages the user is speaking.
If they speak ${sourceLang}, translate to ${targetLang}.
If they speak ${targetLang}, translate to ${sourceLang}.
If they speak ANY OTHER language, output NOTHING.
${sttGuidance}
Output ONLY the translation. Never echo the original. Never label, greet, or comment.
${registerRules}${accuracyGuard}`;
    } else if (isTextOnly) {
      systemInstruction = `You are a real-time spoken conversation translator. User speaks ${sourceLang}${srcHint}. Respond ONLY in ${targetLang}${tgtHint}.
Before translating, say exactly: [SRC] followed by a clean transcription of what the user said in ${sourceLang}.
Then translate immediately into ${targetLang}.
If the user speaks any other language, output NOTHING.
${sttGuidance}
${registerRules}${accuracyGuard}`;
    } else {
      systemInstruction = `You are a real-time spoken conversation translator. User speaks ${sourceLang}${srcHint}. Respond ONLY in ${targetLang}${tgtHint}.
Translate everything the user says into ${targetLang}. Output ONLY the translation — never echo or repeat the original ${sourceLang} text.
If the user speaks any other language (including ${targetLang} itself), output NOTHING. Do not translate ${targetLang} → ${sourceLang} in this session.
${sttGuidance}
${registerRules}${accuracyGuard}`;
    }

    if (summary) {
      systemInstruction += `\n\nConversation context so far:\n${summary}`;
    }

    const mode = isTextOnly ? 'text_only' : 'voice_text';
    const model = "models/gemini-3.1-flash-live-preview";
    const apiVersion = 'v1beta';
    const responseModalities = ["AUDIO"];
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    const generationConfig: Record<string, unknown> = {
      responseModalities,
      temperature: 0,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
    };

    if (!isTextOnly) {
      generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      };
    }

    const languageHints = getLanguageHints(sourceCode, targetCode, bidirectional);

    console.log('[translate-voice-token] Config:', {
      mode,
      bidirectional,
      apiVersion,
      voiceName: isTextOnly ? 'none' : voiceName,
      sourceCode,
      targetCode,
      sourceGender,
      targetGender,
      languageHints,
      model,
    });

    const setupPayload: Record<string, unknown> = {
      model,
      generationConfig,
      inputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
          endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
          prefixPaddingMs: 200,
          silenceDurationMs: 1000,
        },
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    };

    setupPayload.outputAudioTranscription = {};

    return new Response(
      JSON.stringify({ wsUrl, setupMessage: { setup: setupPayload } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("translate-voice-token error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
