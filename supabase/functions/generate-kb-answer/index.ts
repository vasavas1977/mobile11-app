import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { suggestion_id, user_question, language = 'en' } = await req.json();

    if (!user_question) {
      throw new Error('user_question is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch existing KB articles for context
    const { data: kbArticles } = await supabase
      .from('kb_articles')
      .select('title, content, category')
      .eq('is_published', true)
      .limit(20);

    const kbContext = (kbArticles || [])
      .map(a => `[${a.category}] ${a.title}: ${a.content?.slice(0, 200)}`)
      .join('\n');

    const langInstruction = language === 'th'
      ? 'Write the answer in Thai (ภาษาไทย).'
      : language === 'ja'
      ? 'Write the answer in Japanese (日本語).'
      : 'Write the answer in English.';

    const prompt = `You are a professional customer support knowledge base writer for Mobile11, an eSIM provider.

Write a clear, helpful, and complete KB article answer for this frequently asked topic:
"${user_question}"

${langInstruction}

Guidelines:
- Be concise but thorough
- Use step-by-step format when explaining processes
- Include relevant tips or notes
- Keep a friendly, professional tone
- If it's about eSIM installation, include general steps
- If it's about pricing/packages, mention to check the website for current pricing

${kbContext ? `\nExisting KB context for reference:\n${kbContext}` : ''}

Write ONLY the article content. No title, no markdown headers at the top.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a helpful KB article writer. Write clear, actionable support articles.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedAnswer = aiData.choices?.[0]?.message?.content || '';

    if (!generatedAnswer) {
      throw new Error('AI returned empty response');
    }

    // Update the suggestion if suggestion_id provided
    if (suggestion_id) {
      const { error: updateError } = await supabase
        .from('pending_kb_suggestions')
        .update({ ai_suggested_answer: generatedAnswer })
        .eq('id', suggestion_id);

      if (updateError) {
        console.error('Failed to update suggestion:', updateError);
      }
    }

    return new Response(JSON.stringify({
      answer: generatedAnswer,
      suggestion_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('generate-kb-answer error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
