import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle organization credit top-up payments
async function handleOrgCreditTopup(session: Stripe.Checkout.Session): Promise<Response> {
  const { organization_id, topup_request_id, amount, user_id } = session.metadata || {};
  
  console.log('[WEBHOOK] Org credit topup metadata:', { organization_id, topup_request_id, amount, user_id });
  
  if (!organization_id || !amount) {
    console.error('[WEBHOOK] Missing org topup metadata');
    return new Response(JSON.stringify({ error: "Missing organization top-up metadata" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const topupAmount = parseFloat(amount);

  // Check for idempotency - if topup request already completed
  if (topup_request_id) {
    const { data: existingRequest } = await supabase
      .from('organization_topup_requests')
      .select('status')
      .eq('id', topup_request_id)
      .single();

    if (existingRequest?.status === 'completed') {
      console.log('[WEBHOOK] Org topup already completed, skipping:', topup_request_id);
      return new Response(JSON.stringify({ received: true, message: "Top-up already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Get current organization balance
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('credit_balance')
    .eq('id', organization_id)
    .single();

  if (orgError || !org) {
    console.error('[WEBHOOK] Failed to fetch organization:', orgError);
    return new Response(JSON.stringify({ error: "Organization not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const newBalance = (org.credit_balance || 0) + topupAmount;

  // Update organization credit balance
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ credit_balance: newBalance })
    .eq('id', organization_id);

  if (updateError) {
    console.error('[WEBHOOK] Failed to update org balance:', updateError);
    return new Response(JSON.stringify({ error: "Failed to update credit balance" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create transaction record
  const { error: txError } = await supabase
    .from('organization_credit_transactions')
    .insert({
      organization_id,
      amount: topupAmount,
      type: 'topup',
      description: `Self-service credit top-up via Stripe`,
      reference_id: session.id,
      performed_by: user_id || null,
      balance_after: newBalance
    });

  if (txError) {
    console.error('[WEBHOOK] Failed to create transaction record:', txError);
    // Continue - the balance was updated successfully
  }

  // Update topup request status if exists
  if (topup_request_id) {
    await supabase
      .from('organization_topup_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', topup_request_id);
  }

  console.log('[WEBHOOK] Org credit topup completed:', { organization_id, amount: topupAmount, newBalance });

  return new Response(JSON.stringify({ 
    received: true, 
    success: true,
    message: "Organization credit topped up successfully",
    newBalance
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[WEBHOOK] Received Stripe webhook request');
    
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error('[WEBHOOK] No signature provided');
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine which environment this webhook is from
    // We'll try production secret first, then fall back to test secret (some projects store the live webhook secret under STRIPE_WEBHOOK_SECRET).
    const prodWebhookSecret = Deno.env.get("STRIPE_PROD_WEBHOOK_SECRET");
    const testWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const secretsToTry = [
      { name: "STRIPE_PROD_WEBHOOK_SECRET", value: prodWebhookSecret, environment: "production" as const },
      { name: "STRIPE_WEBHOOK_SECRET", value: testWebhookSecret, environment: "test" as const },
    ].filter((s) => !!s.value);

    if (secretsToTry.length === 0) {
      console.error('[WEBHOOK] No webhook secrets configured (STRIPE_PROD_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRET)');
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    let environment = 'test';

    // Stripe client key isn't used for signature verification, but we keep it aligned for future API usage.
    const stripe = new Stripe(
      Deno.env.get("STRIPE_PROD_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY") || "",
      { apiVersion: "2025-08-27.basil" },
    );

    let lastVerifyError: unknown = null;
    for (const secret of secretsToTry) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, secret.value!);
        environment = secret.environment;
        console.log(`[WEBHOOK] Verified with ${secret.name}`);
        lastVerifyError = null;
        break;
      } catch (err: any) {
        lastVerifyError = err;
      }
    }

    if (lastVerifyError) {
      console.error('[WEBHOOK] Webhook signature verification failed:', lastVerifyError);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('[WEBHOOK] Event type:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[WEBHOOK] Processing checkout.session.completed for session:', session.id);

      // Check if this is an organization credit top-up
      if (session.metadata?.type === 'org_credit_topup') {
        console.log('[WEBHOOK] Processing organization credit top-up');
        return await handleOrgCreditTopup(session);
      }

      const { order_ids, parent_order_id, user_id, user_email, environment: metaEnvironment, is_extension, original_order_id } = session.metadata || {};
      
      if (!order_ids || !user_id) {
        console.error('[WEBHOOK] Missing required metadata:', { order_ids, parent_order_id, user_id });
        return new Response(JSON.stringify({ error: "Missing required metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const orderIds = JSON.parse(order_ids || '[]');
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        console.error('[WEBHOOK] Invalid order_ids array:', order_ids);
        return new Response(JSON.stringify({ error: "Invalid order_ids" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resolvedParentOrderId = parent_order_id || null;

      // Use environment from metadata if available, otherwise use detected environment
      const finalEnvironment = metaEnvironment || environment;
      console.log('[WEBHOOK] Processing parent order:', resolvedParentOrderId, 'with', orderIds.length, 'items, environment:', finalEnvironment);

      // Initialize Supabase client with SERVICE_ROLE_KEY for admin operations
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Check if any orders are already completed (idempotency)
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', orderIds);

      const allCompleted = existingOrders?.every(o => o.status === 'completed');
      if (allCompleted) {
        console.log('[WEBHOOK] All orders already completed, skipping:', resolvedParentOrderId);
        return new Response(JSON.stringify({ received: true, message: "Orders already processed" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update all order statuses to processing
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'processing', payment_completed_at: new Date().toISOString() })
        .in('id', orderIds);

      if (orderError) {
        console.error('[WEBHOOK] Failed to update order statuses:', orderError);
        return new Response(JSON.stringify({ error: "Failed to update orders" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log('[WEBHOOK] Updated', orderIds.length, 'order statuses to processing');

      // Update all payment statuses to completed
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          payment_intent_id: session.payment_intent as string || session.id
        })
        .in('order_id', orderIds);

      if (paymentError) {
        console.error('[WEBHOOK] Failed to update payment statuses:', paymentError);
        // Continue anyway - payment was successful
      } else {
        console.log('[WEBHOOK] Updated', orderIds.length, 'payment statuses to completed');
      }

      // Attribute affiliate sales for each order
      for (const orderId of orderIds) {
        try {
          const { data: affiliateResult, error: affiliateError } = await supabase.functions.invoke('attribute-affiliate-sale', {
            body: { order_id: orderId }
          });
          
          if (affiliateError) {
            console.error('[WEBHOOK] Failed to attribute affiliate sale for order:', orderId, affiliateError);
          } else if (affiliateResult?.attributed) {
            console.log('[WEBHOOK] Affiliate sale attributed for order:', orderId, 'affiliate:', affiliateResult.affiliate_id);
          }
        } catch (err: any) {
          console.error('[WEBHOOK] Exception attributing affiliate sale:', err);
          // Continue - affiliate attribution is not critical
        }
      }

      // Get user email for provisioning
      let emailForProvisioning = user_email;
      if (!emailForProvisioning) {
        // Fetch user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(user_id);
        emailForProvisioning = userData?.user?.email;
      }

      if (!emailForProvisioning) {
        console.error('[WEBHOOK] No email available for provisioning');
        // Update all orders to failed
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .in('id', orderIds);
        
        return new Response(JSON.stringify({ error: "No email available for provisioning" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if this is an extension order
      if (is_extension === 'true' && original_order_id) {
        console.log('[WEBHOOK] Processing extension order for original order:', original_order_id);
        
        // Get the original order with provider info
        const { data: originalOrder } = await supabase
          .from('orders')
          .select('*, esim_packages(*, esim_providers(provider_code))')
          .eq('id', original_order_id)
          .single();
        
        if (!originalOrder) {
          console.error('[WEBHOOK] Original order not found');
          await supabase.from('orders').update({ status: 'failed' }).in('id', orderIds);
          return new Response(JSON.stringify({ error: "Cannot process extension: original order not found" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get the extension order and package details
        const extensionOrderId = orderIds[0];
        const { data: extensionOrder } = await supabase
          .from('orders')
          .select('*, esim_packages(*)')
          .eq('id', extensionOrderId)
          .single();
        
        if (!extensionOrder) {
          console.error('[WEBHOOK] Extension order not found');
          return new Response(JSON.stringify({ error: "Extension order not found" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Detect provider for routing
        const providerCode = originalOrder.esim_packages?.esim_providers?.provider_code;
        console.log('[WEBHOOK] Extension provider detected:', providerCode);

        if (providerCode === 'tuge') {
          // TUGE recharge: route through provision-esim (TUGE links recharge to existing ICCID internally)
          console.log('[WEBHOOK] Routing TUGE extension through provision-esim');
          
          const { data: provisionResult, error: provisionError } = await supabase.functions.invoke('provision-esim', {
            body: {
              packageId: extensionOrder.package_id,
              orderId: extensionOrderId,
              userEmail: emailForProvisioning
            }
          });

          if (provisionError || provisionResult?.success === false) {
            console.error('[WEBHOOK] TUGE extension provisioning failed:', provisionError || provisionResult);
            await supabase.from('orders').update({ 
              status: 'needs_attention',
              webhook_data: {
                ...extensionOrder.webhook_data,
                provisioning_error: provisionError?.message || provisionResult?.message || 'TUGE recharge failed',
                failed_at: new Date().toISOString(),
                payment_completed: true
              }
            }).eq('id', extensionOrderId);
          } else {
            console.log('[WEBHOOK] TUGE extension provisioned successfully:', provisionResult);
          }

          // Handle promo code for extension
          if (extensionOrder.promo_code_id) {
            await supabase.from('promo_code_usage').insert({
              promo_code_id: extensionOrder.promo_code_id,
              order_id: extensionOrderId,
              user_id: extensionOrder.user_id,
              discount_applied: extensionOrder.discount_amount || 0
            });
            await supabase.rpc('increment_promo_code_usage', { promo_id: extensionOrder.promo_code_id });
          }

          // Deduct Mobile11 Money if used
          if (extensionOrder.mobile11_money_applied && extensionOrder.mobile11_money_applied > 0) {
            const USD_TO_THB_RATE = 35;
            const amountThb = extensionOrder.currency === 'USD' 
              ? extensionOrder.mobile11_money_applied * USD_TO_THB_RATE 
              : extensionOrder.mobile11_money_applied;
            try {
              await supabase.functions.invoke('deduct-mobile11-money', {
                body: { user_id: extensionOrder.user_id, order_id: extensionOrderId, amount_thb: amountThb }
              });
            } catch (err: any) {
              console.error('[WEBHOOK] Failed to deduct Mobile11 Money:', err);
            }
          }

          // Calculate cashback
          try {
            await supabase.functions.invoke('calculate-loyalty-cashback', { body: { order_id: extensionOrderId } });
          } catch (err: any) {
            console.error('[WEBHOOK] Failed to calculate cashback:', err);
          }

          return new Response(JSON.stringify({ received: true, success: true, message: "TUGE extension initiated" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // USIMSA extension flow (existing logic)
        if (!originalOrder.webhook_data?.topupId) {
          console.error('[WEBHOOK] Original order or topupId not found');
          await supabase.from('orders').update({ status: 'failed' }).in('id', orderIds);
          return new Response(JSON.stringify({ error: "Cannot process extension: original order data missing" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Call USIMSA extend API
        const usimSAAccessKey = Deno.env.get('USIMSA_PROD_ACCESS_KEY');
        const usimSASecretKey = Deno.env.get('USIMSA_PROD_SECRET_KEY');
        const usimSABaseUrl = Deno.env.get('USIMSA_PROD_BASE_URL');

        if (!usimSAAccessKey || !usimSASecretKey || !usimSABaseUrl) {
          console.error('[WEBHOOK] USIMSA credentials not configured');
          await supabase.from('orders').update({ status: 'failed' }).eq('id', extensionOrderId);
          return new Response(JSON.stringify({ error: "Provider credentials not configured" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create HMAC signature for USIMSA
        const timestampMs = Date.now().toString();
        const method = 'POST';
        const pathAndQuery = '/api/v2/extend';
        
        const stringToSign = `${method} ${pathAndQuery}\n${timestampMs}\n${usimSAAccessKey}`;
        const encoder = new TextEncoder();
        const messageData = encoder.encode(stringToSign);
        const keyData = Uint8Array.from(atob(usimSASecretKey), c => c.charCodeAt(0));
        const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

        const baseRoot = usimSABaseUrl.replace(/\/+$/, '');
        const fullUrl = `${baseRoot}${pathAndQuery}`;
        const extensionPayload = {
          topupId: originalOrder.webhook_data.topupId,
          optionId: extensionOrder.esim_packages.package_id
        };

        console.log('[WEBHOOK] Calling USIMSA extend API:', extensionPayload);

        const usimSAResponse = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-gat-access-key': usimSAAccessKey,
            'x-gat-timestamp': timestampMs,
            'x-gat-signature': signatureBase64,
          },
          body: JSON.stringify(extensionPayload)
        });

        const text = await usimSAResponse.text();
        let usimSAResult: any = null;
        try { usimSAResult = text ? JSON.parse(text) : null; } catch { usimSAResult = null; }
        
        console.log('[WEBHOOK] USIMSA extend response:', usimSAResult);

        const code = usimSAResult?.code;
        const isOkCode = code === undefined || code === null || code === '0' || code === 0 || code === '0000';

        if (!usimSAResponse.ok || !usimSAResult || !isOkCode) {
          console.error('[WEBHOOK] USIMSA extend failed:', usimSAResult);
          await supabase.from('orders').update({ status: 'failed' }).eq('id', extensionOrderId);
          return new Response(JSON.stringify({ 
            error: "Failed to extend eSIM with provider",
            details: usimSAResult
          }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if USIMSA returned a NEW eSIM instead of extending (Pattern B)
        const returnedIccid = usimSAResult.iccid || usimSAResult.data?.iccid;
        const originalIccid = originalOrder.iccid;
        const isNewEsim = returnedIccid && originalIccid && returnedIccid !== originalIccid;

        if (isNewEsim) {
          console.log('[WEBHOOK] USIMSA created new eSIM instead of extending', { originalIccid, newIccid: returnedIccid });

          await supabase.from('orders').update({
            status: 'completed',
            iccid: returnedIccid,
            msisdn: usimSAResult.msisdn || null,
            qr_code: usimSAResult.qrcodeImgUrl || null,
            smdp_address: usimSAResult.smdpAddress || null,
            activation_code: usimSAResult.activateCode || null,
            download_link: usimSAResult.downloadLink || null,
            expiry_date: usimSAResult.expiredDate ? new Date(usimSAResult.expiredDate).toISOString() : null,
            webhook_data: {
              ...extensionOrder.webhook_data,
              ...usimSAResult,
              isNewEsim: true,
              originalIccid,
              completedAt: new Date().toISOString()
            }
          }).eq('id', extensionOrderId);

          console.log('[WEBHOOK] Extension created new eSIM, customer must install it:', extensionOrderId);

          return new Response(JSON.stringify({ 
            received: true, success: true,
            message: "New eSIM created (extension not supported for this package)",
            isNewEsim: true, newIccid: returnedIccid
          }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // True extension - same ICCID maintained
        await supabase.from('orders').update({
          status: 'completed',
          iccid: originalOrder.iccid,
          msisdn: originalOrder.msisdn,
          qr_code: originalOrder.qr_code,
          smdp_address: originalOrder.smdp_address,
          activation_code: originalOrder.activation_code,
          download_link: originalOrder.download_link,
          expiry_date: usimSAResult.expiredDate ? new Date(usimSAResult.expiredDate).toISOString() : null,
          webhook_data: {
            ...extensionOrder.webhook_data,
            ...usimSAResult,
            completedAt: new Date().toISOString()
          }
        }).eq('id', extensionOrderId);

        console.log('[WEBHOOK] Extension order completed successfully:', extensionOrderId);

        return new Response(JSON.stringify({ 
          received: true, success: true,
          message: "Extension completed successfully"
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Helper function: retry provisioning with exponential backoff
      const withRetry = async (fn: () => Promise<any>, orderId: string, maxRetries = 3) => {
        let lastError: any;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = await fn();
            if (result.data?.success !== false) {
              return result;
            }
            lastError = result.data;
            console.log(`[WEBHOOK] Retry attempt ${attempt + 1}/${maxRetries} failed for order ${orderId}:`, result.data);
          } catch (e: any) {
            lastError = e;
            console.log(`[WEBHOOK] Retry attempt ${attempt + 1}/${maxRetries} exception for order ${orderId}:`, e);
          }
          if (attempt < maxRetries - 1) {
            const delay = 1000 * Math.pow(2, attempt);
            console.log(`[WEBHOOK] Waiting ${delay}ms before retry for order ${orderId}`);
            await new Promise(r => setTimeout(r, delay));
          }
        }
        return { data: null, error: lastError };
      };

      // Process each order individually - call usimsa-integration for each eSIM with retry
      console.log(`[WEBHOOK] Processing ${orderIds.length} eSIM orders from parent order ${resolvedParentOrderId || 'unknown'}`);
      
      let successCount = 0;
      let failCount = 0;

      for (const orderId of orderIds) {
        // Fetch order to get package_id
        const { data: order } = await supabase
          .from('orders')
          .select('package_id, order_id, webhook_data')
          .eq('id', orderId)
          .single();
        
        if (!order) {
          console.error('[WEBHOOK] Order not found:', orderId);
          failCount++;
          continue;
        }
        
        // Call provision-esim router (routes to correct provider: USIMSA or TUGE)
        console.log(`[WEBHOOK] Provisioning eSIM for order ${order.order_id} (${orderId})`);
        try {
          const { data: integrationData, error: integrationError } = await withRetry(
            () => supabase.functions.invoke('provision-esim', {
              body: {
                packageId: order.package_id,
                orderId: orderId,
                userEmail: emailForProvisioning
              }
            }),
            orderId
          );
          
          if (integrationError || integrationData?.success === false) {
            console.error(`[WEBHOOK] Failed to provision eSIM for order ${order.order_id} after retries:`, integrationError || integrationData);
            
            // Mark order as needs_attention instead of failed (payment was successful)
            await supabase
              .from('orders')
              .update({ 
                status: 'needs_attention',
                webhook_data: {
                  ...(order.webhook_data || {}),
                  provisioning_error: integrationError?.message || integrationData?.message || 'Unknown error',
                  provisioning_error_code: integrationData?.code,
                  failed_at: new Date().toISOString(),
                  payment_completed: true
                }
              })
              .eq('id', orderId);
            
            // Notify admins about the failed provisioning
            try {
              await supabase.functions.invoke('send-admin-notification', {
                body: {
                  action_type: 'order_provisioning_failed',
                  entity_type: 'order',
                  entity_id: orderId,
                  admin_email: 'system@mobile11.io',
                  admin_name: 'System',
                  details: `Payment completed but eSIM provisioning failed after 3 retries. Order requires manual attention.`,
                  metadata: {
                    order_id: orderId,
                    parent_order_id: resolvedParentOrderId,
                    user_email: emailForProvisioning,
                    error: integrationError?.message || integrationData?.message,
                    error_code: integrationData?.code
                  }
                }
              });
              console.log('[WEBHOOK] Admin notification sent for failed provisioning:', orderId);
            } catch (notifyErr) {
              console.error('[WEBHOOK] Failed to send admin notification:', notifyErr);
            }
            
            failCount++;
          } else {
            console.log(`[WEBHOOK] eSIM provisioned successfully for order ${order.order_id} via ${integrationData?.provider || 'provider'}:`, integrationData);
            successCount++;
          }
        } catch (err: any) {
          console.error(`[WEBHOOK] Exception provisioning order ${order.order_id}:`, err);
          await supabase
            .from('orders')
            .update({ 
              status: 'needs_attention',
              webhook_data: {
                ...(order.webhook_data || {}),
                provisioning_error: String(err),
                failed_at: new Date().toISOString(),
                payment_completed: true
              }
            })
            .eq('id', orderId);
          failCount++;
        }
      }

      console.log(`[WEBHOOK] Provisioning complete for parent order ${resolvedParentOrderId || 'unknown'}: ${successCount} success, ${failCount} failed`);

      // Deduct Mobile11 Money if any was used
      const USD_TO_THB_RATE = 35;
      for (const orderId of orderIds) {
        try {
          const { data: orderData } = await supabase
            .from('orders')
            .select('mobile11_money_applied, user_id, currency')
            .eq('id', orderId)
            .single();
          
          if (orderData?.mobile11_money_applied && orderData.mobile11_money_applied > 0) {
            // Only convert if order currency is USD, otherwise it's already in THB
            const amountThb = orderData.currency === 'USD' 
              ? orderData.mobile11_money_applied * USD_TO_THB_RATE 
              : orderData.mobile11_money_applied;
            
            console.log('[WEBHOOK] Deducting Mobile11 Money for order:', orderId, 'amount:', amountThb, 'currency:', orderData.currency);
            await supabase.functions.invoke('deduct-mobile11-money', {
              body: { 
                user_id: orderData.user_id,
                order_id: orderId,
                amount_thb: amountThb
              }
            });
          }
        } catch (err: any) {
          console.error('[WEBHOOK] Failed to deduct Mobile11 Money:', err);
          // Continue - deduction failure is not critical
        }
      }

      // Calculate loyalty cashback for each successfully provisioned order
      for (const orderId of orderIds) {
        try {
          const { data: cashbackResult, error: cashbackError } = await supabase.functions.invoke('calculate-loyalty-cashback', {
            body: { order_id: orderId }
          });
          
          if (cashbackError) {
            console.error('[WEBHOOK] Failed to calculate cashback for order:', orderId, cashbackError);
          } else if (cashbackResult?.success) {
            console.log('[WEBHOOK] Cashback calculated for order:', orderId, 'amount:', cashbackResult.cashback_amount);
          }
        } catch (err: any) {
          console.error('[WEBHOOK] Exception calculating cashback:', err);
          // Continue - cashback is not critical
        }
      }

      // Process referral rewards for all orders
      for (const orderId of orderIds) {
        try {
          const { data: refOrder } = await supabase
            .from('orders')
            .select('webhook_data')
            .eq('id', orderId)
            .single();
          
          if ((refOrder?.webhook_data as any)?.is_referral_order) {
            console.log('[WEBHOOK] Processing referral reward for order:', orderId);
            await supabase.functions.invoke('process-referral-reward', {
              body: { order_id: orderId }
            });
          }
        } catch (err: any) {
          console.error('[WEBHOOK] Failed to process referral reward:', err);
        }
      }

      if (failCount > 0 && successCount === 0) {
        return new Response(JSON.stringify({ 
          received: true, 
          warning: "Payment successful but all eSIM provisioning failed. Support will be notified." 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        received: true, 
        success: true,
        successCount,
        failCount
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle payment_intent.succeeded (for 3DS direct card payments)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('[WEBHOOK] Processing payment_intent.succeeded:', paymentIntent.id);

      const { order_ids, parent_order_id, user_id, user_email, environment: metaEnvironment } = paymentIntent.metadata || {};

      if (!order_ids || !user_id) {
        console.log('[WEBHOOK] payment_intent.succeeded missing metadata (may be checkout-based, handled by checkout.session.completed):', paymentIntent.id);
        return new Response(JSON.stringify({ received: true, message: "No direct-pay metadata, skipping" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const orderIds = JSON.parse(order_ids || '[]');
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        console.error('[WEBHOOK] Invalid order_ids in payment_intent metadata:', order_ids);
        return new Response(JSON.stringify({ error: "Invalid order_ids" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resolvedParentOrderId = parent_order_id || null;
      const finalEnvironment = metaEnvironment || environment;
      console.log('[WEBHOOK] payment_intent.succeeded for parent order:', resolvedParentOrderId, 'with', orderIds.length, 'items');

      // Initialize Supabase client with SERVICE_ROLE_KEY
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Idempotency: check if orders already processed
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', orderIds);

      const alreadyProcessed = existingOrders?.every(o => o.status !== 'pending');
      if (alreadyProcessed) {
        console.log('[WEBHOOK] Orders already processed for payment_intent:', paymentIntent.id);
        return new Response(JSON.stringify({ received: true, message: "Already processed" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update orders to processing
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'processing', payment_completed_at: new Date().toISOString() })
        .in('id', orderIds);

      if (orderError) {
        console.error('[WEBHOOK] Failed to update orders for payment_intent:', orderError);
      } else {
        console.log('[WEBHOOK] Updated', orderIds.length, 'orders to processing');
      }

      // Update payments to completed
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          payment_intent_id: paymentIntent.id
        })
        .in('order_id', orderIds);

      if (paymentError) {
        console.error('[WEBHOOK] Failed to update payments for payment_intent:', paymentError);
      } else {
        console.log('[WEBHOOK] Updated payments to completed');
      }

      // Affiliate attribution
      for (const orderId of orderIds) {
        try {
          const { data: affiliateResult, error: affiliateError } = await supabase.functions.invoke('attribute-affiliate-sale', {
            body: { order_id: orderId }
          });
          if (affiliateError) {
            console.error('[WEBHOOK] Failed to attribute affiliate sale:', orderId, affiliateError);
          } else if (affiliateResult?.attributed) {
            console.log('[WEBHOOK] Affiliate sale attributed:', orderId);
          }
        } catch (err: any) {
          console.error('[WEBHOOK] Exception attributing affiliate:', err);
        }
      }

      // Get user email for provisioning
      let emailForProvisioning = user_email;
      if (!emailForProvisioning) {
        const { data: userData } = await supabase.auth.admin.getUserById(user_id);
        emailForProvisioning = userData?.user?.email;
      }

      if (!emailForProvisioning) {
        console.error('[WEBHOOK] No email for provisioning (payment_intent.succeeded)');
        await supabase.from('orders').update({ status: 'failed' }).in('id', orderIds);
        return new Response(JSON.stringify({ error: "No email for provisioning" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Provision eSIMs with retry
      const withRetryPI = async (fn: () => Promise<any>, orderId: string, maxRetries = 3) => {
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

      for (const orderId of orderIds) {
        const { data: order } = await supabase
          .from('orders')
          .select('package_id, order_id, webhook_data')
          .eq('id', orderId)
          .single();

        if (!order) { failCount++; continue; }

        try {
          const { data: integrationData, error: integrationError } = await withRetryPI(
            () => supabase.functions.invoke('provision-esim', {
              body: { packageId: order.package_id, orderId, userEmail: emailForProvisioning }
            }),
            orderId
          );

          if (integrationError || integrationData?.success === false) {
            console.error(`[WEBHOOK] Provisioning failed for ${orderId}:`, integrationError || integrationData);
            await supabase.from('orders').update({
              status: 'needs_attention',
              webhook_data: { ...(order.webhook_data || {}), provisioning_error: integrationError?.message || integrationData?.message || 'Unknown error', failed_at: new Date().toISOString(), payment_completed: true }
            }).eq('id', orderId);
            
            try {
              await supabase.functions.invoke('send-admin-notification', {
                body: { action_type: 'order_provisioning_failed', entity_type: 'order', entity_id: orderId, admin_email: 'system@mobile11.io', admin_name: 'System', details: 'Direct 3DS payment succeeded but provisioning failed after retries.', metadata: { order_id: orderId, parent_order_id: resolvedParentOrderId, user_email: emailForProvisioning } }
              });
            } catch (notifyErr) { console.error('[WEBHOOK] Notify error:', notifyErr); }
            failCount++;
          } else {
            console.log(`[WEBHOOK] eSIM provisioned for ${orderId} via ${integrationData?.provider || 'provider'}`);
            successCount++;
          }
        } catch (err: any) {
          console.error(`[WEBHOOK] Exception provisioning ${orderId}:`, err);
          await supabase.from('orders').update({ status: 'needs_attention', webhook_data: { ...(order.webhook_data || {}), provisioning_error: String(err), failed_at: new Date().toISOString(), payment_completed: true } }).eq('id', orderId);
          failCount++;
        }
      }

      // Promo code usage
      for (const orderId of orderIds) {
        try {
          const { data: orderData } = await supabase.from('orders').select('promo_code_id, user_id, discount_amount').eq('id', orderId).single();
          if (orderData?.promo_code_id) {
            await supabase.from('promo_code_usage').insert({ promo_code_id: orderData.promo_code_id, order_id: orderId, user_id: orderData.user_id, discount_applied: orderData.discount_amount || 0 });
            await supabase.rpc('increment_promo_code_usage', { promo_id: orderData.promo_code_id });
          }
        } catch (err: any) { console.error('[WEBHOOK] Promo error:', err); }
      }

      // Mobile11 Money deduction
      const USD_TO_THB_RATE = 35;
      for (const orderId of orderIds) {
        try {
          const { data: orderData } = await supabase.from('orders').select('mobile11_money_applied, user_id, currency').eq('id', orderId).single();
          if (orderData?.mobile11_money_applied && orderData.mobile11_money_applied > 0) {
            const amountThb = orderData.currency === 'USD' ? orderData.mobile11_money_applied * USD_TO_THB_RATE : orderData.mobile11_money_applied;
            await supabase.functions.invoke('deduct-mobile11-money', { body: { user_id: orderData.user_id, order_id: orderId, amount_thb: amountThb } });
          }
        } catch (err: any) { console.error('[WEBHOOK] Mobile11 Money error:', err); }
      }

      // Loyalty cashback
      for (const orderId of orderIds) {
        try { await supabase.functions.invoke('calculate-loyalty-cashback', { body: { order_id: orderId } }); } catch (err: any) { console.error('[WEBHOOK] Cashback error:', err); }
      }

      // Referral rewards
      for (const orderId of orderIds) {
        try {
          const { data: refOrder } = await supabase.from('orders').select('webhook_data').eq('id', orderId).single();
          if ((refOrder?.webhook_data as any)?.is_referral_order) {
            await supabase.functions.invoke('process-referral-reward', { body: { order_id: orderId } });
          }
        } catch (err: any) { console.error('[WEBHOOK] Referral error:', err); }
      }

      console.log(`[WEBHOOK] payment_intent.succeeded complete: ${successCount} success, ${failCount} failed`);
      return new Response(JSON.stringify({ received: true, success: true, successCount, failCount }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For other event types, just acknowledge receipt
    console.log('[WEBHOOK] Received event type:', event.type, '- acknowledging');
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('[WEBHOOK ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
