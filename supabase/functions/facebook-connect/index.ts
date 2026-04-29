import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: {
    cursors: { after: string; before: string };
    next?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
  const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('Missing Facebook configuration');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Missing Facebook App credentials' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // Verify auth for all actions
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Extract token and verify user authentication
  const token = authHeader.replace('Bearer ', '');
  
  // Create client with anon key and verify the token directly
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Verify user is authenticated using the token
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
  
  if (userError || !user) {
    console.error('Auth error:', userError?.message || 'No user found', 'Token prefix:', token?.substring(0, 20));
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create service role client for database operations
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const userId = user.id;

  // Check if user is supervisor or higher
  const { data: roleCheck } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['supervisor', 'admin'])
    .single();

  if (!roleCheck) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Supervisor or admin role required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Normalize FRONTEND_URL to an origin (strip any accidental path) to avoid
  // generating a doubled redirect like: /auth/facebook/callback/auth/facebook/callback
  const rawFrontendUrl = Deno.env.get('FRONTEND_URL') || 'https://mobile11.com';
  const frontendOrigin = (() => {
    try {
      return new URL(rawFrontendUrl).origin;
    } catch {
      return rawFrontendUrl.replace(/\/+$/, '');
    }
  })();
  const facebookRedirectUri = `${frontendOrigin}/auth/facebook/callback`;

  try {
    switch (action) {
      case 'initiate': {
        // Core scopes only — always approved, safe for connect/reconnect
        const scope = 'pages_show_list,pages_messaging,pages_manage_metadata';
        
        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
          `client_id=${FACEBOOK_APP_ID}` +
          `&redirect_uri=${encodeURIComponent(facebookRedirectUri)}` +
          `&scope=${encodeURIComponent(scope)}` +
          `&response_type=code` +
          `&state=${userId}`;

        return new Response(
          JSON.stringify({ oauthUrl, redirectUri: facebookRedirectUri }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'upgrade-permissions': {
        // Extended scopes for comment auto-reply — requires Meta App Review approval
        const scope = 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_user_content,pages_manage_engagement';
        
        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
          `client_id=${FACEBOOK_APP_ID}` +
          `&redirect_uri=${encodeURIComponent(facebookRedirectUri)}` +
          `&scope=${encodeURIComponent(scope)}` +
          `&response_type=code` +
          `&state=${userId}` +
          `&auth_type=rerequest`;

        return new Response(
          JSON.stringify({ oauthUrl, redirectUri: facebookRedirectUri, upgrade: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'callback': {
        // Exchange code for access token
        const body = await req.json();
        const { code } = body;

        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Missing authorization code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exchange code for user access token
        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
          `client_id=${FACEBOOK_APP_ID}` +
          `&client_secret=${FACEBOOK_APP_SECRET}` +
          `&redirect_uri=${encodeURIComponent(facebookRedirectUri)}` +
          `&code=${code}`;

        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error('Token exchange error:', tokenData.error);
          return new Response(
            JSON.stringify({ error: tokenData.error.message || 'Failed to exchange code for token' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userAccessToken = tokenData.access_token;

        // Get list of pages the user manages
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?` +
          `fields=id,name,access_token,category,picture` +
          `&access_token=${userAccessToken}`;

        const pagesResponse = await fetch(pagesUrl);
        const pagesData: FacebookPagesResponse = await pagesResponse.json();

        if (!pagesData.data || pagesData.data.length === 0) {
          return new Response(
            JSON.stringify({ 
              error: 'No pages found', 
              message: 'You don\'t manage any Facebook Pages. Please create a Page first or request admin access to an existing Page.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Return list of pages for user to select
        const pages = pagesData.data.map(page => ({
          id: page.id,
          name: page.name,
          category: page.category,
          picture: page.picture?.data?.url,
          access_token: page.access_token, // This is the page access token
        }));

        return new Response(
          JSON.stringify({ pages }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'select-page': {
        // Save selected page to database
        const body = await req.json();
        const { pageId, pageName, pageAccessToken, pagePicture } = body;

        if (!pageId || !pageName || !pageAccessToken) {
          return new Response(
            JSON.stringify({ error: 'Missing page details' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Subscribe to webhook for this page
        const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?` +
          `subscribed_fields=messages,messaging_postbacks,message_echoes,messaging_handovers,feed` +
          `&access_token=${pageAccessToken}`;

        const subscribeResponse = await fetch(subscribeUrl, { method: 'POST' });
        const subscribeData = await subscribeResponse.json();

        if (subscribeData.error) {
          console.error('Webhook subscription error:', subscribeData.error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to subscribe to page webhooks', 
              details: subscribeData.error.message 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use service role client for database operations
        const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Upsert the connection
        const { data: connection, error: insertError } = await serviceClient
          .from('channel_connections')
          .upsert({
            channel_type: 'facebook',
            external_id: pageId,
            name: pageName,
            access_token: pageAccessToken,
            profile_picture_url: pagePicture || null,
            status: 'active',
            connected_by: userId,
            connected_at: new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
          }, {
            onConflict: 'channel_type,external_id'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Database insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save connection', details: insertError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Facebook page connected successfully:', pageId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            connection: {
              id: connection.id,
              name: connection.name,
              external_id: connection.external_id,
              status: connection.status,
              connected_at: connection.connected_at,
              profile_picture_url: connection.profile_picture_url,
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        const body = await req.json();
        const { connectionId } = body;

        if (!connectionId) {
          return new Response(
            JSON.stringify({ error: 'Missing connection ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use service role client for database operations
        const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get the connection to unsubscribe from webhooks
        const { data: connection } = await serviceClient
          .from('channel_connections')
          .select('*')
          .eq('id', connectionId)
          .eq('channel_type', 'facebook')
          .single();

        if (connection?.access_token && connection?.external_id) {
          // Unsubscribe from page webhooks
          try {
            await fetch(
              `https://graph.facebook.com/v19.0/${connection.external_id}/subscribed_apps?access_token=${connection.access_token}`,
              { method: 'DELETE' }
            );
          } catch (e: any) {
            console.error('Failed to unsubscribe from webhooks:', e);
          }
        }

        // Delete the connection
        const { error: deleteError } = await serviceClient
          .from('channel_connections')
          .delete()
          .eq('id', connectionId);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to disconnect', details: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-connections': {
        // Use service role client for database operations
        const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: connections, error } = await serviceClient
          .from('channel_connections')
          .select('id, channel_type, external_id, name, profile_picture_url, status, connected_by, connected_at, last_verified_at')
          .order('connected_at', { ascending: false });

        if (error) {
          console.error('Fetch connections error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch connections' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ connections: connections || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in facebook-connect:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
