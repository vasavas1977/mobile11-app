import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-M11-CODE] ${step}${detailsStr}`);
};

// Input validation schema
const redeemCodeSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(50, 'Code too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid code format'),
});

// Conversion rate
const USD_TO_THB = 35;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logStep("Auth failed", { error: authError?.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Please sign in to redeem codes' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    logStep("User authenticated", { userId: user.id });

    // Parse and validate request body
    const body = await req.json();
    const validationResult = redeemCodeSchema.safeParse(body);
    
    if (!validationResult.success) {
      logStep("Validation failed", validationResult.error.errors);
      return new Response(
        JSON.stringify({ success: false, error: validationResult.error.errors[0]?.message || 'Invalid input' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { code } = validationResult.data;
    logStep("Validating code", { code: code.toUpperCase() });

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the code in promo_codes table
    const { data: promoCode, error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .single();

    if (promoError || !promoCode) {
      logStep("Code not found", { code });
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid code' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if it's a Mobile11 Money topup code
    if (promoCode.discount_type !== 'mobile11_money_topup') {
      logStep("Not a topup code", { discount_type: promoCode.discount_type });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This code is not a Mobile11 Money top-up code. Please use it at checkout instead.',
          isCheckoutCode: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if active
    if (!promoCode.is_active) {
      logStep("Code inactive");
      return new Response(
        JSON.stringify({ success: false, error: 'This code is no longer active' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check expiration
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      logStep("Code not yet valid");
      return new Response(
        JSON.stringify({ success: false, error: 'This code is not yet valid' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      logStep("Code expired");
      return new Response(
        JSON.stringify({ success: false, error: 'This code has expired' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check usage limit
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      logStep("Code usage limit reached");
      return new Response(
        JSON.stringify({ success: false, error: 'This code has reached its usage limit' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if user has already used this code
    const { data: existingUsage } = await supabaseAdmin
      .from("promo_code_usage")
      .select("id")
      .eq("promo_code_id", promoCode.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingUsage) {
      logStep("User already used this code");
      return new Response(
        JSON.stringify({ success: false, error: 'You have already used this code' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Calculate top-up amount in THB (balance is stored in THB)
    let topupAmountThb = promoCode.topup_amount || promoCode.discount_value || 0;
    const codeCurrency = promoCode.currency || 'THB';
    
    if (codeCurrency === 'USD') {
      topupAmountThb = topupAmountThb * USD_TO_THB;
      logStep("Converting USD to THB", { usd: promoCode.topup_amount, thb: topupAmountThb });
    }

    if (topupAmountThb <= 0) {
      logStep("Invalid topup amount", { topupAmountThb });
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid code value' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get or create user loyalty record
    const { data: loyaltyData, error: loyaltyError } = await supabaseAdmin
      .from("user_loyalty")
      .select("mobile11_money_balance")
      .eq("user_id", user.id)
      .single();

    let currentBalance = loyaltyData?.mobile11_money_balance || 0;
    
    if (loyaltyError && loyaltyError.code === 'PGRST116') {
      // No loyalty record exists, create one
      await supabaseAdmin
        .from("user_loyalty")
        .insert({ user_id: user.id, mobile11_money_balance: 0 });
      currentBalance = 0;
    }

    const newBalance = currentBalance + topupAmountThb;
    logStep("Updating balance", { currentBalance, topupAmountThb, newBalance });

    // Update user balance with new expiration date
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("user_loyalty")
      .update({ 
        mobile11_money_balance: newBalance,
        balance_expires_at: expirationDate,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Failed to update balance", { error: updateError });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to add balance' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Record transaction
    await supabaseAdmin
      .from("mobile11_money_transactions")
      .insert({
        user_id: user.id,
        amount: topupAmountThb,
        type: 'topup',
        description: `Redeemed code: ${promoCode.code}`
      });

    // Record promo code usage
    await supabaseAdmin
      .from("promo_code_usage")
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id,
        discount_applied: topupAmountThb
      });

    // Increment code usage count
    await supabaseAdmin.rpc('increment_promo_code_usage', { promo_id: promoCode.id });

    logStep("Code redeemed successfully", { 
      code: promoCode.code, 
      amount: topupAmountThb, 
      newBalance 
    });

    const displayAmount = codeCurrency === 'USD' 
      ? `$${promoCode.topup_amount || promoCode.discount_value}` 
      : `฿${topupAmountThb}`;

    return new Response(
      JSON.stringify({
        success: true,
        addedAmount: topupAmountThb,
        displayAmount,
        newBalance,
        message: `Successfully added ${displayAmount} to your Mobile11 Money balance!`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: 'Unable to redeem code. Please try again.' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
