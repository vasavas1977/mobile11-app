import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to create JWT for 2C2P
async function createJwt(payload: object, secretKey: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  
  const base64UrlEncode = (data: string) => {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;
  
  // Use secret key as UTF-8 string (2C2P expects hex string used directly)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const dataBytes = encoder.encode(dataToSign);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-2C2P-PROMPTPAY] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get 2C2P credentials
    const merchantId = Deno.env.get("2C2P_MERCHANT_ID");
    const secretKey = Deno.env.get("2C2P_SECRET_KEY");
    
    if (!merchantId || !secretKey) {
      throw new Error("2C2P credentials not configured");
    }
    logStep("2C2P credentials verified", { secretKeyLength: secretKey.length });

    // Use SERVICE_ROLE_KEY to bypass RLS and query newly created orders
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    const { orderIds, parentOrderId, items, totalAmountTHB, environment } = body;
    
    if (!orderIds || !parentOrderId || !totalAmountTHB) {
      throw new Error("Missing required fields: orderIds, parentOrderId, totalAmountTHB");
    }
    logStep("Request parsed", { orderIds, parentOrderId, totalAmountTHB, itemCount: items?.length });

    // Verify orders belong to user
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, user_id, total_amount, package_id')
      .in('id', orderIds);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) throw new Error("Orders not found");

    // Verify ownership
    for (const order of orders) {
      if (order.user_id !== user.id) {
        throw new Error("Unauthorized: Order does not belong to user");
      }
    }
    logStep("Orders verified", { orderCount: orders.length });

    // Get origin for return URLs (normalize to strip any path from FRONTEND_URL)
    const rawFrontendUrl = Deno.env.get("FRONTEND_URL") || req.headers.get("origin") || "https://mobile11.com";
    const origin = (() => {
      try { return new URL(rawFrontendUrl).origin; }
      catch { return "https://mobile11.com"; }
    })();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

    // Create short invoice number for 2C2P (max 20 alphanumeric for QR payments)
    const shortInvoiceNo = parentOrderId.replace(/[^A-Z0-9]/gi, '').slice(-20);
    logStep("Short invoice number", { original: parentOrderId, short: shortInvoiceNo, length: shortInvoiceNo.length });

    // Build 2C2P payment token payload - Redirect API approach
    // No paymentChannel specified = 2C2P shows all available payment methods
    const paymentPayload = {
      merchantID: merchantId,
      invoiceNo: shortInvoiceNo,
      description: `Mobile11 eSIM - ${orders.length} package(s)`,
      amount: parseFloat(totalAmountTHB.toFixed(2)),
      currencyCode: "THB",
      frontendReturnUrl: `${origin}/payment-success?parent_order_id=${parentOrderId}&method=2c2p`,
      backendReturnUrl: `${supabaseUrl}/functions/v1/payment-2c2p-webhook`,
      locale: "en",
    };
    
    logStep("Full payment payload", paymentPayload);
    logStep("Payment payload summary", {
      invoiceNo: paymentPayload.invoiceNo,
      amount: paymentPayload.amount,
      currencyCode: paymentPayload.currencyCode,
      frontendReturnUrl: paymentPayload.frontendReturnUrl
    });

    // Create JWT token
    const jwt = await createJwt(paymentPayload, secretKey);
    logStep("JWT token created", { jwtLength: jwt.length });

    // Call 2C2P Payment Token API
    const apiUrl = "https://pgw.2c2p.com/payment/4.3/paymentToken";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: jwt }),
    });

    // Get raw response text first for better error logging
    const responseText = await response.text();
    logStep("2C2P raw response", { status: response.status, body: responseText.substring(0, 500) });

    if (!response.ok) {
      logStep("2C2P API error", { status: response.status, error: responseText });
      throw new Error(`2C2P API error: ${response.status} - ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e: any) {
      throw new Error(`2C2P returned invalid JSON: ${responseText}`);
    }
    
    logStep("2C2P API response parsed", { hasPayload: !!responseData.payload });

    // Decode response JWT to get webPaymentUrl
    if (!responseData.payload) {
      throw new Error(`No payload in 2C2P response. Raw response: ${responseText}`);
    }

    // Decode the response JWT (we just need to read it, not verify)
    const [, payloadPart] = responseData.payload.split('.');
    const decodedPayload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
    
    logStep("2C2P response decoded", { 
      respCode: decodedPayload.respCode,
      respDesc: decodedPayload.respDesc,
      hasWebPaymentUrl: !!decodedPayload.webPaymentUrl
    });

    if (decodedPayload.respCode !== "0000") {
      throw new Error(`2C2P Error: ${decodedPayload.respDesc || decodedPayload.respCode}`);
    }

    if (!decodedPayload.webPaymentUrl) {
      throw new Error("No webPaymentUrl in 2C2P response");
    }

    // Update orders with payment gateway info
    await supabaseClient
      .from('payments')
      .update({ 
        payment_gateway: '2c2p',
        payment_method: 'redirect' // Multi-payment method via redirect
      })
      .in('order_id', orderIds);

    logStep("Payment records updated");

    return new Response(
      JSON.stringify({ 
        webPaymentUrl: decodedPayload.webPaymentUrl,
        paymentToken: decodedPayload.paymentToken
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
