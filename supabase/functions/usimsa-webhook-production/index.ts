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

// Public webhook endpoint - no authentication required
serve(async (req) => {
  console.log('PRODUCTION webhook request received from USIMSA');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Log all headers for debugging
    console.log('Webhook headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');
    
    // Verify webhook signature - OPTIONAL (USIMSA may not send signatures)
    const webhookSecret = Deno.env.get("USIMSA_WEBHOOK_SECRET");
    
    if (webhookSecret && signature) {
      // Only verify if both secret is configured AND signature is provided
      const isValid = await verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
      console.log('✅ Webhook signature verified successfully');
    } else if (!signature) {
      console.warn('⚠️ No webhook signature provided - accepting without verification');
    } else {
      console.warn('⚠️ Webhook secret not configured - accepting without verification');
    }

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

    console.log('Looking for PRODUCTION order with topupId:', topupId);

    // Find the order in our database using topupId stored in webhook_data AND environment
    const { data: orders, error: findError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('environment', 'production')
      .contains('webhook_data', { topupId });

    if (findError || !orders || orders.length === 0) {
      console.error('PRODUCTION order not found for topupId:', topupId, findError);
      return new Response(JSON.stringify({ error: 'Not found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const order = orders[0];
    console.log('Found PRODUCTION order:', order.id, 'for topupId:', topupId);

    // Determine the final status
    const finalQrCodeUrl = qrCodeImgUrl || qrcodeImgUrl;
    
    let orderStatus = order.status;
    // If QR code is available, consider the order completed
    if (finalQrCodeUrl || qrCode) {
      orderStatus = 'completed';
    } else if (status === 'completed' || activationStatus === 'completed') {
      orderStatus = 'completed';
    } else if (status === 'processing' || activationStatus === 'processing') {
      orderStatus = 'processing';
    } else if (status === 'failed' || activationStatus === 'failed') {
      orderStatus = 'failed';
    }

    // Build update data with all validated fields
    const updateData: any = {
      status: orderStatus,
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
      updated_at: new Date().toISOString(),
    };

    // Add eSIM details if available
    if (iccid) {
      updateData.iccid = iccid;
    }
    if (msisdn) {
      updateData.msisdn = msisdn;
    }
    if (qrCode || finalQrCodeUrl) {
      updateData.qr_code = qrCode || finalQrCodeUrl;
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

    console.log('Updating PRODUCTION order with status:', orderStatus);

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update PRODUCTION order:', updateError);
      return new Response(JSON.stringify({ error: 'Processing error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('PRODUCTION order updated successfully');

    // Attribute affiliate sale if order has affiliate tracking
    if (orderStatus === 'completed' && (order.affiliate_id || order.affiliate_session_id)) {
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
    if (orderStatus === 'completed') {
      try {
        console.log('Calculating loyalty cashback for PRODUCTION order:', order.id);
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

    // Send confirmation via LINE (if LINE user) or email if order is completed and has QR code
    if (orderStatus === 'completed' && (qrCode || finalQrCodeUrl)) {
      // Check email_verified before sending email notifications
      if (order.email_verified === false) {
        console.log('Email not verified for order:', order.id, '- skipping confirmation email');
      } else {
        try {
          // Check if user is a LINE user
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('line_user_id, email')
            .eq('user_id', order.user_id)
            .single();

          const isLineUser = profile?.line_user_id || profile?.email?.startsWith('line_');

          if (isLineUser && profile?.line_user_id) {
            // Send LINE notification
            console.log('Sending LINE notification for order:', order.id);
            const { error: lineError } = await supabaseClient.functions.invoke('send-order-line-notification', {
              body: { orderId: order.id, language: order.language || 'en' }
            });
            if (lineError) {
              console.error('Failed to send LINE notification:', lineError);
            } else {
              console.log('LINE notification sent successfully');
            }

            // Also send email if notification_email is provided
            if (order.notification_email) {
              console.log('Also sending email copy to:', order.notification_email);
              const { error: emailError } = await supabaseClient.functions.invoke('send-order-confirmation', {
                body: { orderId: order.id, language: order.language || 'en', overrideEmail: order.notification_email }
              });
              if (emailError) {
                console.error('Failed to send email copy:', emailError);
              }
            }
          } else {
            // Regular user - send email
            console.log('Sending order confirmation email for order:', order.id);
            const { error: emailError } = await supabaseClient.functions.invoke('send-order-confirmation', {
              body: { orderId: order.id, language: order.language || 'en' }
            });
            if (emailError) {
              console.error('Failed to send confirmation email:', emailError);
            } else {
              console.log('Order confirmation email sent successfully');
            }
          }
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        orderId: order.id,
        environment: 'production'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error processing PRODUCTION webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Processing error',
        environment: 'production'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
