import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderLineNotificationRequest {
  orderId: string;
  language?: string;
}

const getQrCodeImageUrl = async (
  supabaseClient: any,
  orderId: string,
  qrCodeData: string
): Promise<string | null> => {
  const filePath = `qr-codes/${orderId}.gif`;

  // Check if already exists in storage
  const { data: existing } = await supabaseClient.storage
    .from('assets')
    .getPublicUrl(filePath);

  // Verify it actually exists by checking list
  const { data: files } = await supabaseClient.storage
    .from('assets')
    .list('qr-codes', { search: `${orderId}.gif` });

  if (files && files.length > 0) {
    console.log('[SEND-ORDER-LINE-NOTIFICATION] Reusing existing QR image');
    return existing.publicUrl;
  }

  // Generate QR code image
  try {
    const qrDataUrl = await QRCode.toDataURL(qrCodeData, { width: 400, margin: 2 });
    const base64Data = qrDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { error: uploadError } = await supabaseClient.storage
      .from('assets')
      .upload(filePath, bytes.buffer, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error('[SEND-ORDER-LINE-NOTIFICATION] QR upload error:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from('assets')
      .getPublicUrl(filePath);

    console.log('[SEND-ORDER-LINE-NOTIFICATION] Generated and uploaded QR image');
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error('[SEND-ORDER-LINE-NOTIFICATION] QR generation error:', err);
    return null;
  }
};

serve(async (req) => {
  console.log('[SEND-ORDER-LINE-NOTIFICATION] Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const lineChannelAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  if (!lineChannelAccessToken) {
    console.error('[SEND-ORDER-LINE-NOTIFICATION] LINE_CHANNEL_ACCESS_TOKEN not configured');
    return new Response(
      JSON.stringify({ error: 'LINE credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { orderId, language = 'en' }: OrderLineNotificationRequest = await req.json();
    console.log('[SEND-ORDER-LINE-NOTIFICATION] Processing order:', orderId, 'Language:', language);

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
      console.error('[SEND-ORDER-LINE-NOTIFICATION] Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's LINE user ID from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('line_user_id, email')
      .eq('user_id', order.user_id)
      .single();

    if (profileError || !profile?.line_user_id) {
      console.error('[SEND-ORDER-LINE-NOTIFICATION] LINE user not found for order:', orderId);
      return new Response(
        JSON.stringify({ error: 'LINE user not found', skipNotification: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEND-ORDER-LINE-NOTIFICATION] Found LINE user:', profile.line_user_id);

    const messages: any[] = [];
    const pkg = order.esim_packages;
    const isThai = language === 'th';

    const formatPrice = (amount: number, currency: string) => {
      if (currency === 'THB') {
        return `฿${Math.round(amount).toLocaleString()}`;
      }
      return `$${amount.toFixed(2)}`;
    };

    // Main order confirmation message
    const orderConfirmation = isThai ? `
📦 คำสั่งซื้อสำเร็จ!
━━━━━━━━━━━━━━━━━

📍 แพ็คเกจ: ${pkg?.name || pkg?.short_name || 'eSIM Package'}
🌍 ประเทศ: ${pkg?.country_name || 'Global'}
📊 ข้อมูล: ${pkg?.data_amount || 'Unlimited'}
📅 อายุการใช้งาน: ${pkg?.validity_days || '-'} วัน
💰 ราคา: ${formatPrice(order.total_amount, order.currency)}

🔢 หมายเลข Order: ${order.order_id}
` : `
📦 Order Confirmed!
━━━━━━━━━━━━━━━━━

📍 Package: ${pkg?.name || pkg?.short_name || 'eSIM Package'}
🌍 Country: ${pkg?.country_name || 'Global'}
📊 Data: ${pkg?.data_amount || 'Unlimited'}
📅 Validity: ${pkg?.validity_days || '-'} Days
💰 Amount: ${formatPrice(order.total_amount, order.currency)}

🔢 Order ID: ${order.order_id}
`;

    messages.push({ type: 'text', text: orderConfirmation.trim() });

    // QR Code image — handle both HTTP URLs and LPA strings
    let qrImageUrl: string | null = null;
    const qrData = order.qr_code || order.download_link;

    if (qrData) {
      if (qrData.startsWith('http')) {
        qrImageUrl = qrData;
      } else {
        // LPA string — generate/reuse QR image from storage
        qrImageUrl = await getQrCodeImageUrl(supabaseClient, order.id, qrData);
      }
    }

    if (qrImageUrl) {
      messages.push({
        type: 'image',
        originalContentUrl: qrImageUrl,
        previewImageUrl: qrImageUrl,
      });

      messages.push({
        type: 'text',
        text: isThai
          ? '📱 สแกน QR Code นี้เพื่อติดตั้ง eSIM ของคุณ'
          : '📱 Scan this QR code to install your eSIM',
      });
    }

    // iPhone one-click install link
    const lpaString = order.download_link || (order.qr_code?.startsWith('LPA:') ? order.qr_code : null);
    if (lpaString) {
      const appleEsimUrl = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`;
      messages.push({
        type: 'text',
        text: isThai
          ? `📱 iPhone ติดตั้งด้วยคลิกเดียว:\n👉 ${appleEsimUrl}`
          : `📱 iPhone One-Click Install:\n👉 ${appleEsimUrl}`,
      });
    }

    // ICCID and installation info
    if (order.iccid) {
      const installInfo = isThai ? `
📋 รายละเอียดการติดตั้ง:

ICCID: ${order.iccid}
${order.smdp_address ? `SM-DP+ Address: ${order.smdp_address}` : ''}
${order.activation_code ? `Activation Code: ${order.activation_code}` : ''}

📖 วิธีติดตั้ง:
👉 https://mobile11.com/help

ขอบคุณที่ใช้บริการ Mobile11! 🎉
` : `
📋 Installation Details:

ICCID: ${order.iccid}
${order.smdp_address ? `SM-DP+ Address: ${order.smdp_address}` : ''}
${order.activation_code ? `Activation Code: ${order.activation_code}` : ''}

📖 Installation Guide:
👉 https://mobile11.com/help

Thank you for choosing Mobile11! 🎉
`;

      messages.push({ type: 'text', text: installInfo.trim() });
    }

    // Send messages via LINE Push API
    console.log('[SEND-ORDER-LINE-NOTIFICATION] Sending', messages.length, 'messages to LINE');
    
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: profile.line_user_id,
        messages: messages.slice(0, 5),
      }),
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error('[SEND-ORDER-LINE-NOTIFICATION] LINE API error:', lineResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send LINE notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEND-ORDER-LINE-NOTIFICATION] Successfully sent LINE notification for order:', orderId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'LINE notification sent',
        orderId: orderId,
        lineUserId: profile.line_user_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SEND-ORDER-LINE-NOTIFICATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
