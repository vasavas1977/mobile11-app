import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReplyPayload {
  conversationId: string;
  message: string;
  agentId: string;
  attachments?: Array<{
    name: string;
    url?: string;
    path?: string;
    type: string;
    size: number;
  }>;
  sticker?: {
    packageId: string;
    stickerId: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ReplyPayload = await req.json();
    const { conversationId, message, agentId, attachments, sticker } = payload;

    console.log(`Sending LINE reply for conversation ${conversationId}`);

    // Get conversation with LINE metadata
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contacts(*)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.channel !== 'line') {
      throw new Error('Not a LINE conversation');
    }

    // Get LINE user ID from conversation metadata or contact
    const metadata = conversation.metadata as { line_user_id?: string } | null;
    const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts;
    const lineUserId = metadata?.line_user_id || contact?.line_id;

    if (!lineUserId) {
      throw new Error('LINE user ID not found');
    }

    console.log(`Sending message to LINE user ${lineUserId}`);

    // Build LINE messages array
    const messages: Array<{ type: string; text?: string; originalContentUrl?: string; previewImageUrl?: string; packageId?: string; stickerId?: string }> = [];

    // Add sticker if provided
    if (sticker && sticker.packageId && sticker.stickerId) {
      messages.push({
        type: 'sticker',
        packageId: sticker.packageId,
        stickerId: sticker.stickerId
      });
    }

    // Add text message if provided
    if (message && message.trim()) {
      messages.push({
        type: 'text',
        text: message.trim()
      });
    }

    // Add image attachments (LINE only supports images directly)
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // Resolve attachment URL from path if needed
        let attachmentUrl = attachment.url;
        if (attachment.path) {
          console.log('Generating signed URL for attachment path:', attachment.path);
          const { data: signedData, error: signedError } = await supabase.storage
            .from('ticket-attachments')
            .createSignedUrl(attachment.path, 60 * 60 * 24); // 24 hours
          
          if (signedData && !signedError) {
            attachmentUrl = signedData.signedUrl;
            console.log('Generated signed URL successfully');
          } else {
            console.error('Failed to generate signed URL:', signedError);
            continue; // Skip this attachment
          }
        }

        if (!attachmentUrl) {
          console.error('No URL available for attachment:', attachment.name);
          continue;
        }

        if (attachment.type.startsWith('image/')) {
          messages.push({
            type: 'image',
            originalContentUrl: attachmentUrl,
            previewImageUrl: attachmentUrl
          });
        } else {
          // For non-image files, send as text with link
          messages.push({
            type: 'text',
            text: `📎 ${attachment.name}: ${attachmentUrl}`
          });
        }
      }
    }

    if (messages.length === 0) {
      throw new Error('No message content to send');
    }

    // Send via LINE Push Message API (not Reply API since replyToken expires in 30s)
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: messages.slice(0, 5) // LINE allows max 5 messages per push
      })
    });

    if (!lineResponse.ok) {
      const errorBody = await lineResponse.text();
      console.error('LINE API error:', lineResponse.status, errorBody);
      throw new Error(`LINE API error: ${lineResponse.status} - ${errorBody}`);
    }

    console.log('LINE message sent successfully');

    // Save message to database
    const messageMetadata: Record<string, any> = {
      sent_via: 'line_push_api'
    };

    // Add sticker info to metadata if sent
    if (sticker) {
      messageMetadata.sticker = sticker;
    }

    const messageData: any = {
      conversation_id: conversationId,
      sender_type: 'agent',
      sender_id: agentId,
      content: sticker ? '[Sticker]' : (message || (attachments?.length ? '[Attachment]' : '')),
      is_internal_note: false,
      metadata: messageMetadata
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
      console.error('Error saving message:', msgError);
      throw msgError;
    }

    // Update first_response_at if this is the first agent response
    if (!conversation.first_response_at) {
      await supabase
        .from('conversations')
        .update({ first_response_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    // Update conversation status and timestamp + auto-pause bot
    const currentMetadata = (conversation.metadata || {}) as Record<string, any>;
    await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
        status: conversation.status === 'open' ? 'pending' : conversation.status,
        metadata: (() => {
          const strongPauseReasons = ['customer_requested_human', 'customer_requested_human_menu', 'escalated', 'manual_agent_toggle'];
          const currentReason = currentMetadata.ai_paused_reason;
          const keepExistingPause = currentMetadata.ai_paused && strongPauseReasons.includes(currentReason);
          return {
            ...currentMetadata,
            ai_paused: true,
            ai_paused_at: keepExistingPause ? currentMetadata.ai_paused_at : new Date().toISOString(),
            ai_paused_reason: keepExistingPause ? currentReason : 'agent_replied'
          };
        })()
      })
      .eq('id', conversationId);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: newMessage.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('send-line-reply error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
