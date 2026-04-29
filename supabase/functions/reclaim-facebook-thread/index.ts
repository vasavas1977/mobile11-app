import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getPageAccessToken(supabase: any, fallback: string) {
  try {
    const { data: conn } = await supabase
      .from('channel_connections')
      .select('access_token')
      .eq('channel_type', 'facebook')
      .eq('status', 'active')
      .limit(1)
      .single();
    if (conn?.access_token) return conn.access_token;
  } catch (_) {}
  return fallback;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { psid, action, message } = body;
    const pageAccessToken = await getPageAccessToken(supabase, FACEBOOK_PAGE_ACCESS_TOKEN);

    // Action: send-test-message
    if (action === 'send-test-message' && psid) {
      const msg = message || 'Test message from bot';
      console.log(`Sending test message to PSID: ${psid}`);
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: psid },
            message: { text: msg },
            messaging_type: 'UPDATE',
          }),
        }
      );
      const data = await res.json();
      console.log('Send message result:', JSON.stringify(data));
      return new Response(JSON.stringify({ success: res.ok, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!psid) {
      return new Response(JSON.stringify({ error: 'psid is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    // Step 1: Try take_thread_control
    console.log(`Attempting take_thread_control for PSID: ${psid}`);
    const takeRes = await fetch(
      `https://graph.facebook.com/v19.0/me/take_thread_control?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: psid },
          metadata: 'Reclaiming stuck thread via utility function',
        }),
      }
    );
    const takeData = await takeRes.json();
    results.push({ action: 'take_thread_control', status: takeRes.status, data: takeData });
    console.log('take_thread_control result:', JSON.stringify(takeData));

    if (takeRes.ok) {
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Fallback to request_thread_control
    console.log('take_thread_control failed, trying request_thread_control...');
    const reqRes = await fetch(
      `https://graph.facebook.com/v19.0/me/request_thread_control?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: psid },
          metadata: 'Requesting thread control back from Page Inbox',
        }),
      }
    );
    const reqData = await reqRes.json();
    results.push({ action: 'request_thread_control', status: reqRes.status, data: reqData });
    console.log('request_thread_control result:', JSON.stringify(reqData));

    return new Response(JSON.stringify({ success: reqRes.ok, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
