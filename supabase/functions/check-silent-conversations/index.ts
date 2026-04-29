import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SILENCE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FOLLOW_UPS = 3;

// Follow-up messages with varied phrasing (bilingual)
const FOLLOW_UP_MESSAGES = {
  th: [
    "พี่คะ มีอะไรให้น้องช่วยเพิ่มเติมไหมคะ? 😊",
    "สวัสดีค่ะพี่ น้องยังอยู่ค่ะ ถ้ามีคำถามเพิ่มเติมบอกน้องได้เลยนะคะ 💬",
    "พี่คะ ถ้าไม่มีคำถามเพิ่มเติม น้องจะปิดการสนทนานี้ไว้ก่อนนะคะ แต่ถ้าพี่ต้องการสอบถามเรื่องใดอีก กลับมาคุยกับน้องได้ตลอดเลยค่ะ! 😊🙏"
  ],
  en: [
    "Hi! Is there anything else I can help with? 😊",
    "I'm still here! Feel free to ask if you have any questions 💬",
    "If there are no other questions, I'll close this conversation for now. But please don't hesitate to come back anytime you need help! 😊🙏"
  ]
};

function customerAlreadyDone(messages: any[]): boolean {
  const doneEN = /\b(no thanks|nothing else|that'?s all|i'?m (good|done)|all good|no more|not right now)\b/i;
  const doneTH = /(ไม่มีแล้ว|ไม่ต้อง|พอแล้ว|เท่านี้|จะสั่ง|ได้เลย|โอเคค่ะ|โอเคครับ|เดี๋ยวค่อย|ไม่มีอะไร|เรียบร้อย|ถามอีกที|ปิดเลย|ปิดได้เลย|ปิดได้|ปิดเลยครับ|ปิดเลยค่ะ|ปิดครับ|ปิดค่ะ)/i;
  
  const customerMsgs = messages
    .filter((m: any) => m.sender_type === 'customer')
    .slice(-5);
  
  return customerMsgs.some((m: any) => doneEN.test(m.content || '') || doneTH.test(m.content || ''));
}

async function detectConversationLanguage(
  supabase: any,
  conversationId: string
): Promise<'th' | 'en'> {
  const { data: recentMessages } = await supabase
    .from('conversation_messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'customer')
    .order('created_at', { ascending: false })
    .limit(5);

  const hasThaiChars = recentMessages?.some(
    (m: any) => m.content?.match(/[\u0E00-\u0E7F]/)
  );
  if (hasThaiChars) return 'th';

  const hasFullEnglish = recentMessages?.some(
    (m: any) => {
      const words = (m.content || '').trim().split(/\s+/).filter((w: string) => /^[a-zA-Z]{2,}/.test(w));
      return words.length >= 3;
    }
  );
  return hasFullEnglish ? 'en' : 'th';
}

async function sendLineMessage(lineUserId: string, message: string, accessToken: string) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }]
    })
  });
  if (!response.ok) {
    const err = await response.text();
    console.error(`LINE push failed: ${response.status} ${err}`);
  }
  return response.ok;
}

async function sendFacebookMessage(psid: string, message: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text: message },
        messaging_type: 'UPDATE'
      })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    console.error(`Facebook send failed: ${response.status} ${err}`);
  }
  return response.ok;
}

async function sendWhatsAppMessage(phone: string, message: string, phoneNumberId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    console.error(`WhatsApp send failed: ${response.status} ${err}`);
  }
  return response.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || '';
    const FB_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') || '';
    const WA_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
    const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';

    const now = new Date();
    const silenceThreshold = new Date(now.getTime() - SILENCE_THRESHOLD_MS).toISOString();

    // Find open/pending conversations where bot is not paused and not awaiting rating
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, channel, metadata, contact_id, status')
      .in('status', ['open', 'pending'])
      .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(500);

    if (convError) {
      throw new Error(`Error fetching conversations: ${convError.message}`);
    }

    let processed = 0;
    let followUpsSent = 0;
    let closed = 0;

    for (const conv of conversations || []) {
      const metadata = (conv.metadata || {}) as Record<string, any>;

      // Skip if AI is paused (agent is handling), awaiting rating, or agent assigned
      if (metadata.ai_paused || metadata.awaiting_rating || metadata.intent_pending || metadata.welcome_back_pending) {
        continue;
      }

      const followUpCount = metadata.follow_up_count || 0;
      
      // Use 1 follow-up max for incompatible device conversations
      const effectiveMaxFollowUps = metadata.device_incompatible ? 1 : MAX_FOLLOW_UPS;

      // Already maxed out follow-ups (shouldn't happen normally but guard)
      if (followUpCount >= effectiveMaxFollowUps) {
        continue;
      }

      // Get the last 5 messages for context
      const { data: recentMsgs } = await supabase
        .from('conversation_messages')
        .select('sender_type, created_at, content, metadata')
        .eq('conversation_id', conv.id)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentMsgs || recentMsgs.length === 0) continue;
      const lastMsg = recentMsgs[0];

      // Only act if the last message was from the bot
      if (lastMsg.sender_type !== 'bot') continue;

      // Check if the last message is old enough (3 min since last bot message)
      const lastMsgTime = new Date(lastMsg.created_at).getTime();
      const silenceMs = now.getTime() - lastMsgTime;

      if (silenceMs < SILENCE_THRESHOLD_MS) continue;

      // Skip if the last message was itself a follow-up sent less than 3 min ago
      const lastMsgMeta = (lastMsg.metadata || {}) as Record<string, any>;
      if (lastMsgMeta.dead_air_follow_up && silenceMs < SILENCE_THRESHOLD_MS) continue;

      processed++;

      // If customer already said they're done, skip follow-ups → auto-close directly
      if (customerAlreadyDone(recentMsgs)) {
        await supabase.from('conversations').update({
          status: 'resolved',
          resolved_at: now.toISOString(),
          metadata: { ...metadata, closed_by: 'customer_confirmed_done' },
          updated_at: now.toISOString()
        }).eq('id', conv.id);
        closed++;
        console.log(`[dead-air] Auto-closed conv ${conv.id} — customer already confirmed done`);
        continue;
      }

      // Determine language
      const lang = await detectConversationLanguage(supabase, conv.id);
      const messageIndex = Math.min(followUpCount, MAX_FOLLOW_UPS - 1);
      const followUpMessage = FOLLOW_UP_MESSAGES[lang][messageIndex];
      const isLastFollowUp = followUpCount >= effectiveMaxFollowUps - 1;

      console.log(`[dead-air] Conv ${conv.id} (${conv.channel}): follow_up #${followUpCount + 1}, lang=${lang}`);

      // Send the message via the appropriate channel
      let sent = false;

      if (conv.channel === 'line') {
        const lineUserId = metadata.line_user_id;
        if (lineUserId && LINE_ACCESS_TOKEN) {
          sent = await sendLineMessage(lineUserId, followUpMessage, LINE_ACCESS_TOKEN);
        }
      } else if (conv.channel === 'facebook') {
        const psid = metadata.psid;
        // Try page-specific token from DB first
        let pageToken = FB_ACCESS_TOKEN;
        if (metadata.page_id) {
          const { data: conn } = await supabase
            .from('channel_connections')
            .select('access_token')
            .eq('channel_type', 'facebook')
            .eq('external_id', metadata.page_id)
            .eq('status', 'active')
            .single();
          if (conn?.access_token) pageToken = conn.access_token;
        }
        if (psid && pageToken) {
          sent = await sendFacebookMessage(psid, followUpMessage, pageToken);
        }
      } else if (conv.channel === 'whatsapp') {
        const phone = metadata.whatsapp_phone;
        if (phone && WA_ACCESS_TOKEN && WA_PHONE_ID) {
          sent = await sendWhatsAppMessage(phone, followUpMessage, WA_PHONE_ID, WA_ACCESS_TOKEN);
        }
      } else if (conv.channel === 'web') {
        // For web, just insert the message — realtime subscription picks it up
        sent = true;
      }

      if (!sent && conv.channel !== 'web') {
        console.error(`[dead-air] Failed to send follow-up for conv ${conv.id} on ${conv.channel}`);
        continue;
      }

      // Save the follow-up message to DB
      await supabase.from('conversation_messages').insert({
        conversation_id: conv.id,
        sender_type: 'bot',
        content: followUpMessage,
        is_internal_note: false,
        metadata: {
          dead_air_follow_up: true,
          follow_up_number: followUpCount + 1,
          channel: conv.channel,
          ai_auto_response: true
        }
      });

      // Update conversation metadata with incremented follow_up_count
      const newMetadata = {
        ...metadata,
        follow_up_count: followUpCount + 1,
        last_follow_up_at: now.toISOString()
      };

      if (isLastFollowUp) {
        // Close the conversation after the 5th follow-up
        await supabase.from('conversations').update({
          status: 'resolved',
          resolved_at: now.toISOString(),
          metadata: { ...newMetadata, closed_by: 'dead_air_auto_close' },
          updated_at: now.toISOString()
        }).eq('id', conv.id);

        // Log dead air event for analytics
        await supabase.from('dead_air_events').insert({
          conversation_id: conv.id,
          bot_message_content: lastMsg.content || '',
          channel: conv.channel,
          silence_duration_seconds: Math.round(silenceMs / 1000),
          customer_returned: false
        });

        closed++;
        console.log(`[dead-air] Closed conv ${conv.id} after ${MAX_FOLLOW_UPS} follow-ups`);
      } else {
        await supabase.from('conversations').update({
          metadata: newMetadata,
          updated_at: now.toISOString()
        }).eq('id', conv.id);
      }

      followUpsSent++;
    }

    const summary = {
      processed,
      followUpsSent,
      closed,
      timestamp: now.toISOString()
    };

    console.log('[dead-air] Summary:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[dead-air] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
