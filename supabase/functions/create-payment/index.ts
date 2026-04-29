import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapping of eSIM package IDs to Stripe TEST price IDs
const PACKAGE_PRICE_MAPPING: Record<string, string> = {
  "24e7e181-2cc3-4755-b851-f5e48e0d3f5a": "price_1SBx4SHwtbvnDkxzC3mvkrUE", // USA 1GB - 7 Days (TEST)
  "f733b76f-46c1-4f60-84c7-cbf5c7b406b0": "price_1SBx4lHwtbvnDkxz2SmeYp14", // Europe 3GB - 15 Days (TEST)
  "b433479b-5d82-4677-9e70-32da838e476f": "price_1SBx4yHwtbvnDkxzaT4SZzeq", // USA 5GB - 30 Days (TEST)
  "0c51e9e8-9a18-4964-b839-76933c63b424": "price_1SBx5HHwtbvnDkxzvGbo5i8j", // Global 10GB - 30 Days (TEST)
};

serve(async (req) => {
  console.log('Payment request received');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use SERVICE_ROLE_KEY to bypass RLS and see newly created orders
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    // Get request body
    const { orderIds, parentOrderId, items, environment, savedCardId, language } = await req.json();
    console.log('Processing payment request', { parentOrderId, environment, itemsCount: Array.isArray(items) ? items.length : 0, savedCardId });

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('[AUTH] No authorization header provided');
      throw new Error("Authentication required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      console.error('[AUTH] User authentication failed:', { userId: user?.id });
      throw new Error("Authentication required");
    }
    console.log('User authenticated:', user.email);

    // Helper to determine zero-decimal currencies
    const ZERO_DECIMAL = new Set(['BIF','CLP','DJF','GNF','JPY','KRW','KMF','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF']);

    // Build line items from items array - each order is a separate line item
    let lineItems: any[] = [];

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Invalid items array');
    }

    // Fetch both package details AND order details (to get discounted prices)
    const orderIdsForLookup = items.map((it: any) => it.orderId);
    console.log(`[ORDERS] Fetching ${orderIdsForLookup.length} orders for payment`, { orderIds: orderIdsForLookup });
    
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, package_id, total_amount, discount_amount, promo_code_id, currency, user_id')
      .in('id', orderIdsForLookup);

    if (ordersError) {
      console.error('[ORDERS] Failed to fetch orders:', ordersError.message, ordersError);
      throw new Error(`Could not prepare checkout: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      console.error('[ORDERS] No orders found for IDs:', orderIdsForLookup);
      throw new Error('Could not find orders for checkout');
    }

    console.log(`[ORDERS] Found ${orders?.length || 0} orders (requested ${orderIdsForLookup.length})`, { 
      orders: orders?.map((o: any) => ({ id: o.id, currency: o.currency, total: o.total_amount })) 
    });

    // Security: Verify all orders belong to authenticated user
    if (orders && orders.length > 0) {
      const unauthorizedOrder = orders.find((o: any) => o.user_id !== user.id);
      if (unauthorizedOrder) {
        console.error('[SECURITY] Unauthorized payment attempt:', { userId: user.id, orderId: unauthorizedOrder.id });
        return new Response(JSON.stringify({ 
          error: 'Unauthorized payment attempt for one or more orders.' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    const orderMap = new Map(orders?.map((o: any) => [o.id, o]));

    const itemIds = items.map((it: any) => it.packageId);
    const { data: pkgs, error: pkgsError } = await supabaseClient
      .from('esim_packages')
      .select('id, name, price, currency, country_name, data_amount, validity_days, description')
      .in('id', itemIds)
      .eq('is_active', true);

    if (pkgsError) {
      console.error('Failed to fetch packages:', pkgsError.message);
      throw new Error('Could not prepare checkout');
    }

    const pkgMap = new Map(pkgs?.map((p: any) => [p.id, p]));

    for (const it of items) {
      const pkg = pkgMap.get(it.packageId);
      const order = orderMap.get(it.orderId);
      
      if (!pkg) {
        console.error('Package not found or inactive:', it.packageId);
        throw new Error('One of the selected packages is no longer available');
      }
      
      if (!order) {
        console.error('Order not found:', it.orderId);
        throw new Error('Order not found');
      }
      
      // Use the order's total_amount (which includes promo discount) instead of package price
      const currency = String(order.currency || pkg.currency || 'USD').toUpperCase();
      const rawPrice = Number(order.total_amount || pkg.price || 0);
      const unitAmount = ZERO_DECIMAL.has(currency) ? Math.round(rawPrice) : Math.round(rawPrice * 100);
      
      console.log(`[LINE_ITEM] Order ${order.id}: ${currency} ${rawPrice} -> ${unitAmount} (${ZERO_DECIMAL.has(currency) ? 'zero-decimal' : 'standard'})`);
      
      // Build product description with discount info if applicable
      let description = pkg.description || `${pkg.country_name} eSIM - ${pkg.data_amount} - ${pkg.validity_days} days`;
      if (order.discount_amount && order.discount_amount > 0) {
        const originalPrice = Number(pkg.price);
        description += ` (Original: $${originalPrice.toFixed(2)}, Discount: $${Number(order.discount_amount).toFixed(2)})`;
      }
      
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { 
            name: pkg.name || 'eSIM Package',
            description: description
          },
          unit_amount: unitAmount,
        },
        quantity: 1, // Each order is quantity 1
      });
    }
    
    console.log(`Created ${lineItems.length} line items with promo-adjusted prices`);

    // Initialize Stripe with appropriate key based on environment
    const stripeKey = environment === 'production' 
      ? Deno.env.get("STRIPE_PROD_SECRET_KEY") 
      : Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeKey) {
      console.error('[CONFIG] Stripe key not configured for environment:', environment);
      throw new Error('Payment processing not configured');
    }
    
    console.log(`Using ${environment} Stripe key`);
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      console.log('No existing customer found, will create during checkout');
    }

    // ===== SAVED CARD: Direct PaymentIntent (bypasses Checkout) =====
    if (savedCardId && customerId) {
      console.log('[DIRECT_PAY] Charging saved card directly:', savedCardId);
      
      // Calculate total amount across all line items
      const totalUnitAmount = lineItems.reduce((sum: number, li: any) => sum + li.price_data.unit_amount, 0);
      const chargeCurrency = lineItems[0].price_data.currency;
      
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalUnitAmount,
          currency: chargeCurrency,
          customer: customerId,
          payment_method: savedCardId,
          confirm: true,
          payment_method_options: {
            card: {
              request_three_d_secure: 'any',
            },
          },
          return_url: `${req.headers.get("origin")}/payment-success?parent_order_id=${parentOrderId}&method=direct`,
          metadata: {
            order_ids: JSON.stringify(orderIds),
            parent_order_id: parentOrderId,
            user_id: user.id,
            user_email: user.email,
            environment: environment || 'test',
            items_count: String(orderIds.length),
            has_promo: orders?.some((o: any) => o.promo_code_id) ? 'true' : 'false'
          },
        });

        console.log('[DIRECT_PAY] PaymentIntent status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
          // Update all orders to processing
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update({ status: 'processing', payment_completed_at: new Date().toISOString() })
            .in('id', orderIds);
          
          if (updateError) {
            console.error('[DIRECT_PAY] Failed to update orders:', updateError);
          }

          // Update payments table to completed
          const { error: paymentUpdateError } = await supabaseClient
            .from('payments')
            .update({ 
              status: 'completed', 
              payment_intent_id: paymentIntent.id 
            })
            .in('order_id', orderIds);
          
          if (paymentUpdateError) {
            console.error('[DIRECT_PAY] Failed to update payments:', paymentUpdateError);
          } else {
            console.log('[DIRECT_PAY] Payments marked as completed for orders:', orderIds);
          }

          console.log('[DIRECT_PAY] Payment succeeded, starting post-payment pipeline');

          // ===== POST-PAYMENT PIPELINE (mirrors stripe-webhook logic) =====

          // 1. Attribute affiliate sales (non-critical)
          for (const orderId of orderIds) {
            try {
              const { data: affiliateResult, error: affiliateError } = await supabaseClient.functions.invoke('attribute-affiliate-sale', {
                body: { order_id: orderId }
              });
              if (affiliateError) {
                console.error('[DIRECT_PAY] Failed to attribute affiliate sale:', orderId, affiliateError);
              } else if (affiliateResult?.attributed) {
                console.log('[DIRECT_PAY] Affiliate sale attributed:', orderId);
              }
            } catch (err: any) {
              console.error('[DIRECT_PAY] Exception attributing affiliate:', err);
            }
          }

          // 2. Provision eSIMs with retry (3 attempts, exponential backoff)
          const withRetry = async (fn: () => Promise<any>, orderId: string, maxRetries = 3) => {
            let lastError: any;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
              try {
                const result = await fn();
                if (result.data?.success !== false) return result;
                lastError = result.data;
                console.log(`[DIRECT_PAY] Retry ${attempt + 1}/${maxRetries} failed for ${orderId}:`, result.data);
              } catch (e: any) {
                lastError = e;
                console.log(`[DIRECT_PAY] Retry ${attempt + 1}/${maxRetries} exception for ${orderId}:`, e);
              }
              if (attempt < maxRetries - 1) {
                const delay = 1000 * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, delay));
              }
            }
            return { data: null, error: lastError };
          };

          let successCount = 0;
          let failCount = 0;

          for (const orderId of orderIds) {
            const { data: order } = await supabaseClient
              .from('orders')
              .select('package_id, order_id, webhook_data')
              .eq('id', orderId)
              .single();

            if (!order) {
              console.error('[DIRECT_PAY] Order not found:', orderId);
              failCount++;
              continue;
            }

            try {
              const { data: integrationData, error: integrationError } = await withRetry(
                () => supabaseClient.functions.invoke('provision-esim', {
                  body: {
                    packageId: order.package_id,
                    orderId: orderId,
                    userEmail: user.email
                  }
                }),
                orderId
              );

              if (integrationError || integrationData?.success === false) {
                console.error(`[DIRECT_PAY] Provisioning failed for ${orderId} after retries:`, integrationError || integrationData);
                await supabaseClient.from('orders').update({
                  status: 'needs_attention',
                  webhook_data: {
                    ...(order.webhook_data || {}),
                    provisioning_error: integrationError?.message || integrationData?.message || 'Unknown error',
                    failed_at: new Date().toISOString(),
                    payment_completed: true
                  }
                }).eq('id', orderId);

                // Notify admins
                try {
                  await supabaseClient.functions.invoke('send-admin-notification', {
                    body: {
                      action_type: 'order_provisioning_failed',
                      entity_type: 'order',
                      entity_id: orderId,
                      admin_email: 'system@mobile11.io',
                      admin_name: 'System',
                      details: `Direct payment succeeded but eSIM provisioning failed after 3 retries.`,
                      metadata: { order_id: orderId, parent_order_id: parentOrderId, user_email: user.email }
                    }
                  });
                } catch (notifyErr) {
                  console.error('[DIRECT_PAY] Failed to send admin notification:', notifyErr);
                }
                failCount++;
              } else {
                console.log(`[DIRECT_PAY] eSIM provisioned for ${orderId} via ${integrationData?.provider || 'provider'}`);
                successCount++;
              }
            } catch (err: any) {
              console.error(`[DIRECT_PAY] Exception provisioning ${orderId}:`, err);
              await supabaseClient.from('orders').update({
                status: 'needs_attention',
                webhook_data: { ...(order.webhook_data || {}), provisioning_error: String(err), failed_at: new Date().toISOString(), payment_completed: true }
              }).eq('id', orderId);
              failCount++;
            }
          }

          console.log(`[DIRECT_PAY] Provisioning: ${successCount} success, ${failCount} failed`);

          // 3. Promo code usage
          for (const orderId of orderIds) {
            try {
              const { data: orderData } = await supabaseClient.from('orders').select('promo_code_id, user_id, discount_amount').eq('id', orderId).single();
              if (orderData?.promo_code_id) {
                await supabaseClient.from('promo_code_usage').insert({
                  promo_code_id: orderData.promo_code_id,
                  order_id: orderId,
                  user_id: orderData.user_id,
                  discount_applied: orderData.discount_amount || 0
                });
                await supabaseClient.rpc('increment_promo_code_usage', { promo_id: orderData.promo_code_id });
                console.log('[DIRECT_PAY] Promo code recorded for order:', orderId);
              }
            } catch (err: any) {
              console.error('[DIRECT_PAY] Failed to record promo code:', err);
            }
          }

          // 4. Deduct Mobile11 Money
          const USD_TO_THB_RATE = 35;
          for (const orderId of orderIds) {
            try {
              const { data: orderData } = await supabaseClient.from('orders').select('mobile11_money_applied, user_id, currency').eq('id', orderId).single();
              if (orderData?.mobile11_money_applied && orderData.mobile11_money_applied > 0) {
                const amountThb = orderData.currency === 'USD'
                  ? orderData.mobile11_money_applied * USD_TO_THB_RATE
                  : orderData.mobile11_money_applied;
                await supabaseClient.functions.invoke('deduct-mobile11-money', {
                  body: { user_id: orderData.user_id, order_id: orderId, amount_thb: amountThb }
                });
              }
            } catch (err: any) {
              console.error('[DIRECT_PAY] Failed to deduct Mobile11 Money:', err);
            }
          }

          // 5. Loyalty cashback
          for (const orderId of orderIds) {
            try {
              await supabaseClient.functions.invoke('calculate-loyalty-cashback', { body: { order_id: orderId } });
            } catch (err: any) {
              console.error('[DIRECT_PAY] Failed to calculate cashback:', err);
            }
          }

          // 6. Referral rewards
          for (const orderId of orderIds) {
            try {
              const { data: refOrder } = await supabaseClient.from('orders').select('webhook_data').eq('id', orderId).single();
              if ((refOrder?.webhook_data as any)?.is_referral_order) {
                await supabaseClient.functions.invoke('process-referral-reward', { body: { order_id: orderId } });
              }
            } catch (err: any) {
              console.error('[DIRECT_PAY] Failed to process referral:', err);
            }
          }

          // ===== END POST-PAYMENT PIPELINE =====

          return new Response(JSON.stringify({ 
            directPayment: true, 
            parentOrderId,
            sessionId: paymentIntent.id,
            successCount,
            failCount
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        if (paymentIntent.status === 'requires_action') {
          console.log('[DIRECT_PAY] 3DS required, persisting payment_intent_id and returning client secret');
          
          // Persist payment_intent_id on payments so webhook can match later
          const { error: piUpdateError } = await supabaseClient
            .from('payments')
            .update({ payment_intent_id: paymentIntent.id })
            .in('order_id', orderIds);
          
          if (piUpdateError) {
            console.error('[DIRECT_PAY] Failed to persist payment_intent_id for 3DS:', piUpdateError);
          } else {
            console.log('[DIRECT_PAY] Persisted payment_intent_id on', orderIds.length, 'payments');
          }
          
          return new Response(JSON.stringify({ 
            requires3DS: true, 
            clientSecret: paymentIntent.client_secret,
            parentOrderId,
            paymentIntentId: paymentIntent.id,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (directErr: any) {
        console.error('[DIRECT_PAY] Direct charge failed:', directErr.message);
        
        // Card declined or other failure
        if (directErr.type === 'StripeCardError') {
          return new Response(JSON.stringify({ 
            error: directErr.message || 'Card declined. Please try another card.' 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
        
        // For other errors, fall through to Checkout Session
        console.warn('[DIRECT_PAY] Falling back to Checkout Session');
      }
    }

    // ===== NEW CARD / FALLBACK: Stripe Checkout Session =====
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "payment",
        locale: language || 'auto',
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&parent_order_id=${parentOrderId}&method=stripe`,
        cancel_url: `${req.headers.get("origin")}/payment-canceled?parent_order_id=${parentOrderId}`,
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
        ...(customerId && {
          saved_payment_method_options: {
            payment_method_save: 'enabled',
            allow_redisplay_filters: ['always', 'limited', 'unspecified'],
          },
        }),
        metadata: {
          order_ids: JSON.stringify(orderIds),
          parent_order_id: parentOrderId,
          user_id: user.id,
          user_email: user.email,
          environment: environment || 'test',
          items_count: String(orderIds.length),
          has_promo: orders?.some((o: any) => o.promo_code_id) ? 'true' : 'false'
        },
        consent_collection: {
          terms_of_service: 'required',
        },
        custom_text: {
          submit: { message: "Complete payment with mobile11" },
          terms_of_service_acceptance: { message: "I agree to mobile11's terms of service" }
        },
      });
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      if (err?.raw?.code === 'amount_too_small') {
        return new Response(JSON.stringify({
          error: "This package price is below Stripe's minimum charge for your currency. Please select a higher-priced package.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      throw err;
    }

    console.log('Checkout session created:', session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('[ERROR] Payment creation failed:', error);
    return new Response(JSON.stringify({ error: 'Unable to process payment. Please try again.' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});