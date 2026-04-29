import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, esim_packages(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get session ID if user is anonymous
    const sessionId = order.user_id ? null : req.headers.get("x-session-id");

    // Find pending conversions for this user/session
    const { data: pendingConversions, error: conversionsError } = await supabase
      .from("destination_conversions")
      .select("*")
      .is("converted_at", null)
      .or(
        order.user_id 
          ? `user_id.eq.${order.user_id}`
          : `session_id.eq.${sessionId}`
      )
      .order("clicked_at", { ascending: false });

    if (conversionsError) {
      console.error("Error fetching conversions:", conversionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch conversions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingConversions || pendingConversions.length === 0) {
      // No pending conversions to track
      return new Response(
        JSON.stringify({ message: "No pending conversions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Match conversion based on destination or timing
    // Use the most recent conversion within the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const matchedConversion = pendingConversions.find(
      conv => conv.clicked_at > thirtyMinutesAgo
    );

    if (matchedConversion) {
      // Update the conversion with order details
      const { error: updateError } = await supabase
        .from("destination_conversions")
        .update({
          order_id: orderId,
          package_id: order.package_id,
          converted_at: new Date().toISOString(),
          conversion_value: order.total_amount
        })
        .eq("id", matchedConversion.id);

      if (updateError) {
        console.error("Error updating conversion:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update conversion" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Conversion tracked successfully",
          conversionId: matchedConversion.id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "No matching conversion found within time window" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in track-conversion function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
