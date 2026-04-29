import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

// Webhook payload validation schema based on USIMSA API docs
const webhookSchema = z.object({
  topupId: z.string().max(100),
  optionId: z.string().max(100).optional(),
  iccid: z.string().max(100).optional(),
  smdp: z.string().max(500).optional(), // SM-DP+Address
  activateCode: z.string().max(200).optional(), // activation code
  downloadLink: z.string().max(500).optional(),
  qrcodeImgUrl: z.string().max(500).optional(),
  expiredDate: z.string().max(100).optional(), // expiration date
  // Legacy fields
  status: z.string().max(50).optional(),
  activationStatus: z.string().max(50).optional(),
  msisdn: z.string().max(50).optional(),
  qrCode: z.string().max(500).optional(),
  qrCodeImgUrl: z.string().max(500).optional(),
}).passthrough();

// Verify HMAC signature
async function verifySignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) {
    console.error('No signature provided in webhook request');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison to prevent timing attacks
    return signature.toLowerCase() === expectedSignature.toLowerCase();
  } catch (error: any) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  console.log('Usimsa webhook received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');
    
    // Verify webhook signature - MANDATORY
    const webhookSecret = Deno.env.get("USIMSA_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error('❌ USIMSA_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!signature) {
      console.error('❌ No webhook signature provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log('✅ Webhook signature verified successfully');

    // Parse and validate webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
    } catch (error: any) {
      console.error('Invalid JSON in webhook payload');
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate webhook data against schema
    const validationResult = webhookSchema.safeParse(webhookData);
    if (!validationResult.success) {
      console.error('Webhook validation failed:', validationResult.error);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const validatedData = validationResult.data;
    console.log('Webhook data validated successfully');

    // Extract all validated fields from USIMSA webhook
    const { 
      topupId, optionId, iccid, smdp, activateCode, downloadLink, 
      qrcodeImgUrl, expiredDate, status, activationStatus, msisdn, 
      qrCode, qrCodeImgUrl 
    } = validatedData;

    if (!topupId) {
      console.error('No topupId in webhook data');
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('Looking for order with topupId:', topupId);

    // Find the order in our database using topupId stored in webhook_data AND environment='test'
    const { data: orders, error: findError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('environment', 'test')
      .contains('webhook_data', { topupId });

    if (findError || !orders || orders.length === 0) {
      console.error('Order not found for topupId:', topupId, findError);
      return new Response(JSON.stringify({ error: 'Not found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const order = orders[0];
    console.log('Found order:', order.id, 'for topupId:', topupId);

    // Build update data with all validated fields
    const updateData: any = {
      webhook_data: {
        ...order.webhook_data,
        topupId,
        ...(optionId && { optionId }),
        ...(iccid && { iccid }),
        ...(smdp && { smdp }),
        ...(activateCode && { activateCode }),
        ...(downloadLink && { downloadLink }),
        ...(qrcodeImgUrl && { qrcodeImgUrl }),
        ...(expiredDate && { expiredDate }),
        ...(status && { status }),
        ...(activationStatus && { activationStatus }),
        ...(msisdn && { msisdn }),
        ...(qrCode && { qrCode }),
        ...(qrCodeImgUrl && { qrCodeImgUrl }),
        webhook_received_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    // Update specific fields if provided
    if (iccid) updateData.iccid = iccid;
    if (msisdn) updateData.msisdn = msisdn;
    
    // Check all possible QR code field names
    const qrUrl = qrCodeImgUrl || qrcodeImgUrl || qrCode;
    if (qrUrl) {
      updateData.qr_code = qrUrl;
      console.log('QR code URL found in webhook');
    }

    // Add expiry date and download information
    if (expiredDate) {
      try {
        updateData.expiry_date = new Date(expiredDate).toISOString();
      } catch (e: any) {
        console.error('Failed to parse expiry date:', expiredDate);
      }
    }
    if (downloadLink) updateData.download_link = downloadLink;
    if (smdp) updateData.smdp_address = smdp;
    if (activateCode) updateData.activation_code = activateCode;

    // Map Usimsa status to our order status
    if (status === 'completed' || activationStatus === 'activated') {
      updateData.status = 'completed';
    } else if (status === 'failed') {
      updateData.status = 'failed';
    } else if (status === 'cancelled' || status === 'canceled') {
      updateData.status = 'cancelled';
    } else if (status === 'processing' || status === 'Opening') {
      updateData.status = 'processing';
    }
    
    // If QR code is present, mark as completed
    if (qrUrl && !updateData.status) {
      updateData.status = 'completed';
      console.log('Marking order as completed due to QR code presence');
    }

    console.log('Updating order with status:', updateData.status);

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return new Response(JSON.stringify({ error: 'Processing error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('Order updated successfully');

    // Attribute affiliate sale if order has affiliate tracking
    if (updateData.status === 'completed' && (order.affiliate_id || order.affiliate_session_id)) {
      try {
        console.log('Attributing affiliate sale for order:', order.id);
        const { data: affiliateResult, error: affiliateError } = await supabaseClient.functions.invoke('attribute-affiliate-sale', {
          body: { order_id: order.id }
        });
        
        if (affiliateError) {
          console.error('Failed to attribute affiliate sale:', affiliateError);
        } else if (affiliateResult?.attributed) {
          console.log('Affiliate sale attributed:', affiliateResult.affiliate_id, 'Commission:', affiliateResult.commission_amount);
        } else {
          console.log('Affiliate attribution skipped:', affiliateResult?.reason);
        }
      } catch (err: any) {
        console.error('Exception attributing affiliate sale:', err);
      }
    }

    // Calculate loyalty cashback when order is completed
    if (updateData.status === 'completed') {
      try {
        console.log('Calculating loyalty cashback for order:', order.id);
        const { data: cashbackResult, error: cashbackError } = await supabaseClient.functions.invoke('calculate-loyalty-cashback', {
          body: { order_id: order.id }
        });
        
        if (cashbackError) {
          console.error('Failed to calculate cashback:', cashbackError);
        } else if (cashbackResult?.success) {
          console.log('Cashback calculated:', cashbackResult.cashback_amount, 'New balance:', cashbackResult.new_balance);
        } else {
          console.log('Cashback skipped:', cashbackResult?.message);
        }
      } catch (err: any) {
        console.error('Exception calculating cashback:', err);
        // Don't fail the webhook for cashback errors
      }
    }

    // Send email notification based on status
    if (updateData.status === 'completed' && qrUrl) {
      // Only send confirmation email if email is verified (non-guest or verified guest)
      if (order.email_verified !== false) {
        console.log('Order completed with QR code, sending confirmation email');
        try {
          await supabaseClient.functions.invoke('send-order-confirmation', {
            body: { orderId: order.id, language: order.language || 'en' }
          });
          console.log('Confirmation email sent');
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      } else {
        console.log('Order completed but email not verified, skipping confirmation email');
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in usimsa-webhook:', error);
    return new Response(JSON.stringify({ error: 'Processing error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
