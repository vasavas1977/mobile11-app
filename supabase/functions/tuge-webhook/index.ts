import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TUGE API v2.0 Webhook Payload Structure
interface TugeWebhookPayload {
  code: string;              // "0000" for success
  msg: string;               // "success"
  sign: string;              // Signature for verification
  timestamp: string;         // ISO timestamp
  data: {
    businessType: string;    // "ESIM"
    eventType: number;       // 1 = order update
    idempotencyKey: string;  // UUID for deduplication
    orderInfo: {
      channelOrderNo: string;      // Our order ID (was platformOrderNo in v1)
      orderNo: string;             // TUGE order number
      orderType?: string;          // e.g., "MULTIPLEMONTHS_AUTO"
      createdTime?: string;        // ISO timestamp
      iccid?: string;              // eSIM ICCID
      imsi?: string;               // IMSI number
      msisdn?: string;             // Phone number
      qrCode?: string;             // LPA string for QR code
      latestActivationTime?: string; // When eSIM must be activated by
      orderState?: string;         // NOTACTIVE, ACTIVATED, TIMEOUT, CANCELLED
      expireTime?: string;         // ISO date string
      dataUsed?: number;           // bytes
      dataTotal?: number;          // bytes
    };
  };
}

serve(async (req) => {
  console.log('[TUGE Webhook] Received callback');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payload: TugeWebhookPayload = await req.json();
    console.log('[TUGE Webhook] Payload:', JSON.stringify(payload, null, 2));

    // Validate payload structure (v2.0 format)
    if (!payload.data?.orderInfo) {
      console.error('[TUGE Webhook] Invalid payload structure - missing data.orderInfo');
      return new Response(JSON.stringify({ success: false, message: 'Invalid payload structure' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const orderInfo = payload.data.orderInfo;
    const { 
      channelOrderNo,  // Our order ID (v2.0 field name)
      orderNo,         // TUGE order number
      orderState,
      iccid,
      msisdn,
      qrCode,
      latestActivationTime,
      expireTime,
    } = orderInfo;

    if (!channelOrderNo) {
      console.error('[TUGE Webhook] Missing channelOrderNo');
      return new Response(JSON.stringify({ success: false, message: 'Missing channelOrderNo' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Parse QR code string to extract SM-DP+ address and activation code
    // Format: LPA:1$smdpAddress$activationCode
    let smdpAddress = '';
    let activationCode = '';
    if (qrCode && qrCode.startsWith('LPA:1$')) {
      const parts = qrCode.split('$');
      if (parts.length >= 3) {
        smdpAddress = parts[1];
        activationCode = parts[2];
      }
    }

    // Find the order by our order ID (stored as channelOrderNo in TUGE)
    let orderId = channelOrderNo;
    
    // First try to find by id (UUID)
    let { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', channelOrderNo)
      .single();

    if (orderError || !order) {
      console.log('[TUGE Webhook] Order not found by id, trying order_id field');
      
      // Try finding by order_id field
      const { data: orderByOrderId, error: orderError2 } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('order_id', channelOrderNo)
        .single();
      
      if (orderError2 || !orderByOrderId) {
        console.error('[TUGE Webhook] Order not found:', channelOrderNo);
        return new Response(JSON.stringify({ success: false, message: 'Order not found' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      
      order = orderByOrderId;
      orderId = order.id;
    }

    // Map TUGE status to our status
    let status = 'processing';
    switch (orderState) {
      case 'NOTACTIVE':
        status = 'completed'; // eSIM is ready but not activated
        break;
      case 'ACTIVATED':
        status = 'active'; // eSIM is activated and in use
        break;
      case 'TIMEOUT':
        status = 'failed';
        break;
      case 'CANCELLED':
        status = 'cancelled';
        break;
      default:
        // If we have eSIM details but no explicit state, consider it completed
        // TUGE's initial webhook often includes ICCID + QR code without orderState
        if (iccid && qrCode) {
          status = 'completed';
          console.log('[TUGE Webhook] No orderState but has eSIM details - marking as completed');
        }
    }

    // Update order with eSIM details
    const updateData: Record<string, unknown> = {
      status,
      provider_status: orderState || 'RECEIVED',
      provider_order_id: orderNo,
      updated_at: new Date().toISOString(),
      webhook_data: {
        ...payload,
        received_at: new Date().toISOString(),
      },
    };

    // Only update eSIM fields if provided
    if (iccid) updateData.iccid = iccid;
    if (msisdn) updateData.msisdn = msisdn;
    if (smdpAddress) updateData.smdp_address = smdpAddress;
    if (activationCode) updateData.activation_code = activationCode;
    if (qrCode) updateData.qr_code = qrCode;
    if (qrCode) updateData.download_link = qrCode; // LPA string is the download link
    if (expireTime) updateData.expiry_date = expireTime;
    if (latestActivationTime) {
      // Store latest activation time in webhook_data
      (updateData.webhook_data as Record<string, unknown>).latestActivationTime = latestActivationTime;
    }

    console.log('[TUGE Webhook] Updating order:', orderId, updateData);

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[TUGE Webhook] Failed to update order:', updateError);
      throw new Error('Failed to update order');
    }

    // If order is completed with eSIM details, trigger confirmation emails
    if (status === 'completed' && (iccid || qrCode)) {
      console.log('[TUGE Webhook] Order completed, checking email_verified before sending confirmation');
      
      try {
        const { data: fullOrder } = await supabaseClient
          .from('orders')
          .select('*, esim_packages(*)')
          .eq('id', orderId)
          .single();

        if (fullOrder && fullOrder.email_verified !== false) {
          // Determine the user's account email from profiles (to deduplicate)
          let userEmail: string | null = null;
          if (fullOrder.user_id) {
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('email')
              .eq('user_id', fullOrder.user_id)
              .single();
            userEmail = profile?.email?.toLowerCase() || null;
          }

          const notificationEmail = fullOrder.notification_email?.toLowerCase() || null;

          // Send to user's registered email (if user_id exists)
          if (fullOrder.user_id && userEmail) {
            await supabaseClient.functions.invoke('send-order-confirmation', {
              body: {
                orderId: orderId,
                language: fullOrder.language || 'en',
                overrideEmail: userEmail,
              },
            });
            console.log('[TUGE Webhook] Confirmation email sent to user account email:', userEmail);
          }

          // Send separately to notification_email ONLY if it differs from user email
          if (notificationEmail && notificationEmail !== userEmail) {
            await supabaseClient.functions.invoke('send-order-confirmation', {
              body: {
                orderId: orderId,
                language: fullOrder.language || 'en',
                overrideEmail: fullOrder.notification_email,
              },
            });
            console.log('[TUGE Webhook] Confirmation email sent to notification_email:', fullOrder.notification_email);
          } else if (notificationEmail) {
            console.log('[TUGE Webhook] Skipping notification_email (same as user email):', notificationEmail);
          }

          // Mark confirmation as sent to prevent post-payment flow from re-sending
          await supabaseClient
            .from('orders')
            .update({ webhook_data: { ...fullOrder.webhook_data, confirmation_sent: true } })
            .eq('id', orderId);

          // Send LINE notification (best-effort, separate from email flow)
          if (fullOrder.user_id) {
            try {
              await supabaseClient.functions.invoke('send-order-line-notification', {
                body: { orderId: orderId, language: fullOrder.language || 'en' },
              });
              console.log('[TUGE Webhook] LINE notification sent for order:', orderId);
            } catch (lineError) {
              console.error('[TUGE Webhook] LINE notification failed (non-fatal):', lineError);
            }
          }

          // If no user_id and no notification_email, skip
          if (!fullOrder.user_id && !fullOrder.notification_email) {
            console.log('[TUGE Webhook] No user_id or notification_email, skipping confirmation email');
          }
        } else if (fullOrder) {
          console.log('[TUGE Webhook] Email not verified, skipping confirmation email for order:', orderId);
        }
      } catch (emailError) {
        console.error('[TUGE Webhook] Failed to send confirmation email:', emailError);
      }
    }

    console.log('[TUGE Webhook] Successfully processed');

    // Return success to TUGE (v2.0 expects this format)
    return new Response(JSON.stringify({ 
      code: "0000",
      msg: "success",
      success: true, 
      message: 'Webhook processed successfully',
      orderId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[TUGE Webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      code: "9999",
      msg: "error",
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
