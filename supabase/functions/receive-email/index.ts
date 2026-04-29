import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SSE Stream Parser for ai-chat-response streaming responses
async function consumeSSEStream(response: Response): Promise<{
  response: string;
  confidence?: number;
  escalate?: boolean;
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
  return { response: fullContent, confidence: metadata.confidence, escalate: metadata.escalate };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

// Resend inbound webhook payload format
interface ResendInboundPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      id: string;
      filename: string;
      content_type: string;
    }>;
    headers?: Array<{
      name: string;
      value: string;
    }>;
  };
}

// Internal email format
interface EmailPayload {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: Array<{
    filename: string;
    content_type: string;
    url: string;
    size?: number;
  }>;
}

// Spam filter rule from database
interface SpamFilterRule {
  id: string;
  rule_type: 'keyword' | 'domain' | 'email' | 'regex';
  value: string;
  is_active: boolean;
  match_in: string[];
}

// Spam check result
interface SpamCheckResult {
  isSpam: boolean;
  matchedRules: string[];
}

// Check if email is whitelisted
async function isWhitelisted(supabase: any, senderEmail: string): Promise<boolean> {
  try {
    // Extract email address from format like "Name <email@domain.com>"
    const emailMatch = senderEmail.match(/<([^>]+)>/);
    const normalizedEmail = (emailMatch ? emailMatch[1] : senderEmail).toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('email_whitelist')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }
    
    return !!data;
  } catch (error: any) {
    console.error('Error in whitelist check:', error);
    return false;
  }
}

// Check email against spam filter rules
async function checkSpam(
  supabase: any,
  email: { from: string; subject: string; body: string }
): Promise<SpamCheckResult> {
  const matchedRules: string[] = [];
  
  try {
    // First check if sender is whitelisted
    const whitelisted = await isWhitelisted(supabase, email.from);
    if (whitelisted) {
      console.log('Sender is whitelisted, bypassing spam check:', email.from);
      return { isSpam: false, matchedRules: [] };
    }

    // Fetch active spam rules
    const { data: rules, error } = await supabase
      .from('spam_filter_rules')
      .select('id, rule_type, value, match_in')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching spam rules:', error);
      return { isSpam: false, matchedRules: [] };
    }
    
    if (!rules || rules.length === 0) {
      return { isSpam: false, matchedRules: [] };
    }
    
    // Extract sender domain
    const senderDomain = email.from.includes('@') 
      ? email.from.split('@')[1]?.replace(/>$/, '').toLowerCase() 
      : '';
    const senderEmail = email.from.match(/<([^>]+)>/)?.[1]?.toLowerCase() || email.from.toLowerCase();
    
    for (const rule of rules as SpamFilterRule[]) {
      let matched = false;
      
      switch (rule.rule_type) {
        case 'keyword': {
          const valueLower = rule.value.toLowerCase();
          if (rule.match_in.includes('subject') && email.subject.toLowerCase().includes(valueLower)) {
            matched = true;
          }
          if (!matched && rule.match_in.includes('body') && email.body.toLowerCase().includes(valueLower)) {
            matched = true;
          }
          break;
        }
        
        case 'domain': {
          if (rule.match_in.includes('from') && senderDomain === rule.value.toLowerCase()) {
            matched = true;
          }
          break;
        }
        
        case 'email': {
          if (rule.match_in.includes('from') && senderEmail === rule.value.toLowerCase()) {
            matched = true;
          }
          break;
        }
        
        case 'regex': {
          try {
            const regex = new RegExp(rule.value, 'i');
            if (rule.match_in.includes('subject') && regex.test(email.subject)) {
              matched = true;
            }
            if (!matched && rule.match_in.includes('body') && regex.test(email.body)) {
              matched = true;
            }
            if (!matched && rule.match_in.includes('from') && regex.test(senderEmail)) {
              matched = true;
            }
          } catch (regexError) {
            console.error('Invalid regex pattern:', rule.value, regexError);
          }
          break;
        }
      }
      
      if (matched) {
        matchedRules.push(`${rule.rule_type}: ${rule.value}`);
      }
    }
    
    return {
      isSpam: matchedRules.length > 0,
      matchedRules,
    };
  } catch (error: any) {
    console.error('Error in spam check:', error);
    return { isSpam: false, matchedRules: [] };
  }
}

// Normalize subject by removing Re:, Fwd:, etc.
function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw):\s*/gi, '')
    .replace(/^(re|fwd|fw):\s*/gi, '') // Run twice for "Re: Fwd:" patterns
    .trim()
    .toLowerCase();
}

// Parse References header into array
function parseReferences(referencesHeader: string): string[] {
  if (!referencesHeader) return [];
  return referencesHeader.split(/\s+/).filter(id => id.length > 0);
}

// Full email response from Resend including threading headers
interface FullEmailResponse {
  text: string;
  html: string;
  in_reply_to?: string;
  references?: string;
  message_id?: string;
}

// Fetch full email content from Resend inbound API
async function fetchFullEmail(emailId: string): Promise<FullEmailResponse | null> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }

  try {
    // Use /emails/receiving/{id} endpoint for inbound emails (not /emails/{id} which is for outbound)
    const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch email from Resend:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Fetched full email from Resend inbound API:', { 
      hasText: !!data.text, 
      hasHtml: !!data.html,
      textLength: data.text?.length || 0,
      htmlLength: data.html?.length || 0,
      inReplyTo: data.in_reply_to || null,
      references: data.references || null,
      messageId: data.message_id || null
    });

    return {
      text: data.text || '',
      html: data.html || '',
      in_reply_to: data.in_reply_to,
      references: data.references,
      message_id: data.message_id,
    };
  } catch (error: any) {
    console.error('Error fetching full email:', error);
    return null;
  }
}

// Fetch all attachment download URLs from Resend inbound API
async function fetchAttachmentUrls(emailId: string): Promise<Map<string, string>> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const urlMap = new Map<string, string>();
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return urlMap;
  }

  try {
    // Use /emails/receiving/{id}/attachments endpoint for inbound emails
    const response = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}/attachments`,
      {
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch attachments:', response.status, await response.text());
      return urlMap;
    }

    const data = await response.json();
    console.log('Fetched attachment URLs from Resend:', { count: data.data?.length || 0 });
    
    // Map attachment IDs to their download URLs
    for (const att of data.data || []) {
      if (att.id && att.download_url) {
        urlMap.set(att.id, att.download_url);
      }
    }
    
    return urlMap;
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    return urlMap;
  }
}

// Upload attachment to Supabase Storage for permanent storage
async function uploadAttachmentToStorage(
  supabase: any,
  downloadUrl: string,
  filename: string,
  contentType: string,
  conversationId: string
): Promise<{ path: string; size: number } | null> {
  try {
    // Download the file from Resend
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      console.error('Failed to download attachment:', response.status);
      return null;
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create a unique path
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `email-attachments/${conversationId}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, uint8Array, {
        contentType: contentType,
        upsert: false,
      });

    if (error) {
      console.error('Failed to upload to storage:', error);
      return null;
    }

    console.log('Uploaded attachment to storage:', path);
    return { path: data.path, size: uint8Array.length };
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    return null;
  }
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

    const rawPayload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(rawPayload, null, 2));

    // Check if this is a Resend inbound webhook format
    let payload: EmailPayload;
    
    if (rawPayload.type && rawPayload.data) {
      // Resend inbound webhook format
      const resendPayload = rawPayload as ResendInboundPayload;
      
      console.log('Processing Resend inbound webhook:', {
        type: resendPayload.type,
        emailId: resendPayload.data.email_id,
        from: resendPayload.data.from,
        to: resendPayload.data.to,
        subject: resendPayload.data.subject,
        attachmentsCount: resendPayload.data.attachments?.length || 0
      });

      // Only process email.received events
      if (resendPayload.type !== 'email.received') {
        console.log('Ignoring non-email.received event:', resendPayload.type);
        return new Response(
          JSON.stringify({ ignored: true, reason: 'Not an email.received event' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Supported email addresses
      const SUPPORTED_EMAILS = ['business@mobile11.com', 'support@mobile11.com'];
      
      // Check if any of the TO addresses are supported
      const targetEmail = resendPayload.data.to.find(addr => 
        SUPPORTED_EMAILS.some(supported => addr.toLowerCase().includes(supported.toLowerCase()))
      );

      if (!targetEmail) {
        console.log('Ignoring email not addressed to supported addresses:', resendPayload.data.to);
        return new Response(
          JSON.stringify({ ignored: true, reason: 'Not addressed to supported addresses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Determine which email was contacted
      const toEmail = SUPPORTED_EMAILS.find(supported => 
        targetEmail.toLowerCase().includes(supported.toLowerCase())
      ) || 'support@mobile11.com';

      // Extract Message-ID from webhook data first
      let messageId: string | undefined = (resendPayload.data as any).message_id;
      let inReplyTo: string | undefined;
      let references: string[] = [];
      
      // Also check headers array if present (fallback)
      if (resendPayload.data.headers) {
        for (const header of resendPayload.data.headers) {
          const headerName = header.name.toLowerCase();
          if (headerName === 'message-id' && !messageId) {
            messageId = header.value;
          }
          if (headerName === 'in-reply-to') {
            inReplyTo = header.value;
          }
          if (headerName === 'references') {
            references = parseReferences(header.value);
          }
        }
      }

      // ALWAYS fetch full email content from Resend API
      // Webhook doesn't include body OR threading headers (in-reply-to, references)
      let emailText = resendPayload.data.text || '';
      let emailHtml = resendPayload.data.html || '';
      
      console.log('Fetching full email content and headers from Resend API...');
      const fullEmail = await fetchFullEmail(resendPayload.data.email_id);
      if (fullEmail) {
        emailText = fullEmail.text || emailText;
        emailHtml = fullEmail.html || emailHtml;
        
        // Get threading headers from full email if not already set
        if (!inReplyTo && fullEmail.in_reply_to) {
          inReplyTo = fullEmail.in_reply_to;
          console.log('Got In-Reply-To from API:', inReplyTo);
        }
        if (references.length === 0 && fullEmail.references) {
          references = parseReferences(fullEmail.references);
          console.log('Got References from API:', references.length, 'IDs');
        }
        if (!messageId && fullEmail.message_id) {
          messageId = fullEmail.message_id;
        }
      }

      console.log('Email threading info:', {
        messageId,
        inReplyTo: inReplyTo || 'none',
        referencesCount: references.length
      });

      // Map to internal format
      payload = {
        from: resendPayload.data.from,
        to: toEmail,
        subject: resendPayload.data.subject || '(No Subject)',
        body: emailText,
        html: emailHtml,
        messageId,
        inReplyTo,
        references,
        attachments: []
      };

      // Fetch all attachment URLs at once and store them
      if (resendPayload.data.attachments && resendPayload.data.attachments.length > 0) {
        console.log('Processing', resendPayload.data.attachments.length, 'attachments...');
        
        // Fetch all attachment URLs in one API call
        const attachmentUrls = await fetchAttachmentUrls(resendPayload.data.email_id);
        
        for (const att of resendPayload.data.attachments) {
          const downloadUrl = attachmentUrls.get(att.id);
          if (downloadUrl) {
            payload.attachments!.push({
              filename: att.filename,
              content_type: att.content_type,
              url: downloadUrl, // Temporary - will be replaced with storage URL after conversation is created
            });
          } else {
            console.warn('No download URL found for attachment:', att.id, att.filename);
          }
        }
      }
    } else {
      // Legacy format (direct payload)
      payload = rawPayload as EmailPayload;
    }

    console.log('Processing email:', { 
      from: payload.from, 
      to: payload.to, 
      subject: payload.subject,
      bodyLength: payload.body?.length || 0,
      htmlLength: payload.html?.length || 0,
      attachmentsCount: payload.attachments?.length || 0,
      inReplyTo: payload.inReplyTo,
      referencesCount: payload.references?.length || 0
    });

    // ========== SPAM FILTER CHECK ==========
    console.log('Checking email against spam filters...');
    const spamResult = await checkSpam(supabase, {
      from: payload.from,
      subject: payload.subject,
      body: payload.body || payload.html || '',
    });

    if (spamResult.isSpam) {
      console.log('SPAM DETECTED! Matched rules:', spamResult.matchedRules);
      
      // Log to spam_log table
      await supabase
        .from('spam_log')
        .insert({
          from_email: payload.from,
          to_email: payload.to,
          subject: payload.subject,
          message_preview: (payload.body || payload.html || '').substring(0, 500),
          matched_rules: spamResult.matchedRules,
          raw_payload: rawPayload,
        });
      
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'spam', 
          matchedRules: spamResult.matchedRules 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Email passed spam check');
    // ========== END SPAM FILTER CHECK ==========

    // Extract email address from "Name <email>" format
    const emailMatch = payload.from.match(/<([^>]+)>/) || [null, payload.from];
    const senderEmail = emailMatch[1] || payload.from;
    const name = payload.fromName || payload.from.replace(/<[^>]+>/, '').trim() || senderEmail.split('@')[0];

    // Multi-level conversation matching strategy
    let conversationId: string | null = null;
    
    // Strategy 1: Match by In-Reply-To header
    if (payload.inReplyTo && !conversationId) {
      console.log('Trying In-Reply-To match:', payload.inReplyTo);
      
      // Check in last_message_id
      const { data: convByLastMsg } = await supabase
        .from('conversations')
        .select('id')
        .eq('metadata->>last_message_id', payload.inReplyTo)
        .single();
      
      if (convByLastMsg) {
        conversationId = convByLastMsg.id;
        console.log('Found conversation by last_message_id:', conversationId);
      }
      
      // If not found, check in message_ids array
      if (!conversationId) {
        const { data: convByMsgIds } = await supabase
          .from('conversations')
          .select('id, metadata')
          .eq('channel', 'email')
          .not('metadata', 'is', null);
        
        if (convByMsgIds) {
          for (const conv of convByMsgIds) {
            const meta = conv.metadata as Record<string, any>;
            const msgIds = meta?.message_ids || [];
            if (msgIds.includes(payload.inReplyTo)) {
              conversationId = conv.id;
              console.log('Found conversation by message_ids array:', conversationId);
              break;
            }
          }
        }
      }
    }
    
    // Strategy 2: Match by any Reference header message ID
    if (!conversationId && payload.references && payload.references.length > 0) {
      console.log('Trying References match with', payload.references.length, 'IDs');
      
      const { data: allEmailConvs } = await supabase
        .from('conversations')
        .select('id, metadata')
        .eq('channel', 'email')
        .not('metadata', 'is', null);
      
      if (allEmailConvs) {
        outer: for (const conv of allEmailConvs) {
          const meta = conv.metadata as Record<string, any>;
          const msgIds = meta?.message_ids || [];
          const lastMsgId = meta?.last_message_id;
          
          // Check if any reference matches
          for (const ref of payload.references) {
            if (msgIds.includes(ref) || lastMsgId === ref) {
              conversationId = conv.id;
              console.log('Found conversation by References header:', conversationId);
              break outer;
            }
          }
        }
      }
    }
    
    // Strategy 3: Fallback - Match by normalized subject + to_email (within 30 days)
    // This is more reliable than contact-based matching since it looks at ALL email conversations
    if (!conversationId) {
      const normalizedSubject = normalizeSubject(payload.subject);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('Trying subject+to_email fallback match:', { 
        normalizedSubject, 
        senderEmail,
        toEmail: payload.to,
        since: thirtyDaysAgo.toISOString()
      });
      
      // Search ALL email conversations with matching normalized subject and to_email
      // This is more reliable than contact-based matching
      const { data: recentConvs } = await supabase
        .from('conversations')
        .select('id, subject, metadata, contact_id, updated_at')
        .eq('channel', 'email')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });
      
      if (recentConvs) {
        for (const conv of recentConvs) {
          const convNormalizedSubject = normalizeSubject(conv.subject || '');
          const convMetadata = conv.metadata as Record<string, any> | null;
          const convToEmail = convMetadata?.to_email;
          
          // Match by normalized subject AND same to_email (what email address customer contacted)
          if (convNormalizedSubject === normalizedSubject && convToEmail === payload.to) {
            // Also verify the contact's email matches the sender
            const { data: contact } = await supabase
              .from('contacts')
              .select('email')
              .eq('id', conv.contact_id)
              .maybeSingle();
            
            if (contact && contact.email?.toLowerCase() === senderEmail.toLowerCase()) {
              conversationId = conv.id;
              console.log('Found conversation by subject+to_email+sender fallback:', conversationId);
              break;
            }
          }
        }
      }
    }

    // Find or create contact using upsert pattern
    // Use case-insensitive matching and get oldest contact if multiple exist
    let contactId: string;
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id')
      .ilike('email', senderEmail)
      .order('created_at', { ascending: true })
      .limit(1);

    if (existingContacts && existingContacts.length > 0) {
      contactId = existingContacts[0].id;
      console.log('Found existing contact:', contactId);
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({ email: senderEmail.toLowerCase(), name })
        .select('id')
        .single();

      if (contactError) {
        // If insert fails due to unique constraint, fetch existing
        if (contactError.code === '23505') {
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .ilike('email', senderEmail)
            .order('created_at', { ascending: true })
            .limit(1);
          
          if (existingContact && existingContact.length > 0) {
            contactId = existingContact[0].id;
            console.log('Found existing contact after conflict:', contactId);
          } else {
            throw contactError;
          }
        } else {
          throw contactError;
        }
      } else {
        contactId = newContact.id;
        console.log('Created new contact:', contactId);
      }
    }

    // Get existing metadata if conversation exists
    let existingMetadata: Record<string, any> = {};
    if (conversationId) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();
      
      existingMetadata = (existingConv?.metadata as Record<string, any>) || {};
    }

    // Create new conversation if not a reply
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contactId,
          channel: 'email',
          status: 'open',
          subject: payload.subject,
          metadata: { 
            message_id: payload.messageId,
            message_ids: payload.messageId ? [payload.messageId] : [],
            last_message_id: payload.messageId,
            to_email: payload.to
          }
        })
        .select('id')
        .single();

      if (convError) throw convError;
      conversationId = newConv.id as string;
      console.log('Created new conversation:', conversationId);
    }

    // Upload attachments to Supabase Storage for permanent storage
    const storedAttachments: Array<{
      name: string;
      path: string;
      size: number;
      type: string;
    }> = [];

    if (payload.attachments && payload.attachments.length > 0) {
      console.log('Uploading attachments to storage...');
      
      for (const att of payload.attachments) {
        const stored = await uploadAttachmentToStorage(
          supabase,
          att.url,
          att.filename,
          att.content_type,
          conversationId
        );
        
        if (stored) {
          storedAttachments.push({
            name: att.filename,
            path: stored.path,
            size: stored.size,
            type: att.content_type,
          });
        }
      }
      
      console.log('Stored', storedAttachments.length, 'attachments');
    }

    // Add message to conversation
    const { error: msgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        content: payload.body || payload.html || '',
        sender_type: 'customer',
        attachments: storedAttachments.length > 0 ? storedAttachments : [],
        metadata: { 
          email_from: payload.from,
          message_id: payload.messageId,
          has_html: !!payload.html,
          html_content: payload.html || null
        }
      });

    if (msgError) throw msgError;

    // Update conversation timestamp and metadata
    const existingMessageIds = existingMetadata.message_ids || [];
    const updatedMessageIds = payload.messageId 
      ? [...existingMessageIds, payload.messageId]
      : existingMessageIds;

    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        status: 'open', // Re-open on customer reply
        metadata: { 
          ...existingMetadata,
          last_message_id: payload.messageId,
          message_ids: updatedMessageIds,
          to_email: payload.to
        }
      })
      .eq('id', conversationId);

    console.log('Email processed successfully:', {
      conversationId,
      messageIdsCount: updatedMessageIds.length,
      bodyLength: (payload.body || payload.html || '').length,
      attachmentsStored: storedAttachments.length
    });

    // ========== NOTIFY LINE GROUP OF NEW EMAIL ==========
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/notify-line-group`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          customerName: name || senderEmail,
          channel: 'email',
          messagePreview: (payload.body || payload.subject || '').slice(0, 80)
        })
      });
      console.log('LINE group notified of new email');
    } catch (lineErr) {
      console.error('Failed to notify LINE group of email:', lineErr);
    }

    // ========== AI AUTO-REPLY FOR EMAIL ==========
    
    // Re-fetch metadata to get latest state (including any ai_paused flag)
    const { data: latestConv } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();
    const latestMetadata = (latestConv?.metadata as Record<string, any>) || {};
    
    const aiPaused = latestMetadata.ai_paused === true;
    
    if (aiPaused) {
      console.log('AI is paused for this conversation, skipping auto-reply');
    } else {
      try {
        console.log('Calling AI chat response for email...');

        // Fetch recent message history
        const { data: historyMessages } = await supabase
          .from('conversation_messages')
          .select('content, sender_type, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(20);

        const sortedHistory = (historyMessages || []).slice().reverse();
        const history = sortedHistory.map((m: any) => ({
          role: m.sender_type === 'customer' ? 'user' : 'assistant',
          content: m.content
        }));

        const emailContent = payload.body || payload.html || '';

        const aiResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/ai-chat-response`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              message: emailContent,
              conversationId: conversationId,
              history: history,
              chatMode: 'freetext',
              channel: 'email'
            })
          }
        );

        if (aiResponse.ok) {
          const contentType = aiResponse.headers.get('content-type') || '';
          let aiResult: any;

          if (contentType.includes('text/event-stream')) {
            aiResult = await consumeSSEStream(aiResponse);
          } else {
            aiResult = await aiResponse.json();
          }

          console.log('AI email response:', {
            hasResponse: !!aiResult.response,
            escalate: aiResult.escalate,
            confidence: aiResult.confidence
          });

          if (aiResult.response && !aiResult.escalate) {
            // Save bot message to conversation
            await supabase
              .from('conversation_messages')
              .insert({
                conversation_id: conversationId,
                sender_type: 'bot',
                content: aiResult.response,
                is_internal_note: false,
                metadata: {
                  ai_auto_response: true,
                  ai_confidence: aiResult.confidence,
                  channel: 'email'
                }
              });

            console.log('Saved AI bot reply to conversation');

            // Send email reply directly via Resend (bypass send-agent-reply to avoid UUID issue with "ai-bot")
            try {
              const resendApiKey = Deno.env.get('RESEND_API_KEY');
              if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

              const fromEmail = latestMetadata.to_email || 'support@mobile11.com';
              const fromDisplayName = fromEmail === 'business@mobile11.com' ? 'Mobile11 Business' : 'Mobile11 Support';
              const existingMessageIds = latestMetadata.message_ids || [];
              const lastMessageId = latestMetadata.last_message_id || '';

              const emailHeaders: Record<string, string> = {};
              if (lastMessageId) emailHeaders['In-Reply-To'] = lastMessageId;
              if (existingMessageIds.length > 0) emailHeaders['References'] = existingMessageIds.join(' ');

              const replySubject = `Re: ${payload.subject || 'Your inquiry'}`;

              console.log('Sending AI bot email directly via Resend:', {
                from: `${fromDisplayName} <${fromEmail}>`,
                to: senderEmail,
                subject: replySubject,
                headers: emailHeaders
              });

              const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: `${fromDisplayName} <${fromEmail}>`,
                  to: senderEmail,
                  subject: replySubject,
                  text: aiResult.response,
                  html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="white-space: pre-wrap;">${aiResult.response.replace(/\n/g, '<br>')}</div>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                      ${fromDisplayName} Team<br>
                      <a href="https://mobile11.com" style="color: #0066cc;">mobile11.com</a>
                    </p>
                  </div>`,
                  headers: emailHeaders
                })
              });

              if (resendResponse.ok) {
                const resendResult = await resendResponse.json();
                console.log('AI bot email sent successfully, Message-ID:', resendResult.id);

                // Update conversation metadata with new Message-ID for threading
                if (resendResult.id) {
                  const updatedMessageIds = [...existingMessageIds, resendResult.id];
                  await supabase
                    .from('conversations')
                    .update({
                      metadata: {
                        ...latestMetadata,
                        last_message_id: resendResult.id,
                        message_ids: updatedMessageIds
                      }
                    })
                    .eq('id', conversationId);
                }
              } else {
                const errText = await resendResponse.text();
                console.error('Resend API error:', resendResponse.status, errText);
              }
            } catch (sendErr) {
              console.error('Failed to send AI email reply:', sendErr);
            }
          } else if (aiResult.escalate) {
            console.log('AI escalated — skipping auto-reply, awaiting human agent');
            // Mark conversation as needing human attention
            await supabase
              .from('conversations')
              .update({
                priority: 'high',
                metadata: {
                  ...latestMetadata,
                  ai_paused: true,
                  ai_paused_at: new Date().toISOString(),
                  ai_paused_reason: 'escalated'
                }
              })
              .eq('id', conversationId);
          }
        } else {
          console.error('AI chat response error:', aiResponse.status, await aiResponse.text());
        }
      } catch (aiErr) {
        console.error('Error calling AI for email auto-reply:', aiErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, conversationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error processing email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
