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
    const { daysBack = 30 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // 1. Fetch recent customer messages
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('id, content, conversation_id, created_at')
      .eq('sender_type', 'customer')
      .eq('is_internal_note', false)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(500);

    if (msgError) throw msgError;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: 'No messages to analyze', clusters: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get conversation channels
    const conversationIds = [...new Set(messages.map(m => m.conversation_id))];
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, channel')
      .in('id', conversationIds.slice(0, 100));

    const channelMap: Record<string, string> = {};
    for (const c of (conversations || [])) {
      channelMap[c.id] = c.channel;
    }

    // 3. Get ratings for these conversations
    const { data: ratings } = await supabase
      .from('conversation_ratings')
      .select('conversation_id, rating')
      .in('conversation_id', conversationIds.slice(0, 100));

    const ratingMap: Record<string, number[]> = {};
    for (const r of (ratings || [])) {
      if (!ratingMap[r.conversation_id]) ratingMap[r.conversation_id] = [];
      ratingMap[r.conversation_id].push(r.rating);
    }

    // 4. Filter to meaningful questions (>10 chars, not greetings)
    const greetingPatterns = /^(hi|hello|hey|สวัสดี|ok|yes|no|thanks|ขอบคุณ|bot|agent)\s*[!.]*$/i;
    const questions = messages
      .filter(m => m.content.length > 10 && !greetingPatterns.test(m.content.trim()))
      .map(m => ({
        text: m.content.slice(0, 200),
        conversationId: m.conversation_id,
        channel: channelMap[m.conversation_id] || 'web',
      }));

    if (questions.length < 5) {
      return new Response(JSON.stringify({ message: 'Not enough meaningful questions', clusters: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Use AI to cluster questions
    const sampleQuestions = questions.slice(0, 100).map(q => q.text);
    const clusterPrompt = `Analyze these customer support questions and group them into 5-15 topic clusters.
For each cluster, provide:
- cluster_name: A concise descriptive name (e.g., "eSIM installation issues", "Package pricing questions")
- count: How many questions belong to this cluster
- sample_questions: 2-3 example questions from this cluster

Questions:
${sampleQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Return ONLY a JSON array of clusters. Example:
[{"cluster_name": "APN Settings", "count": 12, "sample_questions": ["How do I set APN?", "What is the APN for Japan?"]}]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a data analyst. Return only valid JSON arrays. No markdown, no explanation.' },
          { role: 'user', content: clusterPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '[]';
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let clusters: Array<{ cluster_name: string; count: number; sample_questions: string[] }>;
    try {
      clusters = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI clusters:', content);
      clusters = [];
    }

    if (!Array.isArray(clusters) || clusters.length === 0) {
      return new Response(JSON.stringify({ message: 'AI returned no clusters', clusters: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Calculate avg rating per cluster (approximate by matching sample questions to conversations)
    // 7. Upsert into faq_analytics
    const channelsUsed = [...new Set(questions.map(q => q.channel))];

    for (const cluster of clusters) {
      // Calculate approximate avg rating
      const clusterConvIds = questions
        .filter(q => cluster.sample_questions.some(sq =>
          q.text.toLowerCase().includes(sq.slice(0, 20).toLowerCase())
        ))
        .map(q => q.conversationId);

      const clusterRatings: number[] = [];
      for (const cid of clusterConvIds) {
        if (ratingMap[cid]) clusterRatings.push(...ratingMap[cid]);
      }
      const avgRating = clusterRatings.length > 0
        ? Math.round((clusterRatings.reduce((a, b) => a + b, 0) / clusterRatings.length) * 100) / 100
        : null;

      // Upsert: update existing cluster or insert new one
      const { data: existing } = await supabase
        .from('faq_analytics')
        .select('id, question_count')
        .ilike('question_cluster', cluster.cluster_name)
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase.from('faq_analytics').update({
          question_count: cluster.count,
          avg_rating: avgRating,
          sample_questions: cluster.sample_questions,
          channels: channelsUsed,
          last_seen_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('faq_analytics').insert({
          question_cluster: cluster.cluster_name,
          question_count: cluster.count,
          avg_rating: avgRating,
          sample_questions: cluster.sample_questions,
          channels: channelsUsed,
          last_seen_at: new Date().toISOString(),
          auto_suggested: false,
        });
      }

      // 8. Auto-suggest KB article for frequent low-rated clusters
      if (cluster.count >= 5 && (!avgRating || avgRating < 3.0)) {
        const { data: existingSuggestion } = await supabase
          .from('pending_kb_suggestions')
          .select('id')
          .ilike('user_question', `%${cluster.cluster_name}%`)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();

        if (!existingSuggestion) {
          // Generate a real AI answer for the KB suggestion
          let aiAnswer = `Frequently asked topic (${cluster.count} occurrences). Sample questions: ${cluster.sample_questions.join('; ')}`;
          try {
            const answerPrompt = `You are a professional customer support KB writer for Mobile11 (eSIM provider). Write a clear, helpful answer for this frequently asked topic: "${cluster.cluster_name}". Sample customer questions: ${cluster.sample_questions.join('; ')}. Write in English. Be concise but thorough. Use step-by-step format when explaining processes.`;
            const answerResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [
                  { role: 'system', content: 'You are a helpful KB article writer. Write clear, actionable support content. No markdown headers.' },
                  { role: 'user', content: answerPrompt },
                ],
                temperature: 0.4,
              }),
            });
            if (answerResp.ok) {
              const answerData = await answerResp.json();
              const generated = answerData.choices?.[0]?.message?.content;
              if (generated) aiAnswer = generated;
            }
          } catch (aiErr) {
            console.error('Failed to generate AI answer for cluster, using fallback:', aiErr);
          }

          await supabase.from('pending_kb_suggestions').insert({
            user_question: cluster.cluster_name,
            ai_suggested_answer: aiAnswer,
            ai_confidence: 0.75,
            language: 'en',
            status: 'pending',
          });

          // Mark as auto-suggested
          await supabase.from('faq_analytics')
            .update({ auto_suggested: true })
            .ilike('question_cluster', cluster.cluster_name);

          console.log(`Auto-suggested KB article for: ${cluster.cluster_name}`);
        }
      }
    }

    return new Response(JSON.stringify({
      message: 'Analysis complete',
      clusters: clusters.length,
      questionsAnalyzed: questions.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('analyze-faq-trends error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
