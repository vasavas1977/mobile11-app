import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

    if (!accessToken) {
      console.log('[notify-line-group] Missing LINE_CHANNEL_ACCESS_TOKEN, skipping');
      return new Response(
        JSON.stringify({ success: false, reason: 'Not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read group ID from DB first, fallback to secret
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let groupId: string | null = null;

    const { data: configRow } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'line_alert_group_id')
      .single();

    if (configRow?.value) {
      groupId = configRow.value;
      console.log('[notify-line-group] Using group ID from DB:', groupId);
    } else {
      // Fallback to secret
      groupId = Deno.env.get('LINE_ALERT_GROUP_ID') || null;
      if (groupId) {
        console.log('[notify-line-group] Using group ID from secret (fallback)');
      }
    }

    if (!groupId) {
      console.log('[notify-line-group] No LINE alert group configured, skipping');
      return new Response(
        JSON.stringify({ success: false, reason: 'No group configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { conversationId, customerName, channel, messagePreview, alertType } = await req.json();

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://mobile11.com';
    const channelLabel = (channel || 'chat').toUpperCase();
    const name = customerName || 'Customer';

    // Determine alert header based on type/channel
    const isNewInquiry = channel === 'email' || channel === 'form';
    const header = isNewInquiry ? '📩 New Inquiry Received' : '🚨 Agent Requested';

    // Fetch last 3 non-internal messages for context
    let historyBlock = '';
    if (conversationId) {
      const { data: recentMessages } = await supabase
        .from('conversation_messages')
        .select('content, sender_type')
        .eq('conversation_id', conversationId)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentMessages && recentMessages.length > 0) {
        const formatted = recentMessages.reverse().map((m: any, i: number) => {
          const icon = m.sender_type === 'user' ? '👤' : '🤖';
          const text = m.content.length > 80 ? m.content.slice(0, 80) + '…' : m.content;
          return `${i + 1}. ${icon} ${text}`;
        });
        historyBlock = '💬 Recent messages:\n' + formatted.join('\n');
      }
    }

    // Fallback to single preview if no history found
    if (!historyBlock && messagePreview) {
      const preview = messagePreview.length > 80 ? messagePreview.slice(0, 80) + '…' : messagePreview;
      historyBlock = `💬 "${preview}"`;
    }

    const lines = [
      header,
      `👤 ${name}`,
      `📱 Channel: ${channelLabel}`,
    ];
    if (historyBlock) {
      lines.push(historyBlock);
    }
    lines.push(`🔗 ${frontendUrl}/agent/conversation/${conversationId}`);

    const messageText = lines.join('\n');

    console.log(`[notify-line-group] Sending alert to group ${groupId}`);

    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: groupId,
        messages: [{ type: 'text', text: messageText }],
      }),
    });

    if (!lineResponse.ok) {
      const errorBody = await lineResponse.text();
      console.error('[notify-line-group] LINE API error:', lineResponse.status, errorBody);
      return new Response(
        JSON.stringify({ success: false, error: errorBody }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[notify-line-group] Alert sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[notify-line-group] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
