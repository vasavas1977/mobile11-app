import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Validate user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Parse request body
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the order and verify ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, auto_renewal_enabled, renewal_failure_count, renewal_failure_reason")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user owns this order
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized - you don't own this order" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if auto-renewal is enabled
    if (!order.auto_renewal_enabled) {
      return new Response(JSON.stringify({ error: "Auto-renewal is not enabled for this order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reset the failure count and clear the failure reason
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        renewal_failure_count: 0,
        renewal_failure_reason: null,
        last_renewal_attempt_at: null, // Reset so cron can try immediately
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to reset renewal failure count:", updateError);
      return new Response(JSON.stringify({ error: "Failed to reset renewal" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the retry action
    console.log(`[RETRY-RENEWAL] User ${userId} reset renewal for order ${orderId}. Previous failure count: ${order.renewal_failure_count}, reason: ${order.renewal_failure_reason}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Auto-renewal has been unlocked. The system will attempt renewal on the next scheduled check.",
      previousFailureCount: order.renewal_failure_count,
      previousFailureReason: order.renewal_failure_reason
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in retry-auto-renewal:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
