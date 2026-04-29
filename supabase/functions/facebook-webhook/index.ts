import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookMessagingEntry {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    quick_reply?: {
      payload: string;
    };
    attachments?: Array<{
      type: string;
      payload: { url?: string; sticker_id?: number };
    }>;
  };
  postback?: {
    payload: string;
    title?: string;
  };
}

interface FacebookFeedChange {
  field: string;
  value: {
    item: string;
    comment_id: string;
    parent_id?: string;
    post_id?: string;
    verb: string;
    from: { id: string; name?: string };
    message?: string;
    created_time: number;
  };
}

interface FacebookWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging?: FacebookMessagingEntry[];
    standby?: FacebookMessagingEntry[];
    changes?: FacebookFeedChange[];
  }>;
}

// Extract markdown links from text: returns [{text, url}]
// Handles both absolute and relative URLs
function extractMarkdownLinks(text: string): Array<{text: string; url: string}> {
  const links: Array<{text: string; url: string}> = [];
  const regex = /\[([^\]]+)\]\(((?:https?:\/\/[^)\s]+|\/[\w\-\/\?&=%.]+))\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let url = match[2];
    // Convert relative URLs to absolute
    if (url.startsWith('/')) {
      url = `https://mobile11.com${url}`;
    }
    links.push({ text: match[1], url });
  }
  return links;
}

// Strip Markdown for Facebook Messenger (plain text only)
// When stripLinks=true, markdown links are removed entirely (shown as buttons instead)
function stripMarkdownForMessenger(text: string, stripLinks = false): string {
  let result = text
    .replace(/\(?\{\{[A-Z_0-9]+\}\}\)?/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s*\|\s*(?=\s*$|\s*\n)/gm, '')
    .replace(/^\s*\|\s*/gm, '')
    .replace(/\s*\|\s*$/gm, '');

  // Convert relative URLs to absolute before processing links
  result = result.replace(
    /\[([^\]]+)\]\(\/([\w\-\/\?&=%.]+)\)/g,
    (_, linkText, path) => `[${linkText}](https://mobile11.com/${path})`
  );
  
  // Also catch malformed links like: text(/esim/country) or text (/esim/country)
  result = result.replace(
    /([^\[\(])\s*\(\/(esim\/[\w\-]+)\)/g,
    (_, before, path) => `${before} 👉 https://mobile11.com/${path}`
  );

  if (stripLinks) {
    // Remove markdown links entirely (they'll be shown as buttons)
    result = result
      .replace(/\s*\|\s*/g, '\n') // Convert pipe separators to newlines before removing links
      .replace(/[•\-]\s*\[([^\]]+)\]\(https?:\/\/[^)\s]+\)/g, '') // bullet + link
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)\s]+\)/g, '') // standalone link
      .replace(/\[([^\]]+)\]\(https?:\/\/[^\s]+/g, '');
  } else {
    result = result
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1: $2')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s]+)/g, '$1: $2');
  }

  return result
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[•\-]\s*$/gm, '') // Remove empty bullet points
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Determine which "Option" block a link belongs to and extract package type
function getDescriptiveButtonTitle(aiResponse: string, link: {text: string; url: string}, linkIndex: number): string {
  const linkPos = aiResponse.indexOf(link.url);
  if (linkPos === -1) return link.text.slice(0, 20);

  // Get text context before this link (up to 500 chars back)
  const contextBefore = aiResponse.slice(Math.max(0, linkPos - 500), linkPos);

  // Detect Option number (1 or 2)
  const optionMatch = contextBefore.match(/(?:Option|ตัวเลือก(?:ที่)?)\s*(\d)/gi);
  const optionNum = optionMatch ? optionMatch[optionMatch.length - 1].match(/(\d)/)?.[1] : null;

  // Extract package type keywords from context - find the CLOSEST match to the link
  const packageTypes = [
    { pattern: /Day\s*Pass/gi, label: 'DayPass' },
    { pattern: /Limitless/gi, label: 'Limitless' },
    { pattern: /Max\s*Speed/gi, label: 'MaxSpeed' },
    { pattern: /Unlimited/gi, label: 'Unlimited' },
  ];

  let pkgLabel = '';
  let closestPos = -1;
  for (const pt of packageTypes) {
    let match;
    let lastPos = -1;
    while ((match = pt.pattern.exec(contextBefore)) !== null) {
      lastPos = match.index;
    }
    if (lastPos > closestPos) {
      closestPos = lastPos;
      pkgLabel = pt.label;
    }
  }

  // Extract data amount if present (e.g., "5GB", "1GB/day", "500MB")
  const dataMatch = contextBefore.match(/(\d+(?:\.\d+)?\s*(?:GB|MB)(?:\/(?:day|วัน))?)/i);
  const dataInfo = dataMatch ? dataMatch[1].replace(/\s+/g, '') : '';

  // Determine action type from the link text
  const isBuy = /ซื้อ|buy|order|สั่งซื้อ/i.test(link.text);
  const isCustomize = /ปรับแต่ง|custom|เลือก/i.test(link.text);
  const actionPrefix = isBuy ? 'ซื้อ' : isCustomize ? 'ปรับแต่ง' : link.text.slice(0, 8);

  // Build descriptive title (max 20 chars for Facebook)
  let title = actionPrefix;
  if (pkgLabel) {
    title = `${actionPrefix} ${pkgLabel}`;
  } else if (dataInfo) {
    title = `${actionPrefix} ${dataInfo}`;
  } else if (optionNum) {
    title = `${actionPrefix} #${optionNum}`;
  }

  // Truncate to 20 chars (Facebook limit)
  return title.slice(0, 20);
}

// Build Facebook messages: text + button template(s) for links
function buildFacebookMessages(
  aiResponse: string,
  senderId: string
): Array<{recipient: {id: string}; message: any; messaging_type: string}> {
  const links = extractMarkdownLinks(aiResponse);
  
  if (links.length === 0) {
    return [{
      recipient: { id: senderId },
      message: { text: stripMarkdownForMessenger(aiResponse) },
      messaging_type: 'RESPONSE'
    }];
  }

  // Strip links from text body (they'll be buttons)
  const textBody = stripMarkdownForMessenger(aiResponse, true);
  const messages: Array<{recipient: {id: string}; message: any; messaging_type: string}> = [];

  // Facebook button template text limit is 640 chars
  const truncatedText = textBody.length > 640 
    ? textBody.slice(0, 637) + '...' 
    : textBody;

  // Deduplicate links by URL
  const seen = new Set<string>();
  const uniqueLinks = links.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });

  // Generate descriptive titles for each link
  const buttonsWithTitles = uniqueLinks.map((link, idx) => ({
    url: link.url,
    title: getDescriptiveButtonTitle(aiResponse, link, idx)
  }));

  console.log('Button titles generated:', JSON.stringify(buttonsWithTitles.map(b => b.title)));

  // Facebook allows max 3 buttons per template
  const buttonChunks: Array<Array<{url: string; title: string}>> = [];
  for (let i = 0; i < buttonsWithTitles.length; i += 3) {
    buttonChunks.push(buttonsWithTitles.slice(i, i + 3));
  }

  if (buttonChunks.length > 0) {
    messages.push({
      recipient: { id: senderId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: truncatedText || 'Here are your options:',
            buttons: buttonChunks[0].map(btn => ({
              type: 'web_url',
              url: btn.url,
              title: btn.title
            }))
          }
        }
      },
      messaging_type: 'RESPONSE'
    });

    for (let i = 1; i < buttonChunks.length; i++) {
      messages.push({
        recipient: { id: senderId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: 'More options:',
              buttons: buttonChunks[i].map(btn => ({
                type: 'web_url',
                url: btn.url,
                title: btn.title
              }))
            }
          }
        },
        messaging_type: 'RESPONSE'
      });
    }
  }

  return messages;
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
          if (parsed.type === 'done' && parsed.content) {
            // Use the sanitized final content (with real URLs) instead of raw deltas
            fullContent = parsed.content;
            metadata.confidence = parsed.confidence;
            metadata.escalate = parsed.escalate;
            if (parsed.requestRating !== undefined) metadata.requestRating = parsed.requestRating;
            if (parsed.deviceIncompatible !== undefined) metadata.deviceIncompatible = parsed.deviceIncompatible;
          } else if (parsed.type === 'metadata') {
            metadata = parsed;
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
    response: fullContent,
    confidence: metadata.confidence,
    escalate: metadata.escalate,
    packages: metadata.packages,
    requestRating: metadata.requestRating,
    deviceIncompatible: metadata.deviceIncompatible
  };
}

// Validate Facebook signature
async function validateSignature(body: string, signature: string, appSecret: string): Promise<boolean> {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signature.slice(7);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body)
  );

  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSignature === expectedSignature;
}

// Link Facebook PSID to user profile for order notifications
async function linkFacebookPsidToProfile(
  supabase: any,
  facebookPsid: string,
  contact: any
) {
  try {
    // If contact has a user_id, link PSID directly to their profile
    if (contact?.user_id) {
      const { error } = await supabase
        .from('profiles')
        .update({ facebook_psid: facebookPsid })
        .eq('user_id', contact.user_id)
        .is('facebook_psid', null); // Only set if not already set
      
      if (!error) {
        console.log(`[PSID-LINK] Linked PSID ${facebookPsid} to profile for user ${contact.user_id}`);
      }
      return;
    }

    // If contact has an email, try to match to a profile by email
    if (contact?.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, facebook_psid')
        .eq('email', contact.email)
        .is('facebook_psid', null)
        .limit(1)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ facebook_psid: facebookPsid })
          .eq('user_id', profile.user_id);
        
        // Also link user_id back to the contact
        await supabase
          .from('contacts')
          .update({ user_id: profile.user_id })
          .eq('id', contact.id);
        
        console.log(`[PSID-LINK] Linked PSID ${facebookPsid} to profile via email match: ${contact.email}`);
      }
      return;
    }

    // Try matching by Facebook display name to profile name (less reliable, but worth trying)
    if (contact?.facebook_display_name) {
      const nameParts = contact.facebook_display_name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, facebook_psid')
          .is('facebook_psid', null)
          .limit(10);

        if (profiles) {
          const match = profiles.find((p: any) => {
            const profileFullName = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase();
            return profileFullName === contact.facebook_display_name.toLowerCase();
          });

          if (match) {
            await supabase
              .from('profiles')
              .update({ facebook_psid: facebookPsid })
              .eq('user_id', match.user_id);
            
            await supabase
              .from('contacts')
              .update({ user_id: match.user_id })
              .eq('id', contact.id);
            
            console.log(`[PSID-LINK] Linked PSID ${facebookPsid} to profile via name match: ${contact.facebook_display_name}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[PSID-LINK] Error linking PSID to profile:', error);
  }
}

// Fetch user profile from Facebook Graph API
// Strategy 1: Direct PSID lookup (deprecated but sometimes still works)
// Strategy 2: Conversations participants endpoint (requires pages_read_engagement)
// Strategy 3: Return psid_only so chatbot can prompt for name
async function fetchUserProfile(
  psid: string,
  accessToken: string,
  pageId?: string
): Promise<{ name?: string; profile_pic?: string; error_code?: number; error_message?: string; strategy?: string }> {
  // Strategy 1: Try deprecated User Profile API (still works for some apps)
  try {
    const url = `https://graph.facebook.com/v19.0/${psid}?fields=first_name,last_name,name,profile_pic&access_token=${accessToken}`;
    console.log('[FB-PROFILE] Strategy 1: Direct PSID lookup for:', psid);
    const response = await fetch(url);
    const data = await response.json();
    if (!data.error && (data.name || data.first_name)) {
      console.log('[FB-PROFILE] Strategy 1 SUCCESS:', JSON.stringify(data));
      return {
        name: data.name || `${data.first_name} ${data.last_name || ''}`.trim(),
        profile_pic: data.profile_pic,
        strategy: 'direct_psid_lookup'
      };
    }
    if (data.error) {
      console.warn(`[FB-PROFILE] Strategy 1 failed: ${data.error.message} (code: ${data.error.code})`);
    }
  } catch (error: any) {
    console.warn('[FB-PROFILE] Strategy 1 exception:', error);
  }

  // Strategy 2: Try conversations/participants endpoint (requires pages_read_engagement)
  if (pageId) {
    try {
      const convUrl = `https://graph.facebook.com/v19.0/${pageId}/conversations?user_id=${psid}&fields=participants&access_token=${accessToken}`;
      console.log('[FB-PROFILE] Strategy 2: Conversations participants lookup');
      const convResponse = await fetch(convUrl);
      const convData = await convResponse.json();
      if (!convData.error && convData.data?.length > 0) {
        const participants = convData.data[0]?.participants?.data;
        if (participants) {
          // Find the participant that is NOT the page
          const userParticipant = participants.find((p: any) => p.id === psid || p.id !== pageId);
          if (userParticipant?.name) {
            console.log('[FB-PROFILE] Strategy 2 SUCCESS:', JSON.stringify(userParticipant));
            // Strategy 2.5: Try to also get profile picture via PSID picture endpoint
            let picUrl: string | undefined;
            try {
              const picResponse = await fetch(`https://graph.facebook.com/v19.0/${psid}/picture?type=normal&redirect=false&access_token=${accessToken}`);
              const picData = await picResponse.json();
              if (picData?.data?.url) {
                picUrl = picData.data.url;
                console.log('[FB-PROFILE] Strategy 2.5: Got profile picture via PSID picture endpoint');
              }
            } catch (picErr) {
              console.warn('[FB-PROFILE] Strategy 2.5 picture fetch failed:', picErr);
            }
            return {
              name: userParticipant.name,
              profile_pic: picUrl,
              strategy: 'conversations_participants'
            };
          }
        }
      }
      if (convData.error) {
        console.warn(`[FB-PROFILE] Strategy 2 failed: ${convData.error.message} (code: ${convData.error.code})`);
      }
    } catch (error: any) {
      console.warn('[FB-PROFILE] Strategy 2 exception:', error);
    }
  }

  // Strategy 3: Try picture-only endpoint (works even when name API is restricted)
  try {
    const picUrl = `https://graph.facebook.com/v19.0/${psid}/picture?type=normal&redirect=false&access_token=${accessToken}`;
    console.log('[FB-PROFILE] Strategy 3: Picture-only fetch for PSID:', psid);
    const picResponse = await fetch(picUrl);
    const picData = await picResponse.json();
    if (picData?.data?.url && !picData?.data?.is_silhouette) {
      console.log('[FB-PROFILE] Strategy 3 SUCCESS: Got profile picture');
      return { profile_pic: picData.data.url, strategy: 'picture_only' };
    }
  } catch (error: any) {
    console.warn('[FB-PROFILE] Strategy 3 exception:', error);
  }

  // Strategy 4: No profile data available — return psid_only
  console.log(`[FB-PROFILE] All strategies failed for PSID ${psid}, returning psid_only`);
  return { error_message: 'all_strategies_failed', strategy: 'psid_only' };
}

// Download attachment from Facebook and store in Supabase Storage
async function storeAttachment(
  supabase: any,
  url: string,
  type: string,
  conversationId: string
): Promise<{ path: string; url: string; type: string; name: string; size: number } | null> {
  try {
    console.log('Downloading attachment from Facebook:', url.substring(0, 100) + '...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to download attachment:', response.status);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Uint8Array(arrayBuffer);
    
    // Determine extension and content type from the attachment type
    const extension = type === 'image' ? 'jpg' : 
                      type === 'video' ? 'mp4' : 
                      type === 'audio' ? 'mp3' : 'bin';
    const contentType = type === 'image' ? 'image/jpeg' : 
                        type === 'video' ? 'video/mp4' : 
                        type === 'audio' ? 'audio/mpeg' : 'application/octet-stream';
    
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const path = `${conversationId}/${filename}`;
    
    console.log('Uploading attachment to Supabase Storage:', path);
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, blob, { contentType });
    
    if (error) {
      console.error('Failed to upload attachment to storage:', error);
      return null;
    }
    
    console.log('Attachment stored successfully:', path);
    return {
      path,
      url: '', // We'll use path for signed URLs in the frontend
      type: contentType,
      name: filename,
      size: blob.length
    };
  } catch (error: any) {
    console.error('Error storing attachment:', error);
    return null;
  }
}

// Get page access token from database or fallback to env variable
async function getPageAccessToken(supabase: any, pageId: string, fallbackToken: string): Promise<string> {
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

  const FACEBOOK_VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN');
  const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!FACEBOOK_VERIFY_TOKEN || !FACEBOOK_APP_SECRET || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.error('Missing Facebook configuration');
    return new Response('Server configuration error', { status: 500 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase configuration');
    return new Response('Server configuration error', { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Handle webhook verification (GET request from Facebook)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('Webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      
      // Set up Facebook Persistent Menu (one-time, idempotent)
      try {
        const menuResponse = await fetch(
          `https://graph.facebook.com/v19.0/me/messenger_profile?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              persistent_menu: [{
                locale: 'default',
                composer_input_disabled: false,
                call_to_actions: [
                  { type: 'postback', title: '🙋 Talk to Agent', payload: 'TALK_TO_AGENT' },
                  { type: 'web_url', title: '🌐 Browse eSIM', url: 'https://mobile11.com/esim' }
                ]
              }]
            })
          }
        );
        const menuResult = await menuResponse.json();
        console.log('Facebook Persistent Menu setup result:', JSON.stringify(menuResult));
      } catch (menuError) {
        console.error('Failed to set up Facebook Persistent Menu:', menuError);
      }
      
      return new Response(challenge, { status: 200, headers: corsHeaders });
    } else {
      console.error('Webhook verification failed');
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    const bodyText = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Validate signature
    if (signature) {
      const isValid = await validateSignature(bodyText, signature, FACEBOOK_APP_SECRET);
      if (!isValid) {
        console.error('Invalid signature');
        return new Response('Invalid signature', { status: 403, headers: corsHeaders });
      }
    }

    let payload: FacebookWebhookPayload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e: any) {
      console.error('Invalid JSON payload');
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    console.log('Received Facebook webhook:', JSON.stringify(payload, null, 2));

    // Only process page events
    if (payload.object !== 'page') {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Log raw payload for debugging echo issues
    console.log('RAW WEBHOOK PAYLOAD:', JSON.stringify(payload).substring(0, 2000));

    // Process each entry
    for (const entry of payload.entry) {
      const pageId = entry.id; // The page that received the message
      
      // Diagnostic logging: show which channels have events
      console.log(`Processing entry: messaging=${entry.messaging?.length || 0}, standby=${entry.standby?.length || 0}`);
      
      // Get the access token for this specific page
      const pageAccessToken = await getPageAccessToken(supabase, pageId, FACEBOOK_PAGE_ACCESS_TOKEN);

      for (const messaging of entry.messaging || []) {
        const senderId = messaging.sender.id;
        const recipientId = messaging.recipient.id;

        // Detect echo messages (agent replied from Meta Business Suite or other source)
        if ((messaging.message as any)?.is_echo) {
          console.log('Echo message detected (page/agent sent a message)');
          
          // The recipient of an echo is the customer
          const customerFbId = recipientId;
          
          // Find the conversation for this customer
          const { data: echoContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('facebook_id', customerFbId)
            .single();
          
          if (echoContact) {
            const { data: echoConv } = await supabase
              .from('conversations')
              .select('id, metadata')
              .eq('contact_id', echoContact.id)
              .eq('channel', 'facebook')
              .order('updated_at', { ascending: false })
              .limit(1)
              .single();
            
            if (echoConv) {
              // Check if this echo was sent by OUR system (has matching message in DB)
              const echoText = messaging.message?.text || '';
              const { data: recentBotMsg } = await supabase
                .from('conversation_messages')
                .select('id')
                .eq('conversation_id', echoConv.id)
                .eq('content', echoText)
                .eq('sender_type', 'bot')
                .gte('created_at', new Date(Date.now() - 30000).toISOString())
                .limit(1);
              
              const isFromOurSystem = (recentBotMsg && recentBotMsg.length > 0);
              
              // If echo has app_id, it was sent via Send API (our bot or agent reply system)
              // Only echoes WITHOUT app_id come from manual Page Inbox / Meta Business Suite replies
              const isFromOurApp = !!(messaging.message as any)?.app_id;
              
              if (!isFromOurSystem && !isFromOurApp) {
                // Agent replied from Meta Business Suite — pause AI and save message
                console.log('Agent reply detected from Meta Business Suite (no app_id, not from our system), pausing AI');
                
                await supabase.from('conversation_messages').insert({
                  conversation_id: echoConv.id,
                  content: echoText || '[attachment]',
                  sender_type: 'agent',
                  is_internal_note: false,
                  metadata: { channel: 'facebook', source: 'meta_business_suite' }
                });
                
                const echoMetadata = (echoConv.metadata || {}) as Record<string, any>;
                await supabase.from('conversations').update({
                  metadata: {
                    ...echoMetadata,
                    ai_paused: true,
                    ai_paused_at: new Date().toISOString(),
                    ai_paused_reason: 'agent_replied'
                  },
                  updated_at: new Date().toISOString()
                }).eq('id', echoConv.id);
              }
            }
          }
          
          continue; // Don't process echoes as customer messages
        }

        // Also keep the original page-self check as fallback
        if (senderId === pageId) {
          console.log('Skipping message from page itself');
          continue;
        }

        // Reclaim thread control from Page Inbox if it was transferred
        try {
          await fetch(
            `https://graph.facebook.com/v19.0/me/take_thread_control?access_token=${pageAccessToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: senderId },
                metadata: 'Reclaiming for bot processing'
              })
            }
          );
        } catch (e: any) {
          // Non-critical — thread may not have been transferred
        }

        // Log sender metadata from webhook payload for diagnostics
        console.log(`[FB-WEBHOOK-SENDER] Sender metadata: id=${senderId}, messaging keys=${Object.keys(messaging).join(',')}`);

        // Fetch user profile using multi-strategy approach (passing pageId for Strategy 2)
        const profile = await fetchUserProfile(senderId, pageAccessToken, pageId);
        console.log('User profile:', JSON.stringify(profile));

        // Find or create contact
        let { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('facebook_id', senderId)
          .single();

        if (!contact) {
          // Create new contact — store PSID immediately, profile data if available
          const profileEnriched = !!(profile.name || profile.profile_pic);
          const profileMeta: Record<string, any> = {
            profile_status: profileEnriched ? 'profile_enriched' : 'psid_only',
            profile_strategy: profile.strategy || 'unknown',
          };
          if (!profileEnriched) {
            profileMeta.profile_error_message = profile.error_message || 'no_data';
            if (profile.error_code) profileMeta.profile_error_code = profile.error_code;
            profileMeta.needs_name_prompt = true;
          }
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              facebook_id: senderId,
              facebook_display_name: profile.name || null,
              facebook_picture_url: profile.profile_pic || null,
              name: profile.name || `Messenger Contact`,
              metadata: profileMeta,
            })
            .select()
            .single();

          if (contactError) {
            console.error('Error creating contact:', contactError);
            continue;
          }
          contact = newContact;
          console.log(`[FB-CONTACT] Created contact: profile_status=${profileMeta.profile_status}, PSID=${senderId}, error=${profile.error_message || 'none'}`);
        } else {
          // Update profile info if changed, or backfill missing picture
          const needsPictureBackfill = !contact.facebook_picture_url && contact.facebook_id;
          if (profile.name || profile.profile_pic || needsPictureBackfill) {
            // If we have no picture from profile and contact is missing one, try picture-only fetch
            let finalPic = profile.profile_pic;
            if (!finalPic && needsPictureBackfill) {
              try {
                const picResp = await fetch(`https://graph.facebook.com/v19.0/${senderId}/picture?type=normal&redirect=false&access_token=${pageAccessToken}`);
                const picJson = await picResp.json();
                if (picJson?.data?.url && !picJson?.data?.is_silhouette) {
                  finalPic = picJson.data.url;
                  console.log(`[FB-CONTACT] Backfilled profile picture for PSID=${senderId}`);
                }
              } catch (e: any) {
                console.warn('[FB-CONTACT] Picture backfill failed:', e);
              }
            }
            const existingMeta = (contact.metadata || {}) as Record<string, any>;
            await supabase
              .from('contacts')
              .update({
                facebook_display_name: profile.name || contact.facebook_display_name,
                facebook_picture_url: finalPic || contact.facebook_picture_url,
                name: profile.name || contact.name,
                metadata: { ...existingMeta, profile_status: 'profile_enriched' },
              })
              .eq('id', contact.id);
            console.log(`[FB-CONTACT] Updated contact with enriched profile, PSID=${senderId}`);
          }
        }

        // Try to link this Facebook PSID to an existing auth profile
        await linkFacebookPsidToProfile(supabase, senderId, contact);

        // Find or create conversation
        let { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('contact_id', contact.id)
          .eq('channel', 'facebook')
          .in('status', ['open', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let isReturningUser = false;
        let skipAiForWelcomeBack = false;

        // Reset follow_up_count when customer replies (stops dead air cycle)
        if (conversation) {
          const existingMeta = (conversation.metadata || {}) as Record<string, any>;
          if (existingMeta.follow_up_count > 0) {
            await supabase.from('conversations').update({
              metadata: { ...existingMeta, follow_up_count: 0 },
              updated_at: new Date().toISOString()
            }).eq('id', conversation.id);
            conversation.metadata = { ...existingMeta, follow_up_count: 0 };
          }
        }


        if (!conversation) {
          // Create new conversation
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              contact_id: contact.id,
              channel: 'facebook',
              status: 'open',
              subject: profile.name ? `Facebook: ${profile.name}` : 'New Facebook Message',
              metadata: { 
                psid: senderId,
                page_id: recipientId 
              },
            })
            .select()
            .single();

          if (convError) {
            console.error('Error creating conversation:', convError);
            continue;
          }
          conversation = newConversation;

          // ═══ NEW CONVERSATION: Send Intent Selection Quick Replies ═══
          console.log('New conversation - sending intent selection quick replies');
          const intentGreeting = 'สวัสดีค่ะพี่! 🌏✨ น้องช่วยอะไรพี่ได้คะ?';
          
          // Save greeting to DB
          await supabase.from('conversation_messages').insert({
            conversation_id: conversation.id,
            sender_type: 'bot',
            content: intentGreeting,
            is_internal_note: false,
            metadata: { ai_auto_response: true, channel: 'facebook', intent_greeting: true }
          });
          
          // Send via Facebook with Quick Replies
          await fetch(
            `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: senderId },
                message: {
                  text: intentGreeting,
                  quick_replies: [
                    {
                      content_type: 'text',
                      title: '🛒 ซื้อ eSIM',
                      payload: 'INTENT_SALES'
                    },
                    {
                      content_type: 'text',
                      title: '🙋 ช่วยเหลือ',
                      payload: 'INTENT_SUPPORT'
                    }
                  ]
                },
                messaging_type: 'RESPONSE'
              })
            }
          );
          
          // Set intent_pending in metadata
          await supabase
            .from('conversations')
            .update({
              metadata: { ...conversation.metadata, intent_pending: true },
              updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id);
          conversation.metadata = { ...conversation.metadata, intent_pending: true };
          skipAiForWelcomeBack = true;

          // ═══ NAME PROMPT: Ask for name if profile is psid_only ═══
          const newContactMeta = (contact.metadata || {}) as Record<string, any>;
          if (newContactMeta.needs_name_prompt && !contact.facebook_display_name) {
            const namePromptMsg = 'ขอทราบชื่อพี่ด้วยนะคะ? 😊';
            
            await supabase.from('conversation_messages').insert({
              conversation_id: conversation.id,
              sender_type: 'bot',
              content: namePromptMsg,
              is_internal_note: false,
              metadata: { ai_auto_response: true, channel: 'facebook', name_prompt: true }
            });
            
            await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: namePromptMsg },
                messaging_type: 'RESPONSE'
              })
            });

            // Mark contact as awaiting name response
            await supabase
              .from('contacts')
              .update({
                metadata: { ...newContactMeta, awaiting_name_response: true }
              })
              .eq('id', contact.id);
            contact.metadata = { ...newContactMeta, awaiting_name_response: true };
            console.log(`[FB-NAME-PROMPT] Sent name prompt for PSID ${senderId}`);
          }
        }

        // ═══ RETURNING USER DETECTION ═══
        // Check if this is a returning user with an existing conversation that's been idle
        const IDLE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour idle threshold

        if (conversation && messaging.message) {
          // Check last message timestamp
          const { data: lastMsg } = await supabase
            .from('conversation_messages')
            .select('created_at, content, sender_type')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastMsg) {
            const lastMsgTime = new Date(lastMsg.created_at).getTime();
            const now = Date.now();
            const idleMs = now - lastMsgTime;
            
            // Check if user is responding to a welcome-back quick reply
            const quickReplyPayload = messaging.message.quick_reply?.payload;
            
            // ═══ INTENT SELECTION HANDLING ═══
            if (quickReplyPayload === 'INTENT_SALES') {
              console.log('User selected Sales intent');
              await supabase
                .from('conversations')
                .update({
                  metadata: { ...conversation.metadata, intent_pending: false, intent: 'sales' },
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversation.id);
              conversation.metadata = { ...conversation.metadata, intent_pending: false, intent: 'sales' };
              
              const salesMsg = 'ยินดีค่ะพี่! 🛒 บอกน้องได้เลยนะคะว่าพี่จะไปประเทศไหน น้องจะแนะนำแพ็กเกจที่คุ้มที่สุดให้ค่ะ 😊';
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: salesMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'facebook', intent_response: 'sales' }
              });
              await fetch(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: salesMsg },
                    messaging_type: 'RESPONSE'
                  })
                }
              );
              skipAiForWelcomeBack = true;
            } else if (quickReplyPayload === 'INTENT_SUPPORT') {
              console.log('User selected Support intent');
              await supabase
                .from('conversations')
                .update({
                  metadata: { ...conversation.metadata, intent_pending: false, intent: 'support' },
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversation.id);
              conversation.metadata = { ...conversation.metadata, intent_pending: false, intent: 'support' };
              
              const supportMsg = 'ได้เลยค่ะพี่! 🙋 บอกน้องได้เลยนะคะว่ามีปัญหาอะไร น้องจะพยายามช่วยค่ะ\n\nหากพี่ต้องการคุยกับเจ้าหน้าที่จริง พิมพ์ \'agent\' ได้เลยนะคะ 😊';
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: supportMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'facebook', intent_response: 'support' }
              });
              await fetch(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: supportMsg },
                    messaging_type: 'RESPONSE'
                  })
                }
              );
              skipAiForWelcomeBack = true;
            } else if (quickReplyPayload === 'WELCOME_BACK_CONTINUE') {
              console.log('User chose to continue conversation');
              // Send a "welcome back" message and proceed normally
              const continueMsg = 'ยินดีต้อนรับกลับมาครับ! 😊 มีอะไรให้ช่วยเพิ่มเติมไหมครับ?';
              
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: continueMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'facebook', welcome_back: true }
              });
              
              await fetch(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: continueMsg },
                    messaging_type: 'RESPONSE'
                  })
                }
              );
              skipAiForWelcomeBack = true;
              
            } else if (quickReplyPayload === 'WELCOME_BACK_FRESH') {
              console.log('User chose to start fresh');
              // Insert context reset marker
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'system',
                content: '[CONTEXT_RESET]',
                is_internal_note: true,
                metadata: { context_reset: true, channel: 'facebook' }
              });
              
              // Send fresh greeting
              const freshMsg = 'เริ่มใหม่ค่ะ! 🔄\n\nสวัสดีครับ มีอะไรให้น้องช่วยดูแลไหมครับ? 😊 บอกน้องได้เลยนะครับ น้องพร้อมช่วยแนะนำแพ็กเกจที่คุ้มที่สุดให้ครับ! ✨';
              
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: freshMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'facebook', fresh_start: true }
              });
              
              await fetch(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: freshMsg },
                    messaging_type: 'RESPONSE'
                  })
                }
              );
              skipAiForWelcomeBack = true;
              
            } else if (idleMs > IDLE_THRESHOLD_MS && lastMsg.content !== '[CONTEXT_RESET]' && lastMsg.sender_type !== 'bot') {
              // User is returning after being idle — send quick reply prompt
              isReturningUser = true;
              console.log(`Returning user detected. Idle for ${Math.round(idleMs / 60000)} minutes`);
            }
          }
        }

        // Process the message
        if (messaging.message) {
          const msg = messaging.message;

          // === DEDUPLICATION: Skip if this Facebook message was already processed ===
          if (msg.mid) {
            const { data: existingMsg } = await supabase
              .from('conversation_messages')
              .select('id')
              .eq('conversation_id', conversation.id)
              .filter('metadata->>facebook_message_id', 'eq', msg.mid)
              .limit(1)
              .maybeSingle();

            if (existingMsg) {
              console.log(`Duplicate Facebook message detected (mid: ${msg.mid}), skipping`);
              continue;
            }
          }

          let content = msg.text || '';
          const attachments: any[] = [];

          // Known Facebook thumbs-up sticker IDs
          const THUMBS_UP_STICKER_IDS = [369239263222822, 369239343222814, 369239383222810];

          // Handle attachments - download and store them permanently
          if (msg.attachments) {
            for (const att of msg.attachments) {
              // Detect Facebook stickers (like thumbs-up) before processing as images
              if (att.payload?.sticker_id) {
                if (THUMBS_UP_STICKER_IDS.includes(att.payload.sticker_id)) {
                  if (!content) content = '👍';
                  console.log('Detected thumbs-up sticker, converted to 👍 emoji');
                } else {
                  if (!content) content = '[Sticker]';
                  console.log('Detected unknown sticker ID:', att.payload.sticker_id);
                }
                continue; // Skip downloading sticker images
              }

              if (att.payload?.url) {
                // Download and store the attachment in Supabase Storage
                const storedAttachment = await storeAttachment(
                  supabase,
                  att.payload.url,
                  att.type,
                  conversation.id
                );
                
                if (storedAttachment) {
                  attachments.push(storedAttachment);
                } else {
                  // Fallback: store the original URL if storage fails
                  attachments.push({
                    type: att.type === 'image' ? 'image/jpeg' : att.type,
                    url: att.payload.url,
                    name: `${att.type}_attachment`,
                    size: 0
                  });
                }
              }
            }
            if (!content && attachments.length > 0) {
              content = `[${attachments.map(a => a.type.split('/')[0]).join(', ')}]`;
            }
          }

          // Save message
          const { error: msgError } = await supabase
            .from('conversation_messages')
            .insert({
              conversation_id: conversation.id,
              sender_type: 'customer',
              sender_id: contact.id,
              content: content,
              is_internal_note: false,
              metadata: { 
                facebook_message_id: msg.mid,
                psid: senderId
              },
              attachments: attachments.length > 0 ? attachments : null,
            });

          if (msgError) {
            console.error('Error saving message:', msgError);
          } else {
            console.log('Message saved successfully');

            // ═══ NOTIFY AGENTS for every incoming customer message ═══
            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-agents`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  conversationId: conversation.id,
                  messagePreview: content,
                  channel: 'facebook',
                  senderName: contact.name || contact.facebook_display_name || 'Customer'
                })
              });
              console.log('Agents notified of new Facebook message');
            } catch (notifyErr) {
              console.error('Failed to notify agents:', notifyErr);
            }

            // ═══ RETURNING USER: Welcome-back Quick Reply (DISABLED) ═══
            if (isReturningUser && !skipAiForWelcomeBack) {
              console.log('Sending welcome-back quick reply to returning user');
              const welcomeBackMsg = 'ยินดีต้อนรับกลับมาครับ! 😊 ต้องการดำเนินการอย่างไรดีครับ?';
              
              // Save bot message
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: welcomeBackMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'facebook', welcome_back_prompt: true }
              });
              
              // Send via Facebook with Quick Replies
              await fetch(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: {
                      text: welcomeBackMsg,
                      quick_replies: [
                        {
                          content_type: 'text',
                          title: '🔄 คุยต่อจากเดิม',
                          payload: 'WELCOME_BACK_CONTINUE'
                        },
                        {
                          content_type: 'text',
                          title: '✨ เริ่มใหม่',
                          payload: 'WELCOME_BACK_FRESH'
                        }
                      ]
                    },
                    messaging_type: 'RESPONSE'
                  })
                }
              );
              skipAiForWelcomeBack = true;
            }

            // === RATING RESPONSE DETECTION ===
            const convMetadata = (conversation.metadata || {}) as Record<string, any>;
            const quickReplyPayload = msg.quick_reply?.payload;
            
            // Check for rating via Quick Reply payload or text pattern
            const ratingFromPayload = quickReplyPayload?.match(/^RATE:([1-5])$/);
            const ratingFromText = content.match(/^RATE:([1-5])$/);
            const ratingMatch = ratingFromPayload || ratingFromText;
            
            if (ratingMatch && convMetadata.awaiting_rating) {
              const rating = parseInt(ratingMatch[1]);
              console.log(`Facebook user rated conversation ${conversation.id} with ${rating} stars`);
              
              await supabase.from('conversation_ratings').insert({
                conversation_id: conversation.id,
                rating,
                channel: 'facebook',
                language: convMetadata.language || 'th'
              });
              
              await supabase.from('conversations').update({
                metadata: { ...convMetadata, awaiting_rating: false },
                updated_at: new Date().toISOString()
              }).eq('id', conversation.id);
              
              const convLang = await detectConversationLanguage(supabase, conversation.id);
              const thankYouMsg = convLang === 'en'
                ? `Thank you for your ${rating}-star rating! 🙏 Your feedback helps us improve.`
                : `ขอบคุณสำหรับคะแนน ${rating} ดาวค่ะพี่! 🙏 ข้อเสนอแนะของพี่ช่วยให้เราปรับปรุงได้ค่ะ`;
              
              await supabase.from('conversation_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: thankYouMsg,
                is_internal_note: false,
                metadata: { ai_auto_response: true, channel: 'facebook', rating_thank_you: true }
              });
              
              await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: { text: thankYouMsg },
                  messaging_type: 'RESPONSE'
                })
              });
              continue;
            }
            
            // If awaiting_rating but user sent freetext, capture as feedback
            if (convMetadata.awaiting_rating && !ratingMatch) {
              console.log(`Facebook user sent feedback text while awaiting_rating`);
              
              await supabase.from('conversation_ratings').insert({
                conversation_id: conversation.id,
                rating: 3,
                feedback_text: content,
                channel: 'facebook',
                language: convMetadata.language || 'th'
              });
              
              await supabase.from('conversations').update({
                metadata: { ...convMetadata, awaiting_rating: false },
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
                metadata: { ai_auto_response: true, channel: 'facebook', feedback_thank_you: true }
              });
              
              await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: { text: feedbackThankYou },
                  messaging_type: 'RESPONSE'
                })
              });
              continue;
            }

            // === NAME CAPTURE: Check if user is responding to a name prompt ===
            const contactMeta = (contact.metadata || {}) as Record<string, any>;
            const hasTextContentForName = !!(msg.text && msg.text.trim().length > 0);
            if (contactMeta.awaiting_name_response && hasTextContentForName) {
              const possibleName = msg.text!.trim();
              // Accept as name if it's 1-4 words, no URLs, and under 50 chars
              const looksLikeName = possibleName.length <= 50 
                && possibleName.split(/\s+/).length <= 4 
                && !possibleName.includes('http')
                && !/^[0-9]+$/.test(possibleName);
              
              if (looksLikeName) {
                console.log(`[FB-NAME-CAPTURE] Captured name "${possibleName}" for PSID ${senderId}`);
                await supabase
                  .from('contacts')
                  .update({
                    name: possibleName,
                    facebook_display_name: possibleName,
                    metadata: {
                      ...contactMeta,
                      profile_status: 'self_identified',
                      awaiting_name_response: false,
                      needs_name_prompt: false,
                      name_captured_at: new Date().toISOString(),
                    },
                  })
                  .eq('id', contact.id);
                
                // Update local contact object
                contact.name = possibleName;
                contact.facebook_display_name = possibleName;
                
                // Send confirmation and continue to normal AI flow
                const convLang = await detectConversationLanguage(supabase, conversation.id);
                const confirmMsg = convLang === 'en'
                  ? `Nice to meet you, ${possibleName}! 😊 How can I help you today?`
                  : `ยินดีที่ได้รู้จักค่ะ คุณ${possibleName}! 😊 มีอะไรให้ช่วยไหมคะ?`;
                
                await supabase.from('conversation_messages').insert({
                  conversation_id: conversation.id,
                  sender_type: 'bot',
                  content: confirmMsg,
                  is_internal_note: false,
                  metadata: { ai_auto_response: true, channel: 'facebook', name_captured: true }
                });
                
                await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: confirmMsg },
                    messaging_type: 'RESPONSE'
                  })
                });
                skipAiForWelcomeBack = true;
              }
            }

            // === AI CHATBOT INTEGRATION ===
            try {
              const AI_ENABLED_FOR_FACEBOOK = true;
              const hasTextContent = msg.text && msg.text.trim().length > 0;
              
              // === RESUME BOT DETECTION ===
              const resumeBotPatterns = /^(talk to bot|chatbot|chat bot|bot help|คุยกับบอท|บอท|bot|ai)$/i;
              const isResumeRequest = hasTextContent && resumeBotPatterns.test(msg.text!.trim());
              
              if (isResumeRequest && conversation.metadata?.ai_paused) {
                console.log('User requested to resume AI bot on Facebook, clearing ai_paused flag');
                await supabase
                  .from('conversations')
                  .update({
                    metadata: { ...conversation.metadata, ai_paused: false },
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', conversation.id);
                conversation.metadata.ai_paused = false;
                
                const convLang = await detectConversationLanguage(supabase, conversation.id);
                const resumeMsg = convLang === 'th'
                  ? 'กลับมาแล้วค่ะพี่! 😊 มีอะไรให้ช่วยไหมคะ?'
                  : 'I\'m back! 😊 How can I help you?';
                
                await supabase.from('conversation_messages').insert({
                  conversation_id: conversation.id,
                  sender_type: 'bot',
                  content: resumeMsg,
                  is_internal_note: false,
                  metadata: { ai_auto_response: true, channel: 'facebook', bot_resumed: true }
                });
                
                await fetch(
                  `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      recipient: { id: senderId },
                      message: { text: resumeMsg },
                      messaging_type: 'RESPONSE'
                    })
                  }
                );
                skipAiForWelcomeBack = true;
              }
              
              // === INTENT PENDING CHECK ===
              if (conversation.metadata?.intent_pending) {
                console.log('Intent pending - defaulting to sales path for freetext');
                await supabase
                  .from('conversations')
                  .update({
                    metadata: { ...conversation.metadata, intent_pending: false, intent: 'sales' },
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', conversation.id);
                conversation.metadata = { ...conversation.metadata, intent_pending: false, intent: 'sales' };
                // Allow AI to process - reset the skip flag
                skipAiForWelcomeBack = false;
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
                  skipAiForWelcomeBack = true;
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
                    // Allow AI to process
                  } else {
                    console.log(`AI paused for conversation ${conversation.id} (reason: ${pauseReason}), skipping AI response (human agent handling)`);
                    skipAiForWelcomeBack = true;
                    
                    // (notify-agents already called above for every message)
                  }
                }
              }
              
              const hasAnyContent = hasTextContent || (msg.attachments && msg.attachments.length > 0);
              if (AI_ENABLED_FOR_FACEBOOK && hasAnyContent && !skipAiForWelcomeBack) {
                console.log('Calling AI chat response for Facebook message...');

                // Fetch last 20 messages for context
                const { data: historyMessages } = await supabase
                  .from('conversation_messages')
                  .select('content, sender_type, created_at')
                  .eq('conversation_id', conversation.id)
                  .order('created_at', { ascending: false })
                  .limit(20);

                // Reverse to chronological order and respect [CONTEXT_RESET] markers
                let sortedHistory = (historyMessages || []).slice().reverse();
                
                // Find the last context reset marker and only use messages after it
                const lastResetIndex = sortedHistory.findLastIndex(
                  (m: any) => m.content === '[CONTEXT_RESET]'
                );
                if (lastResetIndex >= 0) {
                  sortedHistory = sortedHistory.slice(lastResetIndex + 1);
                  console.log(`[ContextReset] Found reset marker, using ${sortedHistory.length} messages after reset`);
                }

                console.log('History context:', {
                  conversationId: conversation.id,
                  messageCount: sortedHistory.length,
                  firstMsgTime: sortedHistory[0]?.created_at,
                  lastMsgTime: sortedHistory[sortedHistory.length - 1]?.created_at,
                });

                const history = sortedHistory.map(m => ({
                  role: m.sender_type === 'customer' ? 'user' : 'assistant',
                  content: m.content
                }));

                // Call ai-chat-response edge function
                const aiResponse = await fetch(
                  `${SUPABASE_URL}/functions/v1/ai-chat-response`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({
                      message: content,
                      conversationId: conversation.id,
                      contactId: contact.id,
                      history: history,
                      chatMode: 'freetext',
                      channel: 'facebook',
                      intent: conversation.metadata?.intent || undefined,
                      attachments: attachments.length > 0 ? attachments : undefined
                    })
                  }
                );

                if (aiResponse.ok) {
                  const contentType = aiResponse.headers.get('content-type') || '';

                  let aiResult;
                  if (contentType.includes('text/event-stream')) {
                    aiResult = await consumeSSEStream(aiResponse);
                  } else {
                    aiResult = await aiResponse.json();
                  }

                  console.log('AI response received:', {
                    hasResponse: !!aiResult.response,
                    escalate: aiResult.escalate,
                    confidence: aiResult.confidence,
                    streamingUsed: contentType.includes('text/event-stream')
                  });

                  if (aiResult.response) {
                    // Save bot message BEFORE sending to Facebook (avoid race conditions)
                    const botMetadataBase = {
                      ai_auto_response: true,
                      ai_confidence: aiResult.confidence,
                      escalated: aiResult.escalate || false,
                      channel: 'facebook',
                      send_status: 'pending'
                    };

                    console.log('Preparing Facebook bot reply:', {
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

                    // Build Facebook messages (text + button templates for links)
                    const fbMessages = buildFacebookMessages(aiResult.response, senderId);
                    console.log(`Sending ${fbMessages.length} Facebook message(s) (with button templates: ${fbMessages.some(m => m.message.attachment)})`);

                    let allSent = true;
                    let lastError = '';
                    for (const fbMsg of fbMessages) {
                      const fbSendResponse = await fetch(
                        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(fbMsg)
                        }
                      );
                      if (!fbSendResponse.ok) {
                        const fbError = await fbSendResponse.text();
                        console.error('Failed to send Facebook message:', fbSendResponse.status, fbError);
                        allSent = false;
                        lastError = fbError;
                        
                        // Fallback: if button template fails, retry as plain text
                        if (fbMsg.message.attachment) {
                          console.log('Button template failed, falling back to plain text');
                          const fallbackResponse = await fetch(
                            `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                recipient: { id: senderId },
                                message: { text: stripMarkdownForMessenger(aiResult.response) },
                                messaging_type: 'RESPONSE'
                              })
                            }
                          );
                          if (fallbackResponse.ok) {
                            allSent = true;
                            console.log('Fallback plain text sent successfully');
                          }
                        }
                      }
                    }

                    if (allSent) {
                      console.log('AI response sent to Facebook user successfully');

                      if (savedBotMsg?.id) {
                        await supabase
                          .from('conversation_messages')
                          .update({
                            metadata: {
                              ...botMetadataBase,
                              send_status: 'sent',
                              sent_via: 'facebook_send_api'
                            }
                          })
                          .eq('id', savedBotMsg.id);
                      }

                      // Handle escalation - pause AI and notify human agents
                      if (aiResult.escalate) {
                        console.log('AI flagged for escalation, pausing AI and updating conversation status');
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
                          await fetch(`${SUPABASE_URL}/functions/v1/agent-helper-summary`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ conversationId: conversation.id })
                          });
                          console.log('Agent helper summary triggered for conversation', conversation.id);
                        } catch (helperError) {
                          console.error('Failed to trigger agent helper summary:', helperError);
                        }

                        // Notify LINE group about escalation
                        try {
                          await fetch(`${SUPABASE_URL}/functions/v1/notify-line-group`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              conversationId: conversation.id,
                              customerName: contact?.name || contact?.facebook_display_name || 'Customer',
                              channel: 'facebook',
                              messagePreview: (msg.text || '').substring(0, 80) || 'Customer requested agent'
                            })
                          });
                        } catch (lineGroupErr: any) {
                          console.error('Failed to notify LINE group:', lineGroupErr);
                        }
                      }
                      
                      // === SET DEVICE INCOMPATIBLE FLAG ===
                      if (aiResult.deviceIncompatible) {
                        console.log(`[facebook-webhook] Device incompatible detected for conv ${conversation.id}`);
                        await supabase.from('conversations').update({
                          metadata: { ...conversation.metadata, device_incompatible: true },
                          updated_at: new Date().toISOString()
                        }).eq('id', conversation.id);
                        conversation.metadata = { ...conversation.metadata, device_incompatible: true };
                      }
                      
                      // === SEND RATING QUICK REPLIES ===
                      if (aiResult.requestRating && !aiResult.escalate) {
                        console.log(`requestRating=true for Facebook conversation ${conversation.id}, sending rating Quick Replies`);
                        const convLang = await detectConversationLanguage(supabase, conversation.id);
                        const ratingPrompt = convLang === 'en'
                          ? 'Please rate your experience:'
                          : 'กรุณาให้คะแนนประสบการณ์ของพี่ค่ะ:';
                        
                        const ratingRes = await fetch(
                          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              recipient: { id: senderId },
                              message: {
                                text: ratingPrompt,
                                quick_replies: [1, 2, 3, 4, 5].map(n => ({
                                  content_type: 'text',
                                  title: '⭐'.repeat(n),
                                  payload: `RATE:${n}`
                                }))
                              },
                              messaging_type: 'RESPONSE'
                            })
                          }
                        );
                        
                        if (ratingRes.ok) {
                          console.log('Rating Quick Replies sent to Facebook user');
                          await supabase.from('conversation_messages').insert({
                            conversation_id: conversation.id,
                            sender_type: 'bot',
                            content: ratingPrompt,
                            is_internal_note: false,
                            metadata: { ai_auto_response: true, channel: 'facebook', rating_prompt: true }
                          });
                          const fbConvMetadata = (conversation.metadata || {}) as Record<string, any>;
                          await supabase.from('conversations').update({
                            metadata: { ...fbConvMetadata, awaiting_rating: true },
                            updated_at: new Date().toISOString()
                          }).eq('id', conversation.id);
                        } else {
                          console.error('Failed to send rating Quick Replies:', await ratingRes.text());
                        }
                      }
                    } else {
                      console.error('Failed to send AI response to Facebook');

                      if (savedBotMsg?.id) {
                        await supabase
                          .from('conversation_messages')
                          .update({
                            metadata: {
                              ...botMetadataBase,
                              send_status: 'failed',
                              send_error: lastError.slice(0, 200)
                            }
                          })
                          .eq('id', savedBotMsg.id);
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
                        metadata: { ai_auto_response: true, fallback: true, channel: 'facebook', send_status: 'pending' }
                      });

                    // Send fallback to Facebook
                    try {
                      await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          recipient: { id: senderId },
                          message: { text: fallbackText },
                          messaging_type: 'RESPONSE'
                        })
                      });
                      console.log('Fallback message sent to Facebook user');
                    } catch (fbErr: any) {
                      console.error('Failed to send fallback to Facebook:', fbErr);
                    }
                  }
                } else {
                  const errorText = await aiResponse.text();
                  console.error('AI chat response error:', aiResponse.status, errorText);
                }
              }
            } catch (aiError) {
              // AI errors must never break the webhook - message is already saved for human agents
              console.error('AI chatbot error (non-fatal):', aiError);
            }
            // === END AI CHATBOT INTEGRATION ===
          }

          // Update conversation timestamp
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversation.id);
        }

        // Handle postbacks (button clicks)
        if (messaging.postback) {
          const postbackPayload = messaging.postback.payload;
          
          // Handle "Talk to Agent" persistent menu postback
          if (postbackPayload === 'TALK_TO_AGENT') {
            console.log('User clicked Talk to Agent from persistent menu');
            
            // Pause AI for this conversation
            await supabase
              .from('conversations')
              .update({
                status: 'open',
                priority: 'high',
                metadata: {
                  ...conversation.metadata,
                  ai_paused: true,
                  ai_paused_at: new Date().toISOString(),
                  ai_paused_reason: 'customer_requested_human_menu',
                  helper_summary_sent: false
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', conversation.id);

            // Trigger Agent Helper Bot summary
            try {
              const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
              const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
              await fetch(`${SUPABASE_URL}/functions/v1/agent-helper-summary`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ conversationId: conversation.id })
              });
              console.log('Agent helper summary triggered from TALK_TO_AGENT postback', conversation.id);
            } catch (helperError) {
              console.error('Failed to trigger agent helper summary from postback:', helperError);
            }
            
            // Notify agents about escalation
            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-agents`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  conversationId: conversation.id,
                  messagePreview: '🚨 Customer requested human agent',
                  channel: 'facebook',
                  senderName: contact?.name || contact?.facebook_display_name || 'Customer'
                })
              });
            } catch (notifyErr) {
              console.error('Failed to notify agents about escalation:', notifyErr);
            }

            // Notify LINE group about escalation (Talk to Agent menu)
            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-line-group`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  conversationId: conversation.id,
                  customerName: contact?.name || contact?.facebook_display_name || 'Customer',
                  channel: 'facebook',
                  messagePreview: '🚨 Customer clicked Talk to Agent menu'
                })
              });
            } catch (lineGroupErr: any) {
              console.error('Failed to notify LINE group:', lineGroupErr);
            }
            
            // Send confirmation message
            const handoffLang = await detectConversationLanguage(supabase, conversation.id);
            const handoffMsg = handoffLang === 'th'
              ? 'น้องส่งต่อให้เจ้าหน้าที่ดูแลนะคะพี่ ทีมของน้องจะติดต่อกลับโดยเร็วที่สุดค่ะ 😊 หากพี่ต้องการกลับมาคุยกับแชทบอท พิมพ์ "bot" ได้เลยนะคะ'
              : "I'll connect you with our support team — they'll get back to you ASAP! 😊 If you'd like to return to the chatbot, just type 'bot'";
            
            await supabase.from('conversation_messages').insert({
              conversation_id: conversation.id,
              sender_type: 'bot',
              content: handoffMsg,
              is_internal_note: false,
              metadata: { ai_auto_response: true, channel: 'facebook', human_handoff: true }
            });
            
            await fetch(
              `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: { text: handoffMsg },
                  messaging_type: 'RESPONSE'
                })
              }
            );
          } else {
            // Save other postbacks as messages
            const { error: msgError } = await supabase
              .from('conversation_messages')
              .insert({
                conversation_id: conversation.id,
                sender_type: 'customer',
                sender_id: contact.id,
                content: `[Button: ${messaging.postback.title || postbackPayload}]`,
                is_internal_note: false,
                metadata: { 
                  type: 'postback',
                  payload: postbackPayload,
                  psid: senderId
                },
              });

            if (msgError) {
              console.error('Error saving postback:', msgError);
            }
          }
        }
      }

      // ============= STANDBY HANDLER =============
      // When Page Inbox (Secondary Receiver) has thread control, Facebook routes
      // events to the app's `standby` array instead of `messaging`.
      // We handle both: (1) echo messages from agent replies and (2) customer messages (e.g. ad replies).
      for (const standbyEvent of entry.standby || []) {
        // --- Handle customer messages in standby (e.g. ad replies) ---
        if (standbyEvent.message && !(standbyEvent.message as any).is_echo) {
          const standbySenderId = standbyEvent.sender.id;
          const standbyText = standbyEvent.message.text || '';
          console.log(`Standby: Customer message received (likely ad reply). sender=${standbySenderId}, text="${standbyText.slice(0, 80)}"`);

          // Take thread control so our bot can respond
          try {
            await fetch(
              `https://graph.facebook.com/v19.0/me/take_thread_control?access_token=${pageAccessToken}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: standbySenderId },
                  metadata: 'Taking control for ad reply processing'
                })
              }
            );
            console.log('Thread control taken for standby customer message');
          } catch (e: any) {
            console.error('Failed to take thread control for standby message:', e);
          }

          // Fetch user profile
          const standbyProfile = await fetchUserProfile(standbySenderId, pageAccessToken);

          // Find or create contact
          let { data: sContact } = await supabase
            .from('contacts')
            .select('*')
            .eq('facebook_id', standbySenderId)
            .single();

          if (!sContact) {
            const standbyEnriched = !!(standbyProfile.name || standbyProfile.profile_pic);
            const standbyMeta: Record<string, any> = {
              profile_status: standbyEnriched ? 'profile_enriched' : 'psid_only',
            };
            if (!standbyEnriched && standbyProfile.error_code) {
              standbyMeta.profile_error_code = standbyProfile.error_code;
              standbyMeta.profile_error_message = standbyProfile.error_message;
            }
            const { data: newSContact, error: sContactErr } = await supabase
              .from('contacts')
              .insert({
                facebook_id: standbySenderId,
                facebook_display_name: standbyProfile.name || null,
                facebook_picture_url: standbyProfile.profile_pic || null,
                name: standbyProfile.name || `Messenger Contact`,
                metadata: standbyMeta,
              })
              .select()
              .single();
            if (sContactErr) { console.error('Standby: Error creating contact:', sContactErr); continue; }
            sContact = newSContact;
          }

          // Find or create conversation
          let { data: sConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('contact_id', sContact!.id)
            .eq('channel', 'facebook')
            .in('status', ['open', 'pending'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!sConv) {
            const { data: newSConv, error: sConvErr } = await supabase
              .from('conversations')
              .insert({
                contact_id: sContact!.id,
                channel: 'facebook',
                status: 'open',
                subject: standbyProfile.name ? `Facebook: ${standbyProfile.name}` : 'New Facebook Message',
                metadata: { psid: standbySenderId, page_id: pageId, source: 'ad_reply' },
              })
              .select()
              .single();
            if (sConvErr) { console.error('Standby: Error creating conversation:', sConvErr); continue; }
            sConv = newSConv;
          }

          // Save the customer message
          await supabase.from('conversation_messages').insert({
            conversation_id: sConv!.id,
            content: standbyText || '[attachment]',
            sender_type: 'customer',
            sender_id: sContact!.id,
            is_internal_note: false,
            metadata: { channel: 'facebook', source: 'standby_ad_reply' }
          });

          // Send intent selection quick replies (same as new conversation flow)
          const sIntentGreeting = 'สวัสดีค่ะพี่! 🌏✨ น้องช่วยอะไรพี่ได้คะ?';
          await supabase.from('conversation_messages').insert({
            conversation_id: sConv!.id,
            sender_type: 'bot',
            content: sIntentGreeting,
            is_internal_note: false,
            metadata: { ai_auto_response: true, channel: 'facebook', intent_greeting: true }
          });

          await fetch(
            `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: standbySenderId },
                message: {
                  text: sIntentGreeting,
                  quick_replies: [
                    { content_type: 'text', title: '🛒 ซื้อ eSIM', payload: 'INTENT_SALES' },
                    { content_type: 'text', title: '🙋 ช่วยเหลือ', payload: 'INTENT_SUPPORT' }
                  ]
                },
                messaging_type: 'RESPONSE'
              })
            }
          );

          // Set intent_pending
          await supabase.from('conversations').update({
            metadata: { ...(sConv!.metadata as any || {}), intent_pending: true },
            updated_at: new Date().toISOString()
          }).eq('id', sConv!.id);

          // Notify agents
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-agents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                conversationId: sConv!.id,
                message: standbyText || '[Ad Reply]',
                customerName: standbyProfile.name || 'Facebook User',
                channel: 'facebook'
              })
            });
          } catch (notifyErr) {
            console.error('Standby: Failed to notify agents:', notifyErr);
          }

          console.log(`Standby customer message processed: conversation=${sConv!.id}`);
          continue;
        }

        // --- Handle echo messages (agent replies from Meta Business Suite) ---
        if (!(standbyEvent.message as any)?.is_echo) {
          continue;
        }

        console.log('Standby echo detected (agent reply via Page Inbox thread control)');

        const customerFbId = standbyEvent.recipient.id;

        const { data: standbyContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('facebook_id', customerFbId)
          .single();

        if (!standbyContact) {
          console.log('No contact found for standby echo recipient:', customerFbId);
          continue;
        }

        const { data: standbyConv } = await supabase
          .from('conversations')
          .select('id, metadata')
          .eq('contact_id', standbyContact.id)
          .eq('channel', 'facebook')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (!standbyConv) {
          console.log('No conversation found for standby echo contact:', standbyContact.id);
          continue;
        }

        const standbyEchoText = standbyEvent.message?.text || '';
        const { data: recentBotMsg } = await supabase
          .from('conversation_messages')
          .select('id')
          .eq('conversation_id', standbyConv.id)
          .eq('content', standbyEchoText)
          .eq('sender_type', 'bot')
          .gte('created_at', new Date(Date.now() - 30000).toISOString())
          .limit(1);

        const isFromOurSystem = recentBotMsg && recentBotMsg.length > 0;

        const { data: recentAgentMsg } = await supabase
          .from('conversation_messages')
          .select('id')
          .eq('conversation_id', standbyConv.id)
          .eq('content', standbyEchoText)
          .eq('sender_type', 'agent')
          .gte('created_at', new Date(Date.now() - 30000).toISOString())
          .limit(1);

        const isAlreadySaved = recentAgentMsg && recentAgentMsg.length > 0;

        if (!isFromOurSystem && !isAlreadySaved) {
          console.log('Standby: Agent reply from Meta Business Suite, saving and pausing AI');

          await supabase.from('conversation_messages').insert({
            conversation_id: standbyConv.id,
            content: standbyEchoText || '[attachment]',
            sender_type: 'agent',
            is_internal_note: false,
            metadata: { channel: 'facebook', source: 'meta_business_suite', via_standby: true }
          });

          const standbyMetadata = (standbyConv.metadata || {}) as Record<string, any>;
          await supabase.from('conversations').update({
            metadata: {
              ...standbyMetadata,
              ai_paused: true,
              ai_paused_at: new Date().toISOString(),
              ai_paused_reason: 'agent_replied'
            },
            updated_at: new Date().toISOString()
          }).eq('id', standbyConv.id);
        } else {
          console.log('Standby echo is from our system or already saved, skipping');
        }
      }
      // ============= END STANDBY HANDLER =============

      // ============= FEED COMMENT AUTO-REPLY HANDLER =============
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field !== 'feed' || change.value?.item !== 'comment' || change.value?.verb !== 'add') {
            continue;
          }

          const commentValue = change.value;
          const commentId = commentValue.comment_id;
          const commentFromId = commentValue.from?.id;
          const commentText = commentValue.message || '';

          console.log(`Feed comment received: commentId=${commentId}, from=${commentFromId}, text="${commentText}"`);

          // Skip comments from the page itself
          if (commentFromId === pageId) {
            console.log('Skipping comment from page itself');
            continue;
          }

          // Skip if no comment ID
          if (!commentId) {
            console.log('No comment_id in feed change, skipping');
            continue;
          }

          // 1. Post a public reply to the comment
          try {
            const publicReplyText = 'ขอบคุณที่สนใจครับ/ค่ะ! 💬 ทักแชทเราได้เลยนะครับ เราช่วยได้ทันที\nThank you for your interest! Send us a message and we\'ll help you right away. 😊';
            
            const publicReplyResponse = await fetch(
              `https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageAccessToken}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: publicReplyText })
              }
            );
            const publicReplyResult = await publicReplyResponse.json();
            console.log('Public reply result:', JSON.stringify(publicReplyResult));
          } catch (publicReplyError) {
            console.error('Failed to post public reply:', publicReplyError);
          }

          // 2. Send a private reply via Messenger
          try {
            const privateReplyText = 'สวัสดีครับ! 😊 เห็นคอมเมนต์ของคุณแล้ว ยินดีช่วยเหลือครับ\nHi! We saw your comment. How can we help you?';
            
            const privateReplyResponse = await fetch(
              `https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${pageAccessToken}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: privateReplyText })
              }
            );
            const privateReplyResult = await privateReplyResponse.json();
            console.log('Private reply result:', JSON.stringify(privateReplyResult));
          } catch (privateReplyError) {
            console.error('Failed to send private reply:', privateReplyError);
          }
        }
      }
      // ============= END FEED COMMENT AUTO-REPLY HANDLER =============
    }

    return new Response('EVENT_RECEIVED', { status: 200, headers: corsHeaders });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
