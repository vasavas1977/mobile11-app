import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-M11-MONEY] ${step}${detailsStr}`);
};

// Minimum remaining balance rule: $1 USD = 35 THB
const MINIMUM_REMAINING_THB = 35;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      logStep("Auth error", { error: authError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { user_id, order_id, amount_thb } = await req.json();

    logStep("Request received", { user_id, order_id, amount_thb, authenticatedUser: user.id });

    // Verify the authenticated user matches the requested user_id
    if (user_id !== user.id) {
      logStep("User mismatch", { requested: user_id, authenticated: user.id });
      return new Response(
        JSON.stringify({ success: false, error: "Cannot modify other user's balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    if (!user_id || !order_id || !amount_thb || amount_thb <= 0) {
      logStep("Invalid request - missing or invalid parameters");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this order has already been processed for Mobile11 Money deduction
    const { data: existingTransaction } = await supabaseClient
      .from('mobile11_money_transactions')
      .select('id')
      .eq('order_id', order_id)
      .eq('type', 'redeemed')
      .maybeSingle();

    if (existingTransaction) {
      logStep("Deduction already processed for this order", { order_id });
      return new Response(
        JSON.stringify({ success: true, message: "Already processed", already_processed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get user's current loyalty balance
    const { data: loyaltyData, error: loyaltyError } = await supabaseClient
      .from('user_loyalty')
      .select('mobile11_money_balance')
      .eq('user_id', user_id)
      .single();

    if (loyaltyError) {
      logStep("Error fetching loyalty data", { error: loyaltyError });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch user loyalty data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const currentBalance = loyaltyData?.mobile11_money_balance || 0;
    
    // Calculate maximum deductible amount respecting minimum balance rule
    // If balance > minimum, keep minimum. If balance <= minimum, can spend all.
    let maxDeductible: number;
    if (amount_thb <= currentBalance) {
      // Balance can fully cover the order — allow full deduction
      maxDeductible = currentBalance;
    } else if (currentBalance <= MINIMUM_REMAINING_THB) {
      // Balance is at or below minimum, can spend it all
      maxDeductible = currentBalance;
    } else {
      // Partial payment — keep minimum balance
      maxDeductible = currentBalance - MINIMUM_REMAINING_THB;
    }

    // Cap the actual deduction to what's allowed
    const actualDeduction = Math.min(amount_thb, maxDeductible, currentBalance);
    
    if (actualDeduction <= 0) {
      logStep("Insufficient usable balance", { currentBalance, maxDeductible, requested: amount_thb });
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient Mobile11 Money balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Log if we capped the deduction
    if (actualDeduction < amount_thb) {
      logStep("Deduction capped to respect minimum balance", { 
        requested: amount_thb, 
        actualDeduction,
        minRemainingRequired: MINIMUM_REMAINING_THB 
      });
    }

    const newBalance = currentBalance - actualDeduction;
    logStep("Deducting balance", { currentBalance, deduction: actualDeduction, newBalance });

    // Update user's loyalty balance and reset expiration date (1 year from now)
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseClient
      .from('user_loyalty')
      .update({ 
        mobile11_money_balance: newBalance,
        balance_expires_at: expirationDate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      logStep("Error updating balance", { error: updateError });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    logStep("Balance updated with expiration reset", { balance_expires_at: expirationDate });

    // Create transaction record (negative amount for spending)
    const { error: transactionError } = await supabaseClient
      .from('mobile11_money_transactions')
      .insert({
        user_id: user_id,
        order_id: order_id,
        amount: -actualDeduction,  // Negative for redeemed/spending
        type: 'redeemed',          // Valid type per DB constraint
        description: `Used Mobile11 Money for order`
      });

    if (transactionError) {
      logStep("Error creating transaction record", { error: transactionError });
      // Don't fail the whole operation, but log it
    } else {
      logStep("Transaction record created");
    }

    logStep("Deduction complete", { 
      user_id, 
      order_id, 
      requested: amount_thb,
      deducted: actualDeduction, 
      newBalance 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        deducted_amount: actualDeduction,
        new_balance: newBalance,
        capped: actualDeduction < amount_thb
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
