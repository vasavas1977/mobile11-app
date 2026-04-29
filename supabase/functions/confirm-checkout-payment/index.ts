import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { sessionId, parentOrderId } = await req.json();
    console.log('[CONFIRM-CHECKOUT] Request received:', { sessionId, parentOrderId });

    if (!sessionId || !parentOrderId) {
      throw new Error("Missing sessionId or parentOrderId");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user?.email) throw new Error("Authentication required");
    console.log('[CONFIRM-CHECKOUT] User authenticated:', user.email);

    // Fetch orders by parent_order_id
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, status, user_id, package_id, order_id, webhook_data, promo_code_id, discount_amount, mobile11_money_applied, currency')
      .eq('parent_order_id', parentOrderId);

    if (ordersError || !orders || orders.length === 0) {
      console.error('[CONFIRM-CHECKOUT] Orders not found:', ordersError);
      throw new Error("Orders not found");
    }

    // Verify user ownership
    const unauthorized = orders.find(o => o.user_id !== user.id);
    if (unauthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Idempotency: skip if already processed
    const alreadyProcessed = orders.every(o => o.status !== 'pending');
    if (alreadyProcessed) {
      console.log('[CONFIRM-CHECKOUT] Orders already processed, skipping');
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify with Stripe that the Checkout Session is paid
    const stripeKey = Deno.env.get("STRIPE_PROD_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('[CONFIRM-CHECKOUT] Session payment_status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({
        error: 'Payment not yet confirmed by Stripe',
        status: session.payment_status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const orderIds = orders.map(o => o.id);

    // ===== POST-PAYMENT PIPELINE =====

    // Update orders to processing
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ status: 'processing', payment_completed_at: new Date().toISOString() })
      .in('id', orderIds);

    if (updateError) {
      console.error('[CONFIRM-CHECKOUT] Failed to update orders:', updateError);
    }

    // Update payments to completed
    const paymentIntentId = session.payment_intent as string;
    const { error: paymentUpdateError } = await supabaseClient
      .from('payments')
      .update({ status: 'completed', payment_intent_id: paymentIntentId || null })
      .in('order_id', orderIds);

    if (paymentUpdateError) {
      console.error('[CONFIRM-CHECKOUT] Failed to update payments:', paymentUpdateError);
    } else {
      console.log('[CONFIRM-CHECKOUT] Payments marked completed for', orderIds.length, 'orders');
    }

    // 1. Attribute affiliate sales
    for (const orderId of orderIds) {
      try {
        const { data: affiliateResult, error: affiliateError } = await supabaseClient.functions.invoke('attribute-affiliate-sale', {
          body: { order_id: orderId }
        });
        if (affiliateError) {
          console.error('[CONFIRM-CHECKOUT] Affiliate attribution failed:', orderId, affiliateError);
        } else if (affiliateResult?.attributed) {
          console.log('[CONFIRM-CHECKOUT] Affiliate sale attributed:', orderId);
        }
      } catch (err: any) {
        console.error('[CONFIRM-CHECKOUT] Affiliate exception:', err);
      }
    }

    // 2. Provision eSIMs with retry
    const withRetry = async (fn: () => Promise<any>, orderId: string, maxRetries = 3) => {
      let lastError: any;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await fn();
          if (result.data?.success !== false) return result;
          lastError = result.data;
        } catch (e: any) {
          lastError = e;
        }
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
      return { data: null, error: lastError };
    };

    let successCount = 0;
    let failCount = 0;

    for (const order of orders) {
      try {
        const { data: integrationData, error: integrationError } = await withRetry(
          () => supabaseClient.functions.invoke('provision-esim', {
            body: { packageId: order.package_id, orderId: order.id, userEmail: user.email }
          }),
          order.id
        );

        if (integrationError || integrationData?.success === false) {
          console.error(`[CONFIRM-CHECKOUT] Provisioning failed for ${order.id}`);
          await supabaseClient.from('orders').update({
            status: 'needs_attention',
            webhook_data: {
              ...(order.webhook_data || {}),
              provisioning_error: integrationError?.message || integrationData?.message || 'Unknown error',
              failed_at: new Date().toISOString(),
              payment_completed: true
            }
          }).eq('id', order.id);

          try {
            await supabaseClient.functions.invoke('send-admin-notification', {
              body: {
                action_type: 'order_provisioning_failed',
                entity_type: 'order',
                entity_id: order.id,
                admin_email: 'system@mobile11.io',
                admin_name: 'System',
                details: `Checkout payment confirmed but eSIM provisioning failed after 3 retries.`,
                metadata: { order_id: order.id, parent_order_id: parentOrderId, user_email: user.email }
              }
            });
          } catch (notifyErr) {
            console.error('[CONFIRM-CHECKOUT] Admin notification failed:', notifyErr);
          }
          failCount++;
        } else {
          console.log(`[CONFIRM-CHECKOUT] eSIM provisioned for ${order.id}`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`[CONFIRM-CHECKOUT] Exception provisioning ${order.id}:`, err);
        await supabaseClient.from('orders').update({
          status: 'needs_attention',
          webhook_data: { ...(order.webhook_data || {}), provisioning_error: String(err), failed_at: new Date().toISOString(), payment_completed: true }
        }).eq('id', order.id);
        failCount++;
      }
    }

    console.log(`[CONFIRM-CHECKOUT] Provisioning: ${successCount} success, ${failCount} failed`);

    // 3. Promo code usage
    for (const order of orders) {
      try {
        if (order.promo_code_id) {
          await supabaseClient.from('promo_code_usage').insert({
            promo_code_id: order.promo_code_id,
            order_id: order.id,
            user_id: order.user_id,
            discount_applied: order.discount_amount || 0
          });
          await supabaseClient.rpc('increment_promo_code_usage', { promo_id: order.promo_code_id });
        }
      } catch (err: any) {
        console.error('[CONFIRM-CHECKOUT] Promo code error:', err);
      }
    }

    // 4. Deduct Mobile11 Money
    const USD_TO_THB_RATE = 35;
    for (const order of orders) {
      try {
        if (order.mobile11_money_applied && order.mobile11_money_applied > 0) {
          const amountThb = order.currency === 'USD'
            ? order.mobile11_money_applied * USD_TO_THB_RATE
            : order.mobile11_money_applied;
          await supabaseClient.functions.invoke('deduct-mobile11-money', {
            body: { user_id: order.user_id, order_id: order.id, amount_thb: amountThb }
          });
        }
      } catch (err: any) {
        console.error('[CONFIRM-CHECKOUT] Mobile11 Money error:', err);
      }
    }

    // 5. Loyalty cashback
    for (const orderId of orderIds) {
      try {
        await supabaseClient.functions.invoke('calculate-loyalty-cashback', { body: { order_id: orderId } });
      } catch (err: any) {
        console.error('[CONFIRM-CHECKOUT] Cashback error:', err);
      }
    }

    // 6. Referral rewards
    for (const order of orders) {
      try {
        if ((order.webhook_data as any)?.is_referral_order) {
          await supabaseClient.functions.invoke('process-referral-reward', { body: { order_id: order.id } });
        }
      } catch (err: any) {
        console.error('[CONFIRM-CHECKOUT] Referral error:', err);
      }
    }

    console.log('[CONFIRM-CHECKOUT] Pipeline complete');

    return new Response(JSON.stringify({ success: true, successCount, failCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[CONFIRM-CHECKOUT] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
