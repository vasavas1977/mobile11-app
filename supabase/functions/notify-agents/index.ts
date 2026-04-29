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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://mobile11.com';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId, messagePreview, channel, senderName } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch conversation to check assignment
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('assigned_to, subject, channel')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[notify-agents] Conversation not found:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUserIds: string[] = [];

    if (conversation.assigned_to) {
      // Notify the assigned agent only
      targetUserIds = [conversation.assigned_to];
      console.log(`[notify-agents] Notifying assigned agent: ${conversation.assigned_to}`);
    } else {
      // Notify all agents/supervisors/admins
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['agent', 'supervisor', 'admin']);

      if (rolesError) {
        console.error('[notify-agents] Error fetching agent roles:', rolesError);
      }

      if (agentRoles && agentRoles.length > 0) {
        targetUserIds = [...new Set(agentRoles.map(r => r.user_id))];
        console.log(`[notify-agents] Notifying ${targetUserIds.length} agents (unassigned conversation)`);
      }
    }

    if (targetUserIds.length === 0) {
      console.log('[notify-agents] No agents to notify');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No agents to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification
    const channelLabel = (channel || conversation.channel || 'chat').toUpperCase();
    const sender = senderName || 'Customer';
    const preview = messagePreview
      ? (messagePreview.length > 100 ? messagePreview.slice(0, 100) + '…' : messagePreview)
      : 'New message';

    const notification = {
      title: `💬 ${sender} via ${channelLabel}`,
      body: preview,
      icon: '/favicon-512.png',
      badge: '/favicon-512.png',
      tag: `agent-msg-${conversationId}`,
      data: {
        url: `/agent/conversation/${conversationId}`,
        conversationId,
        channel: channelLabel,
      }
    };

    // Call send-push-notification
    const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: targetUserIds,
        notification,
      }),
    });

    const pushResult = await pushResponse.json();
    console.log('[notify-agents] Push result:', pushResult);

    return new Response(
      JSON.stringify({ success: true, ...pushResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[notify-agents] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
