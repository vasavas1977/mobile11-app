import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[2C2P-WEBHOOK] ${step}${detailsStr}`);
};

// Decode JWT payload (without verification - we trust 2C2P's direct callback)
function decodeJwtPayload(jwt: string): any {
  try {
    const [, payloadPart] = jwt.split('.');
    const decoded = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e: any) {
    throw new Error("Invalid JWT format");
  }
}

// Find orders by matching the shortened invoice number back to parent_order_id
// The shortInvoiceNo was created by: parentOrderId.replace(/[^A-Z0-9]/gi, '').slice(-20)
// Example: ORD-1764923399312-9E8BBDVA7 -> 649233993129E8BBDVA7
async function findOrdersByInvoice(supabaseClient: any, invoiceNo: string, paymentData?: any) {
  logStep("Finding orders by invoice", { invoiceNo, length: invoiceNo.length, hasUserDefined1: !!paymentData?.userDefined1 });
  
  // Strategy 0: Check userDefined1 which contains the order UUID for extension orders
  if (paymentData?.userDefined1) {
    const orderId = paymentData.userDefined1;
    logStep("Trying userDefined1 order ID match", { orderId });
    
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id, order_id')
      .eq('id', orderId)
      .maybeSingle();
    
    if (!error && order) {
      // Get all orders with same parent_order_id if it exists
      if (order.parent_order_id) {
        const { data: siblingOrders } = await supabaseClient
          .from('orders')
          .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id')
          .eq('parent_order_id', order.parent_order_id);
        
        if (siblingOrders && siblingOrders.length > 0) {
          logStep("Found orders by userDefined1 match", { count: siblingOrders.length, parentOrderId: order.parent_order_id });
          return { orders: siblingOrders, parentOrderId: order.parent_order_id };
        }
      }
      
      // If no parent_order_id or no siblings, return just this order
      logStep("Found single order by userDefined1", { orderId });
      return { orders: [order], parentOrderId: order.parent_order_id || order.id };
    }
  }
  
  // Strategy 1: Try exact match on parent_order_id (in case it wasn't shortened)
  let { data: orders, error } = await supabaseClient
    .from('orders')
    .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id')
    .eq('parent_order_id', invoiceNo);
  
  if (!error && orders && orders.length > 0) {
    logStep("Found orders by exact match", { count: orders.length });
    return { orders, parentOrderId: invoiceNo };
  }
  
  // Strategy 2: The invoice is shortened - extract suffix pattern for matching
  // Take the last 15 chars which should be unique enough to match
  const suffix = invoiceNo.slice(-15);
  logStep("Trying suffix match", { suffix });
  
  // Use ilike to find parent_order_id containing the suffix pattern
  const { data: matchedOrders, error: matchError } = await supabaseClient
    .from('orders')
    .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id')
    .ilike('parent_order_id', `%${suffix}%`);
  
  if (matchError) {
    logStep("Suffix match error", { error: matchError });
    throw matchError;
  }
  
  if (matchedOrders && matchedOrders.length > 0) {
    const parentOrderId = matchedOrders[0].parent_order_id;
    logStep("Found orders by suffix match", { count: matchedOrders.length, parentOrderId });
    return { orders: matchedOrders, parentOrderId };
  }
  
  // Strategy 3: Try matching with alphanumeric-only version
  // Search for any orders where cleaned parent_order_id ends with invoiceNo
  const { data: allRecentOrders, error: recentError } = await supabaseClient
    .from('orders')
    .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('created_at', { ascending: false });
  
  if (!recentError && allRecentOrders) {
    for (const order of allRecentOrders) {
      const cleanedParentId = order.parent_order_id?.replace(/[^A-Z0-9]/gi, '') || '';
      if (cleanedParentId.endsWith(invoiceNo) || cleanedParentId.includes(invoiceNo.slice(-10))) {
        // Found matching order, now get all orders with same parent_order_id
        const { data: siblingOrders } = await supabaseClient
          .from('orders')
          .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id')
          .eq('parent_order_id', order.parent_order_id);
        
        if (siblingOrders && siblingOrders.length > 0) {
          logStep("Found orders by cleaned ID match", { count: siblingOrders.length, parentOrderId: order.parent_order_id });
          return { orders: siblingOrders, parentOrderId: order.parent_order_id };
        }
      }
    }
  }
  
  // Strategy 4: Try matching order_id field directly (for extension orders)
  // Extension orders have order_id like "EXT-abc123..." which becomes invoiceNo
  logStep("Trying order_id field match");
  const { data: ordersByOrderIdField, error: orderIdError } = await supabaseClient
    .from('orders')
    .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id, order_id')
    .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (!orderIdError && ordersByOrderIdField) {
    for (const order of ordersByOrderIdField) {
      // Clean order_id same way as invoiceNo was created - use substring(0, 20) to match invoice generation
      const cleanedOrderId = order.order_id?.replace(/[^A-Z0-9]/gi, '').substring(0, 20) || '';
      if (cleanedOrderId === invoiceNo || cleanedOrderId.startsWith(invoiceNo.slice(0, 15))) {
        logStep("Found order by order_id field match", { 
          orderId: order.id, 
          orderIdField: order.order_id, 
          cleanedOrderId,
          invoiceNo
        });
        
        // Get all orders with same parent_order_id if exists
        if (order.parent_order_id) {
          const { data: siblingOrders } = await supabaseClient
            .from('orders')
            .select('id, user_id, package_id, total_amount, promo_code_id, affiliate_id, parent_order_id')
            .eq('parent_order_id', order.parent_order_id);
          
          if (siblingOrders && siblingOrders.length > 0) {
            return { orders: siblingOrders, parentOrderId: order.parent_order_id };
          }
        }
        
        return { orders: [order], parentOrderId: order.parent_order_id || order.id };
      }
    }
  }
  
  logStep("No orders found with any strategy");
  return { orders: [], parentOrderId: null };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received", { method: req.method });

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const body = await req.json();
    logStep("Request body received", { hasPayload: !!body.payload });

    if (!body.payload) {
      throw new Error("No payload in webhook request");
    }

    // Decode the JWT payload
    const paymentData = decodeJwtPayload(body.payload);
    logStep("Payment data decoded", {
      invoiceNo: paymentData.invoiceNo,
      respCode: paymentData.respCode,
      respDesc: paymentData.respDesc,
      amount: paymentData.amount,
      tranRef: paymentData.tranRef,
      userDefined1: paymentData.userDefined1 || 'not set',
      userDefined3: paymentData.userDefined3 || 'not set'
    });

    const { invoiceNo, respCode, respDesc, tranRef, amount } = paymentData;

    if (!invoiceNo) {
      throw new Error("No invoiceNo in payment data");
    }

    // Find orders using multiple matching strategies (pass full paymentData for userDefined fields)
    const { orders, parentOrderId } = await findOrdersByInvoice(supabaseClient, invoiceNo, paymentData);
    
    if (!orders || orders.length === 0) {
      throw new Error(`No orders found for invoiceNo: ${invoiceNo}`);
    }
    
    logStep("Orders found", { 
      count: orders.length, 
      orderIds: orders.map((o: any) => o.id),
      parentOrderId 
    });

    // Check response code
    // 0000 = Payment successful
    // 2000 = Payment pending (for some banking methods)
    const isSuccess = respCode === "0000";
    const isPending = respCode === "2000";

    if (!isSuccess && !isPending) {
      logStep("Payment failed or cancelled", { respCode, respDesc });
      
      // Update ONLY the specific order that failed, not all sibling orders
      // This prevents a single failed callback from marking unrelated extension orders as failed
      const specificOrderId = paymentData.userDefined1;
      
      if (specificOrderId) {
        // Extension order: only update the specific order referenced in the callback
        logStep("Updating specific order to failed", { specificOrderId });
        await supabaseClient
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', specificOrderId);
        
        await supabaseClient
          .from('payments')
          .update({ 
            status: 'failed',
            payment_reference: tranRef || null
          })
          .eq('order_id', specificOrderId);
      } else {
        // Non-extension order: fall back to parent_order_id matching
        logStep("Updating orders by parent_order_id to failed", { parentOrderId });
        await supabaseClient
          .from('orders')
          .update({ status: 'failed' })
          .eq('parent_order_id', parentOrderId);

        const orderIds = orders.map((o: any) => o.id);
        await supabaseClient
          .from('payments')
          .update({ 
            status: 'failed',
            payment_reference: tranRef || null
          })
          .in('order_id', orderIds);
      }

      return new Response(
        JSON.stringify({ status: "failed", message: respDesc }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Payment successful, processing orders");

    // Update orders to processing status
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({ status: 'processing', payment_completed_at: new Date().toISOString() })
      .eq('parent_order_id', parentOrderId);

    if (updateOrderError) {
      logStep("Error updating orders", { error: updateOrderError });
      throw updateOrderError;
    }
    logStep("Orders updated to processing");

    // Check if this is an extension order (userDefined3 = 'extension')
    const isExtension = paymentData.userDefined3 === 'extension';

    if (isExtension) {
      logStep("Processing extension order", { orderId: paymentData.userDefined1 });
      
      const extensionOrderId = paymentData.userDefined1;
      
      // Get extension order with original order reference
      const { data: extensionOrder, error: extOrderError } = await supabaseClient
        .from('orders')
        .select('*, esim_packages(*)')
        .eq('id', extensionOrderId)
        .single();
      
      if (extOrderError || !extensionOrder) {
        logStep("Extension order not found", { extensionOrderId });
        throw new Error("Extension order not found");
      }
      
      // Get original order ID from webhook_data
      const originalOrderId = (extensionOrder.webhook_data as any)?.originalOrderId;
      if (!originalOrderId) {
        logStep("Original order ID not found in extension order");
        throw new Error("Original order reference missing");
      }
      
      // Get original order with provider info
      const { data: originalOrder } = await supabaseClient
        .from('orders')
        .select('*, esim_packages(*, esim_providers(provider_code))')
        .eq('id', originalOrderId)
        .single();
      
      if (!originalOrder) {
        logStep("Original order not found");
        throw new Error("Cannot process extension: original order not found");
      }

      // Detect provider for routing
      const providerCode = (originalOrder.esim_packages as any)?.esim_providers?.provider_code;
      logStep("Extension provider detected", { providerCode });

      if (providerCode === 'tuge') {
        // TUGE recharge: route through provision-esim (TUGE links recharge to existing ICCID internally)
        logStep("Routing TUGE extension through provision-esim");
        
        // Get user email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('user_id', extensionOrder.user_id)
          .single();

        const { data: provisionResult, error: provisionError } = await supabaseClient.functions.invoke('provision-esim', {
          body: {
            packageId: extensionOrder.package_id,
            orderId: extensionOrderId,
            userEmail: profile?.email
          }
        });

        if (provisionError || provisionResult?.success === false) {
          logStep("TUGE extension provisioning failed", { error: provisionError || provisionResult });
          await supabaseClient.from('orders').update({ 
            status: 'needs_attention',
            webhook_data: {
              ...(extensionOrder.webhook_data as any),
              provisioning_error: provisionError?.message || provisionResult?.message || 'TUGE recharge failed',
              failed_at: new Date().toISOString(),
              payment_completed: true
            }
          }).eq('id', extensionOrderId);
        } else {
          logStep("TUGE extension provisioned successfully", { result: provisionResult });
        }

        // Handle promo code for extension
        if (extensionOrder.promo_code_id) {
          await supabaseClient.from('promo_code_usage').insert({
            promo_code_id: extensionOrder.promo_code_id,
            order_id: extensionOrderId,
            user_id: extensionOrder.user_id,
            discount_applied: extensionOrder.discount_amount || 0
          });
          await supabaseClient.rpc('increment_promo_code_usage', { promo_id: extensionOrder.promo_code_id });
        }

        // Deduct Mobile11 Money if used
        if (extensionOrder.mobile11_money_applied && extensionOrder.mobile11_money_applied > 0) {
          const USD_TO_THB_RATE = 35;
          const amountThb = extensionOrder.currency === 'USD' 
            ? extensionOrder.mobile11_money_applied * USD_TO_THB_RATE 
            : extensionOrder.mobile11_money_applied;
          try {
            await supabaseClient.functions.invoke('deduct-mobile11-money', {
              body: { user_id: extensionOrder.user_id, order_id: extensionOrderId, amount_thb: amountThb }
            });
          } catch (err: any) {
            logStep("Failed to deduct Mobile11 Money", { error: String(err) });
          }
        }

        // Calculate cashback
        try {
          await supabaseClient.functions.invoke('calculate-loyalty-cashback', { body: { order_id: extensionOrderId } });
        } catch (err: any) {
          logStep("Failed to calculate cashback", { error: String(err) });
        }

        return new Response(JSON.stringify({ status: "success", message: "TUGE extension initiated" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
        });
      }

      // USIMSA extension flow (existing logic)
      if (!originalOrder?.webhook_data || !(originalOrder.webhook_data as any)?.topupId) {
        logStep("Original order or topupId not found");
        throw new Error("Cannot process extension: original order data missing");
      }
      
      // Call USIMSA extend API
      const usimSAAccessKey = Deno.env.get('USIMSA_PROD_ACCESS_KEY');
      const usimSASecretKey = Deno.env.get('USIMSA_PROD_SECRET_KEY');
      const usimSABaseUrl = Deno.env.get('USIMSA_PROD_BASE_URL');
      
      // Create HMAC signature
      const timestampMs = Date.now().toString();
      const method = 'POST';
      const pathAndQuery = '/api/v2/extend';
      
      const stringToSign = `${method} ${pathAndQuery}\n${timestampMs}\n${usimSAAccessKey}`;
      const encoder = new TextEncoder();
      const messageData = encoder.encode(stringToSign);
      const keyData = Uint8Array.from(atob(usimSASecretKey!), c => c.charCodeAt(0));
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
      
      const baseRoot = usimSABaseUrl!.replace(/\/+$/, '');
      const extensionPayload = {
        topupId: (originalOrder.webhook_data as any).topupId,
        optionId: (extensionOrder.esim_packages as any).package_id
      };
      
      logStep("Calling USIMSA extend API", extensionPayload);
      
      const usimSAResponse = await fetch(`${baseRoot}${pathAndQuery}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-gat-access-key': usimSAAccessKey!,
          'x-gat-timestamp': timestampMs,
          'x-gat-signature': signatureBase64,
        },
        body: JSON.stringify(extensionPayload)
      });
      
      const text = await usimSAResponse.text();
      let usimSAResult: any = null;
      try { usimSAResult = text ? JSON.parse(text) : null; } catch { usimSAResult = null; }
      
      logStep("USIMSA extend response", usimSAResult);
      
      const code = usimSAResult?.code;
      const isOkCode = code === undefined || code === null || code === '0' || code === 0 || code === '0000';
      
      if (!usimSAResponse.ok || !usimSAResult || !isOkCode) {
        logStep("USIMSA extend failed", { code, message: usimSAResult?.message });
        await supabaseClient.from('orders').update({ status: 'failed' }).eq('id', extensionOrderId);
        throw new Error(`USIMSA extend failed: ${usimSAResult?.message || 'Unknown error'}`);
      }
      
      // Check for Pattern B (new ICCID returned)
      const returnedIccid = usimSAResult.iccid || usimSAResult.data?.iccid;
      const originalIccid = originalOrder.iccid;
      const isNewEsim = returnedIccid && originalIccid && returnedIccid !== originalIccid;
      
      if (isNewEsim) {
        logStep("USIMSA created new eSIM instead of extending", { originalIccid, newIccid: returnedIccid });
        
        await supabaseClient.from('orders').update({
          status: 'completed',
          iccid: returnedIccid,
          msisdn: usimSAResult.msisdn || null,
          qr_code: usimSAResult.qrcodeImgUrl || null,
          smdp_address: usimSAResult.smdpAddress || null,
          activation_code: usimSAResult.activateCode || null,
          download_link: usimSAResult.downloadLink || null,
          expiry_date: usimSAResult.expiredDate ? new Date(usimSAResult.expiredDate).toISOString() : null,
          webhook_data: { ...(extensionOrder.webhook_data as any), ...usimSAResult, isNewEsim: true, originalIccid }
        }).eq('id', extensionOrderId);
        
        if (extensionOrder.promo_code_id) {
          await supabaseClient.from('promo_code_usage').insert({
            promo_code_id: extensionOrder.promo_code_id,
            order_id: extensionOrderId,
            user_id: extensionOrder.user_id,
            discount_applied: extensionOrder.discount_amount || 0
          });
          await supabaseClient.rpc('increment_promo_code_usage', { promo_id: extensionOrder.promo_code_id });
        }
        
        try {
          await supabaseClient.functions.invoke('calculate-loyalty-cashback', { body: { order_id: extensionOrderId } });
        } catch (err: any) {
          logStep("Failed to calculate cashback", { error: String(err) });
        }
        
        return new Response(JSON.stringify({ status: "success", isNewEsim: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
        });
      }
      
      // True extension - same ICCID maintained
      await supabaseClient.from('orders').update({
        status: 'completed',
        iccid: originalOrder.iccid,
        msisdn: originalOrder.msisdn,
        qr_code: originalOrder.qr_code,
        smdp_address: originalOrder.smdp_address,
        activation_code: originalOrder.activation_code,
        download_link: originalOrder.download_link,
        expiry_date: usimSAResult.expiredDate ? new Date(usimSAResult.expiredDate).toISOString() : null,
        webhook_data: { ...(extensionOrder.webhook_data as any), ...usimSAResult, completedAt: new Date().toISOString() }
      }).eq('id', extensionOrderId);
      
      logStep("Extension completed successfully", { extensionOrderId });
      
      // Handle promo code for extension
      if (extensionOrder.promo_code_id) {
        await supabaseClient.from('promo_code_usage').insert({
          promo_code_id: extensionOrder.promo_code_id,
          order_id: extensionOrderId,
          user_id: extensionOrder.user_id,
          discount_applied: extensionOrder.discount_amount || 0
        });
        await supabaseClient.rpc('increment_promo_code_usage', { promo_id: extensionOrder.promo_code_id });
      }
      
      // Deduct Mobile11 Money if used
      if (extensionOrder.mobile11_money_applied && extensionOrder.mobile11_money_applied > 0) {
        const USD_TO_THB_RATE = 35;
        const amountThb = extensionOrder.currency === 'USD' 
          ? extensionOrder.mobile11_money_applied * USD_TO_THB_RATE 
          : extensionOrder.mobile11_money_applied;
        try {
          await supabaseClient.functions.invoke('deduct-mobile11-money', {
            body: { user_id: extensionOrder.user_id, order_id: extensionOrderId, amount_thb: amountThb }
          });
        } catch (err: any) {
          logStep("Failed to deduct Mobile11 Money", { error: String(err) });
        }
      }
      
      // Calculate cashback for extension
      try {
        await supabaseClient.functions.invoke('calculate-loyalty-cashback', { body: { order_id: extensionOrderId } });
      } catch (err: any) {
        logStep("Failed to calculate cashback", { error: String(err) });
      }
      
      return new Response(JSON.stringify({ status: "success", message: "Extension completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
      });
    }

    // Update payment records
    const orderIds = orders.map((o: any) => o.id);
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        status: 'completed',
        payment_reference: tranRef || null,
        payment_intent_id: tranRef || null
      })
      .in('order_id', orderIds);

    if (paymentError) {
      logStep("Error updating payments", { error: paymentError });
    } else {
      logStep("Payments updated to completed");
    }

    // Handle promo code usage (only once per transaction)
    const promoCodeId = orders[0]?.promo_code_id;
    if (promoCodeId) {
      logStep("Recording promo code usage", { promoCodeId });
      
      // Calculate total discount
      const totalDiscount = orders.reduce((sum: number, o: any) => {
        return sum + (o.total_amount || 0);
      }, 0);

      await supabaseClient
        .from('promo_code_usage')
        .insert({
          promo_code_id: promoCodeId,
          order_id: orders[0].id,
          user_id: orders[0].user_id,
          discount_applied: totalDiscount
        });

      await supabaseClient.rpc('increment_promo_code_usage', { promo_id: promoCodeId });
    }

    // Get user email for eSIM provisioning
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('user_id', orders[0].user_id)
      .single();

    if (profileError || !profile?.email) {
      logStep("Error fetching user profile", { error: profileError });
    }

    const userEmail = profile?.email;

    // Helper function: retry provisioning with exponential backoff
    const withRetry = async (fn: () => Promise<any>, orderId: string, maxRetries = 3) => {
      let lastError: any;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await fn();
          // Check if the response indicates success
          if (result.data?.success !== false) {
            return result;
          }
          lastError = result.data;
          logStep(`Retry attempt ${attempt + 1}/${maxRetries} failed for order`, { orderId, error: result.data });
        } catch (e: any) {
          lastError = e;
          logStep(`Retry attempt ${attempt + 1}/${maxRetries} exception for order`, { orderId, error: String(e) });
        }
        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt);
          logStep(`Waiting ${delay}ms before retry`, { orderId });
          await new Promise(r => setTimeout(r, delay));
        }
      }
      return { data: null, error: lastError };
    };

    // Process each order - provision eSIMs with retry logic
    for (const order of orders) {
      logStep("Processing order for eSIM", { orderId: order.id, packageId: order.package_id });

      try {
        // Call provision-esim router (routes to correct provider: USIMSA or TUGE)
        const { data: provisionData, error: provisionError } = await withRetry(
          () => supabaseClient.functions.invoke('provision-esim', {
            body: {
              orderId: order.id,
              packageId: order.package_id,
              userEmail: userEmail
            }
          }),
          order.id
        );

        if (provisionError || provisionData?.success === false) {
          logStep("Provisioning failed after all retries", { orderId: order.id, error: provisionError || provisionData });
          
          // Mark order as needs_attention instead of failed (payment was successful)
          await supabaseClient
            .from('orders')
            .update({ 
              status: 'needs_attention',
              webhook_data: {
                ...(order.webhook_data || {}),
                provisioning_error: provisionError?.message || provisionData?.message || 'Unknown error',
                provisioning_error_code: provisionData?.code,
                failed_at: new Date().toISOString(),
                payment_completed: true
              }
            })
            .eq('id', order.id);
          
          // Notify admins about the failed provisioning
          try {
            await supabaseClient.functions.invoke('send-admin-notification', {
              body: {
                action_type: 'order_provisioning_failed',
                entity_type: 'order',
                entity_id: order.id,
                admin_email: 'system@mobile11.io',
                admin_name: 'System',
                details: `Payment completed but eSIM provisioning failed after 3 retries. Order requires manual attention.`,
                metadata: {
                  order_id: order.id,
                  parent_order_id: parentOrderId,
                  user_email: userEmail,
                  error: provisionError?.message || provisionData?.message,
                  error_code: provisionData?.code
                }
              }
            });
            logStep("Admin notification sent for failed provisioning", { orderId: order.id });
          } catch (notifyErr) {
            logStep("Failed to send admin notification", { error: String(notifyErr) });
          }
        } else {
          logStep("eSIM provisioning successful", { orderId: order.id, provider: provisionData?.provider });
        }

        // Attribute affiliate sale if applicable
        if (order.affiliate_id) {
          logStep("Attributing affiliate sale", { affiliateId: order.affiliate_id, orderId: order.id });
          
          await supabaseClient.functions.invoke('attribute-affiliate-sale', {
            body: {
              order_id: order.id,
              affiliate_id: order.affiliate_id
            }
          });
        }
      } catch (processingError: any) {
        logStep("Error processing order", { orderId: order.id, error: processingError.message });
        // Mark as needs_attention for manual review
        await supabaseClient
          .from('orders')
          .update({ 
            status: 'needs_attention',
            webhook_data: {
              ...(order.webhook_data || {}),
              provisioning_error: processingError.message,
              failed_at: new Date().toISOString(),
              payment_completed: true
            }
          })
          .eq('id', order.id);
      }
    }

    // Deduct Mobile11 Money if any was used
    const USD_TO_THB_RATE = 35;
    for (const order of orders) {
      try {
        const { data: orderData } = await supabaseClient
          .from('orders')
          .select('mobile11_money_applied, currency')
          .eq('id', order.id)
          .single();
        
        if (orderData?.mobile11_money_applied && orderData.mobile11_money_applied > 0) {
          // Only convert if order currency is USD, otherwise it's already in THB
          const amountThb = orderData.currency === 'USD' 
            ? orderData.mobile11_money_applied * USD_TO_THB_RATE 
            : orderData.mobile11_money_applied;
          
          logStep("Deducting Mobile11 Money", { orderId: order.id, amount: amountThb, currency: orderData.currency });
          await supabaseClient.functions.invoke('deduct-mobile11-money', {
            body: { 
              user_id: order.user_id,
              order_id: order.id,
              amount_thb: amountThb
            }
          });
        }
      } catch (err: any) {
        logStep("Failed to deduct Mobile11 Money", { orderId: order.id, error: String(err) });
        // Continue - deduction failure is not critical
      }
    }

    // Calculate loyalty cashback for each order
    for (const order of orders) {
      try {
        const { data: cashbackResult, error: cashbackError } = await supabaseClient.functions.invoke('calculate-loyalty-cashback', {
          body: { order_id: order.id }
        });
        
        if (cashbackError) {
          logStep("Failed to calculate cashback", { orderId: order.id, error: cashbackError });
        } else if (cashbackResult?.success) {
          logStep("Cashback calculated", { orderId: order.id, amount: cashbackResult.cashback_amount });
        }
      } catch (err: any) {
        logStep("Exception calculating cashback", { orderId: order.id, error: String(err) });
        // Continue - cashback is not critical
      }
    }

    // Process referral rewards for all orders
    for (const order of orders) {
      try {
        const { data: refOrder } = await supabaseClient
          .from('orders')
          .select('webhook_data')
          .eq('id', order.id)
          .single();
        
        if ((refOrder?.webhook_data as any)?.is_referral_order) {
          logStep("Processing referral reward", { orderId: order.id });
          await supabaseClient.functions.invoke('process-referral-reward', {
            body: { order_id: order.id }
          });
        }
      } catch (err: any) {
        logStep("Failed to process referral reward", { orderId: order.id, error: String(err) });
      }
    }

    logStep("Webhook processing complete");

    return new Response(
      JSON.stringify({ status: "success", ordersProcessed: orders.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
