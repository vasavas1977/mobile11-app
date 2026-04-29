import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid Facebook Message Tags for utility messaging outside 24-hour window
const VALID_MESSAGE_TAGS = [
  'POST_PURCHASE_UPDATE',
  'CONFIRMED_EVENT_UPDATE', 
  'ACCOUNT_UPDATE',
  'HUMAN_AGENT'
] as const;

type FacebookMessageTag = typeof VALID_MESSAGE_TAGS[number];

interface ReplyPayload {
  conversationId: string;
  message: string;
  agentId: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    path?: string;
  }>;
  isInternalNote?: boolean;
  messageTag?: FacebookMessageTag;
}

// Prepare attachments with signed URLs for Facebook
async function prepareAttachmentsForFacebook(
  supabase: any,
  attachments: Array<{ url: string; name: string; type: string; path?: string }>
): Promise<Array<{ url: string; type: string }>> {
  const prepared: Array<{ url: string; type: string }> = [];
  
  for (const att of attachments) {
    let finalUrl = att.url;
    
    // If we have a path, generate a signed URL (24 hour validity for Facebook to download)
    if (att.path) {
      console.log('Generating signed URL for attachment path:', att.path);
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .createSignedUrl(att.path, 60 * 60 * 24); // 24 hours
      
      if (data && !error) {
        finalUrl = data.signedUrl;
        console.log('Generated signed URL successfully');
      } else {
        console.error('Failed to generate signed URL:', error);
      }
    } else if (att.url && att.url.includes('supabase.co/storage')) {
      // Extract path from Supabase storage URL and create signed URL
      const pathMatch = att.url.match(/ticket-attachments\/(.+?)(\?|$)/);
      if (pathMatch) {
        console.log('Extracting path from URL:', pathMatch[1]);
        const { data, error } = await supabase.storage
          .from('ticket-attachments')
          .createSignedUrl(decodeURIComponent(pathMatch[1]), 60 * 60 * 24);
        
        if (data && !error) {
          finalUrl = data.signedUrl;
          console.log('Generated signed URL from extracted path');
        } else {
          console.error('Failed to generate signed URL from extracted path:', error);
        }
      }
    }
    
    prepared.push({ url: finalUrl, type: att.type });
  }
  
  return prepared;
}

// Send message via Facebook Send API
async function sendFacebookMessage(
  psid: string, 
  message: string, 
  accessToken: string,
  attachments?: Array<{ url: string; type: string }>,
  messageTag?: FacebookMessageTag
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Build base payload with messaging_type
    const buildPayload = (messageContent: any) => {
      const payload: any = {
        recipient: { id: psid },
        message: messageContent
      };
      
      // Apply MESSAGE_TAG for utility messaging (outside 24-hour window)
      if (messageTag) {
        payload.messaging_type = 'MESSAGE_TAG';
        payload.tag = messageTag;
        console.log(`Sending with MESSAGE_TAG: ${messageTag}`);
      } else {
        payload.messaging_type = 'RESPONSE';
      }
      
      return payload;
    };

    // If there are attachments, send them separately (each with tag if applicable)
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        const attachmentType = attachment.type.startsWith('image') ? 'image' : 
                               attachment.type.startsWith('video') ? 'video' :
                               attachment.type.startsWith('audio') ? 'audio' : 'file';
        
        const payload = buildPayload({
          attachment: {
            type: attachmentType,
            payload: { url: attachment.url, is_reusable: true }
          }
        });

        const response = await fetch(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error sending attachment:', errorData);
        }
      }
    }

    // Send text message
    if (message && message.trim()) {
      const payload = buildPayload({ text: message });
      
      const response = await fetch(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Facebook Send API error:', data);
        return { success: false, error: data.error?.message || 'Failed to send message' };
      }

      return { success: true, messageId: data.message_id };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending Facebook message:', error);
    return { success: false, error: String(error) };
  }
}

// Get page access token from database or fallback to env variable
async function getPageAccessToken(supabase: any, pageId: string | null, fallbackToken: string): Promise<string> {
  if (!pageId) {
    console.log('No page ID provided, using fallback token');
    return fallbackToken;
  }

  try {
    const { data: connection } = await supabase
      .from('channel_connections')
      .select('access_token')
      .eq('channel_type', 'facebook')
      .eq('external_id', pageId)
      .eq('status', 'active')
      .single();

    if (connection?.access_token) {
      console.log('Using dynamic page access token from database');
      return connection.access_token;
    }
  } catch (error: any) {
    console.error('Error fetching page access token from database:', error);
  }
  
  console.log('Using fallback page access token from environment');
  return fallbackToken;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing configuration');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload: ReplyPayload = await req.json();
    const { conversationId, message, agentId, attachments, isInternalNote, messageTag } = payload;

    // Validate messageTag if provided
    if (messageTag && !VALID_MESSAGE_TAGS.includes(messageTag)) {
      console.error('Invalid message tag:', messageTag);
      return new Response(
        JSON.stringify({ error: `Invalid messageTag. Must be one of: ${VALID_MESSAGE_TAGS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing Facebook reply:', { conversationId, agentId, isInternalNote, hasAttachments: !!attachments, messageTag });

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts (
          id,
          facebook_id
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PSID and page_id from conversation metadata or contact
    const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts;
    const metadata = conversation.metadata as { psid?: string; page_id?: string } | null;
    const psid = metadata?.psid || contact?.facebook_id;
    const pageId = metadata?.page_id;

    if (!psid) {
      console.error('No Facebook PSID found for conversation');
      return new Response(
        JSON.stringify({ error: 'No Facebook recipient found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the appropriate access token for this page
    const accessToken = await getPageAccessToken(supabase, pageId || null, FACEBOOK_PAGE_ACCESS_TOKEN);

    // Save the message to database with tag metadata for auditing
    const messageMetadata: any = { 
      channel: 'facebook',
      facebook_messaging_type: messageTag ? 'MESSAGE_TAG' : 'RESPONSE'
    };
    
    if (messageTag) {
      messageMetadata.facebook_tag = messageTag;
    }

    const messageData: any = {
      conversation_id: conversationId,
      sender_type: 'agent',
      sender_id: agentId,
      content: message || (attachments?.length ? '[Attachment]' : ''),
      is_internal_note: isInternalNote || false,
      metadata: messageMetadata,
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
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not an internal note, send via Facebook
    if (!isInternalNote) {
      // Prepare attachments with signed URLs for Facebook
      const preparedAttachments = attachments && attachments.length > 0
        ? await prepareAttachmentsForFacebook(supabase, attachments)
        : undefined;
      
      const sendResult = await sendFacebookMessage(
        psid,
        message,
        accessToken,
        preparedAttachments,
        messageTag
      );

      if (!sendResult.success) {
        console.error('Failed to send Facebook message:', sendResult.error);
        // Update message metadata to indicate send failure
        await supabase
          .from('conversation_messages')
          .update({
            metadata: { 
              ...messageMetadata, 
              facebook_send_error: sendResult.error,
              facebook_send_failed: true
            }
          })
          .eq('id', newMessage.id);

        return new Response(
          JSON.stringify({ error: 'Failed to send Facebook message', details: sendResult.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update message with Facebook message ID
      if (sendResult.messageId) {
        await supabase
          .from('conversation_messages')
          .update({
            metadata: { 
              ...messageMetadata, 
              facebook_message_id: sendResult.messageId 
            }
          })
          .eq('id', newMessage.id);
      }

      // Update first_response_at if this is the first agent response
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

    // Auto-pause bot when agent sends a non-internal reply
    if (!isInternalNote) {
      const currentMetadata = (conversation.metadata || {}) as Record<string, any>;
      const strongPauseReasons = ['customer_requested_human', 'customer_requested_human_menu', 'escalated', 'manual_agent_toggle'];
      const currentReason = currentMetadata.ai_paused_reason;
      const keepExistingPause = currentMetadata.ai_paused && strongPauseReasons.includes(currentReason);
      updates.metadata = {
        ...currentMetadata,
        ai_paused: true,
        ai_paused_at: keepExistingPause ? currentMetadata.ai_paused_at : new Date().toISOString(),
        ai_paused_reason: keepExistingPause ? currentReason : 'agent_replied'
      };
    }

    await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    console.log('Facebook reply sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: newMessage.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing Facebook reply:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
