import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for installed eSIMs
const UNINSTALLED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for uninstalled eSIMs
const MIN_API_CALL_INTERVAL_MS = 60 * 1000; // Minimum 60 seconds between API calls

// Input validation schema
const orderIdSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format')
});

// USIMSA API call
async function checkUsimInstallation(iccid: string, isTestEnv: boolean): Promise<Record<string, unknown>> {
  const baseUrl = Deno.env.get(isTestEnv ? 'USIMSA_DEV_BASE_URL' : 'USIMSA_PROD_BASE_URL') || 
                  Deno.env.get('USIMSA_BASE_URL') || 'https://open-api.usimsa.com';
  const accessKey = Deno.env.get(isTestEnv ? 'USIMSA_DEV_ACCESS_KEY' : 'USIMSA_PROD_ACCESS_KEY') ||
                    Deno.env.get('USIMSA_ACCESS_KEY');
  const secretKey = Deno.env.get(isTestEnv ? 'USIMSA_DEV_SECRET_KEY' : 'USIMSA_PROD_SECRET_KEY') ||
                    Deno.env.get('USIMSA_SECRET_KEY');

  if (!accessKey || !secretKey) {
    throw new Error('Missing USIMSA API credentials');
  }

  const timestampMs = Date.now().toString();
  const method = 'GET';
  const pathAndQuery = `/api/v2/iccid/${iccid}/device`;
  const encoder = new TextEncoder();

  function base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesToBase64(bytes: ArrayBuffer): string {
    const arr = new Uint8Array(bytes);
    let binary = '';
    for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(secretKey).buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const stringToSign = `${method} ${pathAndQuery}\n${timestampMs}\n${accessKey}`;
  const signatureBytes = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(stringToSign));
  const signatureBase64 = bytesToBase64(signatureBytes);

  let finalBaseUrl = baseUrl.replace(/\/+$/, '');
  if (!finalBaseUrl.includes('/api')) {
    finalBaseUrl = `${finalBaseUrl}/api`;
  }

  const apiUrl = `${finalBaseUrl}/v2/iccid/${iccid}/device`;
  console.log('[USIMSA] Calling API:', apiUrl);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'x-gat-timestamp': timestampMs,
      'x-gat-access-key': accessKey,
      'x-gat-signature': signatureBase64,
    },
  });

  const responseText = await response.text();
  console.log('[USIMSA] Response status:', response.status);

  if (!responseText || !responseText.trim()) {
    throw new Error('Empty response from USIMSA API');
  }

  const responseData = JSON.parse(responseText);
  
  if (!response.ok) {
    throw new Error(`USIMSA API error: ${JSON.stringify(responseData)}`);
  }

  return responseData;
}

// TUGE API call
async function checkTugeInstallation(iccid: string, isTestEnv: boolean): Promise<Record<string, unknown>> {
  const baseUrl = Deno.env.get(isTestEnv ? 'TUGE_BASE_URL' : 'TUGE_PROD_BASE_URL');
  const accountId = Deno.env.get(isTestEnv ? 'TUGE_ACCOUNT_ID' : 'TUGE_PROD_ACCOUNT_ID');
  const secret = Deno.env.get(isTestEnv ? 'TUGE_SECRET' : 'TUGE_PROD_SECRET');

  if (!baseUrl || !accountId || !secret) {
    throw new Error('Missing TUGE API credentials');
  }

  // First, get auth token
  console.log('[TUGE] Getting auth token...');
  const authResponse = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const authData = await authResponse.json();
  const token = authData.data?.token || authData.data?.accessToken;
  
  if (!token) {
    throw new Error('Failed to get TUGE auth token');
  }

  // Call profile endpoint
  const profileUrl = `${baseUrl}/eSIMApi/v2/iccid/profile`;
  console.log('[TUGE] Calling profile API for ICCID:', iccid);

  const profileResponse = await fetch(profileUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ iccid }),
  });

  const profileData = await profileResponse.json();
  console.log('[TUGE] Profile response:', JSON.stringify(profileData));

  if (profileData.code !== '0000' && profileData.code !== 0) {
    throw new Error(`TUGE API error: ${profileData.msg || profileData.message}`);
  }

  // Map TUGE response to our installation format
  const data = profileData.data || {};

  // TUGE uses "state" field (not "esimState") with values like "Enable", "Disable", etc.
  const tugeState = data.state || data.esimState || '';
  const tugeStateLower = tugeState.toLowerCase();
  
  // "Disable" means the profile IS on the device but toggled off — still counts as installed
  // Use actual API data (installCount/installTime) as the source of truth for installation
  const apiInstallCount = parseInt(data.installCount) || 0;
  const hasInstallTime = !!data.installTime;
  const isInstalled = apiInstallCount > 0 || hasInstallTime || ['enable', 'installed', 'enabled', 'disable', 'disabled'].includes(tugeStateLower);

  return {
    code: '0000',
    message: 'success',
    device: {
      installTime: isInstalled ? (data.installTime || new Date().toISOString()) : null,
      installDevice: data.installDevice || data.deviceInfo || null,
      eid: data.eid || null,
      installCount: apiInstallCount || (isInstalled ? 1 : 0),
    },
    installCount: apiInstallCount || (isInstalled ? 1 : 0),
    // Additional TUGE-specific fields
    esimState: tugeState,
    smdpAddress: data.smdpAddress,
    activationCode: data.activationCode,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const body = await req.json();
    const validationResult = orderIdSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request data', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId } = validationResult.data;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order with provider info
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        id, order_id, iccid, environment, cached_installation, installation_cached_at,
        esim_packages!inner(provider_id, esim_providers(provider_code))
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.iccid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order does not have an ICCID yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have valid cached data
    const cachedInstallation = order.cached_installation as Record<string, unknown> | null;
    const installationCachedAt = order.installation_cached_at ? new Date(order.installation_cached_at) : null;
    
    if (cachedInstallation && installationCachedAt) {
      const cacheAge = Date.now() - installationCachedAt.getTime();
      const isInstalled = !!(cachedInstallation?.device as Record<string, unknown>)?.installTime;
      
      const effectiveTtl = isInstalled ? CACHE_TTL_MS : UNINSTALLED_CACHE_TTL_MS;
      
      if (cacheAge < effectiveTtl) {
        console.log(`Returning cached installation status (age: ${Math.round(cacheAge / 1000)}s, installed: ${isInstalled})`);
        return new Response(
          JSON.stringify({ success: true, installation: cachedInstallation, cached: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (cacheAge < MIN_API_CALL_INTERVAL_MS) {
        console.log(`Recent API call detected (${Math.round(cacheAge / 1000)}s ago), returning cached data`);
        return new Response(
          JSON.stringify({ success: true, installation: cachedInstallation, cached: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine provider
    const packageData = order.esim_packages as { provider_id: string | null; esim_providers: { provider_code: string } | null } | null;
    const providerCode = packageData?.esim_providers?.provider_code?.toLowerCase() || 'usimsa';
    const isTestEnv = (order.environment || '').toLowerCase() === 'test';

    console.log(`[check-installation-status] Provider: ${providerCode}, ICCID: ${order.iccid}, Env: ${isTestEnv ? 'test' : 'production'}`);

    let responseData: Record<string, unknown>;

    try {
      if (providerCode === 'tuge') {
        responseData = await checkTugeInstallation(order.iccid, isTestEnv);
      } else {
        responseData = await checkUsimInstallation(order.iccid, isTestEnv);
      }
    } catch (apiError) {
      console.error(`[${providerCode.toUpperCase()}] API call failed:`, apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch installation status from ${providerCode.toUpperCase()}`,
          details: errorMessage 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper to normalize timestamps
    const normalizeTimestamp = (timestamp: string | null | undefined): string | null => {
      if (!timestamp) return null;
      if (/Z|[+-]\d{2}:\d{2}$/.test(timestamp)) return timestamp;
      return timestamp.replace(' ', 'T') + 'Z';
    };

    const deviceData = responseData.device as Record<string, unknown> | undefined;

    // Structure the response
    const installation = {
      code: responseData.code || '0000',
      message: responseData.message || 'success',
      iccid: order.iccid,
      orderId: order.order_id,
      provider: providerCode,
      device: {
        installTime: normalizeTimestamp(deviceData?.installTime as string | null | undefined),
        installDevice: deviceData?.installDevice || null,
        eid: deviceData?.eid || null,
      },
      installCount: responseData.installCount || deviceData?.installCount || (deviceData?.installTime ? 1 : 0),
      updateTime: normalizeTimestamp(responseData.updateTime as string | null | undefined),
      // TUGE-specific fields
      ...(providerCode === 'tuge' && {
        esimState: responseData.esimState,
        smdpAddress: responseData.smdpAddress,
        activationCode: responseData.activationCode,
      }),
    };

    // Cache the installation data
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        cached_installation: installation,
        installation_cached_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to cache installation status:', updateError);
    } else {
      console.log('Installation status cached successfully');
    }

    return new Response(
      JSON.stringify({ success: true, installation, cached: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in check-installation-status:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
