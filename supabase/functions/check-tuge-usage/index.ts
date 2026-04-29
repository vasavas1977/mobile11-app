import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TugeUsageRequest {
  orderId: string;
}

interface TugeAuthResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    token?: string;       // Some responses use this
    accessToken?: string; // Others use this
    expires: number;      // seconds
  };
}

interface TugeUsageResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    iccId?: string;
    // TUGE v2/order/usage returns:
    // - dataUsage: string in MB (e.g., "700.00")
    // - dataTotal: string "unlimited" or number
    // - dataResidual: string "unlimited" or number
    dataUsage?: string;
    dataUsed?: number;     // Alternative format: bytes
    dataTotal?: number | string;
    dataResidual?: string;
    orderState?: string;
    expireTime?: string;
    daysRemaining?: number;
  };
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

// Helper to check success code (handles both string "0000" and number 0)
function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

async function getTugeToken(accountId: string, secret: string, baseUrl: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  // FIXED: Use /oauth/token per official PHP reference
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

  // Handle both token field names per PHP reference
  const token = authResult.data.token || authResult.data.accessToken;
  if (!token) {
    throw new Error('No token received in TUGE auth response');
  }

  // Cache the token - expires is in seconds, convert to milliseconds
  cachedToken = {
    token,
    expiresAt: Date.now() + (authResult.data.expires * 1000),
  };

  return token;
}

serve(async (req) => {
  console.log('[TUGE Usage] Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { orderId }: TugeUsageRequest = await req.json();
    console.log('[TUGE Usage] Checking usage for order:', orderId);

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

    // Use provider_order_id (TUGE's orderNo) for usage lookup
    if (!order.provider_order_id) {
      throw new Error('Order has no TUGE order number assigned');
    }

     // Get TUGE credentials (production first, fallback to sandbox)
     const accountId = Deno.env.get("TUGE_PROD_ACCOUNT_ID") || Deno.env.get("TUGE_ACCOUNT_ID");
     const secret = Deno.env.get("TUGE_PROD_SECRET") || Deno.env.get("TUGE_SECRET");
     const baseUrl = Deno.env.get("TUGE_PROD_BASE_URL") || Deno.env.get("TUGE_BASE_URL") || "https://enterpriseapi.tugegroup.com:8070/openapi";

    if (!accountId || !secret) {
      throw new Error('TUGE credentials not configured');
    }

    const token = await getTugeToken(accountId, secret, baseUrl);

    // Call TUGE usage API - using orderNo per documentation
    const usageResponse = await fetch(`${baseUrl}/eSIMApi/v2/order/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderNo: order.provider_order_id, // Use TUGE's order number
      }),
    });

    const usageResult: TugeUsageResponse = await usageResponse.json();
    console.log('[TUGE Usage] Usage API response:', usageResult);

    if (!isSuccessCode(usageResult.code)) {
      throw new Error(usageResult.msg || usageResult.message || 'Failed to fetch usage');
    }
    
    // Fetch order info from Order Query API for real expiry dates (activatedEndTime)
    console.log('[TUGE Usage] Fetching order info for orderNo:', order.provider_order_id);
    let orderInfo: any = {};
    try {
      const orderInfoResponse = await fetch(`${baseUrl}/eSIMApi/v2/order/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderNo: order.provider_order_id }),
      });
      const orderInfoResult = await orderInfoResponse.json();
      console.log('[TUGE Usage] Order Query API response:', orderInfoResult);
      if (isSuccessCode(orderInfoResult.code) && orderInfoResult.data?.list?.[0]) {
        orderInfo = orderInfoResult.data.list[0];
      }
    } catch (error: any) {
      console.error('[TUGE Usage] Error fetching order info (non-fatal):', error);
    }
    
    // Helper to safely parse date to ISO string (returns null on invalid date)
    const safeToISOString = (dateStr: string | null | undefined): string | null => {
      if (!dateStr) return null;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
      } catch {
        return null;
      }
    };

    // ALSO fetch profile data for fallback expiry info
    let profileData: any = {};
    const iccidToUse = order.iccid || usageResult.data?.iccId || orderInfo.iccId;
    if (iccidToUse) {
      console.log('[TUGE Usage] Fetching profile for ICCID:', iccidToUse);
      const profileResponse = await fetch(`${baseUrl}/eSIMApi/v2/iccid/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ iccid: iccidToUse }), // FIXED: lowercase key per TUGE API spec
      });
      
      const profileResult = await profileResponse.json();
      console.log('[TUGE Usage] Profile API response:', profileResult);
      
      if (isSuccessCode(profileResult.code) && profileResult.data) {
        profileData = profileResult.data;
      }
    }

    // TUGE API returns different field names and formats:
    // - dataUsage: string in MB (e.g., "700.00")
    // - dataTotal: string "unlimited" or number
    // - dataResidual: string "unlimited" or number
    const tugeData = usageResult.data;
    const isUnlimited = String(tugeData.dataTotal).toLowerCase() === 'unlimited' || 
                        String(tugeData.dataResidual).toLowerCase() === 'unlimited';
    
    let dataUsedMB = 0;
    let dataTotalMB = 0;
    
    // Parse dataUsage (MB as string) or dataUsed (bytes as number)
    if (tugeData.dataUsage !== undefined) {
      dataUsedMB = parseFloat(String(tugeData.dataUsage)) || 0;
    } else if (tugeData.dataUsed !== undefined) {
      dataUsedMB = (Number(tugeData.dataUsed) || 0) / (1024 * 1024);
    }
    
    // Parse dataTotal
    if (!isUnlimited && tugeData.dataTotal !== undefined) {
      if (typeof tugeData.dataTotal === 'number') {
        dataTotalMB = tugeData.dataTotal / (1024 * 1024);
      } else {
        dataTotalMB = parseFloat(String(tugeData.dataTotal)) || 0;
      }
    }
    
    const percentUsed = dataTotalMB > 0 ? (dataUsedMB / dataTotalMB) * 100 : 0;
    
    // Format for UI display (same keys as USIMSA/check-esim-usage)
    const formatDataAmount = (mb: number): string => {
      if (mb >= 1024) {
        return `${(mb / 1024).toFixed(2)} GB`;
      }
      return `${mb.toFixed(0)} MB`;
    };
    
    const usageMb = Math.round(dataUsedMB * 100) / 100;
    const dataUsed = formatDataAmount(usageMb);
    const totalData = isUnlimited ? 'Unlimited' : (dataTotalMB > 0 ? formatDataAmount(dataTotalMB) : 'Unlimited');
    const remainingDataMb = (!isUnlimited && dataTotalMB > 0) ? Math.max(0, dataTotalMB - dataUsedMB) : null;
    const remainingData = isUnlimited ? 'Unlimited' : (remainingDataMb !== null ? formatDataAmount(remainingDataMb) : 'Unlimited');
    const percentageUsed = Math.round(percentUsed * 100) / 100;
    
    // Get expiry info - PRIORITY: Order Query API > Profile API > Calculated fallback
    // Order Query API returns: activatedStartTime, activatedEndTime, orderStatus (MOST ACCURATE)
    let expireTime = orderInfo.activatedEndTime || profileData.expireTime || tugeData.expireTime;
    let activeTime = orderInfo.activatedStartTime || profileData.installTime || profileData.activeTime || 
                     profileData.latestActivationTime || (tugeData as any).activeTime || profileData.createdTime;
    const orderState = orderInfo.orderStatus || profileData.orderState || tugeData.orderState;
    let daysRemaining = profileData.daysRemaining ?? tugeData.daysRemaining;
    
    console.log('[TUGE Usage] Expiry sources:', { 
      orderActivatedEndTime: orderInfo.activatedEndTime,
      profileExpireTime: profileData.expireTime,
      usingExpireTime: expireTime 
    });
    
    // Get package validity days from order's package for expiry calculation
    const { data: packageData } = await supabaseClient
      .from('esim_packages')
      .select('validity_days')
      .eq('id', order.package_id)
      .single();
    const validityDays = packageData?.validity_days || 0;
    
    // FALLBACK: If still no expireTime but activeTime exists, calculate expiry
    if (!expireTime && activeTime && validityDays > 0) {
      const startDate = new Date(activeTime);
      if (!isNaN(startDate.getTime())) {
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + validityDays);
        expireTime = expiryDate.toISOString();
        console.log('[TUGE Usage] Calculated expireTime as fallback:', { activeTime, validityDays, expireTime });
      }
    }
    
    // Calculate daysRemaining from expireTime
    if (expireTime) {
      const expiryDate = new Date(expireTime);
      if (!isNaN(expiryDate.getTime())) {
        const now = new Date();
        daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }
    
    // Use safe date parsing to prevent "Invalid Date" from crashing refresh
    const validUntil = safeToISOString(expireTime);
    const validFrom = safeToISOString(activeTime);
    
    console.log('[TUGE Usage] Final validity info:', { expireTime, activeTime, validUntil, validFrom, daysRemaining, orderState, validityDays });

    // Update cached usage in order with UI-friendly format
    await supabaseClient
      .from('orders')
      .update({
        iccid: iccidToUse, // Store ICCID if returned
        cached_usage: {
          // UI-friendly fields (same as USIMSA path in check-esim-usage)
          dataUsed,
          remainingData,
          totalData,
          percentageUsed,
          usageMb,
          remainingDataMb,
          validFrom,
          validUntil,
          notYetActivated: false,
          
          // TUGE-specific fields (backward compat)
          dataUsedMB: Math.round(dataUsedMB * 100) / 100,
          dataTotalMB: Math.round(dataTotalMB * 100) / 100,
          percentUsed: percentageUsed,
          lastChecked: new Date().toISOString(),
          orderState,
          expireTime,
          activeTime,
          daysRemaining,
          iccId: iccidToUse,
          
          provider: { name: 'tuge' }
        },
        usage_cached_at: new Date().toISOString(),
        provider_status: orderState,
      })
      .eq('id', orderId);

    return new Response(JSON.stringify({
      success: true,
      usage: {
        dataUsedMB: Math.round(dataUsedMB * 100) / 100,
        dataTotalMB: Math.round(dataTotalMB * 100) / 100,
        percentUsed: Math.round(percentUsed * 100) / 100,
        dataUsedBytes: usageResult.data.dataUsed,
        dataTotalBytes: usageResult.data.dataTotal,
        orderState: usageResult.data.orderState,
        expireTime: usageResult.data.expireTime,
        daysRemaining: usageResult.data.daysRemaining,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[TUGE Usage] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
