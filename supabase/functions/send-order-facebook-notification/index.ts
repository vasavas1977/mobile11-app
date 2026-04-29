import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderFacebookNotificationRequest {
  orderId: string;
  language?: string;
}

serve(async (req) => {
  console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const pageAccessToken = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
  if (!pageAccessToken) {
    console.error('[SEND-ORDER-FACEBOOK-NOTIFICATION] FACEBOOK_PAGE_ACCESS_TOKEN not configured');
    return new Response(
      JSON.stringify({ error: 'Facebook credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { orderId, language = 'en' }: OrderFacebookNotificationRequest = await req.json();
    console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] Processing order:', orderId, 'Language:', language);

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order with package details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        esim_packages (
          name,
          short_name,
          country_name,
          data_amount,
          validity_days,
          package_type
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[SEND-ORDER-FACEBOOK-NOTIFICATION] Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.user_id) {
      console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] No user_id on order, skipping');
      return new Response(
        JSON.stringify({ skipNotification: true, reason: 'No user_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to find Facebook PSID - first check profiles, then contacts
    let facebookPsid: string | null = null;

    // Check profiles table for facebook_psid
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('facebook_psid')
      .eq('user_id', order.user_id)
      .single();

    if (profile?.facebook_psid) {
      facebookPsid = profile.facebook_psid;
      console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] Found PSID from profile:', facebookPsid);
    }

    // Fallback: check contacts table
    if (!facebookPsid) {
      const { data: contact } = await supabaseClient
        .from('contacts')
        .select('facebook_id')
        .eq('user_id', order.user_id)
        .not('facebook_id', 'is', null)
        .limit(1)
        .single();

      if (contact?.facebook_id) {
        facebookPsid = contact.facebook_id;
        console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] Found PSID from contacts:', facebookPsid);
      }
    }

    if (!facebookPsid) {
      console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] No Facebook PSID found for user:', order.user_id);
      return new Response(
        JSON.stringify({ skipNotification: true, reason: 'No Facebook PSID' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build messages
    const pkg = order.esim_packages;
    const isThai = language === 'th';

    const formatPrice = (amount: number, currency: string) => {
      if (currency === 'THB') return `฿${Math.round(amount).toLocaleString()}`;
      return `$${amount.toFixed(2)}`;
    };

    // Main confirmation message
    const confirmationText = isThai ? `📦 คำสั่งซื้อสำเร็จ!

📍 แพ็คเกจ: ${pkg?.name || pkg?.short_name || 'eSIM Package'}
🌍 ประเทศ: ${pkg?.country_name || 'Global'}
📊 ข้อมูล: ${pkg?.data_amount || 'Unlimited'}
📅 อายุการใช้งาน: ${pkg?.validity_days || '-'} วัน
💰 ราคา: ${formatPrice(order.total_amount, order.currency)}
🔢 หมายเลข Order: ${order.order_id}` : `📦 Order Confirmed!

📍 Package: ${pkg?.name || pkg?.short_name || 'eSIM Package'}
🌍 Country: ${pkg?.country_name || 'Global'}
📊 Data: ${pkg?.data_amount || 'Unlimited'}
📅 Validity: ${pkg?.validity_days || '-'} Days
💰 Amount: ${formatPrice(order.total_amount, order.currency)}
🔢 Order ID: ${order.order_id}`;

    // Send confirmation text
    await sendFacebookMessage(pageAccessToken, facebookPsid, { text: confirmationText });

    // Send QR code image if available
    if (order.qr_code && order.qr_code.startsWith('http')) {
      await sendFacebookMessage(pageAccessToken, facebookPsid, {
        attachment: {
          type: 'image',
          payload: { url: order.qr_code, is_reusable: true }
        }
      });

      await sendFacebookMessage(pageAccessToken, facebookPsid, {
        text: isThai 
          ? '📱 สแกน QR Code นี้เพื่อติดตั้ง eSIM ของคุณ' 
          : '📱 Scan this QR code to install your eSIM'
      });
    }

    // Send installation details
    if (order.iccid) {
      const installText = isThai ? `📋 รายละเอียดการติดตั้ง:

ICCID: ${order.iccid}
${order.smdp_address ? `SM-DP+ Address: ${order.smdp_address}` : ''}
${order.activation_code ? `Activation Code: ${order.activation_code}` : ''}

📖 วิธีติดตั้ง: https://mobile11.com/help

ขอบคุณที่ใช้บริการ Mobile11! 🎉` : `📋 Installation Details:

ICCID: ${order.iccid}
${order.smdp_address ? `SM-DP+ Address: ${order.smdp_address}` : ''}
${order.activation_code ? `Activation Code: ${order.activation_code}` : ''}

📖 Installation Guide: https://mobile11.com/help

Thank you for choosing Mobile11! 🎉`;

      await sendFacebookMessage(pageAccessToken, facebookPsid, { text: installText });
    }

    console.log('[SEND-ORDER-FACEBOOK-NOTIFICATION] Successfully sent for order:', orderId);

    return new Response(
      JSON.stringify({ success: true, orderId, facebookPsid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SEND-ORDER-FACEBOOK-NOTIFICATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendFacebookMessage(token: string, recipientId: string, message: Record<string, unknown>) {
  const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message,
      messaging_type: 'MESSAGE_TAG',
      tag: 'POST_PURCHASE_UPDATE',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SEND-ORDER-FACEBOOK-NOTIFICATION] Facebook API error:', response.status, errorText);
  }

  return response;
}
