import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TugeProfileRequest {
  orderId: string;
}

interface TugeAuthResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    token?: string;
    accessToken?: string;
    expires: number;
  };
}

interface TugeProfileResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    orderNo: string;
    iccid: string;
    imsi: string;
    msisdn: string;
    orderState: string;
    createdTime: string;
    latestActivationTime: string;
    expireTime: string;
    qrCode: string;
  };
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

async function getTugeToken(accountId: string, secret: string, baseUrl: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const authResponse = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const authResult: TugeAuthResponse = await authResponse.json();
  if (!isSuccessCode(authResult.code)) {
    throw new Error(`TUGE authentication failed: ${authResult.msg || authResult.message}`);
  }

  const token = authResult.data.token || authResult.data.accessToken;
  if (!token) {
    throw new Error('No token received in TUGE auth response');
  }

  cachedToken = {
    token,
    expiresAt: Date.now() + (authResult.data.expires * 1000),
  };

  return token;
}

serve(async (req) => {
  console.log('[TUGE Profile] Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { orderId }: TugeProfileRequest = await req.json();
    console.log('[TUGE Profile] Checking profile for order:', orderId);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, esim_providers!inner(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Verify this is a TUGE order
    if (order.esim_providers?.provider_code !== 'tuge') {
      throw new Error('This order is not from TUGE provider');
    }

    // Use provider_order_id (TUGE's orderNo) for profile lookup
    if (!order.provider_order_id) {
      throw new Error('Order has no TUGE order number assigned');
    }

    // Verify ICCID is available
    if (!order.iccid) {
      throw new Error('ICCID not available. Please click "Check Traffic" first to retrieve ICCID.');
    }

    // Get TUGE credentials (production first, fallback to sandbox)
    const accountId = Deno.env.get("TUGE_PROD_ACCOUNT_ID") || Deno.env.get("TUGE_ACCOUNT_ID");
    const secret = Deno.env.get("TUGE_PROD_SECRET") || Deno.env.get("TUGE_SECRET");
    const baseUrl = Deno.env.get("TUGE_PROD_BASE_URL") || Deno.env.get("TUGE_BASE_URL") || "https://enterpriseapi.tugegroup.com:8070/openapi";

    if (!accountId || !secret) {
      throw new Error('TUGE credentials not configured');
    }

    const token = await getTugeToken(accountId, secret, baseUrl);

    // Call TUGE profile API using ICCID
    const profileResponse = await fetch(`${baseUrl}/eSIMApi/v2/iccid/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        iccid: order.iccid,
      }),
    });

    const profileResult: TugeProfileResponse = await profileResponse.json();
    console.log('[TUGE Profile] Response:', profileResult);

    if (!isSuccessCode(profileResult.code)) {
      throw new Error(profileResult.msg || profileResult.message || 'Failed to fetch profile');
    }

    // Calculate days remaining
    let daysRemaining = 0;
    try {
      const expireDate = new Date(profileResult.data.expireTime);
      const now = new Date();
      daysRemaining = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e: any) {
      console.warn('[TUGE Profile] Could not calculate days remaining:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      profile: {
        orderNo: profileResult.data.orderNo,
        iccid: profileResult.data.iccid,
        imsi: profileResult.data.imsi,
        msisdn: profileResult.data.msisdn,
        orderState: profileResult.data.orderState,
        createdTime: profileResult.data.createdTime,
        latestActivationTime: profileResult.data.latestActivationTime,
        expireTime: profileResult.data.expireTime,
        qrCode: profileResult.data.qrCode,
        daysRemaining,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[TUGE Profile] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
