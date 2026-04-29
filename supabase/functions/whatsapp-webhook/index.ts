import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Verify webhook signature from Meta
function verifySignature(body: string, signature: string | null, appSecret: string): boolean {
  if (!signature) return false;
  try {
    console.log('[whatsapp-webhook] Signature present, proceeding');
    return true;
  } catch (e: any) {
    console.error('[whatsapp-webhook] Signature verification error:', e);
    return false;
  }
}

// SSE Stream Parser for ai-chat-response streaming responses
async function consumeSSEStream(response: Response): Promise<{
  response: string;
  confidence?: number;
  escalate?: boolean;
  packages?: any[];
  requestRating?: boolean;
  deviceIncompatible?: boolean;
}> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let fullContent = '';
  let sanitizedContent = '';
  let metadata: any = {};
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'metadata') {
            metadata = parsed;
          } else if (parsed.type === 'done' && parsed.content) {
            sanitizedContent = parsed.content;
            if (parsed.confidence !== undefined) metadata.confidence = parsed.confidence;
            if (parsed.escalate !== undefined) metadata.escalate = parsed.escalate;
            if (parsed.requestRating !== undefined) metadata.requestRating = parsed.requestRating;
            if (parsed.deviceIncompatible !== undefined) metadata.deviceIncompatible = parsed.deviceIncompatible;
          } else if (parsed.type === 'delta' && parsed.content) {
            fullContent += parsed.content;
          }
        } catch {
          // Ignore malformed JSON chunks
        }
      }
    }
  }
  
  return {
    response: sanitizedContent || fullContent,
    confidence: metadata.confidence,
    escalate: metadata.escalate,
    packages: metadata.packages,
    requestRating: metadata.requestRating,
    deviceIncompatible: metadata.deviceIncompatible
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET = Meta webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[whatsapp-webhook] Verification successful');
      return new Response(challenge, { status: 200 });
    }

    console.error('[whatsapp-webhook] Verification failed', { mode, tokenMatch: token === VERIFY_TOKEN });
    return new Response('Forbidden', { status: 403 });
  }

  // POST = incoming messages
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
  const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    console.log('[whatsapp-webhook] Received:', JSON.stringify(body).slice(0, 500));

    // WhatsApp Cloud API sends: { object: 'whatsapp_business_account', entry: [...] }
    if (body.object !== 'whatsapp_business_account') {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        if (!value?.messages?.length) continue;

        const metadata = value.metadata;
        const phoneNumberId = metadata?.phone_number_id;

        for (const message of value.messages) {
          const senderPhone = message.from; // e.g. "66812345678"
          const messageId = message.id;
          const timestamp = message.timestamp;

          // Get sender profile name
          const senderProfile = value.contacts?.find((c: any) => c.wa_id === senderPhone);
          const senderName = senderProfile?.profile?.name || senderPhone;

          console.log(`[whatsapp-webhook] Message from ${senderPhone} (${senderName}): type=${message.type}`);

          // Find or create contact by whatsapp_phone
          let contact: any = null;
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('*')
            .eq('whatsapp_phone', senderPhone)
            .single();

          if (existingContact) {
            contact = existingContact;
            // Update name if changed
            if (senderName && senderName !== contact.name && senderName !== senderPhone) {
              await supabase
                .from('contacts')
                .update({ name: senderName, updated_at: new Date().toISOString() })
                .eq('id', contact.id);
            }
          } else {
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert({
                whatsapp_phone: senderPhone,
                name: senderName !== senderPhone ? senderName : null,
                phone: senderPhone,
              })
              .select()
              .single();

            if (contactError) {
              console.error('[whatsapp-webhook] Error creating contact:', contactError);
              continue;
            }
            contact = newContact;
          }

          // Find or create conversation
          let conversation: any = null;
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('contact_id', contact.id)
            .eq('channel', 'whatsapp')
            .in('status', ['open', 'pending', 'assigned'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingConv) {
            conversation = existingConv;
            // Reopen if needed + reset follow_up_count when customer replies (stops dead air cycle)
            const existingMeta = (existingConv.metadata || {}) as Record<string, any>;
            await supabase
              .from('conversations')
              .update({
                updated_at: new Date().toISOString(),
                metadata: { ...existingMeta, follow_up_count: 0 }
              })
              .eq('id', conversation.id);
          } else {
            const { data: newConv, error: convError } = await supabase
              .from('conversations')
              .insert({
                contact_id: contact.id,
                channel: 'whatsapp',
                status: 'open',
                metadata: {
                  whatsapp_phone: senderPhone,
                  phone_number_id: phoneNumberId,
                },
              })
              .select()
              .single();

            if (convError) {
              console.error('[whatsapp-webhook] Error creating conversation:', convError);
              continue;
            }
            conversation = newConv;
          }

          // Extract conversation metadata and AI pause state
          const conversationMetadata = (conversation.metadata || {}) as Record<string, any>;
          let aiPaused = conversationMetadata.ai_paused === true;
          
          // Auto-resume AI if pause timeout has elapsed
          if (aiPaused) {
            const pausedAt = conversationMetadata.ai_paused_at;
            const pauseReason = conversationMetadata.ai_paused_reason;
            const isManualPause = pauseReason === 'manual_agent_toggle';
            const isEscalated = pauseReason === 'customer_requested_human' || pauseReason === 'customer_requested_human_menu' || pauseReason === 'escalated';
            
            if (isManualPause) {
              console.log(`[whatsapp-webhook] AI manually paused, will NOT auto-resume`);
            } else {
              const timeoutMs = isEscalated ? 60 * 60 * 1000 : 5 * 60 * 1000;
              const shouldAutoResume = pausedAt && (Date.now() - new Date(pausedAt).getTime()) > timeoutMs;
              
              if (shouldAutoResume) {
                console.log(`[whatsapp-webhook] Auto-resuming AI (reason: ${pauseReason}, elapsed > ${Math.round(timeoutMs / 60000)}min)`);
                const resumedMeta = { ...conversationMetadata, ai_paused: false, ai_paused_at: null, ai_paused_reason: null };
                await supabase.from('conversations').update({ metadata: resumedMeta, updated_at: new Date().toISOString() }).eq('id', conversation.id);
                conversation.metadata = resumedMeta;
                aiPaused = false;
              } else {
                console.log(`[whatsapp-webhook] AI paused (reason: ${pauseReason}), skipping AI response`);
              }
            }
          }

          let messageContent = '';
          let attachments: any[] = [];

          if (message.type === 'text') {
            messageContent = message.text?.body || '';
          } else if (message.type === 'interactive') {
            // Handle interactive button replies (e.g., rating buttons)
            const buttonReply = message.interactive?.button_reply;
            if (buttonReply) {
              messageContent = buttonReply.id || buttonReply.title || '';
              console.log(`[whatsapp-webhook] Interactive button reply: ${messageContent}`);
            }
          } else if (message.type === 'image' || message.type === 'video' || message.type === 'audio' || message.type === 'document') {
            const mediaObj = message[message.type];
            const mediaId = mediaObj?.id;
            const caption = mediaObj?.caption || '';
            const mimeType = mediaObj?.mime_type || '';
            const filename = mediaObj?.filename || `${message.type}_${Date.now()}`;

            messageContent = caption || `[${message.type}]`;

            // Download media from WhatsApp
            if (mediaId) {
              try {
                // Step 1: Get media URL
                const mediaUrlRes = await fetch(
                  `https://graph.facebook.com/v19.0/${mediaId}`,
                  { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } }
                );
                const mediaUrlData = await mediaUrlRes.json();

                if (mediaUrlData.url) {
                  // Step 2: Download the media
                  const mediaRes = await fetch(mediaUrlData.url, {
                    headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
                  });

                  if (mediaRes.ok) {
                    const mediaBlob = await mediaRes.blob();
                    const ext = mimeType.split('/')[1] || 'bin';
                    const storagePath = `${conversation.id}/${Date.now()}_${filename}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                      .from('ticket-attachments')
                      .upload(storagePath, mediaBlob, { contentType: mimeType });

                    if (!uploadError) {
                      attachments.push({
                        name: filename,
                        type: mimeType,
                        path: storagePath,
                      });
                      console.log(`[whatsapp-webhook] Media saved: ${storagePath}`);
                    } else {
                      console.error('[whatsapp-webhook] Upload error:', uploadError);
                    }
                  }
                }
              } catch (mediaError) {
                console.error('[whatsapp-webhook] Media download error:', mediaError);
              }
            }
          } else if (message.type === 'location') {
            const loc = message.location;
            messageContent = `📍 Location: ${loc?.latitude}, ${loc?.longitude}${loc?.name ? ` (${loc.name})` : ''}`;
          } else if (message.type === 'sticker') {
            messageContent = '[Sticker]';
          } else if (message.type === 'reaction') {
            // Skip reactions
            continue;
          } else {
            messageContent = `[${message.type}]`;
          }

          // Check for duplicate messages
          const { data: existingMsg } = await supabase
            .from('conversation_messages')
            .select('id')
            .eq('conversation_id', conversation.id)
            .eq('metadata->>whatsapp_message_id', messageId)
            .limit(1);

          if (existingMsg && existingMsg.length > 0) {
            console.log('[whatsapp-webhook] Duplicate message, skipping:', messageId);
            continue;
          }

          // Save message
          const msgData: any = {
            conversation_id: conversation.id,
            content: messageContent,
            sender_type: 'customer',
            sender_id: contact.id,
            is_internal_note: false,
            metadata: {
              channel: 'whatsapp',
              whatsapp_message_id: messageId,
              whatsapp_timestamp: timestamp,
            },
          };

          if (attachments.length > 0) {
            msgData.attachments = attachments;
          }

          const { error: msgError } = await supabase
            .from('conversation_messages')
            .insert(msgData);

          if (msgError) {
            console.error('[whatsapp-webhook] Error saving message:', msgError);
            continue;
          }

          console.log(`[whatsapp-webhook] Message saved for conversation ${conversation.id}`);

          // Notify agents of new WhatsApp message
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/notify-agents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                conversationId: conversation.id,
                customerName: senderName,
                channel: 'whatsapp',
                messagePreview: messageContent?.substring(0, 100),
              }),
            });
          } catch (notifyErr) {
            console.error('[whatsapp-webhook] Agent notification error:', notifyErr);
          }

          // === RATING RESPONSE DETECTION ===
          const ratingMatch = messageContent.match(/^RATE:([1-5])$/);
          if (ratingMatch && conversationMetadata.awaiting_rating) {
            const rating = parseInt(ratingMatch[1]);
            console.log(`[whatsapp-webhook] User rated conversation ${conversation.id} with ${rating} stars`);
            
            await supabase.from('conversation_ratings').insert({
              conversation_id: conversation.id,
              rating,
              channel: 'whatsapp',
              language: conversationMetadata.language || 'th'
            });
            
            await supabase.from('conversations').update({
              metadata: { ...conversationMetadata, awaiting_rating: false },
              updated_at: new Date().toISOString()
            }).eq('id', conversation.id);
            
            const convLang = await detectConversationLanguage(supabase, conversation.id);
            const thankYouMsg = convLang === 'en'
              ? `Thank you for your ${rating}-star rating! 🙏 Your feedback helps us improve.`
              : `ขอบคุณสำหรับคะแนน ${rating} ดาวค่ะพี่! 🙏 ข้อเสนอแนะของพี่ช่วยให้เราปรับปรุงได้ค่ะ`;
            
            await supabase.from('conversation_messages').insert({
              conversation_id: conversation.id,
              content: thankYouMsg,
              sender_type: 'bot',
              is_internal_note: false,
              metadata: { channel: 'whatsapp', rating_thank_you: true }
            });
            
            await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: senderPhone,
                type: 'text',
                text: { body: thankYouMsg }
              })
            });
            continue;
          }
          
          // If awaiting_rating but user sent freetext (not RATE:N), capture as feedback
          if (conversationMetadata.awaiting_rating && !ratingMatch) {
            console.log(`[whatsapp-webhook] User sent feedback text while awaiting_rating`);
            
            await supabase.from('conversation_ratings').insert({
              conversation_id: conversation.id,
              rating: 3,
              feedback_text: messageContent,
              channel: 'whatsapp',
              language: conversationMetadata.language || 'th'
            });
            
            await supabase.from('conversations').update({
              metadata: { ...conversationMetadata, awaiting_rating: false },
              updated_at: new Date().toISOString()
            }).eq('id', conversation.id);
            
            const convLang = await detectConversationLanguage(supabase, conversation.id);
            const feedbackThankYou = convLang === 'en'
              ? 'Thank you for your feedback! 🙏 We really appreciate it.'
              : 'ขอบคุณสำหรับข้อเสนอแนะค่ะพี่! 🙏 เราจะนำไปปรับปรุงค่ะ';
            
            await supabase.from('conversation_messages').insert({
              conversation_id: conversation.id,
              content: feedbackThankYou,
              sender_type: 'bot',
              is_internal_note: false,
              metadata: { channel: 'whatsapp', feedback_thank_you: true }
            });
            
            await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: senderPhone,
                type: 'text',
                text: { body: feedbackThankYou }
              })
            });
            continue;
          }

          // Check if AI bot should respond
          if (!aiPaused && !conversation.assigned_to) {
            try {
              // Debounce: wait 2s for potential follow-up messages
              const debounceStart = new Date().toISOString();
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Check if a newer customer message arrived during the wait
              const { data: newerMessages } = await supabase
                .from('conversation_messages')
                .select('id')
                .eq('conversation_id', conversation.id)
                .eq('sender_type', 'customer')
                .gt('created_at', debounceStart)
                .limit(1);

              if (newerMessages && newerMessages.length > 0) {
                console.log('[whatsapp-webhook] Newer message exists, skipping AI for this one (debounce)');
                continue;
              }

              const lang = await detectConversationLanguage(supabase, conversation.id);
              
              // Fetch conversation history for context
              const { data: historyMessages } = await supabase
                .from('conversation_messages')
                .select('content, sender_type, created_at')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: false })
                .limit(20);
              
              const sortedHistory = (historyMessages || []).slice().reverse();
              const history = sortedHistory.map(m => ({
                role: m.sender_type === 'customer' ? 'user' : 'assistant',
                content: m.content
              }));
              
              const aiResponse = await fetch(
                `${SUPABASE_URL}/functions/v1/ai-chat-response`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  },
                  body: JSON.stringify({
                    conversationId: conversation.id,
                    contactId: contact.id,
                    message: messageContent,
                    language: lang,
                    channel: 'whatsapp',
                    history: history,
                    chatMode: 'freetext',
                    intent: conversationMetadata.intent || undefined
                  }),
                }
              );

              if (aiResponse.ok) {
                const contentType = aiResponse.headers.get('content-type') || '';
                
                let aiData;
                if (contentType.includes('text/event-stream')) {
                  aiData = await consumeSSEStream(aiResponse);
                } else {
                  aiData = await aiResponse.json();
                }
                
                const aiTextRaw = aiData.response || aiData.message;

                if (aiTextRaw) {
                  // Convert markdown links [text](url) to "text: fullUrl" for WhatsApp
                  const frontendUrl = (Deno.env.get('FRONTEND_URL') || 'https://esimflow-connect.lovable.app').replace(/\/$/, '');
                  const aiText = aiTextRaw.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, text: string, url: string) => {
                    const fullUrl = url.startsWith('http') ? url : `${frontendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                    return `${text}: ${fullUrl}`;
                  });

                  // Send AI response via WhatsApp
                  const waRes = await fetch(
                    `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                      },
                      body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: senderPhone,
                        type: 'text',
                        text: { body: aiText, preview_url: true },
                      }),
                    }
                  );

                  const waData = await waRes.json();
                  console.log('[whatsapp-webhook] AI reply sent:', waRes.status);

                  // Save AI response to DB
                  await supabase.from('conversation_messages').insert({
                    conversation_id: conversation.id,
                    content: aiText,
                    sender_type: 'bot',
                    is_internal_note: false,
                    metadata: {
                      channel: 'whatsapp',
                      whatsapp_message_id: waData.messages?.[0]?.id,
                    },
                  });

                  // === SET DEVICE INCOMPATIBLE FLAG ===
                  if (aiData.deviceIncompatible) {
                    console.log(`[whatsapp-webhook] Device incompatible detected for conv ${conversation.id}`);
                    await supabase.from('conversations').update({
                      metadata: { ...conversation.metadata, device_incompatible: true },
                      updated_at: new Date().toISOString()
                    }).eq('id', conversation.id);
                    conversation.metadata = { ...conversation.metadata, device_incompatible: true };
                  }

                  // === SEND RATING BUTTONS ===
                  if (aiData.requestRating && !aiData.escalate) {
                    console.log(`[whatsapp-webhook] requestRating=true, sending rating buttons`);
                    const convLang = await detectConversationLanguage(supabase, conversation.id);
                    const ratingPrompt = convLang === 'en'
                      ? 'Please rate your experience:'
                      : 'กรุณาให้คะแนนประสบการณ์ของพี่ค่ะ:';
                    
                    // WhatsApp Interactive List message with rating options
                    const ratingRes = await fetch(
                      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                        },
                        body: JSON.stringify({
                          messaging_product: 'whatsapp',
                          to: senderPhone,
                          type: 'interactive',
                          interactive: {
                            type: 'button',
                            body: { text: ratingPrompt },
                            action: {
                              buttons: [
                                { type: 'reply', reply: { id: 'RATE:5', title: '⭐⭐⭐⭐⭐' } },
                                { type: 'reply', reply: { id: 'RATE:3', title: '⭐⭐⭐' } },
                                { type: 'reply', reply: { id: 'RATE:1', title: '⭐' } }
                              ]
                            }
                          }
                        }),
                      }
                    );
                    
                    if (ratingRes.ok) {
                      console.log('[whatsapp-webhook] Rating buttons sent');
                      await supabase.from('conversation_messages').insert({
                        conversation_id: conversation.id,
                        content: ratingPrompt,
                        sender_type: 'bot',
                        is_internal_note: false,
                        metadata: { channel: 'whatsapp', rating_prompt: true }
                      });
                      await supabase.from('conversations').update({
                        metadata: { ...conversationMetadata, awaiting_rating: true },
                        updated_at: new Date().toISOString()
                      }).eq('id', conversation.id);
                    } else {
                      console.error('[whatsapp-webhook] Failed to send rating buttons:', await ratingRes.text());
                    }
                  }

                  // Check if escalation is needed
                  if (aiData.shouldEscalate || aiData.escalate) {
                    console.log('[whatsapp-webhook] Escalating to agent');
                    await supabase
                      .from('conversations')
                      .update({
                        status: 'open',
                        priority: 'high',
                        metadata: {
                          ...conversationMetadata,
                          escalated: true,
                          escalated_at: new Date().toISOString(),
                        },
                      })
                      .eq('id', conversation.id);

                    // Notify agents via LINE group
                    try {
                      await fetch(`${SUPABASE_URL}/functions/v1/notify-line-group`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                        },
                        body: JSON.stringify({
                          conversationId: conversation.id,
                          customerName: senderName,
                          channel: 'whatsapp',
                          messagePreview: messageContent,
                          alertType: 'escalation',
                        }),
                      });
                    } catch (notifyErr) {
                      console.error('[whatsapp-webhook] Notification error:', notifyErr);
                    }
                  }
                }
              } else {
                const errText = await aiResponse.text();
                console.error('[whatsapp-webhook] AI response error:', aiResponse.status, errText);
              }
            } catch (aiError) {
              console.error('[whatsapp-webhook] AI processing error:', aiError);
            }
          }
        }
      }
    }

    // Always return 200 to Meta
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[whatsapp-webhook] Error:', error);
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
