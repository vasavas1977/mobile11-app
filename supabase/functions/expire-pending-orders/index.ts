import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`[expire-pending-orders] Starting expiration check at ${now.toISOString()}`);
    console.log(`[expire-pending-orders] Expiring orders created before ${twentyFourHoursAgo.toISOString()}`);

    // Find pending orders older than 24 hours
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_id, user_id')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('[expire-pending-orders] Error fetching orders:', fetchError);
      throw fetchError;
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      console.log('[expire-pending-orders] No pending orders to expire');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending orders to expire', expiredCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[expire-pending-orders] Found ${expiredOrders.length} orders to expire`);

    const orderIds = expiredOrders.map(o => o.id);

    // Update orders to expired status
    const { error: updateOrdersError } = await supabase
      .from('orders')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .in('id', orderIds);

    if (updateOrdersError) {
      console.error('[expire-pending-orders] Error updating orders:', updateOrdersError);
      throw updateOrdersError;
    }

    // Update associated payments to expired status
    const { error: updatePaymentsError } = await supabase
      .from('payments')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .in('order_id', orderIds)
      .eq('status', 'pending');

    if (updatePaymentsError) {
      console.error('[expire-pending-orders] Error updating payments:', updatePaymentsError);
      // Don't throw - order update succeeded
    }

    console.log(`[expire-pending-orders] Successfully expired ${expiredOrders.length} orders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Expired ${expiredOrders.length} pending orders`,
        expiredCount: expiredOrders.length,
        expiredOrderIds: expiredOrders.map(o => o.order_id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[expire-pending-orders] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
