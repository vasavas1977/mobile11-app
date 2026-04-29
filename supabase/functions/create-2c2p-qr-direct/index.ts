import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function createJwt(payload: object, secretKey: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const base64UrlEncode = (data: string) =>
    btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToSign));
  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

function decodeJwtPayload(jwt: string): any {
  const [, payloadPart] = jwt.split('.');
  return JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
}

const log = (step: string, details?: any) => {
  console.log(`[CREATE-2C2P-QR-DIRECT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const merchantId = Deno.env.get("2C2P_MERCHANT_ID");
    const secretKey = Deno.env.get("2C2P_SECRET_KEY");
    if (!merchantId || !secretKey) throw new Error("2C2P credentials not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    log("User authenticated", { userId: user.id });

    const body = await req.json();
    const { orderIds, parentOrderId, items, totalAmountTHB, environment } = body;
    if (!orderIds || !parentOrderId || !totalAmountTHB) {
      throw new Error("Missing required fields: orderIds, parentOrderId, totalAmountTHB");
    }
    log("Request parsed", { parentOrderId, totalAmountTHB, itemCount: items?.length });

    // Verify orders belong to user
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, user_id, total_amount, package_id')
      .in('id', orderIds);
    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) throw new Error("Orders not found");
    for (const order of orders) {
      if (order.user_id !== user.id) throw new Error("Unauthorized: Order does not belong to user");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const rawFrontendUrl = Deno.env.get("FRONTEND_URL") || req.headers.get("origin") || "https://mobile11.com";
    const origin = (() => { try { return new URL(rawFrontendUrl).origin; } catch { return "https://mobile11.com"; } })();

    const shortInvoiceNo = parentOrderId.replace(/[^A-Z0-9]/gi, '').slice(-20);
    log("Invoice", { short: shortInvoiceNo });

    // Step 1: Get Payment Token (request QR category, then use PromptPay channel in Do Payment)
    const tokenPayload = {
      merchantID: merchantId,
      invoiceNo: shortInvoiceNo,
      description: `Mobile11 eSIM - ${orders.length} package(s)`,
      amount: parseFloat(totalAmountTHB.toFixed(2)),
      currencyCode: "THB",
      paymentChannel: ["QR"],
      frontendReturnUrl: `${origin}/payment-success?parent_order_id=${parentOrderId}&method=2c2p`,
      backendReturnUrl: `${supabaseUrl}/functions/v1/payment-2c2p-webhook`,
      locale: "en",
    };

    log("Step 1: Requesting payment token", { amount: tokenPayload.amount });
    const tokenJwt = await createJwt(tokenPayload, secretKey);

    const tokenResponse = await fetch("https://pgw.2c2p.com/payment/4.3/paymentToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: tokenJwt }),
    });

    const tokenText = await tokenResponse.text();
    if (!tokenResponse.ok) throw new Error(`2C2P Token API error: ${tokenResponse.status} - ${tokenText}`);

    let tokenData;
    try { tokenData = JSON.parse(tokenText); } catch { throw new Error(`Invalid JSON from token API: ${tokenText}`); }
    if (!tokenData.payload) throw new Error(`No payload in token response`);

    const tokenDecoded = decodeJwtPayload(tokenData.payload);
    log("Step 1 response", { respCode: tokenDecoded.respCode, respDesc: tokenDecoded.respDesc });

    if (tokenDecoded.respCode !== "0000") {
      throw new Error(`2C2P Token Error: ${tokenDecoded.respDesc || tokenDecoded.respCode}`);
    }

    const paymentToken = tokenDecoded.paymentToken;
    if (!paymentToken) throw new Error("No paymentToken in response");

    // Step 2: Do Payment with PromptPay QR channel
    const doPaymentPayload = {
      paymentToken: paymentToken,
      payment: {
        code: { channelCode: "PPQR" },
        data: { qrType: "URL" }
      }
    };

    log("Step 2: Calling Do Payment API", {
      channelCode: doPaymentPayload.payment.code.channelCode,
      qrType: doPaymentPayload.payment.data.qrType,
      hasPaymentToken: !!doPaymentPayload.paymentToken,
    });

    const doPaymentResponse = await fetch("https://pgw.2c2p.com/payment/4.3/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doPaymentPayload),
    });

    const doPaymentText = await doPaymentResponse.text();
    log("Step 2 raw response", { status: doPaymentResponse.status, body: doPaymentText.substring(0, 1000) });

    if (!doPaymentResponse.ok) {
      log("Do Payment API HTTP error", { status: doPaymentResponse.status });
      return new Response(
        JSON.stringify({ fallback: true, error: `Do Payment API error: ${doPaymentResponse.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let doPaymentData;
    try { doPaymentData = JSON.parse(doPaymentText); } catch {
      return new Response(
        JSON.stringify({ fallback: true, error: "Invalid JSON from Do Payment API" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Handle both JWT-wrapped ({ payload: "jwt" }) and direct JSON response formats
    let doPaymentDecoded;
    if (doPaymentData.payload && typeof doPaymentData.payload === 'string') {
      doPaymentDecoded = decodeJwtPayload(doPaymentData.payload);
      log("Step 2 decoded from JWT", { respCode: doPaymentDecoded.respCode });
    } else if (doPaymentData.respCode) {
      doPaymentDecoded = doPaymentData;
      log("Step 2 direct JSON response", { respCode: doPaymentDecoded.respCode });
    } else {
      log("Step 2 unknown response format", { keys: Object.keys(doPaymentData) });
      return new Response(
        JSON.stringify({ fallback: true, error: "Unknown Do Payment response format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    log("Step 2 parsed", {
      respCode: doPaymentDecoded.respCode,
      respDesc: doPaymentDecoded.respDesc,
      type: doPaymentDecoded.type,
      hasData: !!doPaymentDecoded.data,
      channelCode: doPaymentDecoded.channelCode,
    });

    if (doPaymentDecoded.respCode !== "1005" && doPaymentDecoded.respCode !== "0000") {
      log("Unexpected respCode, falling back", { respCode: doPaymentDecoded.respCode });
      return new Response(
        JSON.stringify({ fallback: true, error: `2C2P QR Error: ${doPaymentDecoded.respDesc || doPaymentDecoded.respCode}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const qrImageUrl = doPaymentDecoded.data;
    if (!qrImageUrl || doPaymentDecoded.type !== "URL") {
      log("No QR URL in response, falling back", { type: doPaymentDecoded.type, data: doPaymentDecoded.data?.substring?.(0, 100) });
      return new Response(
        JSON.stringify({ fallback: true, error: "No QR image URL in response" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update payments table
    await supabaseClient
      .from('payments')
      .update({
        payment_gateway: '2c2p',
        payment_method: 'promptpay_direct'
      })
      .in('order_id', orderIds);

    log("Success", { qrImageUrl: qrImageUrl.substring(0, 80) });

    return new Response(
      JSON.stringify({
        qrImageUrl,
        paymentToken,
        invoiceNo: shortInvoiceNo,
        expiryTimer: 900, // 15 minutes in seconds
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ fallback: true, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
