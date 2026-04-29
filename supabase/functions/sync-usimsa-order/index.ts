import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('Sync USIMSA order request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Step 1: Authenticate user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Step 2: Verify admin role
  const { data: isAdmin } = await supabaseAnon.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Step 3: Use service role for admin operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { orderId } = await req.json();
    console.log('Syncing order:', orderId);

    // Get order details from database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Order not found');
    }

    // Get the USIMSA topupId from webhook_data (this is what USIMSA uses to track orders)
    const usimSAOrderId = order.webhook_data?.topupId || order.order_id;
    console.log('USIMSA Order ID (topupId):', usimSAOrderId);
    
    if (!order.webhook_data?.topupId) {
      console.warn('Order missing topupId in webhook_data, may not find order in USIMSA');
    }

    // Prepare USIMSA API request for order query (use production credentials)
    const accessKey = Deno.env.get("USIMSA_PROD_ACCESS_KEY");
    const secretKey = Deno.env.get("USIMSA_PROD_SECRET_KEY");
    
    if (!accessKey || !secretKey) {
      throw new Error("Usimsa credentials not configured");
    }

    const timestampMs = Date.now().toString();
    const method = 'GET';
    const pathAndQuery = `/api/v2/order/${usimSAOrderId}`;
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

    // Build final base URL (matches usimsa-integration logic)
    let finalBaseUrl = Deno.env.get("USIMSA_PROD_BASE_URL")?.replace(/\/+$/, '') || "https://open-api.usimsa.com/api";
    if (Deno.env.get("USIMSA_PROD_BASE_URL") && !Deno.env.get("USIMSA_PROD_BASE_URL")!.includes('/api')) {
      finalBaseUrl = `${finalBaseUrl}/api`;
    }
    const endpoints = [finalBaseUrl];

    let orderStatus: any = null;
    let lastError = '';

    for (const baseUrl of endpoints) {
      const url = `${baseUrl}/v2/order/${usimSAOrderId}`;
      console.log('Querying USIMSA order status:', url);
      
      try {
        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "x-gat-timestamp": timestampMs,
            "x-gat-access-key": accessKey,
            "x-gat-signature": signatureBase64,
          },
        });

        const text = await resp.text();
        console.log('USIMSA status response:', resp.status, text);

        if (resp.ok) {
          orderStatus = text ? JSON.parse(text) : null;
          break;
        }
        
        lastError = text;
        if (resp.status === 401 || resp.status === 403) {
          console.warn('Auth failed, trying next endpoint...');
          continue;
        }
        break;
      } catch (error: any) {
        console.error('Error querying endpoint:', error);
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    if (!orderStatus) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to query USIMSA order status',
        error: lastError
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log('Order status from USIMSA:', orderStatus);

    // Extract eSIM details from response
    // The response may contain: topupId, optionId, iccid, smdp, activateCode, 
    // downloadLink, qrcodeImgUrl, expiredDate
    const esimDetails = orderStatus.products?.[0] || orderStatus;
    
    console.log('eSIM details extracted:', esimDetails);

    // Update order in database with latest data
    const updateData: any = {
      webhook_data: { 
        ...order.webhook_data, 
        ...orderStatus,
        esim_details: esimDetails 
      },
      updated_at: new Date().toISOString()
    };

    // Update critical fields if provided
    if (esimDetails.iccid) updateData.iccid = esimDetails.iccid;
    if (esimDetails.msisdn) updateData.msisdn = esimDetails.msisdn;
    const qrUrl = esimDetails.qrCodeImgUrl || esimDetails.qrcodeImgUrl || esimDetails.qrCode;
    if (qrUrl) {
      updateData.qr_code = qrUrl;
      console.log('QR code URL found:', updateData.qr_code);
    }

    // Map status
    const status = orderStatus.status || orderStatus.orderStatus;
    if (status === 'completed' || orderStatus.activationStatus === 'activated') {
      updateData.status = 'completed';
    } else if (status === 'failed') {
      updateData.status = 'failed';
    } else if (status === 'cancelled' || status === 'canceled') {
      updateData.status = 'cancelled';
    } else if (status === 'processing' || status === 'Opening') {
      updateData.status = 'processing';
    }
    // If QR or activation details are present, consider it deliverable
    if (!updateData.status && (esimDetails.qrCodeImgUrl || esimDetails.qrcodeImgUrl || esimDetails.qrCode || esimDetails.activateCode || esimDetails.downloadLink)) {
      updateData.status = 'completed';
    }

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw new Error('Failed to update order');
    }

    console.log('Order synced successfully');

    return new Response(JSON.stringify({
      success: true,
      status: updateData.status,
      iccid: updateData.iccid,
      qrCode: updateData.qr_code,
      esimDetails: esimDetails
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in sync-usimsa-order:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
