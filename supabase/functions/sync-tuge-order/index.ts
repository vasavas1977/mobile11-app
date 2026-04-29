import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

async function getTugeToken(baseUrl: string, accountId: string, secret: string): Promise<string> {
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json' },
    body: JSON.stringify({ accountId, secret }),
  });
  const result = await response.json();
  if (!isSuccessCode(result.code)) throw new Error(`TUGE auth failed: ${result.msg || result.message}`);
  return result.data.token || result.data.accessToken;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_id, provider_order_id, status, webhook_data, iccid, qr_code, activation_code')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) throw new Error("Order not found");
    if (!order.provider_order_id) throw new Error("No provider_order_id");

    const baseUrl = Deno.env.get("TUGE_PROD_BASE_URL")?.replace(/\/+$/, '');
    const accountId = Deno.env.get("TUGE_PROD_ACCOUNT_ID");
    const secret = Deno.env.get("TUGE_PROD_SECRET");
    if (!baseUrl || !accountId || !secret) throw new Error("TUGE credentials not configured");

    const token = await getTugeToken(baseUrl, accountId, secret);

    // Query TUGE Order API
    const orderResp = await fetch(`${baseUrl}/eSIMApi/v2/order/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderNo: order.provider_order_id }),
    });

    const orderResult = await orderResp.json();
    console.log('[SYNC-TUGE] Order API response:', JSON.stringify(orderResult));

    if (!isSuccessCode(orderResult.code)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: orderResult.msg || orderResult.message,
        raw: orderResult 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tugeOrder = orderResult.data?.list?.[0];
    if (!tugeOrder) {
      return new Response(JSON.stringify({ success: false, error: "No order data from TUGE", raw: orderResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse LPA string if present
    let activationCode = tugeOrder.activateCode || tugeOrder.activationCode;
    let smdpAddress: string | null = null;
    const qrCode = tugeOrder.qrCode || tugeOrder.qrcodeImgUrl;
    
    if (qrCode && qrCode.startsWith('LPA:1$')) {
      const parts = qrCode.split('$');
      if (parts.length >= 3) {
        smdpAddress = parts[1];
        activationCode = activationCode || parts[2];
      }
    }

    // Build update
    const updateData: Record<string, any> = {
      webhook_data: {
        ...(order.webhook_data as Record<string, any> || {}),
        tuge_order_sync: tugeOrder,
        synced_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    if (tugeOrder.iccid) updateData.iccid = tugeOrder.iccid;
    if (qrCode) updateData.qr_code = qrCode;
    if (activationCode) updateData.activation_code = activationCode;
    if (smdpAddress) updateData.smdp_address = smdpAddress;
    if (tugeOrder.orderState) updateData.provider_status = tugeOrder.orderState;

    // Check if order should be marked complete
    const isPushMode = (order.webhook_data as any)?.push_mode === true;
    const orderState = tugeOrder.orderState?.toUpperCase();
    const isCompleted = orderState === 'COMPLETED' || orderState === 'ENABLE' || orderState === 'INSTALLED' || orderState === 'ENABLED';
    const hasEsimData = tugeOrder.iccid || qrCode || activationCode;

    if (isCompleted || (isPushMode && hasEsimData)) {
      updateData.status = 'completed';
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ 
      success: true, 
      tugeOrder,
      updated: updateData,
      isPushMode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('[SYNC-TUGE] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
