import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TugeOrderRequest {
  packageId: string;
  orderId: string;
  userEmail: string;
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

interface TugeOrderResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    channelOrderNo: string;
    orderNo: string;
    orderState: string;
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

function isTMobileUSA(packageData: { package_id: string; carrier?: string; country_name?: string }): boolean {
  if (packageData.package_id?.includes('TMO')) return true;
  if (packageData.carrier?.toLowerCase().includes('t-mobile') && packageData.country_name?.toUpperCase() === 'USA') return true;
  return false;
}

/**
 * Convert a date string (YYYY-MM-DD) to UTC timestamp representing 12:00 PM New York time.
 * T-Mobile USA eSIMs activate at noon Eastern time.
 * EDT (Mar-Nov): UTC-4, so noon ET = 16:00 UTC
 * EST (Nov-Mar): UTC-5, so noon ET = 17:00 UTC
 */
function toNewYorkNoonUTC(dateStr: string): string {
  // Parse the date parts
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Determine if the date falls in EDT or EST
  // EDT: second Sunday of March to first Sunday of November
  const date = new Date(Date.UTC(year, month - 1, day));
  const jan = new Date(Date.UTC(year, 0, 1));
  const jul = new Date(Date.UTC(year, 6, 1));
  
  // Simple DST check: create date at noon ET assuming EDT first
  // US DST starts 2nd Sunday of March, ends 1st Sunday of November
  const marchSecondSunday = new Date(Date.UTC(year, 2, 1));
  marchSecondSunday.setUTCDate(14 - marchSecondSunday.getUTCDay()); // 2nd Sunday
  const novFirstSunday = new Date(Date.UTC(year, 10, 1));
  novFirstSunday.setUTCDate(novFirstSunday.getUTCDay() === 0 ? 1 : 8 - novFirstSunday.getUTCDay());
  
  const isEDT = date >= marchSecondSunday && date < novFirstSunday;
  const utcHour = isEDT ? 16 : 17; // noon ET in UTC
  
  return `${dateStr}T${String(utcHour).padStart(2, '0')}:00:00Z`;
}

function calculateStartDate(): string {
  // Default: 6 days from now at noon New York time
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 6);
  const dateStr = date.toISOString().split('T')[0];
  return toNewYorkNoonUTC(dateStr);
}

async function getTugeToken(accountId: string, secret: string, baseUrl: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    console.log('[TUGE] Using cached token');
    return cachedToken.token;
  }

  console.log('[TUGE] Requesting new auth token');
  const authResponse = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const authResult: TugeAuthResponse = await authResponse.json();
  console.log('[TUGE] Auth response:', { code: authResult.code });

  if (!isSuccessCode(authResult.code)) {
    throw new Error(`TUGE authentication failed: ${authResult.msg || authResult.message}`);
  }

  const token = authResult.data.token || authResult.data.accessToken;
  if (!token) throw new Error('No token received in TUGE auth response');

  cachedToken = {
    token,
    expiresAt: Date.now() + (authResult.data.expires * 1000),
  };

  return token;
}

serve(async (req) => {
  console.log('[TUGE] Integration request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { packageId, orderId, userEmail }: TugeOrderRequest = await req.json();
    console.log('[TUGE] Processing order:', { packageId, orderId, userEmail });

    const { data: packageData, error: packageError } = await supabaseClient
      .from('esim_packages')
      .select('*, esim_providers!inner(*)')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      console.error('[TUGE] Package not found:', packageError);
      throw new Error('Package not found');
    }

    if (packageData.esim_providers?.provider_code !== 'tuge') {
      throw new Error('This package is not from TUGE provider');
    }

    const accountId = Deno.env.get("TUGE_PROD_ACCOUNT_ID") || Deno.env.get("TUGE_ACCOUNT_ID");
    const secret = Deno.env.get("TUGE_PROD_SECRET") || Deno.env.get("TUGE_SECRET");
    const baseUrl = Deno.env.get("TUGE_PROD_BASE_URL") || Deno.env.get("TUGE_BASE_URL") || "https://enterpriseapi.tugegroup.com:8070/openapi";

    if (!accountId || !secret) {
      throw new Error('TUGE credentials not configured.');
    }

    console.log('[TUGE] Using base URL:', baseUrl);
    const token = await getTugeToken(accountId, secret, baseUrl);

    const tugeProductCode = packageData.package_id;
    const isPushMode = isTMobileUSA(packageData);

    // Get order's webhook_data for device info
    const { data: orderData } = await supabaseClient
      .from('orders')
      .select('webhook_data')
      .eq('id', orderId)
      .single();
    
    const webhookData = orderData?.webhook_data as Record<string, unknown> | null;

    let orderPayload: Record<string, unknown>;
    let orderEndpoint: string;

    if (isPushMode) {
      // --- Push Mode (Section 4.6) for T-Mobile USA ---
      console.log('[TUGE] Using PUSH MODE for T-Mobile USA');
      
      const eid = webhookData?.device_eid2 as string | undefined;
      const imei2 = webhookData?.device_imei2 as string | undefined;

      if (!eid || !imei2) {
        // Fail with clear error — need device info
        const { data: existingOrder } = await supabaseClient
          .from('orders').select('webhook_data').eq('id', orderId).single();
        
        await supabaseClient
          .from('orders')
          .update({
            status: 'failed',
            provider_status: 'FAILED',
            webhook_data: {
              ...(existingOrder?.webhook_data as Record<string, unknown> || {}),
              error_code: 'MISSING_DEVICE_INFO',
              error_message: 'T-Mobile USA requires EID (32 digits) and IMEI2 (15-17 digits). Please provide device info.',
              failed_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        return new Response(JSON.stringify({
          success: false,
          message: 'T-Mobile USA requires EID and IMEI2. Please provide device info before ordering.',
          code: 'MISSING_DEVICE_INFO',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const isDesignatedDate = webhookData?.designated_activate === true;
      const activationDate = webhookData?.activation_date as string | undefined;
      // Convert activation_date (YYYY-MM-DD) to noon New York time in UTC
      const startDate = (isDesignatedDate && activationDate) 
        ? toNewYorkNoonUTC(activationDate) 
        : calculateStartDate();
      console.log('[TUGE] Push mode params:', { startDate, designated: isDesignatedDate, eid: eid.substring(0, 8) + '...', imei2: imei2.substring(0, 6) + '...' });

      orderEndpoint = `${baseUrl}/eSIMApi/v2/order/create/push`;
      orderPayload = {
        productCode: tugeProductCode,
        startDate,
        channelOrderNo: orderId,
        eid,
        imei2,
        idempotencyKey: crypto.randomUUID(),
      };
    } else {
      // --- Standard Mode (Section 4.4) ---
      console.log('[TUGE] Using STANDARD MODE');

      const isDesignatedDate = webhookData?.designated_activate === true;
      const activationDate = webhookData?.activation_date as string | undefined;
      const deviceImei2 = webhookData?.device_imei2 as string | undefined;
      const deviceEid2 = webhookData?.device_eid2 as string | undefined;

      orderEndpoint = `${baseUrl}/eSIMApi/v2/order/create`;
      orderPayload = {
        productCode: tugeProductCode,
        channelOrderNo: orderId,
        idempotencyKey: crypto.randomUUID(),
        email: userEmail,
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/tuge-webhook`,
      };

      if (isDesignatedDate && activationDate) {
        orderPayload.activateDate = activationDate;
        console.log('[TUGE] Designated date activation:', activationDate);
      }
      if (deviceImei2) orderPayload.imei = deviceImei2;
      if (deviceEid2) orderPayload.eid = deviceEid2;
    }

    console.log('[TUGE] Creating order at:', orderEndpoint);
    console.log('[TUGE] Order payload:', { ...orderPayload, eid: orderPayload.eid ? '***' : undefined });

    const orderResponse = await fetch(orderEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderResult: TugeOrderResponse = await orderResponse.json();
    console.log('[TUGE] Order response:', orderResult);

    if (!isSuccessCode(orderResult.code)) {
      const errorMessage = orderResult.msg || orderResult.message || 'Order creation failed';
      
      const { data: existingOrderFail } = await supabaseClient
        .from('orders').select('webhook_data').eq('id', orderId).single();
      
      await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
          provider_status: 'FAILED',
          webhook_data: {
            ...(existingOrderFail?.webhook_data as Record<string, unknown> || {}),
            error_code: orderResult.code,
            error_message: errorMessage,
            failed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return new Response(JSON.stringify({
        success: false,
        message: errorMessage,
        code: orderResult.code,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: existingOrderSuccess } = await supabaseClient
      .from('orders').select('webhook_data').eq('id', orderId).single();
    
    const updateData = {
      provider_order_id: orderResult.data.orderNo,
      provider_status: orderResult.data.orderState,
      status: 'processing',
      webhook_data: {
        ...(existingOrderSuccess?.webhook_data as Record<string, unknown> || {}),
        ...orderResult.data,
        channelOrderNo: orderResult.data.channelOrderNo,
        push_mode: isPushMode,
        created_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[TUGE] Failed to update order:', updateError);
      throw new Error('Failed to update order with TUGE data');
    }

    console.log('[TUGE] Order successfully placed via', isPushMode ? 'PUSH MODE' : 'STANDARD MODE');

    return new Response(JSON.stringify({
      success: true,
      tugeOrderNo: orderResult.data.orderNo,
      orderId: orderId,
      status: orderResult.data.orderState,
      pushMode: isPushMode,
      message: isPushMode 
        ? 'Push mode order placed. eSIM will be pushed to device.' 
        : 'Order placed successfully. eSIM details will be sent via webhook.',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[TUGE] Error in tuge-integration:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
