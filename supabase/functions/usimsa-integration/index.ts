import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsimSAOrderRequest {
  packageId: string;
  orderId: string;
  userEmail: string;
}

serve(async (req) => {
  console.log('Usimsa integration request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { packageId, orderId, userEmail }: UsimSAOrderRequest = await req.json();
    console.log('Processing USIMSA order (PRODUCTION):', { packageId, orderId, userEmail });

    // Get package details from database
    const { data: packageData, error: packageError } = await supabaseClient
      .from('esim_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      console.error('Package not found:', packageError);
      throw new Error('Package not found');
    }

    // Always use production credentials
    const accessKey = Deno.env.get("USIMSA_PROD_ACCESS_KEY");
    const secretKey = Deno.env.get("USIMSA_PROD_SECRET_KEY");
    const baseUrl = Deno.env.get("USIMSA_PROD_BASE_URL");
    
    console.log('Using PRODUCTION environment, Base URL:', baseUrl);
    
    if (!accessKey || !secretKey) {
      throw new Error('USIMSA production credentials not configured');
    }

    const timestampMs = Date.now().toString();
    const method = 'POST';
    const pathAndQuery = '/api/v2/order';
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

    // Map package to Usimsa package ID (using package_id field)
    const usimSAPackageId = packageData.package_id;
    
    // Validate that package_id is a valid USIMSA optionId (GUID format)
    const guidRegex = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
    if (!guidRegex.test(usimSAPackageId)) {
      console.error('Invalid package_id format for USIMSA:', usimSAPackageId);
      
      // Fetch existing webhook_data to preserve referral fields
      const { data: existingOrder1 } = await supabaseClient
        .from('orders').select('webhook_data').eq('id', orderId).single();
      
      // Update order with specific error
      await supabaseClient
        .from('orders')
        .update({
          status: 'needs_attention',
          webhook_data: {
            ...(existingOrder1?.webhook_data as Record<string, unknown> || {}),
            error_code: 'INVALID_PACKAGE_ID',
            error_message: `Package has invalid optionId format: ${usimSAPackageId}. Expected GUID format.`,
            package_name: packageData.name,
            failed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Package "${packageData.name}" has an invalid optionId format. It must be a GUID (e.g., "64717154-69CC-ED11-BA77-A04A5E5FB80D"). Please update the package_id in the database.`,
        code: 'INVALID_PACKAGE_ID',
        invalidPackageId: usimSAPackageId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build order data according to USIMSA API specification
    // https://documenter.getpostman.com/view/23417993/2s93z88PZz
    const orderData = {
      orderId: orderId,
      products: [
        {
          optionId: usimSAPackageId,
          qty: 1,
        },
      ],
    };
    // Ensure base URL has /api suffix if provided via env var
    let finalBaseUrl = baseUrl?.replace(/\/+$/, '') || "https://open-api.usimsa.com/api";
    
    // If env var doesn't include /api, add it
    if (baseUrl && !baseUrl.includes('/api')) {
      finalBaseUrl = `${finalBaseUrl}/api`;
    }
    
    const endpoints = [finalBaseUrl].filter(Boolean);
    console.log('Sending order to Usimsa PRODUCTION:', { orderData, endpoints });
    console.log('Auth header check:', {
      hasAccessKey: Boolean(accessKey),
      accessKeyLen: accessKey?.length || 0,
      hasSecretKey: Boolean(secretKey),
      timestampMs,
      signing: 'METHOD path\\nms\\naccessKey',
      pathAndQuery,
      sigB64Len: signatureBase64.length,
    });

    const bodyString = JSON.stringify(orderData);

    let usimSAResponse: Response | null = null;
    let responseText = '';
    let usimSAResult: any = null;

    let lastStatus: number | undefined;
    let lastText = '';

    for (const baseUrl of endpoints) {
      console.log('Calling USIMSA order endpoint:', `${baseUrl}/v2/order`);
      const resp = await fetch(`${baseUrl}/v2/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // USIMSA HMAC headers (base64)
          "x-gat-timestamp": timestampMs,
          "x-gat-access-key": accessKey,
          "x-gat-signature": signatureBase64,
        },
        body: bodyString,
      });
      lastStatus = resp.status;
      const text = await resp.text();
      lastText = text;
      console.log('USIMSA order response status:', resp.status);
      console.log('USIMSA order response text:', text);

      if (resp.ok) {
        usimSAResponse = resp;
        try { usimSAResult = text ? JSON.parse(text) : null; } catch { usimSAResult = null; }
        break;
      }
      if (resp.status === 401 || resp.status === 403) {
        console.warn('Auth failed on endpoint, trying next if available...');
        continue;
      }
      // Other errors: stop early
      usimSAResponse = resp;
      responseText = text;
      break;
    }

    // if still no success, propagate last status/body
    if (!usimSAResponse || !usimSAResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Provider error',
        status: lastStatus ?? (usimSAResponse?.status ?? 0),
        providerRaw: lastText || responseText,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Ensure we have parsed body
    if (!usimSAResult) {
      try { usimSAResult = responseText ? JSON.parse(responseText) : null; } catch { usimSAResult = null; }
    }

    console.log('Usimsa API response status:', usimSAResponse.status);
    console.log('Usimsa API response body:', usimSAResult ?? responseText);

    // Check if we have a valid response
    if (!usimSAResponse || !usimSAResult) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No valid response from provider',
        status: usimSAResponse?.status ?? 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Consider provider-level error codes according to USIMSA API spec:
    // - 0000: success
    // - 9001: The specified product is not valid
    // - 9003: The order has already been processed
    // - 9999: internal server error
    const code = (usimSAResult as any)?.code;
    const isSuccessCode = code === undefined || code === null || code === '0' || code === 0 || code === '0000';
    
    if (!isSuccessCode) {
      const message = (usimSAResult as any)?.message || 'Provider returned an error';
      console.error('USIMSA API error:', { code, message });
      
      // Map specific error codes to user-friendly messages
      let errorMessage = message;
      let orderStatus = 'failed';
      
      if (code === '9001' || code === 9001) {
        errorMessage = 'The specified product is not valid. Please check the package_id in the database.';
        orderStatus = 'failed';
      } else if (code === '9003' || code === 9003) {
        errorMessage = 'The order has already been processed.';
        orderStatus = 'processing'; // Order exists, just duplicate request
      } else if (code === '9999' || code === 9999) {
        errorMessage = 'Internal server error from eSIM provider.';
        orderStatus = 'failed';
      }
      
      // Fetch existing webhook_data to preserve referral fields
      const { data: existingOrder2 } = await supabaseClient
        .from('orders').select('webhook_data').eq('id', orderId).single();
      
      // Update order status to failed
      await supabaseClient
        .from('orders')
        .update({
          status: orderStatus,
          webhook_data: {
            ...(existingOrder2?.webhook_data as Record<string, unknown> || {}),
            error_code: code,
            error_message: message,
            failed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      return new Response(JSON.stringify({
        success: false,
        message: errorMessage,
        code: code,
        providerMessage: message,
        status: usimSAResponse.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch existing webhook_data to preserve referral fields
    const { data: existingOrder3 } = await supabaseClient
      .from('orders').select('webhook_data').eq('id', orderId).single();
    
    // Update order in database with Usimsa response
    // API returns: { products: [{ topupId, optionId }], code: "0000", message: "" }
    const topupId = usimSAResult.products?.[0]?.topupId;
    const updateData: any = {
      webhook_data: { 
        ...(existingOrder3?.webhook_data as Record<string, unknown> || {}),
        ...usimSAResult, 
        orderId,
        topupId // Store topupId for webhook matching
      },
      status: 'processing',
      updated_at: new Date().toISOString()
    };
    
    console.log('Storing topupId for webhook matching:', topupId);
    
    // Note: USIMSA sends eSIM details via webhook callback
    // iccid, msisdn, qrCode will be populated when webhook is received
    
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw new Error('Failed to update order with Usimsa data');
    }

    console.log('Order successfully processed with Usimsa');

    return new Response(JSON.stringify({ 
      success: true, 
      topupId: topupId,
      orderId: orderId,
      message: 'Order placed successfully. eSIM details will be sent via webhook.'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in usimsa-integration:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});