import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  console.log('Cancel order request received');
  
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

  // Step 2: Check if user is admin
  const { data: isAdmin } = await supabaseAnon.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  // Step 3: Use service role for operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log('Canceling order:', orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, esim_packages!inner(is_cancelable)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Order not found');
    }

    // Step 4: Verify user owns this order (unless admin)
    if (!isAdmin && order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'You can only cancel your own orders' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Step 5: Check if package is cancelable (for non-admins)
    if (!isAdmin && !order.esim_packages?.is_cancelable) {
      return new Response(JSON.stringify({ 
        error: 'This package is not eligible for cancellation. Please contact support for assistance.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('Order status:', order.status);

    // Always try to cancel with USIMSA if we have a topupId (let USIMSA be source of truth)
    const topupId = order.webhook_data?.topupId;
    let usimsaCancelled = false;
    let usimSAData: any = null;

    if (topupId) {
      try {
        console.log('Attempting to cancel with USIMSA, topupId:', topupId);
        
        const accessKey = Deno.env.get('USIMSA_PROD_ACCESS_KEY') ?? Deno.env.get('USIMSA_ACCESS_KEY');
        const secretKey = Deno.env.get('USIMSA_PROD_SECRET_KEY') ?? Deno.env.get('USIMSA_SECRET_KEY');
        const rawBase = Deno.env.get('USIMSA_PROD_BASE_URL')?.replace(/\/+$/, '') || null;
        // Ensure base URL includes /api suffix so request path matches signature (/api/v2/...)
        const finalBaseUrl = rawBase
          ? (rawBase.includes('/api') ? rawBase : `${rawBase}/api`)
          : 'https://open-api.usimsa.com/api';
        
        console.log('USIMSA cancel using PRODUCTION creds:', {
          hasAccessKey: Boolean(accessKey),
          hasSecretKey: Boolean(secretKey),
          baseUrl: finalBaseUrl,
        });
        console.log('USIMSA cancel request URL:', `${finalBaseUrl}/v2/cancel/${topupId}`);
        
        if (!accessKey || !secretKey) {
          console.error('USIMSA credentials not configured');
        } else {
          // Generate HMAC signature
          const timestamp = Date.now().toString();
          const path = `/api/v2/cancel/${topupId}`;
          const stringToSign = `POST ${path}\n${timestamp}\n${accessKey}`;
          
          const encoder = new TextEncoder();
          
          const key = await crypto.subtle.importKey(
            'raw',
            base64ToBytes(secretKey).buffer as ArrayBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          
          const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
          const signatureBase64 = bytesToBase64(signatureBytes);

          // Call USIMSA cancel endpoint
          const usimSAResponse = await fetch(
            `${finalBaseUrl}/v2/cancel/${topupId}`,
            {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'x-gat-access-key': accessKey,
                'x-gat-timestamp': timestamp,
                'x-gat-signature': signatureBase64
              }
            }
          );

          const responseText = await usimSAResponse.text();
          console.log('USIMSA cancel response:', usimSAResponse.status, responseText);

          // Parse USIMSA response
          try {
            if (!responseText) {
              // Empty response body - use HTTP status
              usimSAData = {
                code: usimSAResponse.status.toString(),
                message: `HTTP ${usimSAResponse.status}: ${usimSAResponse.statusText || 'Empty response body'}`
              };
              console.log('Empty USIMSA response, using HTTP status:', usimSAData);
            } else {
              usimSAData = JSON.parse(responseText);
              console.log('USIMSA response data:', usimSAData);
            }
          } catch (e: any) {
            console.error('Failed to parse USIMSA response:', e);
            usimSAData = { 
              code: usimSAResponse.ok ? '9999' : usimSAResponse.status.toString(),
              message: usimSAResponse.ok ? 'Failed to parse response' : `HTTP ${usimSAResponse.status}: ${usimSAResponse.statusText}`
            };
          }

          // Handle USIMSA response codes
          const responseCode = usimSAData.code || '9999';
          
          if (responseCode === '0000') {
            usimsaCancelled = true;
            console.log('Order successfully cancelled with USIMSA');
          } else if (responseCode === '9002') {
            usimsaCancelled = true;
            console.log('Order already cancelled on USIMSA');
          } else {
            // Handle error codes
            const errorMessages: Record<string, string> = {
              '9001': 'Order not found on USIMSA',
              '9003': 'Item is non-refundable',
              '9004': 'Already installed, cannot be cancelled',
              '9005': 'Cancellation request failed',
              '9999': 'Internal server error'
            };
            const errorMessage = errorMessages[responseCode] || usimSAData.message || 'Unknown error';
            console.error(`USIMSA cancellation failed with code ${responseCode}:`, errorMessage);
            
            // Store error in webhook_data but don't throw - let admin see the USIMSA response
            return new Response(
              JSON.stringify({ 
                success: false,
                error: `Cannot cancel order: ${errorMessage} (USIMSA code: ${responseCode})`,
                usimsa_response: usimSAData
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
              }
            );
          }
        }
      } catch (error: any) {
        console.error('Error canceling with USIMSA:', error);
      }
    } else {
      console.log('No topupId found, skipping USIMSA cancellation');
    }

    // Only update order status to cancelled if USIMSA confirmed cancellation
    if (usimsaCancelled) {
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'cancelled',
          webhook_data: {
            ...order.webhook_data,
            cancelled_at: new Date().toISOString(),
            cancelled_from_usimsa: true,
            usimsa_cancel_response: usimSAData || null
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        throw new Error('Failed to update order status');
      }

      console.log('Order cancelled successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          cancelled_from_usimsa: true,
          message: usimsaCancelled && usimSAData?.code === '9002' 
            ? 'Order was already cancelled on USIMSA' 
            : 'Order cancelled successfully',
          usimsa_response: usimSAData
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // No topupId available -> cannot request USIMSA. Do NOT change local status.
      console.log('No topupId found on order; cannot cancel on USIMSA');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order has no topupId; cannot send cancel request to USIMSA',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error in cancel-order:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
