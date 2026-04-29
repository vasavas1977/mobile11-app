import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('Email confirmation test started');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get the most recent order
    const { data: orders, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, order_id, user_id, status')
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderError || !orders || orders.length === 0) {
      throw new Error('No orders found to test');
    }

    const testOrder = orders[0];
    console.log('Testing with order:', testOrder.order_id);

    // Test the email confirmation function
    const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke('send-order-confirmation', {
      body: { orderId: testOrder.id }
    });

    if (emailError) {
      console.error('Email function error:', emailError);
      throw emailError;
    }

    console.log('Email function result:', emailResult);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email confirmation test completed',
      orderId: testOrder.order_id,
      emailResult: emailResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Test error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});