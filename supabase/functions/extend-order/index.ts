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
    console.log('[EXTEND-ORDER] Extension order request received');
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { orderId, newPackageId, promoCode, promoCodeId, discount: promoDiscount, currency: userCurrency, mobile11MoneyApplied: rawMobile11Money, language } = await req.json();
    const mobile11MoneyApplied = rawMobile11Money || 0;
    console.log('[EXTEND-ORDER] Extending order:', orderId, 'with new package:', newPackageId, 'promo:', promoCode, 'currency:', userCurrency, 'mobile11Money:', mobile11MoneyApplied);

    if (!orderId || !newPackageId) {
      throw new Error('Missing orderId or newPackageId');
    }
    
    // Apply promo discount if provided
    const appliedDiscount = promoDiscount || 0;

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, esim_packages(*, esim_providers(provider_code))')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Check if user owns this order or is admin
    const { data: isAdminData } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (order.user_id !== user.id && !isAdminData) {
      throw new Error('Unauthorized to extend this order');
    }

    if (order.status === 'cancelled') {
      throw new Error('Cannot extend a cancelled order');
    }

    // Provider-aware check: USIMSA needs topupId, TUGE uses order/create for recharges
    const providerCode = order.esim_packages?.esim_providers?.provider_code;
    if (providerCode === 'tuge') {
      // TUGE recharges work via new order/create call - just need the order to exist with a provider reference
      if (!order.provider_order_id && !order.webhook_data?.orderNo) {
        throw new Error('TUGE order missing provider reference; cannot extend yet.');
      }
      console.log('[EXTEND-ORDER] TUGE order detected, will use order/create for recharge');
    } else {
      // USIMSA and other providers need topupId
      if (!order.webhook_data?.topupId) {
        throw new Error('Order missing topupId; cannot extend yet.');
      }
    }

    // Fetch the new package details
    const { data: newPackage, error: packageError } = await supabaseClient
      .from('esim_packages')
      .select('*')
      .eq('id', newPackageId)
      .single();

    if (packageError || !newPackage) {
      throw new Error('New package not found');
    }

    // Check if package supports extension BEFORE payment
    if (newPackage.supports_extension === false) {
      console.log('[EXTEND-ORDER] Package does not support extension:', newPackage.name);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'extension_not_supported',
          message: 'This package does not support true extensions. A new eSIM would be created instead. Please purchase a new eSIM directly.',
          packageName: newPackage.name
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Validate that the country/region matches (API requirement)
    // For regional packages, country_code may be empty, so fallback to country_name
    const originalCountryCode = order.esim_packages.country_code;
    const originalCountryName = order.esim_packages.country_name;
    const newCountryCode = newPackage.country_code;
    const newCountryName = newPackage.country_name;

    let countryMatches = false;
    if (originalCountryCode && newCountryCode) {
      // Both have country codes - compare them
      countryMatches = originalCountryCode === newCountryCode;
    } else {
      // One or both have empty country_code (regional packages) - compare by name
      countryMatches = originalCountryName === newCountryName;
    }

    if (!countryMatches) {
      console.log('[EXTEND-ORDER] Country mismatch:', {
        originalCountryCode,
        originalCountryName,
        newCountryCode,
        newCountryName
      });
      throw new Error('Extension package must be for the same country/region as the original order');
    }

    console.log('[EXTEND-ORDER] Retrieved new package:', newPackage.name);

    // For Day Pass and Limitless: Validate data amount matches original
    const originalPackageType = order.esim_packages.package_type;
    if (originalPackageType === 'day_pass' || originalPackageType === 'limitless') {
      let originalDataValue: string | null = null;
      let newDataValue: string | null = null;
      
      if (originalPackageType === 'day_pass') {
        originalDataValue = order.esim_packages.daily_reset_amount;
        newDataValue = newPackage.daily_reset_amount;
      } else if (originalPackageType === 'limitless') {
        originalDataValue = order.esim_packages.qos_speed;
        newDataValue = newPackage.qos_speed;
      }
      
      if (originalDataValue && newDataValue && originalDataValue !== newDataValue) {
        console.log('[EXTEND-ORDER] Data amount mismatch for Day Pass/Limitless:', {
          originalPackageType,
          originalDataValue,
          newDataValue
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: 'data_amount_mismatch',
            message: `For ${originalPackageType === 'day_pass' ? 'Day Pass' : 'Limitless'} plans, only the number of days can be extended. The data amount must match your original plan.`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Determine payment gateway based on user's currency preference (moved up for storage logic)
    const shouldUse2C2P = userCurrency === 'THB';
    
    // Calculate final price after discount
    const priceAfterPromo = Math.max(0, newPackage.price - appliedDiscount);
    
    // Mobile11 Money is already in USD from the frontend
    const THB_RATE = 35;
    const finalPrice = Math.max(0, priceAfterPromo - mobile11MoneyApplied);
    
    // Determine storage currency and amount based on payment method
    const storedAmount = shouldUse2C2P ? parseFloat((finalPrice * THB_RATE).toFixed(2)) : finalPrice;
    const storedCurrency = shouldUse2C2P ? 'THB' : newPackage.currency;
    const storedMobile11Money = shouldUse2C2P ? parseFloat((mobile11MoneyApplied * THB_RATE).toFixed(2)) : mobile11MoneyApplied;
    
    console.log('[EXTEND-ORDER] Price calculation:', { 
      original: newPackage.price, 
      discount: appliedDiscount, 
      mobile11Money: mobile11MoneyApplied,
      final: finalPrice,
      storedAmount,
      storedCurrency,
      shouldUse2C2P 
    });

    // Create a pending order record for the extension
    const { data: extensionOrder, error: createError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: order.user_id,
        package_id: newPackage.id,
        total_amount: storedAmount,
        original_amount: (appliedDiscount > 0 || mobile11MoneyApplied > 0) ? (shouldUse2C2P ? newPackage.price * THB_RATE : newPackage.price) : null,
        discount_amount: appliedDiscount > 0 ? (shouldUse2C2P ? appliedDiscount * THB_RATE : appliedDiscount) : null,
        mobile11_money_applied: mobile11MoneyApplied > 0 ? (shouldUse2C2P ? mobile11MoneyApplied : storedMobile11Money) : null,
        promo_code_id: promoCodeId || null,
        currency: storedCurrency,
        order_id: `EXT-${orderId.substring(0, 8)}-${Date.now()}`,
        parent_order_id: order.order_id,
        status: 'pending',
        environment: 'production',
        webhook_data: {
          originalOrderId: orderId,
          isExtension: true,
          extensionTimestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (createError || !extensionOrder) {
      console.error('[EXTEND-ORDER] Failed to create extension order:', createError);
      throw new Error('Failed to create extension order');
    }

    console.log('[EXTEND-ORDER] Created extension order:', extensionOrder.id);

    // Create a pending payment record for the extension
    const isFreeOrder = finalPrice === 0;
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        order_id: extensionOrder.id,
        amount: finalPrice,
        currency: newPackage.currency,
        status: isFreeOrder ? 'completed' : 'pending',
        payment_method: isFreeOrder ? (mobile11MoneyApplied > 0 ? 'mobile11_money' : 'promo_code') : null
      });

    if (paymentError) {
      console.error('[EXTEND-ORDER] Failed to create payment record:', paymentError);
    }

    // Handle free orders (fully covered by promo + Mobile11 Money)
    if (isFreeOrder) {
      console.log('[EXTEND-ORDER] Free extension order - no payment needed');
      
      // Update order status to processing
      await supabaseClient
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', extensionOrder.id);

      // Deduct Mobile11 Money if used
      if (mobile11MoneyApplied > 0) {
        try {
          const deductResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/deduct-mobile11-money`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                user_id: order.user_id,
                order_id: extensionOrder.id,
                amount_thb: mobile11MoneyApplied * THB_RATE
              })
            }
          );
          const deductResult = await deductResponse.json();
          console.log('[EXTEND-ORDER] Mobile11 Money deduction result:', deductResult);
        } catch (e: any) {
          console.error('[EXTEND-ORDER] Failed to deduct Mobile11 Money:', e);
        }
      }

      // Increment promo code usage if used
      if (promoCodeId) {
        await supabaseClient.rpc('increment_promo_code_usage', { promo_id: promoCodeId });
      }

      // Process the free order for eSIM provisioning
      try {
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-free-orders`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              orderIds: [extensionOrder.id],
              environment: 'production'
            })
          }
        );
        console.log('[EXTEND-ORDER] Free order processing triggered');
      } catch (e: any) {
        console.error('[EXTEND-ORDER] Failed to trigger free order processing:', e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          requiresPayment: false,
          extensionOrderId: extensionOrder.order_id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get user email for payment checkout
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('user_id', order.user_id)
      .single();

    const userEmail = profileData?.email;

    // Payment routing already determined above
    console.log('[EXTEND-ORDER] Payment routing:', { userCurrency, shouldUse2C2P });

    if (shouldUse2C2P) {
      // 2C2P payment flow for THB
      const merchantId = Deno.env.get('2C2P_MERCHANT_ID');
      const secretKey = Deno.env.get('2C2P_SECRET_KEY');

      if (!merchantId || !secretKey) {
        console.error('[EXTEND-ORDER] 2C2P credentials not configured');
        throw new Error('THB payment system not configured');
      }

      // Convert USD price to THB (rate: 35)
      const THB_RATE = 35;
      const amountTHB = (finalPrice * THB_RATE).toFixed(2);
      console.log('[EXTEND-ORDER] THB amount:', amountTHB);

      // Create shortened invoice number for 2C2P (max 20 alphanumeric chars)
      const invoiceNo = extensionOrder.order_id.replace(/-/g, '').substring(0, 20);
      // Use FRONTEND_URL with origin normalization - mobile browsers often don't send origin header
      const rawOrigin = Deno.env.get('FRONTEND_URL') || req.headers.get('origin') || 'https://mobile11.com';
      const origin = (() => {
        try { return new URL(rawOrigin).origin; }
        catch { return 'https://mobile11.com'; }
      })();

      const payload = {
        merchantID: merchantId,
        invoiceNo: invoiceNo,
        description: `eSIM Extension: ${newPackage.name}`.substring(0, 50),
        amount: amountTHB,
        currencyCode: 'THB',
        frontendReturnUrl: `${origin}/payment-success?parent_order_id=${extensionOrder.order_id}&method=2c2p`,
        backendReturnUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-2c2p-webhook`,
        paymentChannel: ['ALL'],
        locale: 'en',
        userDefined1: extensionOrder.id,
        userDefined2: order.user_id,
        userDefined3: 'extension',
        userDefined4: promoCode || '',
        userDefined5: String(appliedDiscount)
      };

      console.log('[EXTEND-ORDER] Creating 2C2P payment token');

      const jwt = await createJwt(payload, secretKey);

      const response = await fetch('https://pgw.2c2p.com/payment/4.3/paymentToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: jwt })
      });

      const result = await response.json();
      console.log('[EXTEND-ORDER] 2C2P response received');

      if (!result.payload) {
        console.error('[EXTEND-ORDER] 2C2P error - no payload:', result);
        throw new Error('Failed to create 2C2P payment session');
      }

      const decoded = decodeJwtPayload(result.payload);
      console.log('[EXTEND-ORDER] 2C2P decoded response code:', decoded.respCode);

      if (decoded.respCode !== '0000') {
        console.error('[EXTEND-ORDER] 2C2P error:', decoded.respDesc);
        throw new Error(`Payment error: ${decoded.respDesc}`);
      }

      // Update payment record with 2C2P info
      await supabaseClient
        .from('payments')
        .update({
          payment_gateway: '2c2p',
          payment_method: 'redirect'
        })
        .eq('order_id', extensionOrder.id);

      console.log('[EXTEND-ORDER] 2C2P payment URL:', decoded.webPaymentUrl);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: decoded.webPaymentUrl,
          extensionOrderId: extensionOrder.id,
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
        console.error('[EXTEND-ORDER] Stripe key not configured');
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
      const lineItemName = appliedDiscount > 0 
        ? `${newPackage.name} Extension (Discounted)`
        : `${newPackage.name} Extension`;
        
      const stripeLocale = ['en', 'th', 'ja', 'ko', 'fr', 'de'].includes(language) ? language : 'auto';
      console.log('[EXTEND-ORDER] Stripe locale:', stripeLocale, '(from language:', language, ')');

      const session = await stripe.checkout.sessions.create({
        locale: stripeLocale,
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [{
          price_data: {
            currency: newPackage.currency.toLowerCase(),
            product_data: {
              name: lineItemName,
              description: `Extend eSIM: ${newPackage.description || newPackage.country_name}`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
        success_url: `${req.headers.get('origin') || ''}/payment-success?session_id={CHECKOUT_SESSION_ID}&parent_order_id=${extensionOrder.order_id}&method=stripe`,
        cancel_url: `${req.headers.get('origin') || ''}/payment-canceled?parent_order_id=${extensionOrder.order_id}&order_id=${extensionOrder.id}`,
        metadata: {
          order_ids: JSON.stringify([extensionOrder.id]),
          parent_order_id: extensionOrder.order_id,
          user_id: order.user_id,
          user_email: userEmail || '',
          environment: 'production',
          is_extension: 'true',
          original_order_id: orderId,
          promo_code: promoCode || '',
          promo_code_id: promoCodeId || '',
          discount_amount: String(appliedDiscount)
        }
      });

      console.log('[EXTEND-ORDER] Stripe checkout session created:', session.id);

      // Update payment record with Stripe info
      await supabaseClient
        .from('payments')
        .update({
          payment_gateway: 'stripe',
          payment_method: 'card'
        })
        .eq('order_id', extensionOrder.id);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: session.url,
          extensionOrderId: extensionOrder.id,
          paymentGateway: 'stripe'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error: any) {
    console.error('[EXTEND-ORDER] Error:', error);
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