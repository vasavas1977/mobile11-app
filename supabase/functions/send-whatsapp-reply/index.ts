import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReplyPayload {
  conversationId: string;
  message: string;
  agentId: string;
  isInternalNote?: boolean;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    path?: string;
  }>;
}

// Send text message via WhatsApp Cloud API
async function sendWhatsAppMessage(
  phoneNumberId: string,
  recipientPhone: string,
  message: string,
  accessToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-whatsapp-reply] API error:', data);
      return { success: false, error: data.error?.message || 'Failed to send message' };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error: any) {
    console.error('[send-whatsapp-reply] Error:', error);
    return { success: false, error: String(error) };
  }
}

// Send media via WhatsApp Cloud API
async function sendWhatsAppMedia(
  phoneNumberId: string,
  recipientPhone: string,
  mediaUrl: string,
  mediaType: string,
  accessToken: string,
  caption?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const waType = mediaType.startsWith('image') ? 'image' :
                   mediaType.startsWith('video') ? 'video' :
                   mediaType.startsWith('audio') ? 'audio' : 'document';

    const mediaPayload: any = { link: mediaUrl };
    if (caption && (waType === 'image' || waType === 'video' || waType === 'document')) {
      mediaPayload.caption = caption;
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: waType,
          [waType]: mediaPayload,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error('[send-whatsapp-reply] Media send error:', data);
      return { success: false, error: data.error?.message };
    }

    await response.json();
    return { success: true };
  } catch (error: any) {
    console.error('[send-whatsapp-reply] Media send error:', error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[send-whatsapp-reply] Missing configuration');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload: ReplyPayload = await req.json();
    const { conversationId, message, agentId, isInternalNote, attachments } = payload;

    console.log('[send-whatsapp-reply] Processing:', { conversationId, agentId, isInternalNote });

    // Get conversation with contact
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts (
          id,
          whatsapp_phone,
          phone
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[send-whatsapp-reply] Conversation not found:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recipient phone number
    const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts;
    const conversationMetadata = (conversation.metadata || {}) as Record<string, any>;
    const recipientPhone = conversationMetadata?.whatsapp_phone || contact?.whatsapp_phone || contact?.phone;

    if (!recipientPhone) {
      console.error('[send-whatsapp-reply] No WhatsApp phone number found');
      return new Response(
        JSON.stringify({ error: 'No WhatsApp recipient found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save message to database
    const messageData: any = {
      conversation_id: conversationId,
      sender_type: 'agent',
      sender_id: agentId,
      content: message || (attachments?.length ? '[Attachment]' : ''),
      is_internal_note: isInternalNote || false,
      metadata: { channel: 'whatsapp' },
    };

    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }

    const { data: newMessage, error: msgError } = await supabase
      .from('conversation_messages')
      .insert(messageData)
      .select()
      .single();

    if (msgError) {
      console.error('[send-whatsapp-reply] Error saving message:', msgError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via WhatsApp if not internal note
    if (!isInternalNote) {
      // Send attachments first
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          let mediaUrl = att.url;

          // Generate signed URL if we have a path
          if (att.path) {
            const { data: signedData } = await supabase.storage
              .from('ticket-attachments')
              .createSignedUrl(att.path, 60 * 60 * 24);
            if (signedData?.signedUrl) {
              mediaUrl = signedData.signedUrl;
            }
          }

          await sendWhatsAppMedia(
            WHATSAPP_PHONE_NUMBER_ID,
            recipientPhone,
            mediaUrl,
            att.type,
            WHATSAPP_ACCESS_TOKEN
          );
        }
      }

      // Send text message
      if (message && message.trim()) {
        const sendResult = await sendWhatsAppMessage(
          WHATSAPP_PHONE_NUMBER_ID,
          recipientPhone,
          message,
          WHATSAPP_ACCESS_TOKEN
        );

        if (!sendResult.success) {
          console.error('[send-whatsapp-reply] Failed to send:', sendResult.error);
          await supabase
            .from('conversation_messages')
            .update({
              metadata: {
                channel: 'whatsapp',
                whatsapp_send_error: sendResult.error,
                whatsapp_send_failed: true,
              },
            })
            .eq('id', newMessage.id);

          return new Response(
            JSON.stringify({ error: 'Failed to send WhatsApp message', details: sendResult.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update with WhatsApp message ID
        if (sendResult.messageId) {
          await supabase
            .from('conversation_messages')
            .update({
              metadata: {
                channel: 'whatsapp',
                whatsapp_message_id: sendResult.messageId,
              },
            })
            .eq('id', newMessage.id);
        }
      }

      // Update first_response_at
      if (!conversation.first_response_at) {
        await supabase
          .from('conversations')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    }

    // Update conversation
    const updates: any = { updated_at: new Date().toISOString() };
    if (!isInternalNote && conversation.status === 'open') {
      updates.status = 'pending';
    }

    // Auto-pause bot when agent replies
    if (!isInternalNote) {
      const strongPauseReasons = ['customer_requested_human', 'customer_requested_human_menu', 'escalated', 'manual_agent_toggle'];
      const currentReason = (conversationMetadata as any)?.ai_paused_reason;
      const keepExistingPause = (conversationMetadata as any)?.ai_paused && strongPauseReasons.includes(currentReason);
      updates.metadata = {
        ...conversationMetadata,
        ai_paused: true,
        ai_paused_at: keepExistingPause ? (conversationMetadata as any)?.ai_paused_at : new Date().toISOString(),
        ai_paused_reason: keepExistingPause ? currentReason : 'agent_replied',
      };
    }

    await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    console.log('[send-whatsapp-reply] Reply sent successfully');

    return new Response(
      JSON.stringify({ success: true, messageId: newMessage.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[send-whatsapp-reply] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
