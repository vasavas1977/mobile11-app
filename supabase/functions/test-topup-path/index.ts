import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  topupId: string;
  environment?: 'test' | 'production';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Test Topup Path Parameter Endpoint ===');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestBody: TestRequest = await req.json();
    const { topupId, environment = 'production' } = requestBody;

    if (!topupId) {
      return new Response(
        JSON.stringify({ error: 'topupId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing topupId: ${topupId} in ${environment} environment`);

    // Get USIMSA credentials based on environment
    const baseUrl = environment === 'production'
      ? Deno.env.get('USIMSA_PROD_BASE_URL')
      : Deno.env.get('USIMSA_BASE_URL');
    const accessKey = environment === 'production'
      ? Deno.env.get('USIMSA_PROD_ACCESS_KEY')
      : Deno.env.get('USIMSA_ACCESS_KEY');
    const secretKey = environment === 'production'
      ? Deno.env.get('USIMSA_PROD_SECRET_KEY')
      : Deno.env.get('USIMSA_SECRET_KEY');

    if (!baseUrl || !accessKey || !secretKey) {
      console.error(`Missing ${environment} USIMSA credentials`);
      return new Response(
        JSON.stringify({ error: `Missing ${environment} USIMSA credentials` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Generate signature for GET request with path parameter
    // Format: GET /api/v2/topup/{topupId}\n{timestamp}\n{accessKey}
    const method = 'GET';
    const path = `/api/v2/topup/${topupId}`;
    const signatureData = `${method} ${path}\n${timestamp}\n${accessKey}`;
    
    console.log('Signature data:', signatureData);

    // Generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(signatureData);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated signature:', signature);

    // Make request to USIMSA API using path parameter (no query string)
    const usimSAUrl = `${baseUrl}${path}`;
    console.log('Request URL:', usimSAUrl);

    const usimSAResponse = await fetch(usimSAUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': accessKey,
        'x-signature': signature,
        'x-timestamp': timestamp,
      },
    });

    const responseText = await usimSAResponse.text();
    console.log('USIMSA Response Status:', usimSAResponse.status);
    console.log('USIMSA Response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e: any) {
      responseData = { raw: responseText };
    }

    // Return test results
    return new Response(
      JSON.stringify({
        success: usimSAResponse.ok,
        test_details: {
          topupId,
          environment,
          method: 'GET',
          path,
          url: usimSAUrl,
          timestamp,
          signature_format: 'GET /api/v2/topup/{topupId}\\n{timestamp}\\n{accessKey}',
        },
        usimsa_response: {
          status: usimSAResponse.status,
          statusText: usimSAResponse.statusText,
          data: responseData,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in test-topup-path function:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: message,
        details: 'Check edge function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
