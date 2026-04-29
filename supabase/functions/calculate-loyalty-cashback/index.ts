import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LOYALTY-CASHBACK] ${step}${detailsStr}`);
};

// Tier thresholds in THB
const TIER_THRESHOLDS = {
  explorer: { min: 0, rate: 5 },
  silver: { min: 1750, rate: 7 },
  gold: { min: 3500, rate: 10 },
  platinum: { min: 7000, rate: 15 },
};

// USD to THB conversion rate
const USD_TO_THB = 35;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { order_id, backfill } = await req.json();
    
    if (!order_id) {
      throw new Error("order_id is required");
    }
    logStep("Processing order", { order_id, backfill });

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, original_amount, mobile11_money_applied, currency, status, loyalty_processed')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Skip if already processed (unless backfill mode forces reprocessing)
    if (order.loyalty_processed && !backfill) {
      logStep("Order already processed", { order_id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Already processed",
        cashback: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Only process completed orders
    if (order.status !== 'completed') {
      logStep("Order not completed, skipping", { status: order.status });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Order not completed",
        cashback: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = order.user_id;
    
    // Use total_amount (actual money paid after Mobile11 Money deducted)
    // Cashback is ONLY earned on real money spent, not on Mobile11 Money usage
    const baseAmount = order.total_amount;
    logStep("Order details", { userId, baseAmount, original_amount: order.original_amount, total_amount: order.total_amount, currency: order.currency });

    // Skip cashback if user paid nothing with real money (100% Mobile11 Money)
    if (baseAmount <= 0) {
      logStep("No real money paid, skipping cashback", { total_amount: order.total_amount, mobile11_money_applied: order.mobile11_money_applied });
      
      // Still mark as processed to prevent retries
      await supabase
        .from('orders')
        .update({ loyalty_processed: true })
        .eq('id', order_id);
        
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No cashback - paid with Mobile11 Money",
        cashback: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Convert amount to THB if needed
    let amountInTHB = baseAmount;
    if (order.currency === 'USD') {
      amountInTHB = baseAmount * USD_TO_THB;
    }
    logStep("Amount in THB (real money only)", { amountInTHB, baseAmount });

    // Fetch or create user loyalty record
    let { data: loyalty, error: loyaltyError } = await supabase
      .from('user_loyalty')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (loyaltyError && loyaltyError.code === 'PGRST116') {
      // No loyalty record exists, create one
      logStep("Creating new loyalty record");
      const { data: newLoyalty, error: createError } = await supabase
        .from('user_loyalty')
        .insert({
          user_id: userId,
          tier: 'explorer',
          total_spent: 0,
          mobile11_money_balance: 0,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create loyalty record: ${createError.message}`);
      }
      loyalty = newLoyalty;
    } else if (loyaltyError) {
      throw new Error(`Failed to fetch loyalty: ${loyaltyError.message}`);
    }

    logStep("Current loyalty state", { 
      tier: loyalty.tier, 
      total_spent: loyalty.total_spent,
      balance: loyalty.mobile11_money_balance 
    });

    // Determine current tier's cashback rate
    const currentTier = loyalty.tier || 'explorer';
    const tierConfig = TIER_THRESHOLDS[currentTier as keyof typeof TIER_THRESHOLDS] || TIER_THRESHOLDS.explorer;
    const cashbackRate = tierConfig.rate / 100;
    
    // Calculate cashback
    const cashbackAmount = Math.round(amountInTHB * cashbackRate * 100) / 100;
    logStep("Cashback calculated", { rate: tierConfig.rate, cashbackAmount });

    // Calculate new totals
    const newTotalSpent = (loyalty.total_spent || 0) + amountInTHB;
    const newBalance = (loyalty.mobile11_money_balance || 0) + cashbackAmount;

    // Determine new tier based on new total spent
    let newTier = 'explorer';
    if (newTotalSpent >= TIER_THRESHOLDS.platinum.min) {
      newTier = 'platinum';
    } else if (newTotalSpent >= TIER_THRESHOLDS.gold.min) {
      newTier = 'gold';
    } else if (newTotalSpent >= TIER_THRESHOLDS.silver.min) {
      newTier = 'silver';
    }

    const tierUpgraded = newTier !== currentTier;
    logStep("New tier calculation", { newTotalSpent, newTier, tierUpgraded });

    // Update user loyalty record with expiration date (1 year from now)
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from('user_loyalty')
      .update({
        total_spent: newTotalSpent,
        mobile11_money_balance: newBalance,
        tier: newTier,
        balance_expires_at: expirationDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update loyalty: ${updateError.message}`);
    }
    logStep("Loyalty record updated with expiration", { balance_expires_at: expirationDate });

    // Check for existing earned transaction for this order (prevent duplicates)
    const { data: existingTx } = await supabase
      .from('mobile11_money_transactions')
      .select('id')
      .eq('order_id', order_id)
      .eq('type', 'earned')
      .maybeSingle();

    if (existingTx) {
      logStep("Transaction record already exists, skipping", { order_id });
    } else {
      // Create transaction record
      const { error: txError } = await supabase
        .from('mobile11_money_transactions')
        .insert({
          user_id: userId,
          order_id: order_id,
          amount: cashbackAmount,
          type: 'earned',
          description: `${tierConfig.rate}% cashback for order`,
        });

      if (txError) {
        logStep("Warning: Failed to create transaction record", { error: txError.message });
        // Don't throw - the balance is already updated
      } else {
        logStep("Transaction record created");
      }
    }

    // Mark order as loyalty processed
    await supabase
      .from('orders')
      .update({ loyalty_processed: true })
      .eq('id', order_id);

    logStep("Order marked as processed");

    return new Response(JSON.stringify({
      success: true,
      order_id,
      cashback_amount: cashbackAmount,
      new_balance: newBalance,
      new_total_spent: newTotalSpent,
      tier: newTier,
      tier_upgraded: tierUpgraded,
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
