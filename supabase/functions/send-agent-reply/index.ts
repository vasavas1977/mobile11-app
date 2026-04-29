import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReplyPayload {
  conversationId: string;
  message: string;
  agentId: string;
  fromEmail?: string;
  attachments?: { url: string; name: string; type: string }[];
  isInternalNote?: boolean;
}

interface ConversationMessage {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Supported email addresses with their display names
const EMAIL_CONFIG: Record<string, string> = {
  'support@mobile11.com': 'Mobile11 Support',
  'business@mobile11.com': 'Mobile11 Business',
};

const DEFAULT_EMAIL = 'support@mobile11.com';

// Build References header from array of message IDs
function buildReferencesHeader(messageIds: string[]): string {
  if (!messageIds || messageIds.length === 0) return '';
  return messageIds.join(' ');
}

// Format previous messages as quoted history for email
function formatQuotedHistory(messages: ConversationMessage[], contactEmail: string): string {
  if (!messages || messages.length === 0) return '';
  
  const quotedMessages = messages.map(msg => {
    const date = new Date(msg.created_at).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const sender = msg.sender_type === 'customer' 
      ? contactEmail 
      : 'Mobile11 Support';
    
    // Clean content - remove excessive whitespace
    const cleanContent = msg.content
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return `
      <div style="border-left: 2px solid #ccc; padding-left: 12px; margin: 16px 0; color: #666;">
        <div style="font-size: 12px; margin-bottom: 8px;">
          <strong>${sender}</strong> on ${date}:
        </div>
        <div style="white-space: pre-wrap;">${cleanContent.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }).join('');
  
  return `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
      <div style="font-size: 11px; color: #999; margin-bottom: 12px;">Previous messages:</div>
      ${quotedMessages}
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
    const payload: ReplyPayload = await req.json();

    console.log('Processing agent reply:', {
      conversationId: payload.conversationId,
      fromEmail: payload.fromEmail,
      isInternalNote: payload.isInternalNote,
      attachmentsCount: payload.attachments?.length || 0
    });

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        channel,
        subject,
        contact_id,
        metadata,
        first_response_at,
        contacts!conversations_contact_id_fkey (
          id,
          email,
          name
        )
      `)
      .eq('id', payload.conversationId)
      .single();

    if (convError) throw convError;

    // Add message to conversation
    const messageData: any = {
      conversation_id: payload.conversationId,
      content: payload.message,
      sender_type: 'agent',
      sender_id: payload.agentId,
      is_internal_note: payload.isInternalNote || false
    };
    
    if (payload.attachments && payload.attachments.length > 0) {
      messageData.attachments = payload.attachments;
    }

    const { data: message, error: msgError } = await supabase
      .from('conversation_messages')
      .insert(messageData)
      .select('id')
      .single();

    if (msgError) throw msgError;

    // Update first response time if not set
    if (!conversation.first_response_at && !payload.isInternalNote) {
      await supabase
        .from('conversations')
        .update({ first_response_at: new Date().toISOString() })
        .eq('id', payload.conversationId);
    }

    // Send email if this is an email conversation and NOT an internal note
    const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts;
    const metadata = conversation.metadata as Record<string, any> | null;
    
    if (conversation.channel === 'email' && contact?.email && !payload.isInternalNote) {
      // Determine which email to send from
      let fromEmailAddress = payload.fromEmail || metadata?.to_email || DEFAULT_EMAIL;
      
      // Validate the email address is supported
      if (!EMAIL_CONFIG[fromEmailAddress]) {
        console.warn(`Unsupported from email: ${fromEmailAddress}, falling back to default`);
        fromEmailAddress = DEFAULT_EMAIL;
      }
      
      const fromDisplayName = EMAIL_CONFIG[fromEmailAddress];
      const fromFormatted = `${fromDisplayName} <${fromEmailAddress}>`;
      
      // Fetch recent messages for quoted history (excluding internal notes)
      const { data: recentMessages } = await supabase
        .from('conversation_messages')
        .select('id, content, sender_type, created_at, metadata')
        .eq('conversation_id', payload.conversationId)
        .eq('is_internal_note', false)
        .neq('id', message.id) // Exclude the message we just added
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Reverse to show oldest first in quoted history
      const orderedMessages = (recentMessages || []).reverse() as ConversationMessage[];
      const quotedHistory = formatQuotedHistory(orderedMessages, contact.email);
      
      // Build email headers for proper threading
      const existingMessageIds = metadata?.message_ids || [];
      const lastMessageId = metadata?.last_message_id || '';
      
      const emailHeaders: Record<string, string> = {};
      if (lastMessageId) {
        emailHeaders['In-Reply-To'] = lastMessageId;
      }
      const referencesHeader = buildReferencesHeader(existingMessageIds);
      if (referencesHeader) {
        emailHeaders['References'] = referencesHeader;
      }
      
      // Format attachments for Resend API (using path URL method)
      const resendAttachments = payload.attachments?.map(att => ({
        path: att.url,       // Resend will fetch the file from this URL
        filename: att.name,  // Original filename for display
      })) || [];

      console.log('Sending email reply:', {
        from: fromFormatted,
        to: contact.email,
        subject: conversation.subject,
        headers: emailHeaders,
        hasHistory: orderedMessages.length > 0,
        attachmentsCount: resendAttachments.length
      });

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: fromFormatted,
        to: contact.email,
        subject: `Re: ${conversation.subject || 'Your inquiry'}`,
        text: payload.message,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="white-space: pre-wrap;">${payload.message.replace(/\n/g, '<br>')}</div>
            ${quotedHistory}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              ${fromDisplayName} Team<br>
              <a href="https://mobile11.com" style="color: #0066cc;">mobile11.com</a>
            </p>
          </div>
        `,
        headers: emailHeaders,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't throw - message is saved, just email failed
      } else {
        console.log('Email sent successfully to:', contact.email, 'Message-ID:', emailResult?.id);
        
        // Store the new Message-ID in conversation metadata for future threading
        if (emailResult?.id) {
          const updatedMessageIds = [...existingMessageIds, emailResult.id];
          await supabase
            .from('conversations')
            .update({
              metadata: {
                ...metadata,
                last_message_id: emailResult.id,
                message_ids: updatedMessageIds
              }
            })
            .eq('id', payload.conversationId);
          
          console.log('Updated conversation with new Message-ID:', emailResult.id);
        }
      }
    }

    // Update conversation timestamp and status + auto-pause bot
    const updates: any = { updated_at: new Date().toISOString() };
    if (!payload.isInternalNote) {
      updates.status = 'pending'; // Mark as pending (awaiting customer response)
      // Auto-pause bot when agent replies
      const strongPauseReasons = ['customer_requested_human', 'customer_requested_human_menu', 'escalated', 'manual_agent_toggle'];
      const currentReason = (metadata as any)?.ai_paused_reason;
      const keepExistingPause = (metadata as any)?.ai_paused && strongPauseReasons.includes(currentReason);
      updates.metadata = {
        ...metadata,
        ai_paused: true,
        ai_paused_at: keepExistingPause ? (metadata as any)?.ai_paused_at : new Date().toISOString(),
        ai_paused_reason: keepExistingPause ? currentReason : 'agent_replied'
      };
    }
    
    await supabase
      .from('conversations')
      .update(updates)
      .eq('id', payload.conversationId);

    return new Response(
      JSON.stringify({ success: true, messageId: message.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending reply:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
