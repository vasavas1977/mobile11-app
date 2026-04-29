import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-ORG-CREDIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Initialize client with user token to verify org membership
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      logStep("Auth error", { error: userError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { organization_id, order_id, amount } = await req.json();
    logStep("Request received", { organization_id, order_id, amount, userId: user.id });

    if (!organization_id || !order_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify user is org admin/manager
    const { data: membership } = await supabaseUser
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      logStep("Not authorized for org", { userId: user.id, organization_id });
      return new Response(
        JSON.stringify({ success: false, error: "Not authorized for this organization" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if order already processed (idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from('organization_credit_transactions')
      .select('id')
      .eq('reference_id', order_id)
      .eq('type', 'purchase')
      .maybeSingle();

    if (existingTx) {
      logStep("Already processed", { order_id });
      return new Response(
        JSON.stringify({ success: true, message: "Already processed", already_processed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get current balance
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('credit_balance, name')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      logStep("Organization not found", { error: orgError });
      return new Response(
        JSON.stringify({ success: false, error: "Organization not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const currentBalance = org.credit_balance || 0;
    
    // Validate sufficient balance
    if (currentBalance < amount) {
      logStep("Insufficient balance", { currentBalance, required: amount });
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient credit balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const newBalance = currentBalance - amount;

    // Update organization balance
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ 
        credit_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', organization_id);

    if (updateError) {
      logStep("Failed to update balance", { error: updateError });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create transaction record
    const { error: txError } = await supabaseAdmin
      .from('organization_credit_transactions')
      .insert({
        organization_id,
        amount: -amount, // Negative for purchases
        type: 'purchase',
        description: `eSIM purchase for order`,
        reference_id: order_id,
        performed_by: user.id,
        balance_after: newBalance
      });

    if (txError) {
      logStep("Failed to create transaction record", { error: txError });
    }

    logStep("Deduction complete", { 
      organization: org.name,
      deducted: amount,
      newBalance 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        deducted_amount: amount,
        new_balance: newBalance 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
