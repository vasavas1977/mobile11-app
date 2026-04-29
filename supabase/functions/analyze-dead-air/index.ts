import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SILENCE_THRESHOLD_SECONDS = 300; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { daysBack = 7, silenceThreshold = SILENCE_THRESHOLD_SECONDS } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    // 1. Get conversations from the period
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, channel, status, resolved_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200);

    if (convError) throw convError;
    if (!conversations || conversations.length === 0) {
      return new Response(JSON.stringify({ message: 'No conversations to analyze', events: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const convIds = conversations.map(c => c.id);
    const channelMap = Object.fromEntries(conversations.map(c => [c.id, c.channel]));

    // 2. Get all messages for these conversations, ordered
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('id, conversation_id, sender_type, content, created_at')
      .in('conversation_id', convIds.slice(0, 50))
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: 'No messages found', events: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Get existing dead air event message IDs to avoid duplicates
    const { data: existingEvents } = await supabase
      .from('dead_air_events')
      .select('bot_message_id')
      .gte('created_at', cutoff);

    const existingMsgIds = new Set((existingEvents || []).map(e => e.bot_message_id));

    // 4. Group messages by conversation
    const msgByConv: Record<string, typeof messages> = {};
    for (const msg of messages) {
      if (!msgByConv[msg.conversation_id]) msgByConv[msg.conversation_id] = [];
      msgByConv[msg.conversation_id].push(msg);
    }

    // 5. Detect dead air patterns
    const deadAirEvents: Array<{
      conversation_id: string;
      bot_message_id: string;
      bot_message_content: string;
      channel: string;
      silence_duration_seconds: number;
      customer_returned: boolean;
    }> = [];

    for (const [convId, convMessages] of Object.entries(msgByConv)) {
      for (let i = 0; i < convMessages.length; i++) {
        const msg = convMessages[i];
        // Only look at bot/system messages
        if (msg.sender_type !== 'bot' && msg.sender_type !== 'system') continue;
        if (existingMsgIds.has(msg.id)) continue;

        const nextMsg = convMessages[i + 1];

        if (!nextMsg) {
          // Bot message was the LAST message in conversation
          const conv = conversations.find(c => c.id === convId);
          if (conv && (conv.status === 'resolved' || conv.status === 'closed')) {
            // Customer never replied after bot's last message - abandoned
            const resolvedAt = conv.resolved_at ? new Date(conv.resolved_at).getTime() : Date.now();
            const botSentAt = new Date(msg.created_at).getTime();
            const silenceSec = Math.floor((resolvedAt - botSentAt) / 1000);
            if (silenceSec >= silenceThreshold) {
              deadAirEvents.push({
                conversation_id: convId,
                bot_message_id: msg.id,
                bot_message_content: msg.content.substring(0, 1000),
                channel: channelMap[convId] || 'web',
                silence_duration_seconds: silenceSec,
                customer_returned: false,
              });
            }
          }
        } else if (nextMsg.sender_type === 'customer') {
          // Customer replied but took a long time
          const botSentAt = new Date(msg.created_at).getTime();
          const customerRepliedAt = new Date(nextMsg.created_at).getTime();
          const silenceSec = Math.floor((customerRepliedAt - botSentAt) / 1000);
          if (silenceSec >= silenceThreshold) {
            deadAirEvents.push({
              conversation_id: convId,
              bot_message_id: msg.id,
              bot_message_content: msg.content.substring(0, 1000),
              channel: channelMap[convId] || 'web',
              silence_duration_seconds: silenceSec,
              customer_returned: true,
            });
          }
        }
      }
    }

    // 6. Insert dead air events
    let insertedCount = 0;
    if (deadAirEvents.length > 0) {
      const { error: insertError } = await supabase
        .from('dead_air_events')
        .insert(deadAirEvents);
      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        insertedCount = deadAirEvents.length;
      }
    }

    // 7. Use AI to cluster the bot messages that caused silence
    let clusters: Array<{ topic: string; count: number; sample_messages: string[] }> = [];
    if (deadAirEvents.length >= 3) {
      const botMessages = deadAirEvents.map(e => e.bot_message_content).slice(0, 50);
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `You are an analyst. Given bot messages that caused customer silence (dead air), cluster them by topic/pattern. Return JSON array: [{"topic": "short description of what the bot said that caused silence", "count": number, "sample_messages": ["msg1", "msg2"]}]. Max 10 clusters. Focus on identifying WHY these responses failed.`
            },
            {
              role: 'user',
              content: `These bot messages were followed by customer silence (5+ minutes or abandonment). Cluster them by pattern:\n\n${botMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'report_clusters',
              description: 'Report clustered dead air patterns',
              parameters: {
                type: 'object',
                properties: {
                  clusters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        topic: { type: 'string' },
                        count: { type: 'integer' },
                        sample_messages: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['topic', 'count', 'sample_messages'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['clusters'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'report_clusters' } }
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        try {
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const parsed = JSON.parse(toolCall.function.arguments);
            clusters = parsed.clusters || [];
          }
        } catch (e: any) {
          console.error('Failed to parse AI clusters:', e);
        }
      }
    }

    return new Response(JSON.stringify({
      message: 'Dead air analysis complete',
      events_detected: deadAirEvents.length,
      events_inserted: insertedCount,
      clusters,
      summary: {
        total_conversations_scanned: conversations.length,
        avg_silence_duration: deadAirEvents.length > 0
          ? Math.round(deadAirEvents.reduce((s, e) => s + e.silence_duration_seconds, 0) / deadAirEvents.length)
          : 0,
        abandoned_count: deadAirEvents.filter(e => !e.customer_returned).length,
        returned_count: deadAirEvents.filter(e => e.customer_returned).length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('analyze-dead-air error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
