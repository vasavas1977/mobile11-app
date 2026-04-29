import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("2C2P_SECRET_KEY");
    if (!secretKey) throw new Error("2C2P credentials not configured");

    const { paymentToken } = await req.json();
    if (!paymentToken) throw new Error("Missing paymentToken");

    // Call 2C2P Payment Inquiry API
    const inquiryPayload = { paymentToken };
    const jwt = await createJwt(inquiryPayload, secretKey);

    const response = await fetch("https://pgw.2c2p.com/payment/4.3/paymentInquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: jwt }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return new Response(
        JSON.stringify({ status: 'error', respCode: 'HTTP_ERROR', respDesc: `HTTP ${response.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const responseData = JSON.parse(responseText);
    if (!responseData.payload) {
      return new Response(
        JSON.stringify({ status: 'error', respCode: 'NO_PAYLOAD', respDesc: 'No payload in response' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Decode JWT response
    const [, payloadPart] = responseData.payload.split('.');
    const decoded = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));

    console.log(`[CHECK-2C2P-STATUS] respCode=${decoded.respCode}, respDesc=${decoded.respDesc}`);

    // Map 2C2P response codes to simplified status
    let status: string;
    switch (decoded.respCode) {
      case "0000": // Success
        status = 'completed';
        break;
      case "1005": // Pending scan
      case "1003": // Processing
      case "2001": // Transaction in progress
        status = 'pending';
        break;
      case "2004": // Transaction expired
      case "4004": // Expired
        status = 'expired';
        break;
      default:
        // Any other code is treated as failed
        status = 'failed';
        break;
    }

    return new Response(
      JSON.stringify({ status, respCode: decoded.respCode, respDesc: decoded.respDesc }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("[CHECK-2C2P-STATUS] Error:", error.message);
    return new Response(
      JSON.stringify({ status: 'error', respCode: 'INTERNAL', respDesc: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
