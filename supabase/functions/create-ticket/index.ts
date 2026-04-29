import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email, subject, message, category = 'general', priority: userPriority } = await req.json();
    
    // Intelligent priority detection
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'not working', 'broken', 'down', 'cant', 'cannot'];
    const highKeywords = ['important', 'soon', 'issue', 'problem', 'error', 'failed', 'help'];
    
    // Analyze subject and message for keywords
    const text = (subject + ' ' + message).toLowerCase();
    let detectedPriority = userPriority || 'medium';
    
    // Auto-escalate based on keywords
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      detectedPriority = 'urgent';
      console.log('Priority auto-escalated to urgent based on keywords');
    } else if (highKeywords.some(keyword => text.includes(keyword)) && detectedPriority === 'medium') {
      detectedPriority = 'high';
      console.log('Priority auto-escalated to high based on keywords');
    }
    
    // Category-based priority escalation
    if (['billing', 'refund', 'payment'].includes(category.toLowerCase())) {
      if (detectedPriority === 'low' || detectedPriority === 'medium') {
        detectedPriority = 'high';
        console.log('Priority auto-escalated to high based on category:', category);
      }
    }
    
    if (category.toLowerCase() === 'esim_activation') {
      if (detectedPriority === 'low') {
        detectedPriority = 'medium';
        console.log('Priority auto-escalated to medium based on esim_activation category');
      }
    }

    // Validate input
    if (!name || !email || !subject || !message) {
      throw new Error('Missing required fields');
    }

    // Get user ID if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // Track whether AI reply was emailed (to skip generic confirmation)
    let aiEmailSent = false;

    // Generate ticket number
    const timestamp = Date.now();
    const ticketNumber = `TKT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${timestamp.toString().slice(-4)}`;

    // ========== CONTACT MANAGEMENT ==========
    // Create or get contact for the conversation system
    let contactId: string | null = null;
    
    // Try to find existing contact by email or user_id
    const { data: existingContact } = await supabaseClient
      .from('contacts')
      .select('id')
      .or(`email.eq.${email}${userId ? `,user_id.eq.${userId}` : ''}`)
      .limit(1)
      .single();

    if (existingContact) {
      contactId = existingContact.id;
      console.log('Found existing contact:', contactId);
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabaseClient
        .from('contacts')
        .insert({
          name,
          email,
          user_id: userId,
        })
        .select('id')
        .single();

      if (contactError) {
        console.error('Error creating contact:', contactError);
      } else {
        contactId = newContact.id;
        console.log('Created new contact:', contactId);
      }
    }

    // ========== CREATE SUPPORT TICKET (for tracking/ticket number) ==========
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: userId,
        email,
        name,
        subject,
        category,
        priority: detectedPriority,
        initial_priority: userPriority || 'medium',
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // ========== CREATE CONVERSATION (single source of truth for messages) ==========
    if (contactId) {
      // Create conversation with 'form' channel
      const { data: conversation, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          contact_id: contactId,
          channel: 'form',
          subject: `[${ticketNumber}] ${subject}`,
          status: 'open',
          priority: detectedPriority,
          ticket_id: ticket.id,
          metadata: {
            category,
            ticket_number: ticketNumber,
            source: 'contact_form'
          }
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
      } else {
        console.log('Created conversation:', conversation.id);

        // Create initial message in conversation_messages (SINGLE SOURCE OF TRUTH)
        const { error: convMsgError } = await supabaseClient
          .from('conversation_messages')
          .insert({
            conversation_id: conversation.id,
            content: message,
            sender_type: 'customer',
            sender_id: userId,
            metadata: {
              category,
              ticket_number: ticketNumber
            }
          });

        if (convMsgError) {
          console.error('Error creating conversation message:', convMsgError);
        } else {
          console.log('Created conversation message for omni-channel inbox');

          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

          // ═══ NOTIFY AGENTS of new form submission ═══
          try {
            await fetch(`${supabaseUrl}/functions/v1/notify-agents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                conversationId: conversation.id,
                messagePreview: message.length > 100 ? message.slice(0, 100) + '…' : message,
                channel: 'form',
                senderName: name
              })
            });
            console.log('Agents notified of new form submission');
          } catch (notifyErr) {
            console.error('Failed to notify agents:', notifyErr);
          }

          // ═══ NOTIFY LINE GROUP of new form submission ═══
          try {
            await fetch(`${supabaseUrl}/functions/v1/notify-line-group`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                conversationId: conversation.id,
                customerName: name,
                channel: 'form',
                messagePreview: message.length > 80 ? message.slice(0, 80) + '…' : message
              })
            });
            console.log('LINE group notified of new form submission');
          } catch (lineErr) {
            console.error('Failed to notify LINE group:', lineErr);
          }

          // ═══ AI AUTO-REPLY FOR FORM SUBMISSION ═══
          try {
            console.log('Calling AI chat response for form submission...');

            const aiResponse = await fetch(
              `${supabaseUrl}/functions/v1/ai-chat-response`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${serviceKey}`
                },
                body: JSON.stringify({
                  message: `[Subject: ${subject}] ${message}`,
                  conversationId: conversation.id,
                  history: [],
                  chatMode: 'freetext',
                  channel: 'form'
                })
              }
            );

            if (aiResponse.ok) {
              const contentType = aiResponse.headers.get('content-type') || '';
              let aiResult: any;

              if (contentType.includes('text/event-stream')) {
                // Consume SSE stream
                const reader = aiResponse.body?.getReader();
                if (reader) {
                  const decoder = new TextDecoder();
                  let fullContent = '';
                  let metadata: any = {};
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split('\n')) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                          const parsed = JSON.parse(data);
                          if (parsed.type === 'done' && parsed.content) {
                            fullContent = parsed.content;
                            metadata.confidence = parsed.confidence;
                            metadata.escalate = parsed.escalate;
                          } else if (parsed.type === 'metadata') {
                            metadata = parsed;
                          } else if (parsed.type === 'delta' && parsed.content) {
                            fullContent += parsed.content;
                          }
                        } catch { /* ignore */ }
                      }
                    }
                  }
                  aiResult = { response: fullContent, confidence: metadata.confidence, escalate: metadata.escalate };
                }
              } else {
                aiResult = await aiResponse.json();
              }

              if (aiResult?.response && !aiResult.escalate) {
                // Save bot reply to conversation
                const { error: botMsgError } = await supabaseClient
                  .from('conversation_messages')
                  .insert({
                    conversation_id: conversation.id,
                    sender_type: 'bot',
                    content: aiResult.response,
                    is_internal_note: false,
                    metadata: {
                      ai_auto_response: true,
                      ai_confidence: aiResult.confidence,
                      channel: 'form'
                    }
                  });

              if (botMsgError) {
                  console.error('Error saving AI form reply:', botMsgError);
                } else {
                  console.log('Saved AI bot reply to form conversation');

                  // ═══ SEND AI REPLY VIA EMAIL ═══
                  try {
                    const resendApiKey = Deno.env.get('RESEND_API_KEY');
                    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

                    const replySubject = `Re: [${ticketNumber}] ${subject}`;
                    const emailHeaders: Record<string, string> = {};

                    console.log('Sending AI reply email for form submission:', {
                      to: email,
                      subject: replySubject,
                    });

                    const formDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
                    const resendResponse = await fetch('https://api.resend.com/emails', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        from: 'Mobile11 Support <support@mobile11.com>',
                        to: email,
                        subject: replySubject,
                        text: `Hi ${name},\n\nThank you for contacting mobile11 support. Your ticket ${ticketNumber} has been created.\n\n${aiResult.response}\n\nMobile11 Support Team\nhttps://mobile11.com\n\n---\nOn ${formDate}, ${name} wrote:\n> Subject: ${subject}\n>\n> ${message.replace(/\n/g, '\n> ')}`,
                        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                          <p>Hi ${name},</p>
                          <p>Thank you for contacting mobile11 support. Your ticket <strong>${ticketNumber}</strong> has been created.</p>
                          <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
                          <div style="white-space: pre-wrap;">${aiResult.response.replace(/\n/g, '<br>')}</div>
                          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
                          <p style="color: #666; font-size: 12px;">
                            Mobile11 Support Team<br>
                            <a href="https://mobile11.com" style="color: #0066cc;">mobile11.com</a>
                          </p>
                          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
                            <div style="font-size: 11px; color: #999; margin-bottom: 12px;">
                              On ${formDate}, ${name} &lt;${email}&gt; wrote:
                            </div>
                            <blockquote style="margin: 0; padding: 8px 12px; border-left: 3px solid #ddd; color: #555; font-size: 13px;">
                              <strong>Subject:</strong> ${subject}<br><br>
                              <div style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
                            </blockquote>
                          </div>
                        </div>`,
                        headers: emailHeaders
                      })
                    });

                    if (resendResponse.ok) {
                      const resendResult = await resendResponse.json();
                      console.log('AI reply email sent for form, Message-ID:', resendResult.id);
                      aiEmailSent = true;

                      // Update conversation metadata with Message-ID for threading
                      if (resendResult.id) {
                        await supabaseClient
                          .from('conversations')
                          .update({
                            metadata: {
                              category,
                              ticket_number: ticketNumber,
                              source: 'contact_form',
                              last_message_id: resendResult.id,
                              message_ids: [resendResult.id],
                              to_email: 'support@mobile11.com'
                            }
                          })
                          .eq('id', conversation.id);
                        console.log('Updated conversation metadata with threading info');
                      }
                    } else {
                      const errText = await resendResponse.text();
                      console.error('Resend API error for form reply:', resendResponse.status, errText);
                    }
                  } catch (sendErr) {
                    console.error('Failed to send AI form reply email:', sendErr);
                  }
                }
              } else if (aiResult?.escalate) {
                console.log('AI escalated form submission — awaiting human agent');
              }
            } else {
              console.error('AI form response error:', aiResponse.status);
            }
          } catch (aiErr) {
            console.error('Error calling AI for form auto-reply:', aiErr);
          }
        }
      }
    }

    // Send generic confirmation email only if AI reply was NOT already emailed
    if (!aiEmailSent) {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      try {
        await resend.emails.send({
          from: 'mobile11 Support <support@mobile11.com>',
          to: [email],
          subject: `Ticket Created: ${ticketNumber}`,
          html: `
            <h2>Your support ticket has been created</h2>
            <p>Hi ${name},</p>
            <p>Thank you for contacting mobile11 support. We have received your request and will respond as soon as possible.</p>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <strong>Ticket Number:</strong> ${ticketNumber}<br>
              <strong>Subject:</strong> ${subject}<br>
              <strong>Status:</strong> Open
            </div>
            <p>You can track your ticket and add additional information by visiting your account.</p>
            <p>Best regards,<br>mobile11 Support Team</p>
          `,
        });
        console.log('Generic confirmation email sent (AI reply not available)');
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticket_number: ticketNumber,
        ticket_id: ticket.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
