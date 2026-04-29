import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BACKFILL-LOYALTY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Backfill started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch all completed orders that haven't been processed for loyalty
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, currency, status, created_at')
      .eq('status', 'completed')
      .eq('loyalty_processed', false)
      .order('created_at', { ascending: true });

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    logStep("Found unprocessed orders", { count: orders?.length || 0 });

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No orders to process",
        processed: 0,
        failed: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each order
    for (const order of orders) {
      try {
        logStep("Processing order", { orderId: order.id, userId: order.user_id });

        const { data, error } = await supabase.functions.invoke('calculate-loyalty-cashback', {
          body: { order_id: order.id, backfill: true }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success) {
          processed++;
          logStep("Order processed", { 
            orderId: order.id, 
            cashback: data.cashback_amount,
            newBalance: data.new_balance 
          });
        } else {
          failed++;
          errors.push(`${order.id}: ${data?.message || 'Unknown error'}`);
        }
      } catch (err: any) {
        failed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${order.id}: ${errMsg}`);
        logStep("Order failed", { orderId: order.id, error: errMsg });
      }
    }

    logStep("Backfill complete", { processed, failed });

    return new Response(JSON.stringify({
      success: true,
      message: `Backfill complete: ${processed} processed, ${failed} failed`,
      processed,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Only show first 10 errors
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
