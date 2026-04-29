import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'conversationId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://mobile11.com';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if summary already sent
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, contacts(name, email, line_display_name, facebook_display_name)')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const metadata = conversation.metadata as Record<string, any> || {};
    if (metadata.helper_summary_sent) {
      console.log('Helper summary already sent for conversation', conversationId);
      return new Response(JSON.stringify({ status: 'already_sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch last 20 messages
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('content, sender_type, created_at, is_internal_note')
      .eq('conversation_id', conversationId)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: false })
      .limit(20);

    const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts;
    const customerName = contact?.name || contact?.line_display_name || contact?.facebook_display_name || contact?.email || 'Unknown';

    // Build conversation transcript
    const transcript = (messages || [])
      .reverse()
      .map((m: any) => `[${m.sender_type}]: ${m.content}`)
      .join('\n');

    // Detect if conversation is in Thai
    const thaiRegex = /[\u0E00-\u0E7F]/;
    const customerMessages = (messages || []).filter((m: any) => m.sender_type === 'customer');
    const thaiMessageCount = customerMessages.filter((m: any) => thaiRegex.test(m.content)).length;
    const isThai = customerMessages.length > 0 && (thaiMessageCount / customerMessages.length) > 0.3;

    const conversationLink = `${frontendUrl}/agent/conversation/${conversationId}`;

    // Call AI for summary
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      // Fallback: post a basic summary without AI
      const basicSummary = `🔔 Escalation Alert\n\nCustomer: ${customerName}\nChannel: ${conversation.channel}\nPriority: High\n\nThis conversation has been escalated to a human agent. Please review the conversation history.\n\n👉 View conversation: ${conversationLink}`;

      await supabase.from('conversation_messages').insert({
        conversation_id: conversationId,
        content: basicSummary,
        sender_type: 'system',
        is_internal_note: true,
        metadata: { helper_summary: true }
      });

      const { data: freshBasic } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      await supabase.from('conversations').update({
        metadata: { ...((freshBasic?.metadata as Record<string, any>) || {}), helper_summary_sent: true }
      }).eq('id', conversationId);

      return new Response(JSON.stringify({ status: 'basic_summary_sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = isThai
      ? `You are an internal Agent Helper Bot. Your job is to summarize escalated customer conversations for human agents. Be concise and actionable.

IMPORTANT: Write the entire summary in Thai language.

Output format (use this exact structure):
---
🔔 สรุปสำหรับเจ้าหน้าที่

ลูกค้า: [name]
ช่องทาง: [channel]
ภาษา: [detected language]
อารมณ์: [customer sentiment]

ปัญหา: [1-2 sentence summary of what the customer needs]

รายละเอียดสำคัญ:
- [important detail 1]
- [important detail 2]
- [important detail 3]

บอทได้ดำเนินการ: [brief summary of what the AI bot attempted]

แนะนำให้ดำเนินการ: [what the agent should do next]
---

Keep it brief. Focus on what the agent needs to know to help quickly.`
      : `You are an internal Agent Helper Bot. Your job is to summarize escalated customer conversations for human agents. Be concise and actionable.

Output format (use this exact structure):
---
🔔 Agent Helper Summary

Customer: [name]
Channel: [channel]
Language: [detected language]
Mood: [customer sentiment]

Issue: [1-2 sentence summary of what the customer needs]

Key Details:
- [important detail 1]
- [important detail 2]
- [important detail 3]

What the Bot Tried: [brief summary of what the AI bot attempted]

Suggested Action: [what the agent should do next]
---

Keep it brief. Focus on what the agent needs to know to help quickly.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Summarize this escalated conversation for the agent.\n\nCustomer: ${customerName}\nChannel: ${conversation.channel}\n\nTranscript:\n${transcript}` }
        ],
        stream: false,
      }),
    });

    let summaryText: string;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      summaryText = aiData.choices?.[0]?.message?.content || 'Unable to generate summary.';
    } else {
      console.error('AI gateway error:', aiResponse.status, await aiResponse.text());
      summaryText = `🔔 Escalation Alert\n\nCustomer: ${customerName}\nChannel: ${conversation.channel}\nPriority: High\n\nThis conversation has been escalated. Please review the history.`;
    }

    // Append the conversation link
    summaryText += `\n\n👉 View conversation: ${conversationLink}`;

    // Insert as internal note
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      content: summaryText,
      sender_type: 'system',
      is_internal_note: true,
      metadata: { helper_summary: true }
    });

    // Mark as sent - re-fetch metadata to avoid overwriting ai_paused or other flags
    const { data: freshConv } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    await supabase.from('conversations').update({
      metadata: { ...((freshConv?.metadata as Record<string, any>) || {}), helper_summary_sent: true }
    }).eq('id', conversationId);

    // Send visible escalation notice to Facebook so it appears in Business Suite
    if (conversation.channel === 'facebook') {
      const fbMetadata = (conversation.metadata as Record<string, any>) || {};
      const psid = fbMetadata.psid || contact?.facebook_id;
      const pageId = fbMetadata.page_id;

      if (psid) {
        // Get page access token from channel_connections or env fallback
        let pageAccessToken = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') || '';
        if (pageId) {
          try {
            const { data: connection } = await supabase
              .from('channel_connections')
              .select('access_token')
              .eq('channel_type', 'facebook')
              .eq('external_id', pageId)
              .eq('status', 'active')
              .single();
            if (connection?.access_token) {
              pageAccessToken = connection.access_token;
            }
          } catch (e: any) {
            console.error('Failed to fetch page token, using fallback:', e);
          }
        }

        if (pageAccessToken) {
          const escalationNotice = isThai
            ? 'การสนทนาของคุณถูกส่งต่อให้เจ้าหน้าที่แล้ว เจ้าหน้าที่จะติดต่อกลับในเร็วๆ นี้ ขอบคุณที่รอนะคะ 🙏'
            : 'Your conversation has been transferred to a human agent. An agent will assist you shortly. Thank you for your patience. 🙏';

          try {
            const fbRes = await fetch(
              `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: psid },
                  message: { text: escalationNotice },
                  messaging_type: 'RESPONSE'
                })
              }
            );

            if (fbRes.ok) {
              console.log('Escalation notice sent to Facebook for conversation', conversationId);
              // Save to DB so it appears in custom portal too
              await supabase.from('conversation_messages').insert({
                conversation_id: conversationId,
                content: escalationNotice,
                sender_type: 'bot',
                is_internal_note: false,
                metadata: { escalation_notice: true, channel: 'facebook' }
              });
            } else {
              const errData = await fbRes.text();
              console.error('Facebook Send API error for escalation notice:', fbRes.status, errData);
            }
          } catch (fbError) {
            console.error('Failed to send escalation notice to Facebook:', fbError);
          }
        }
      }
    }

    console.log('Helper summary posted for conversation', conversationId);

    return new Response(JSON.stringify({ status: 'summary_sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('agent-helper-summary error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
