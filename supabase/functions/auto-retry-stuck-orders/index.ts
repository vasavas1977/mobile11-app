import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RETRY_COUNT = 5;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function buildFinalBaseUrl(): string {
  const baseUrl = Deno.env.get("USIMSA_PROD_BASE_URL")?.replace(/\/+$/, '');
  if (!baseUrl) return "https://open-api.usimsa.com/api";
  // If env var doesn't include /api, add it (matches usimsa-integration logic)
  if (!baseUrl.includes('/api')) {
    return `${baseUrl}/api`;
  }
  return baseUrl;
}

async function signUsimsa(method: string, pathAndQuery: string, accessKey: string, secretKey: string) {
  const timestampMs = Date.now().toString();
  const encoder = new TextEncoder();

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(secretKey).buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const stringToSign = `${method} ${pathAndQuery}\n${timestampMs}\n${accessKey}`;
  const signatureBytes = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(stringToSign));
  const signatureBase64 = bytesToBase64(signatureBytes);

  return { timestampMs, signatureBase64 };
}

async function fetchUsimOrderStatus(topupId: string) {
  const accessKey = Deno.env.get("USIMSA_PROD_ACCESS_KEY");
  const secretKey = Deno.env.get("USIMSA_PROD_SECRET_KEY");

  if (!accessKey || !secretKey) {
    throw new Error("USIMSA credentials not configured");
  }

  const pathAndQuery = `/api/v2/order/${topupId}`;
  const { timestampMs, signatureBase64 } = await signUsimsa('GET', pathAndQuery, accessKey, secretKey);

  const finalBaseUrl = buildFinalBaseUrl();
  const url = `${finalBaseUrl}/v2/order/${topupId}`;

  console.log('Auto-retry querying USIMSA:', url);

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "x-gat-timestamp": timestampMs,
      "x-gat-access-key": accessKey,
      "x-gat-signature": signatureBase64,
    },
  });

  const text = await resp.text();
  if (!resp.ok) {
    console.error(`USIMSA API error ${resp.status}: ${text}`);
    return null;
  }

  return text ? JSON.parse(text) : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("Auto-retry: checking for stuck USIMSA orders...");

    // Find orders stuck in processing for 10+ minutes with topupId but no QR code
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: stuckOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, order_id, webhook_data, created_at, user_id, package_id, total_amount')
      .eq('status', 'processing')
      .is('qr_code', null)
      .lt('created_at', tenMinutesAgo)
      .not('webhook_data', 'is', null)
      .limit(20);

    if (queryError) {
      console.error("Query error:", queryError);
      throw queryError;
    }

    // Filter to only USIMSA orders with topupId and respect cooldown
    const eligibleOrders = (stuckOrders || []).filter(order => {
      const topupId = order.webhook_data?.topupId;
      if (!topupId) return false;

      // Cooldown: skip if retried in the last 5 minutes
      const lastRetry = order.webhook_data?.last_retry_at;
      if (lastRetry && new Date(lastRetry) > new Date(fiveMinutesAgo)) return false;

      return true;
    });

    console.log(`Found ${eligibleOrders.length} eligible stuck orders to retry`);

    const results: any[] = [];
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    for (const order of eligibleOrders) {
      const topupId = order.webhook_data.topupId;
      const retryCount = (order.webhook_data?.retry_count ?? 0) + 1;
      const alreadyNotified = !!order.webhook_data?.admin_notified;
      
      console.log(`Retrying order ${order.id} (topupId: ${topupId}, attempt: ${retryCount})`);

      try {
        const orderStatus = await fetchUsimOrderStatus(topupId);

        if (!orderStatus) {
          // Check if we've exceeded max retries → escalate to needs_attention
          if (retryCount >= MAX_RETRY_COUNT) {
            console.log(`Order ${order.id} exceeded ${MAX_RETRY_COUNT} retries, escalating to needs_attention`);
            await supabase.from('orders').update({
              status: 'needs_attention',
              webhook_data: {
                ...order.webhook_data,
                last_retry_at: new Date().toISOString(),
                retry_count: retryCount,
                escalated_at: new Date().toISOString(),
                escalation_reason: `Auto-retry failed ${retryCount} times (API errors)`,
              },
              updated_at: new Date().toISOString(),
            }).eq('id', order.id);

            results.push({ orderId: order.id, result: 'escalated_needs_attention' });
          } else {
            // Mark last_retry_at and increment retry_count
            await supabase.from('orders').update({
              webhook_data: {
                ...order.webhook_data,
                last_retry_at: new Date().toISOString(),
                retry_count: retryCount,
              }
            }).eq('id', order.id);

            results.push({ orderId: order.id, result: 'api_error', retryCount });
          }
          continue;
        }

        const esimDetails = orderStatus.products?.[0] || orderStatus;
        const qrUrl = esimDetails.qrCodeImgUrl || esimDetails.qrcodeImgUrl || esimDetails.qrCode;
        const activateCode = esimDetails.activateCode || esimDetails.activationCode;
        const downloadLink = esimDetails.downloadLink;

        const updateData: any = {
          webhook_data: {
            ...order.webhook_data,
            ...orderStatus,
            esim_details: esimDetails,
            last_retry_at: new Date().toISOString(),
            retry_count: retryCount,
            auto_retried: true,
            admin_notified: alreadyNotified, // preserve notification state
          },
          updated_at: new Date().toISOString(),
        };

        if (esimDetails.iccid) updateData.iccid = esimDetails.iccid;
        if (esimDetails.msisdn) updateData.msisdn = esimDetails.msisdn;
        if (qrUrl) updateData.qr_code = qrUrl;
        if (activateCode) updateData.activation_code = activateCode;
        if (downloadLink) updateData.download_link = downloadLink;

        // Determine if order is now complete
        const hasEsimData = qrUrl || activateCode || downloadLink;
        const apiStatus = orderStatus.status || orderStatus.orderStatus;

        if (hasEsimData || apiStatus === 'completed' || orderStatus.activationStatus === 'activated') {
          updateData.status = 'completed';
          console.log(`Order ${order.id} auto-completed!`);

          await supabase.from('orders').update(updateData).eq('id', order.id);

          // Trigger order confirmation email
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
            await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`,
              },
              body: JSON.stringify({ orderId: order.id }),
            });
            console.log(`Confirmation email triggered for order ${order.id}`);
          } catch (emailErr) {
            console.error(`Failed to send confirmation for order ${order.id}:`, emailErr);
          }

          results.push({ orderId: order.id, result: 'completed' });
        } else {
          // Still processing - update retry timestamp
          await supabase.from('orders').update(updateData).eq('id', order.id);

          // Check if stuck for 30+ minutes AND not yet notified → send admin notification
          const orderCreated = new Date(order.created_at);
          if (orderCreated < thirtyMinutesAgo && !alreadyNotified) {
            console.log(`Order ${order.id} stuck for 30+ minutes, notifying admins`);

            // Get customer email
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, first_name')
              .eq('user_id', order.user_id)
              .single();

            // Get package name
            const { data: pkg } = await supabase
              .from('esim_packages')
              .select('country_name, data_amount, validity_days')
              .eq('id', order.package_id)
              .single();

            const minutesElapsed = Math.round((Date.now() - orderCreated.getTime()) / 60000);
            const packageName = pkg ? `${pkg.country_name} ${pkg.data_amount} ${pkg.validity_days}d` : 'Unknown';

            try {
              const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
              const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
              await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${anonKey}`,
                },
                body: JSON.stringify({
                  action_type: 'stuck_order_alert',
                  entity_type: 'order',
                  entity_id: order.id,
                  admin_email: 'system@mobile11.com',
                  admin_name: 'Auto-Retry System',
                  details: `Order ${order.order_id} has been stuck in processing for ${minutesElapsed} minutes. Customer: ${profile?.email || 'unknown'}. Package: ${packageName}. Amount: ฿${order.total_amount}. USIMSA topupId: ${topupId}. Please check manually.`,
                  metadata: {
                    order_id: order.order_id,
                    customer_email: profile?.email,
                    package: packageName,
                    minutes_elapsed: minutesElapsed,
                    topup_id: topupId,
                  }
                }),
              });

              // Mark as notified — set directly on the already-updated webhook_data
              await supabase.from('orders').update({
                webhook_data: {
                  ...updateData.webhook_data,
                  admin_notified: true,
                  admin_notified_at: new Date().toISOString(),
                }
              }).eq('id', order.id);

              console.log(`Admin notification sent for order ${order.id}`);
            } catch (notifyErr) {
              console.error(`Failed to notify admins for order ${order.id}:`, notifyErr);
            }

            results.push({ orderId: order.id, result: 'notified_admin' });
          } else {
            results.push({ orderId: order.id, result: 'still_processing' });
          }
        }
      } catch (orderErr) {
        console.error(`Error processing order ${order.id}:`, orderErr);
        results.push({ orderId: order.id, result: 'error', error: String(orderErr) });
      }
    }

    console.log("Auto-retry completed:", JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Auto-retry error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
