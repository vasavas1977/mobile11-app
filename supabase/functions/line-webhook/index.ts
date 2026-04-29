import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Default to Thai unless ALL recent messages are clearly full English sentences
  const hasThaiChars = recentMessages?.some(
    (m: any) => m.content?.match(/[\u0E00-\u0E7F]/)
  );
  if (hasThaiChars) return 'th';
  
  // Only switch to English if we have messages and they contain full English sentences (3+ words)
  const hasFullEnglish = recentMessages?.some(
    (m: any) => {
      const words = (m.content || '').trim().split(/\s+/).filter((w: string) => /^[a-zA-Z]{2,}/.test(w));
      return words.length >= 3;
    }
  );
  return hasFullEnglish ? 'en' : 'th';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-line-signature',
};

interface LineEvent {
  type: string;
  replyToken?: string;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
  message?: {
    type: string;
    id: string;
    text?: string;
    packageId?: string;
    stickerId?: string;
  };
  postback?: {
    data: string;
  };
}

interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

async function verifySignature(body: string, signature: string, channelSecret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = encoder.encode(channelSecret);
  const message = encoder.encode(body);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, message);
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
  return signature === expectedSignature;
}

async function getLineUserProfile(userId: string, accessToken: string) {
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching LINE profile:', error);
    return null;
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
            // Use the sanitized content from the 'done' event (has real URLs, not placeholders)
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (!channelSecret || !accessToken) {
      console.error('LINE credentials not configured');
      return new Response(JSON.stringify({ error: 'LINE credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get signature from header
    const signature = req.headers.get('x-line-signature');
    if (!signature) {
      console.error('Missing LINE signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Read body as text for signature verification
    const bodyText = await req.text();
    console.log('Received LINE webhook:', bodyText);

    // Verify signature
    const isValid = await verifySignature(bodyText, signature, channelSecret);
    if (!isValid) {
      console.error('Invalid LINE signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse body
    const body: LineWebhookBody = JSON.parse(bodyText);
    console.log('LINE events:', JSON.stringify(body.events, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each event
    for (const event of body.events) {
      // Handle text and sticker messages
      // Skip group/room messages — only process 1:1 direct messages
      if (event.source?.type === 'group' || event.source?.type === 'room') {
        console.log(`Skipping ${event.source.type} message — bot should not respond in groups/rooms`);
        continue;
      }

      if (event.type === 'message' && (event.message?.type === 'text' || event.message?.type === 'sticker') && event.source.userId) {
        const lineUserId = event.source.userId;
        const isSticker = event.message.type === 'sticker';
        const messageText = isSticker ? '[Sticker]' : (event.message.text || '');

        console.log(`Processing ${isSticker ? 'sticker' : 'text'} message from LINE user ${lineUserId}`);

        // Get LINE user profile
        const profile = await getLineUserProfile(lineUserId, accessToken);
        console.log('LINE profile:', profile);

        // Find or create contact
        let contact;
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('*')
          .eq('line_id', lineUserId)
          .single();

        if (existingContact) {
          contact = existingContact;
          // Update profile info if changed
          if (profile && (contact.name !== profile.displayName || contact.line_picture_url !== profile.pictureUrl)) {
            await supabase
              .from('contacts')
              .update({
                name: profile.displayName || contact.name,
                line_display_name: profile.displayName,
                line_picture_url: profile.pictureUrl,
                metadata: {
                  ...contact.metadata,
                  line_display_name: profile.displayName,
                  line_picture_url: profile.pictureUrl
                }
              })
              .eq('id', contact.id);
          }
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              line_id: lineUserId,
              name: profile?.displayName || `LINE User ${lineUserId.slice(-6)}`,
              line_display_name: profile?.displayName,
              line_picture_url: profile?.pictureUrl,
              metadata: {
                line_display_name: profile?.displayName,
                line_picture_url: profile?.pictureUrl
              }
            })
            .select()
            .single();

          if (contactError) {
            console.error('Error creating contact:', contactError);
            continue;
          }
          contact = newContact;
        }

        // Find or create conversation
        let conversation;
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('contact_id', contact.id)
          .eq('channel', 'line')
          .in('status', ['open', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingConversation) {
          conversation = existingConversation;
          // Update metadata with latest reply token
          // Reset follow_up_count when customer replies (stops dead air cycle)
          const existingMeta = (existingConversation.metadata || {}) as Record<string, any>;
          const { follow_up_count: _fu, last_follow_up_at: _lf, ...cleanMeta } = existingMeta;
          await supabase
            .from('conversations')
            .update({
              updated_at: new Date().toISOString(),
              metadata: {
                ...cleanMeta,
                follow_up_count: 0,
                line_user_id: lineUserId,
                reply_token: event.replyToken
              }
            })
            .eq('id', conversation.id);

          // ═══ IDLE DETECTION: Welcome-back prompt after 1 hour ═══
          const IDLE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
          if (!conversation.metadata?.welcome_back_pending && !conversation.metadata?.intent_pending) {
            const { data: lastMsg } = await supabase
              .from('conversation_messages')
              .select('created_at')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastMsg) {
              const idleMs = Date.now() - new Date(lastMsg.created_at).getTime();
              if (idleMs > IDLE_THRESHOLD_MS) {
                console.log(`LINE user idle for ${Math.round(idleMs / 60000)} min, sending welcome-back prompt`);
                const welcomeBackMsg = 'ยินดีต้อนรับกลับมาค่ะพี่! 😊 ต้องการดำเนินการอย่างไรดีคะ?';

                // Save to DB
                await supabase.from('conversation_messages').insert({
                  conversation_id: conversation.id,
                  sender_type: 'bot',
                  content: welcomeBackMsg,
                  is_internal_note: false,
                  metadata: { ai_auto_response: true, channel: 'line', welcome_back_prompt: true }
                });

                // Send via LINE with Quick Reply buttons
                await fetch('https://api.line.me/v2/bot/message/push', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify({
                    to: lineUserId,
                    messages: [{
                      type: 'text',
                      text: welcomeBackMsg,
                      quickReply: {
                        items: [
                          {
                            type: 'action',
                            action: { type: 'message', label: '🔄 คุยต่อจากเดิม', text: 'คุยต่อจากเดิม' }
                          },
                          {
                            type: 'action',
                            action: { type: 'message', label: '✨ เริ่มใหม่', text: 'เริ่มใหม่' }
                          }
                        ]
                      }
                    }]
                  })
                });

                // Set welcome_back_pending flag
                await supabase.from('conversations').update({
                  metadata: { ...conversation.metadata, welcome_back_pending: true },
                  updated_at: new Date().toISOString()
                }).eq('id', conversation.id);
                conversation.metadata = { ...conversation.metadata, welcome_back_pending: true };

                // Save the customer's original message but skip AI
                await supabase.from('conversation_messages').insert({
                  conversation_id: conversation.id,
                  sender_type: 'customer',
                  content: messageText,
                  is_internal_note: false,
                  metadata: { line_message_id: event.message.id, line_timestamp: event.timestamp }
                });
                continue; // Skip further processing
              }
            }
          }

          // ═══ WELCOME BACK RESPONSE HANDLING ═══
          if (conversation.metadata?.welcome_back_pending) {
            const trimmedText = messageText.trim();
            const isContinue = /^(คุยต่อจากเดิม|continue|ต่อ)$/i.test(trimmedText);
            const isFresh = /^(เริ่มใหม่|start new|ใหม่)$/i.test(trimmedText);

            if (isContinue) {
              console.log('LINE user chose to continue previous conversation');
              await supabase.from('conversations').update({
                metadata: { ...conversation.metadata, welcome_back_pending: false },
                updated_at: new Date().toISOString()
              }).eq('id', conversation.id);
              conversation.metadata = { ...conversation.metadata, welcome_back_pending: false };

              const continueMsg = 'ยินดีค่ะพี่! 😊 มีอะไรให้น้องช่วยต่อคะ?';
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id, sender_type: 'bot', content: continueMsg,
                is_internal_note: false, metadata: { ai_auto_response: true, channel: 'line', welcome_back_continue: true }
              });
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: continueMsg }] })
              });
              continue;
            } else if (isFresh) {
              console.log('LINE user chose to start fresh');
              // Insert context reset marker
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id, sender_type: 'system', content: '[CONTEXT_RESET]',
                is_internal_note: false, metadata: { context_reset: true }
              });
              // Clear flags and set intent_pending for fresh start
              await supabase.from('conversations').update({
                metadata: { ...conversation.metadata, welcome_back_pending: false, intent_pending: true, intent: null, ai_paused: false },
                updated_at: new Date().toISOString()
              }).eq('id', conversation.id);
              conversation.metadata = { ...conversation.metadata, welcome_back_pending: false, intent_pending: true, intent: null, ai_paused: false };

              // Send intent selection (Sales/Support)
              const intentGreeting = 'เริ่มใหม่เลยนะคะพี่! 🌏✨ น้องช่วยอะไรพี่ได้คะ?';
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id, sender_type: 'bot', content: intentGreeting,
                is_internal_note: false, metadata: { ai_auto_response: true, channel: 'line', intent_greeting: true }
              });
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({
                  to: lineUserId,
                  messages: [{
                    type: 'text',
                    text: intentGreeting,
                    quickReply: {
                      items: [
                        { type: 'action', action: { type: 'message', label: '🛒 ซื้อ eSIM', text: 'ซื้อ eSIM' } },
                        { type: 'action', action: { type: 'message', label: '🙋 ช่วยเหลือ', text: 'ช่วยเหลือ' } }
                      ]
                    }
                  }]
                })
              });
              continue;
            } else {
              // Freetext while welcome_back_pending - treat as continue
              console.log('LINE user sent freetext while welcome_back_pending, treating as continue');
              await supabase.from('conversations').update({
                metadata: { ...conversation.metadata, welcome_back_pending: false },
                updated_at: new Date().toISOString()
              }).eq('id', conversation.id);
              conversation.metadata = { ...conversation.metadata, welcome_back_pending: false };
              // Fall through to normal processing
            }
          }
        } else {
          // Create new conversation
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              contact_id: contact.id,
              channel: 'line',
              status: 'open',
              priority: 'medium',
              subject: `LINE Chat - ${profile?.displayName || 'User'}`,
              metadata: {
                line_user_id: lineUserId,
                reply_token: event.replyToken
              }
            })
            .select()
            .single();

          if (convError) {
            console.error('Error creating conversation:', convError);
            continue;
          }
          conversation = newConversation;

          // ═══ NEW CONVERSATION: Send Intent Selection Quick Replies ═══
          console.log('New LINE conversation - sending intent selection quick replies');
          const intentGreeting = 'สวัสดีค่ะพี่! 🌏✨ น้องช่วยอะไรพี่ได้คะ?';
          
          // Save greeting to DB
          await supabase.from('conversation_messages').insert({
            conversation_id: conversation.id,
            sender_type: 'bot',
            content: intentGreeting,
            is_internal_note: false,
            metadata: { ai_auto_response: true, channel: 'line', intent_greeting: true }
          });
          
          // Send via LINE Push API with Quick Reply buttons
          await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              to: lineUserId,
              messages: [{
                type: 'text',
                text: intentGreeting,
                quickReply: {
                  items: [
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '🛒 ซื้อ eSIM',
                        text: 'ซื้อ eSIM'
                      }
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '🙋 ช่วยเหลือ',
                        text: 'ช่วยเหลือ'
                      }
                    }
                  ]
                }
              }]
            })
          });
          
          // Set intent_pending in metadata
          await supabase
            .from('conversations')
            .update({
              metadata: { ...conversation.metadata, intent_pending: true },
              updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id);
          conversation.metadata = { ...conversation.metadata, intent_pending: true };
          continue; // Skip further processing for this first message
        }

        // Build message metadata
        const messageMetadata: Record<string, any> = {
          line_message_id: event.message.id,
          line_timestamp: event.timestamp
        };

        // Add sticker info if it's a sticker message
        if (isSticker && event.message.packageId && event.message.stickerId) {
          messageMetadata.sticker = {
            packageId: event.message.packageId,
            stickerId: event.message.stickerId
          };
        }

        // Insert message
        const { error: msgError } = await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversation.id,
            sender_type: 'customer',
            content: messageText,
            is_internal_note: false,
            metadata: messageMetadata
          });

        if (msgError) {
          console.error('Error inserting message:', msgError);
        } else {
          console.log(`Message saved for conversation ${conversation.id}`);

          // ═══ NOTIFY AGENTS for every incoming customer message ═══
          try {
            await fetch(`${supabaseUrl}/functions/v1/notify-agents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                conversationId: conversation.id,
                messagePreview: messageText,
                channel: 'line',
                senderName: contact?.name || contact?.line_display_name || 'Customer'
              })
            });
            console.log('Agents notified of new LINE message');
          } catch (notifyErr) {
            console.error('Failed to notify agents:', notifyErr);
          }
          
           // === RATING RESPONSE DETECTION ===
          // Check if user sent a rating (RATE:1-5) while awaiting_rating
          const ratingMatch = messageText.match(/^RATE:([1-5])$/);
          if (ratingMatch && conversation.metadata?.awaiting_rating) {
            const rating = parseInt(ratingMatch[1]);
            console.log(`LINE user rated conversation ${conversation.id} with ${rating} stars`);
            
            // Save rating
            await supabase.from('conversation_ratings').insert({
              conversation_id: conversation.id,
              rating,
              channel: 'line',
              language: conversation.metadata?.language || 'th'
            });
            
            // Clear awaiting_rating flag
            await supabase.from('conversations').update({
              metadata: { ...conversation.metadata, awaiting_rating: false },
              updated_at: new Date().toISOString()
            }).eq('id', conversation.id);
            
            // Send thank you
            const convLang = await detectConversationLanguage(supabase, conversation.id);
            const thankYouMsg = convLang === 'en'
              ? `Thank you for your ${rating}-star rating! 🙏 Your feedback helps us improve.`
              : `ขอบคุณสำหรับคะแนน ${rating} ดาวค่ะพี่! 🙏 ข้อเสนอแนะของพี่ช่วยให้เราปรับปรุงได้ค่ะ`;
            
            await supabase.from('conversation_messages').insert({
              conversation_id: conversation.id,
              sender_type: 'bot',
              content: thankYouMsg,
              is_internal_note: false,
              metadata: { ai_auto_response: true, channel: 'line', rating_thank_you: true }
            });
            
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
              body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: thankYouMsg }] })
            });
            
            continue; // Skip AI processing
          }
          
          // If awaiting_rating but user sent freetext (not RATE:N), capture as feedback
          if (conversation.metadata?.awaiting_rating && !ratingMatch) {
            console.log(`LINE user sent feedback text while awaiting_rating: ${messageText.slice(0, 50)}`);
            
            // Save as feedback with a default rating of 0 (text-only feedback)
            await supabase.from('conversation_ratings').insert({
              conversation_id: conversation.id,
              rating: 3, // neutral default when only text feedback
              feedback_text: messageText,
              channel: 'line',
              language: conversation.metadata?.language || 'th'
            });
            
            // Clear awaiting_rating flag
            await supabase.from('conversations').update({
              metadata: { ...conversation.metadata, awaiting_rating: false },
              updated_at: new Date().toISOString()
            }).eq('id', conversation.id);
            
            const convLang = await detectConversationLanguage(supabase, conversation.id);
            const feedbackThankYou = convLang === 'en'
              ? 'Thank you for your feedback! 🙏 We really appreciate it.'
              : 'ขอบคุณสำหรับข้อเสนอแนะค่ะพี่! 🙏 เราจะนำไปปรับปรุงค่ะ';
            
            await supabase.from('conversation_messages').insert({
              conversation_id: conversation.id,
              sender_type: 'bot',
              content: feedbackThankYou,
              is_internal_note: false,
              metadata: { ai_auto_response: true, channel: 'line', feedback_thank_you: true }
            });
            
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
              body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: feedbackThankYou }] })
            });
            
            continue; // Skip AI processing
          }

           // === AI CHATBOT INTEGRATION ===
          try {
            const AI_ENABLED_FOR_LINE = true;
            
            // === RESUME BOT DETECTION ===
            // Check if user wants to talk to bot again (resume AI)
            const resumeBotPatterns = /^(talk to bot|chatbot|chat bot|bot help|คุยกับบอท|บอท|bot|ai)$/i;
            const isResumeRequest = resumeBotPatterns.test(messageText.trim());
            
            if (isResumeRequest && conversation.metadata?.ai_paused) {
              console.log('User requested to resume AI bot, clearing ai_paused flag');
              await supabase
                .from('conversations')
                .update({
                  metadata: { ...conversation.metadata, ai_paused: false },
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversation.id);
              // Update local reference
              conversation.metadata.ai_paused = false;
              
              // Send a welcome-back message
              const convLang = await detectConversationLanguage(supabase, conversation.id);
              const resumeMsg = convLang === 'th'
                ? 'กลับมาแล้วค่ะพี่! 😊 มีอะไรให้ช่วยไหมคะ?'
                : 'I\'m back! 😊 How can I help you?';
              
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: resumeMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'line', bot_resumed: true }
              });
              
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                  to: lineUserId,
                  messages: [{ type: 'text', text: resumeMsg }]
                })
              });
              
              continue; // Skip normal AI processing for this message
            }
            
            // === INTENT PENDING CHECK ===
            if (conversation.metadata?.intent_pending) {
              const trimmedText = messageText.trim().toLowerCase();
              const isSalesIntent = /^(ซื้อ\s*e?sim|buy\s*e?sim|ซื้อ)$/i.test(trimmedText);
              const isSupportIntent = /^(ช่วยเหลือ|support|help)$/i.test(trimmedText);
              
              if (isSalesIntent) {
                console.log('LINE user selected Sales intent via text');
                await supabase.from('conversations').update({
                  metadata: { ...conversation.metadata, intent_pending: false, intent: 'sales' },
                  updated_at: new Date().toISOString()
                }).eq('id', conversation.id);
                conversation.metadata = { ...conversation.metadata, intent_pending: false, intent: 'sales' };
                
                const salesMsg = 'ยินดีค่ะพี่! 🛒 บอกน้องได้เลยนะคะว่าพี่จะไปประเทศไหน น้องจะแนะนำแพ็กเกจที่คุ้มที่สุดให้ค่ะ 😊';
                await supabase.from('conversation_messages').insert({
                  conversation_id: conversation.id, sender_type: 'bot', content: salesMsg,
                  is_internal_note: false, metadata: { ai_auto_response: true, channel: 'line', intent_response: 'sales' }
                });
                await fetch('https://api.line.me/v2/bot/message/push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                  body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: salesMsg }] })
                });
                continue;
              } else if (isSupportIntent) {
                console.log('LINE user selected Support intent via text');
                await supabase.from('conversations').update({
                  metadata: { ...conversation.metadata, intent_pending: false, intent: 'support' },
                  updated_at: new Date().toISOString()
                }).eq('id', conversation.id);
                conversation.metadata = { ...conversation.metadata, intent_pending: false, intent: 'support' };
                
                const supportMsg = 'ได้เลยค่ะพี่! 🙋 บอกน้องได้เลยนะคะว่ามีปัญหาอะไร น้องจะพยายามช่วยค่ะ\n\nหากพี่ต้องการคุยกับเจ้าหน้าที่จริง พิมพ์ \'agent\' ได้เลยนะคะ 😊';
                await supabase.from('conversation_messages').insert({
                  conversation_id: conversation.id, sender_type: 'bot', content: supportMsg,
                  is_internal_note: false, metadata: { ai_auto_response: true, channel: 'line', intent_response: 'support' }
                });
                await fetch('https://api.line.me/v2/bot/message/push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                  body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: supportMsg }] })
                });
                continue;
              } else {
                // Freetext while intent_pending - default to sales
                console.log('LINE user sent freetext while intent_pending, defaulting to sales');
                await supabase.from('conversations').update({
                  metadata: { ...conversation.metadata, intent_pending: false, intent: 'sales' },
                  updated_at: new Date().toISOString()
                }).eq('id', conversation.id);
                conversation.metadata = { ...conversation.metadata, intent_pending: false, intent: 'sales' };
                // Fall through to AI processing
              }
            }
            
            // === AI PAUSED CHECK (with auto-resume: 60min for escalated, 5min for agent_replied, NEVER for manual_agent_toggle) ===
            if (conversation.metadata?.ai_paused) {
              const pausedAt = conversation.metadata?.ai_paused_at;
              const pauseReason = conversation.metadata?.ai_paused_reason;
              const isManualAgentPause = pauseReason === 'manual_agent_toggle';
              const isEscalated = pauseReason === 'customer_requested_human' || pauseReason === 'customer_requested_human_menu' || pauseReason === 'escalated';

              if (isManualAgentPause) {
                // Agent manually toggled bot off — NEVER auto-resume, agent must re-enable manually
                console.log(`AI paused manually by agent for conversation ${conversation.id}, will NOT auto-resume`);
                continue; // Message is already saved, human agent will respond
              } else {
                const timeoutMs = isEscalated ? 60 * 60 * 1000 : 5 * 60 * 1000;
                const shouldAutoResume = pausedAt && (Date.now() - new Date(pausedAt).getTime()) > timeoutMs;

                if (shouldAutoResume) {
                  const timeoutMin = Math.round(timeoutMs / 60000);
                  console.log(`AI paused for >${timeoutMin} min (reason: ${pauseReason}), auto-resuming for conversation ${conversation.id}`);
                  const resumedMetadata = { ...conversation.metadata, ai_paused: false, ai_paused_at: null, ai_paused_reason: null };
                  await supabase
                    .from('conversations')
                    .update({ metadata: resumedMetadata, updated_at: new Date().toISOString() })
                    .eq('id', conversation.id);
                  conversation.metadata = resumedMetadata;
                  // Fall through to AI processing
                } else {
                  console.log(`AI paused for conversation ${conversation.id} (reason: ${pauseReason}), skipping AI response (human agent handling)`);
                  
                  // (notify-agents already called above for every message)
                  
                  continue; // Message is already saved, human agent will respond
                }
              }
            }
            
            // Process AI response for text messages and stickers
            if (AI_ENABLED_FOR_LINE) {
              console.log('Calling AI chat response for LINE message...');
              
              // Fetch conversation history for context (LAST 20 messages, most recent)
              const { data: historyMessages } = await supabase
                .from('conversation_messages')
                .select('content, sender_type, created_at')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: false })  // Get newest first
                .limit(20);
              
              // Reverse to chronological order (oldest first for AI context)
              const sortedHistory = (historyMessages || []).slice().reverse();
              
              // Diagnostic log: confirm we have the right context window
              console.log('History context:', {
                conversationId: conversation.id,
                messageCount: sortedHistory.length,
                firstMsgTime: sortedHistory[0]?.created_at,
                lastMsgTime: sortedHistory[sortedHistory.length - 1]?.created_at,
                lastAssistantMsg: sortedHistory.filter(m => m.sender_type !== 'customer').pop()?.content?.slice(0, 50)
              });
              
              // Prepare history for AI
              const history = sortedHistory.map(m => ({
                role: m.sender_type === 'customer' ? 'user' : 'assistant',
                content: m.content
              }));
              
              // NOTE: Language detection is delegated to ai-chat-response
              // This prevents short messages like "7" or "Yes" from switching language
              // The ai-chat-response function uses history-based detection which is more reliable
              
              // Call ai-chat-response edge function
              const aiResponse = await fetch(
                `${supabaseUrl}/functions/v1/ai-chat-response`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`
                  },
                   body: JSON.stringify({
                    message: messageText,
                    conversationId: conversation.id,
                    contactId: contact.id,
                    history: history,
                    chatMode: 'freetext',
                    channel: 'line',
                    intent: conversation.metadata?.intent || undefined
                  })
                }
              );
              
              if (aiResponse.ok) {
                // Check if it's an SSE stream or JSON response
                const contentType = aiResponse.headers.get('content-type') || '';
                
                let aiResult;
                if (contentType.includes('text/event-stream')) {
                  // Consume SSE stream from ai-chat-response
                  aiResult = await consumeSSEStream(aiResponse);
                } else {
                  // Fallback to JSON for backward compatibility
                  aiResult = await aiResponse.json();
                }
                
                console.log('AI response received:', { 
                  hasResponse: !!aiResult.response, 
                  escalate: aiResult.escalate,
                  confidence: aiResult.confidence,
                  streamingUsed: contentType.includes('text/event-stream')
                });
                
                 if (aiResult.response) {
                   // IMPORTANT: Save bot message BEFORE pushing to LINE to avoid race conditions.
                   // If the user replies quickly (e.g., "7"), we need the latest bot question in DB
                   // so ai-chat-response can preserve Germany instead of falling back to older Japan context.
                   const botMetadataBase = {
                     ai_auto_response: true,
                     ai_confidence: aiResult.confidence,
                     escalated: aiResult.escalate || false,
                     channel: 'line',
                     send_status: 'pending'
                   };

                   // Minimal diagnostic (no full content): helps confirm what we are about to send
                   console.log('Preparing LINE bot reply:', {
                     conversationId: conversation.id,
                     preview: aiResult.response.slice(0, 60),
                     confidence: aiResult.confidence
                   });

                   const { data: savedBotMsg, error: saveBotMsgError } = await supabase
                     .from('conversation_messages')
                     .insert({
                       conversation_id: conversation.id,
                       sender_type: 'bot',
                       content: aiResult.response,
                       is_internal_note: false,
                       metadata: botMetadataBase
                     })
                     .select('id')
                     .single();

                   if (saveBotMsgError) {
                     console.error('Error saving AI response (pre-send):', saveBotMsgError);
                   }

                   // Send AI response via LINE Push API immediately (no delay)
                   const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
                     method: 'POST',
                     headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${accessToken}`
                     },
                     body: JSON.stringify({
                       to: lineUserId,
                       messages: [{ type: 'text', text: aiResult.response }]
                     })
                   });
                   
                   if (lineResponse.ok) {
                     console.log('AI response sent to LINE user successfully');

                     // Mark DB message as sent (if we managed to save it)
                     if (savedBotMsg?.id) {
                       const { error: markSentError } = await supabase
                         .from('conversation_messages')
                         .update({
                           metadata: {
                             ...botMetadataBase,
                             send_status: 'sent',
                             sent_via: 'line_push_api'
                           }
                         })
                         .eq('id', savedBotMsg.id);

                       if (markSentError) {
                         console.error('Error updating bot message send_status=sent:', markSentError);
                       }
                     }
                    
                    // Handle escalation - pause AI and notify human agents
                    if (aiResult.escalate) {
                      console.log('AI flagged for escalation, pausing AI and updating conversation status');
                      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
                      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
                      await supabase
                        .from('conversations')
                        .update({ 
                          status: 'open', 
                          priority: 'high',
                          metadata: {
                            ...conversation.metadata,
                            ai_paused: true,
                            ai_paused_at: new Date().toISOString(),
                            ai_paused_reason: 'customer_requested_human',
                            helper_summary_sent: false
                          },
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', conversation.id);

                      // Trigger Agent Helper Bot summary
                      try {
                        await fetch(`${supabaseUrl}/functions/v1/agent-helper-summary`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ conversationId: conversation.id })
                        });
                        console.log('Agent helper summary triggered for conversation', conversation.id);
                      } catch (helperError) {
                        console.error('Failed to trigger agent helper summary:', helperError);
                      }
                      
                      // Notify agents about escalation
                      try {
                        await fetch(`${supabaseUrl}/functions/v1/notify-agents`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            conversationId: conversation.id,
                            messagePreview: '🚨 Customer requested human agent',
                            channel: 'line',
                            senderName: contact?.name || contact?.line_display_name || 'Customer'
                          })
                        });
                      } catch (notifyErr) {
                        console.error('Failed to notify agents about escalation:', notifyErr);
                      }

                      // Notify LINE group about escalation
                      try {
                        await fetch(`${supabaseUrl}/functions/v1/notify-line-group`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            conversationId: conversation.id,
                            customerName: contact?.name || contact?.line_display_name || 'Customer',
                            channel: 'line',
                            messagePreview: messageText?.substring(0, 80) || 'Customer requested agent'
                          })
                        });
                      } catch (lineGroupErr: any) {
                        console.error('Failed to notify LINE group:', lineGroupErr);
                      }
                    }
                    
                    // === SET DEVICE INCOMPATIBLE FLAG ===
                    if (aiResult.deviceIncompatible) {
                      console.log(`[line-webhook] Device incompatible detected for conv ${conversation.id}`);
                      await supabase.from('conversations').update({
                        metadata: { ...conversation.metadata, device_incompatible: true },
                        updated_at: new Date().toISOString()
                      }).eq('id', conversation.id);
                      // Refresh metadata for subsequent updates
                      conversation.metadata = { ...conversation.metadata, device_incompatible: true };
                    }
                    
                    // === SEND RATING QUICK REPLY BUTTONS ===
                    if (aiResult.requestRating && !aiResult.escalate) {
                      console.log(`requestRating=true for conversation ${conversation.id}, sending rating Quick Reply`);
                      const convLang = await detectConversationLanguage(supabase, conversation.id);
                      const ratingPrompt = convLang === 'en'
                        ? 'Please rate your experience:'
                        : 'กรุณาให้คะแนนประสบการณ์ของพี่ค่ะ:';
                      
                      const ratingResponse = await fetch('https://api.line.me/v2/bot/message/push', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                          to: lineUserId,
                          messages: [{
                            type: 'text',
                            text: ratingPrompt,
                            quickReply: {
                              items: [1, 2, 3, 4, 5].map(n => ({
                                type: 'action',
                                action: {
                                  type: 'message',
                                  label: '⭐'.repeat(n),
                                  text: `RATE:${n}`
                                }
                              }))
                            }
                          }]
                        })
                      });
                      
                      if (ratingResponse.ok) {
                        console.log('Rating Quick Reply sent successfully');
                        // Save rating prompt message to DB
                        await supabase.from('conversation_messages').insert({
                          conversation_id: conversation.id,
                          sender_type: 'bot',
                          content: ratingPrompt,
                          is_internal_note: false,
                          metadata: { ai_auto_response: true, channel: 'line', rating_prompt: true }
                        });
                        // Mark conversation as awaiting rating
                        await supabase.from('conversations').update({
                          metadata: { ...conversation.metadata, awaiting_rating: true },
                          updated_at: new Date().toISOString()
                        }).eq('id', conversation.id);
                      } else {
                        console.error('Failed to send rating Quick Reply:', await ratingResponse.text());
                      }
                    }
                  } else {
                    const lineError = await lineResponse.text();
                    console.error('Failed to send AI response to LINE:', lineResponse.status, lineError);

                     // Mark DB message as failed (if we saved it)
                     if (savedBotMsg?.id) {
                       const { error: markFailedError } = await supabase
                         .from('conversation_messages')
                         .update({
                           metadata: {
                             ...botMetadataBase,
                             send_status: 'failed',
                             line_status: lineResponse.status
                           }
                         })
                         .eq('id', savedBotMsg.id);

                       if (markFailedError) {
                         console.error('Error updating bot message send_status=failed:', markFailedError);
                       }
                     }
                  }
                } else {
                  // AI returned empty response — send a fallback so customer isn't left hanging
                  console.warn(`AI returned empty response for conversation ${conversation.id}, sending fallback`);
                  const fallbackText = conversation.metadata?.language === 'en'
                    ? "Sorry, I couldn't process that. Could you please rephrase? Or type 'agent' to speak with a human 😊"
                    : "ขอโทษค่ะ น้องไม่สามารถประมวลผลได้ในตอนนี้ ลองพิมพ์ใหม่อีกครั้งนะคะ หรือพิมพ์ 'agent' เพื่อคุยกับเจ้าหน้าที่ค่ะ 😊";
                  
                  // Save fallback message
                  await supabase
                    .from('conversation_messages')
                    .insert({
                      conversation_id: conversation.id,
                      sender_type: 'bot',
                      content: fallbackText,
                      is_internal_note: false,
                      metadata: { ai_auto_response: true, fallback: true, channel: 'line', send_status: 'pending' }
                    });

                  // Send fallback to LINE
                  try {
                    await fetch('https://api.line.me/v2/bot/message/push', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                      },
                      body: JSON.stringify({
                        to: lineUserId,
                        messages: [{ type: 'text', text: fallbackText }]
                      })
                    });
                    console.log('Fallback message sent to LINE user');
                  } catch (lineErr) {
                    console.error('Failed to send fallback to LINE:', lineErr);
                  }
                }
              } else {
                const aiError = await aiResponse.text();
                console.error('AI chat response failed:', aiResponse.status, aiError);
              }
            }
          } catch (aiError) {
            // Don't fail the webhook if AI response fails - message is still saved for human follow-up
            console.error('AI chatbot integration error:', aiError);
          }
        }
      } else if (event.type === 'follow' && event.source.userId) {
        // User added the bot - create/update contact
        const lineUserId = event.source.userId;
        const profile = await getLineUserProfile(lineUserId, accessToken);

        const { data: existingContact } = await supabase
          .from('contacts')
          .select('*')
          .eq('line_id', lineUserId)
          .single();

        if (!existingContact) {
          await supabase.from('contacts').insert({
            line_id: lineUserId,
            name: profile?.displayName || `LINE User ${lineUserId.slice(-6)}`,
            line_display_name: profile?.displayName,
            line_picture_url: profile?.pictureUrl,
            metadata: {
              line_display_name: profile?.displayName,
              line_picture_url: profile?.pictureUrl
            }
          });
        }
        console.log(`LINE user ${lineUserId} followed the bot`);
      } else if (event.type === 'unfollow' && event.source.userId) {
        console.log(`LINE user ${event.source.userId} unfollowed the bot`);
      } else if (event.type === 'join' && event.source.type === 'group') {
        // Bot was added to a new group — auto-update the alert group ID
        const newGroupId = event.source.groupId;
        console.log(`Bot joined LINE group: ${newGroupId}, updating system_config`);
        
        const { error: configErr } = await supabase
          .from('system_config')
          .upsert({ key: 'line_alert_group_id', value: newGroupId, updated_at: new Date().toISOString() });
        
        if (configErr) {
          console.error('Failed to update line_alert_group_id:', configErr);
        } else {
          console.log('line_alert_group_id updated to:', newGroupId);
          
          // Send confirmation message to the new group
          const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
          if (LINE_CHANNEL_ACCESS_TOKEN) {
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
              },
              body: JSON.stringify({
                to: newGroupId,
                messages: [{ type: 'text', text: '✅ This group is now set as the escalation alert group. Agent requests will be notified here.' }],
              }),
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('LINE webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
