import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTugeOrderRequest {
  packageId: string;
  userId?: string;
  email?: string;
  environment?: 'test' | 'production';
  eid?: string;
  imei2?: string;
  startDate?: string;
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

function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

function isTMobileUSA(pkg: { package_id: string; carrier?: string; country_name?: string }): boolean {
  if (pkg.package_id?.includes('TMO')) return true;
  if (pkg.carrier?.toLowerCase().includes('t-mobile') && pkg.country_name?.toUpperCase() === 'USA') return true;
  return false;
}

/**
 * Convert a date string (YYYY-MM-DD) to UTC timestamp representing 12:00 PM New York time.
 * T-Mobile USA eSIMs activate at noon Eastern time.
 */
function toNewYorkNoonUTC(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  // US DST: 2nd Sunday of March to 1st Sunday of November
  const marchSecondSunday = new Date(Date.UTC(year, 2, 1));
  marchSecondSunday.setUTCDate(14 - marchSecondSunday.getUTCDay());
  const novFirstSunday = new Date(Date.UTC(year, 10, 1));
  novFirstSunday.setUTCDate(novFirstSunday.getUTCDay() === 0 ? 1 : 8 - novFirstSunday.getUTCDay());
  
  const isEDT = date >= marchSecondSunday && date < novFirstSunday;
  const utcHour = isEDT ? 16 : 17;
  
  return `${dateStr}T${String(utcHour).padStart(2, '0')}:00:00Z`;
}

function calculateStartDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 6);
  const dateStr = date.toISOString().split('T')[0];
  return toNewYorkNoonUTC(dateStr);
}

async function getTugeToken(baseUrl: string, accountId: string, secret: string): Promise<string> {
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const result: TugeAuthResponse = await response.json();
  if (!isSuccessCode(result.code)) {
    throw new Error(`TUGE authentication failed: ${result.msg || result.message}`);
  }

  const token = result.data.token || result.data.accessToken;
  if (!token) throw new Error('No token received from TUGE');
  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { packageId, userId, email, environment = 'test', eid, imei2, startDate }: CreateTugeOrderRequest = await req.json();

    const { data: pkg, error: pkgError } = await supabaseClient
      .from('esim_packages')
      .select('*, esim_providers(*)')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) throw new Error('Package not found');
    
    const provider = pkg.esim_providers;
    if (!provider || provider.provider_code?.toLowerCase() !== 'tuge') {
      throw new Error('Not a TUGE package');
    }

    const isPushMode = isTMobileUSA(pkg);

    // For push mode, require eid and imei2
    if (isPushMode && (!eid || !imei2)) {
      throw new Error('T-Mobile USA orders require EID (32 digits) and IMEI2 (15-17 digits)');
    }

    const baseUrl = environment === 'production' 
      ? (Deno.env.get("TUGE_PROD_BASE_URL") || provider.api_base_url)
      : (Deno.env.get("TUGE_BASE_URL") || provider.api_base_url_sandbox || provider.api_base_url);
    
    if (!baseUrl) throw new Error('TUGE base URL not configured');
    
    const accountId = Deno.env.get(environment === 'production' ? "TUGE_PROD_ACCOUNT_ID" : "TUGE_ACCOUNT_ID");
    const secret = Deno.env.get(environment === 'production' ? "TUGE_PROD_SECRET" : "TUGE_SECRET");

    if (!accountId || !secret) throw new Error('TUGE credentials not configured');

    // Create local order record
    const internalOrderId = `TUGE-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_id: internalOrderId,
        user_id: userId || null,
        package_id: pkg.id,
        provider_id: provider.id,
        status: 'pending',
        environment: environment,
        total_amount: 0,
        notification_email: email || null,
        currency: pkg.currency || 'USD',
        webhook_data: isPushMode ? { device_eid2: eid, device_imei2: imei2, push_mode: true } : null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create payment record ($0 admin order)
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        order_id: order.id,
        amount: 0,
        currency: pkg.currency || 'USD',
        status: 'succeeded',
        payment_method: 'admin_manual',
        payment_gateway: 'manual',
        payment_intent_id: `admin_${internalOrderId}`,
      });

    if (paymentError) {
      console.warn('[CREATE-TUGE-ORDER] Failed to create payment record:', paymentError);
    }

    // Call TUGE API
    const token = await getTugeToken(baseUrl, accountId, secret);

    let orderEndpoint: string;
    let tugePayload: Record<string, unknown>;

    if (isPushMode) {
      console.log('[CREATE-TUGE-ORDER] Using PUSH MODE for T-Mobile USA');
      orderEndpoint = `${baseUrl}/eSIMApi/v2/order/create/push`;
      tugePayload = {
        productCode: pkg.package_id,
        startDate: startDate || calculateStartDate(),
        channelOrderNo: order.id,
        eid,
        imei2,
        idempotencyKey: crypto.randomUUID(),
      };
    } else {
      orderEndpoint = `${baseUrl}/eSIMApi/v2/order/create`;
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tuge-webhook`;
      tugePayload = {
        productCode: pkg.package_id,
        channelOrderNo: order.id,
        idempotencyKey: crypto.randomUUID(),
        callbackUrl: webhookUrl,
      };
    }

    const tugeResponse = await fetch(orderEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(tugePayload),
    });

    const tugeResult: TugeOrderResponse = await tugeResponse.json();
    if (!isSuccessCode(tugeResult.code)) {
      await supabaseClient.from('orders').delete().eq('id', order.id);
      throw new Error(`TUGE Order failed: ${tugeResult.msg || tugeResult.message}`);
    }

    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from('orders')
      .update({
        provider_order_id: tugeResult.data.orderNo,
        provider_status: tugeResult.data.orderState,
        status: 'processing',
        webhook_data: {
          ...(order.webhook_data as Record<string, unknown> || {}),
          ...tugeResult.data,
          push_mode: isPushMode,
        },
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify(updatedOrder), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[CREATE-TUGE-ORDER] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
