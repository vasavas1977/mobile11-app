import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create JWT for 2C2P
async function createJwt(payload: object, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64UrlEncode = (data: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Helper function to decode JWT response from 2C2P
function decodeJwtPayload(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  
  const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - payloadB64.length % 4) % 4);
  const payloadJson = atob(payloadB64 + padding);
  return JSON.parse(payloadJson);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('[RETRY-PAYMENT] Retry payment request received');
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { orderId, language } = await req.json();
    console.log('[RETRY-PAYMENT] Retrying payment for order:', orderId);

    if (!orderId) {
      throw new Error('Missing orderId');
    }

    // Support both UUID (id) and human-readable order ID (order_id / parent_order_id)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    let orderQuery = supabaseClient
      .from('orders')
      .select('*, esim_packages(*)');
    
    if (isUuid) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.or(`order_id.eq.${orderId},parent_order_id.eq.${orderId}`);
    }
    
    const { data: order, error: orderError } = await orderQuery
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError || !order) {
      console.error('[RETRY-PAYMENT] Order lookup failed:', { orderId, isUuid, orderError });
      throw new Error('Order not found');
    }

    // Check if user owns this order
    if (order.user_id !== user.id) {
      throw new Error('Unauthorized to access this order');
    }

    // Status filter already applied in query above

    console.log('[RETRY-PAYMENT] Order found:', order.order_id, 'Amount:', order.total_amount, order.currency);

    // Get user email for payment checkout
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('user_id', order.user_id)
      .single();

    const userEmail = profileData?.email || user.email;

    // Check existing payment record
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Determine payment gateway based on stored payment method (not currency)
    // PromptPay/QR → 2C2P, everything else → Stripe
    const shouldUse2C2P = existingPayment?.payment_method === 'promptpay' || 
                          existingPayment?.payment_method === 'redirect' ||
                          existingPayment?.payment_gateway === '2c2p';
    console.log('[RETRY-PAYMENT] Payment routing:', { 
      currency: order.currency, 
      paymentMethod: existingPayment?.payment_method,
      paymentGateway: existingPayment?.payment_gateway,
      shouldUse2C2P 
    });

    const rawOrigin = Deno.env.get('FRONTEND_URL') || req.headers.get('origin') || 'https://mobile11.com';
    const origin = (() => {
      try { return new URL(rawOrigin).origin; }
      catch { return 'https://mobile11.com'; }
    })();
    const parentOrderId = order.parent_order_id || order.order_id;

    if (shouldUse2C2P) {
      // 2C2P payment flow for THB
      const merchantId = Deno.env.get('2C2P_MERCHANT_ID');
      const secretKey = Deno.env.get('2C2P_SECRET_KEY');

      if (!merchantId || !secretKey) {
        console.error('[RETRY-PAYMENT] 2C2P credentials not configured');
        throw new Error('THB payment system not configured');
      }

      // Use existing THB amount or convert
      const amountTHB = order.currency === 'THB' 
        ? Number(order.total_amount).toFixed(2)
        : (Number(order.total_amount) * 35).toFixed(2);
      console.log('[RETRY-PAYMENT] THB amount:', amountTHB);

      // Create shortened invoice number for 2C2P (max 20 alphanumeric chars)
      const invoiceNo = order.order_id.replace(/-/g, '').substring(0, 20);

      const payload = {
        merchantID: merchantId,
        invoiceNo: invoiceNo,
        description: `eSIM: ${order.esim_packages?.name || 'Package'}`.substring(0, 50),
        amount: amountTHB,
        currencyCode: 'THB',
        frontendReturnUrl: `${origin}/payment-success?parent_order_id=${parentOrderId}&method=2c2p`,
        backendReturnUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-2c2p-webhook`,
        paymentChannel: ['ALL'],
        locale: 'en',
        userDefined1: order.id,
        userDefined2: order.user_id,
        userDefined3: 'retry_payment'
      };

      console.log('[RETRY-PAYMENT] Creating 2C2P payment token');

      const jwt = await createJwt(payload, secretKey);

      const response = await fetch('https://pgw.2c2p.com/payment/4.3/paymentToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: jwt })
      });

      const result = await response.json();
      console.log('[RETRY-PAYMENT] 2C2P response received');

      if (!result.payload) {
        console.error('[RETRY-PAYMENT] 2C2P error - no payload:', result);
        throw new Error('Failed to create 2C2P payment session');
      }

      const decoded = decodeJwtPayload(result.payload);
      console.log('[RETRY-PAYMENT] 2C2P decoded response code:', decoded.respCode);

      if (decoded.respCode !== '0000') {
        console.error('[RETRY-PAYMENT] 2C2P error:', decoded.respDesc);
        throw new Error(`Payment error: ${decoded.respDesc}`);
      }

      // Update or create payment record with 2C2P info
      if (existingPayment) {
        await supabaseClient
          .from('payments')
          .update({
            payment_gateway: '2c2p',
            payment_method: 'redirect',
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id);
      } else {
        await supabaseClient
          .from('payments')
          .insert({
            order_id: order.id,
            amount: order.total_amount,
            currency: order.currency,
            payment_gateway: '2c2p',
            payment_method: 'redirect',
            status: 'pending'
          });
      }

      console.log('[RETRY-PAYMENT] 2C2P payment URL:', decoded.webPaymentUrl);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: decoded.webPaymentUrl,
          paymentGateway: '2c2p'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // Stripe payment flow for USD
      const stripeKey = Deno.env.get('STRIPE_PROD_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        console.error('[RETRY-PAYMENT] Stripe key not configured');
        throw new Error('Payment system not configured');
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Check if customer exists in Stripe
      let customerId: string | undefined;
      if (userEmail) {
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      }

      // Create Stripe checkout session
      const stripeLocale = ['en', 'th', 'ja', 'ko', 'fr', 'de'].includes(language) ? language : 'auto';
      console.log('[RETRY-PAYMENT] Stripe locale:', stripeLocale, '(from language:', language, ')');

      const session = await stripe.checkout.sessions.create({
        locale: stripeLocale,
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [{
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: {
              name: order.esim_packages?.name || 'eSIM Package',
              description: order.esim_packages?.description || order.esim_packages?.country_name,
            },
            unit_amount: Math.round(Number(order.total_amount) * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&parent_order_id=${parentOrderId}&method=stripe`,
        cancel_url: `${origin}/payment-canceled?parent_order_id=${parentOrderId}&order_id=${order.id}`,
        metadata: {
          order_ids: JSON.stringify([order.id]),
          parent_order_id: parentOrderId,
          user_id: order.user_id,
          user_email: userEmail || '',
          environment: 'production',
          is_retry: 'true'
        }
      });

      console.log('[RETRY-PAYMENT] Stripe checkout session created:', session.id);

      // Update or create payment record with Stripe info
      if (existingPayment) {
        await supabaseClient
          .from('payments')
          .update({
            payment_gateway: 'stripe',
            payment_method: 'card',
            payment_intent_id: session.id,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id);
      } else {
        await supabaseClient
          .from('payments')
          .insert({
            order_id: order.id,
            amount: order.total_amount,
            currency: order.currency,
            payment_gateway: 'stripe',
            payment_method: 'card',
            payment_intent_id: session.id,
            status: 'pending'
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: session.url,
          paymentGateway: 'stripe'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error: any) {
    console.error('[RETRY-PAYMENT] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
