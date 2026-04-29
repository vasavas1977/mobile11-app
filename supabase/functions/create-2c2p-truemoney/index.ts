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
  console.log(`[CREATE-2C2P-TRUEMONEY] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    // Step 1: Get Payment Token with DPAY channel for TrueMoney
    const tokenPayload = {
      merchantID: merchantId,
      invoiceNo: shortInvoiceNo,
      description: `Mobile11 eSIM - ${orders.length} package(s)`,
      amount: parseFloat(totalAmountTHB.toFixed(2)),
      currencyCode: "THB",
      paymentChannel: ["DPAY"],
      frontendReturnUrl: `${origin}/payment-success?parent_order_id=${parentOrderId}&method=2c2p`,
      backendReturnUrl: `${supabaseUrl}/functions/v1/payment-2c2p-webhook`,
      locale: "en",
    };

    log("Step 1: Requesting payment token (DPAY)", { amount: tokenPayload.amount });
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

    // Step 2: Do Payment with TrueMoney channel
    const doPaymentPayload = {
      paymentToken: paymentToken,
      payment: {
        code: { channelCode: "TRUEMONEY" },
      },
    };

    log("Step 2: Calling Do Payment API (TRUEMONEY)", {
      channelCode: "TRUEMONEY",
      hasPaymentToken: !!paymentToken,
    });

    const doPaymentResponse = await fetch("https://pgw.2c2p.com/payment/4.3/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doPaymentPayload),
    });

    const doPaymentText = await doPaymentResponse.text();
    log("Step 2 raw response", { status: doPaymentResponse.status, body: doPaymentText.substring(0, 1000) });

    if (!doPaymentResponse.ok) {
      throw new Error(`Do Payment API error: ${doPaymentResponse.status} - ${doPaymentText}`);
    }

    let doPaymentData;
    try { doPaymentData = JSON.parse(doPaymentText); } catch {
      throw new Error("Invalid JSON from Do Payment API");
    }

    // Handle both JWT-wrapped and direct JSON response formats
    let doPaymentDecoded;
    if (doPaymentData.payload && typeof doPaymentData.payload === 'string') {
      doPaymentDecoded = decodeJwtPayload(doPaymentData.payload);
      log("Step 2 decoded from JWT", { respCode: doPaymentDecoded.respCode });
    } else if (doPaymentData.respCode) {
      doPaymentDecoded = doPaymentData;
      log("Step 2 direct JSON response", { respCode: doPaymentDecoded.respCode });
    } else {
      throw new Error("Unknown Do Payment response format");
    }

    log("Step 2 parsed", {
      respCode: doPaymentDecoded.respCode,
      respDesc: doPaymentDecoded.respDesc,
      type: doPaymentDecoded.type,
      hasData: !!doPaymentDecoded.data,
    });

    // 0000 = success, 1001 = redirect to authenticate (expected for e-wallet), 1005 = redirect required
    const successCodes = ["0000", "1001", "1005"];
    if (!successCodes.includes(doPaymentDecoded.respCode)) {
      throw new Error(`2C2P TrueMoney Error: ${doPaymentDecoded.respDesc || doPaymentDecoded.respCode}`);
    }

    // TrueMoney returns a redirect URL
    const redirectUrl = doPaymentDecoded.data;
    if (!redirectUrl) {
      throw new Error("No redirect URL in TrueMoney response");
    }

    // Update payments table
    await supabaseClient
      .from('payments')
      .update({
        payment_gateway: '2c2p',
        payment_method: 'truemoney',
      })
      .in('order_id', orderIds);

    log("Success", { redirectUrl: redirectUrl.substring(0, 80) });

    return new Response(
      JSON.stringify({
        redirectUrl,
        paymentToken,
        invoiceNo: shortInvoiceNo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
