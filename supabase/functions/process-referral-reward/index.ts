import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REFERRAL-REWARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Processing referral reward", { order_id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch order with webhook_data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, webhook_data, total_amount, original_amount, currency')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      logStep("Order not found", { order_id, error: orderError });
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookData = order.webhook_data as any;
    if (!webhookData?.is_referral_order || !webhookData?.referrer_user_id) {
      logStep("Not a referral order, skipping");
      return new Response(JSON.stringify({ success: true, message: "Not a referral order" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const referrerId = webhookData.referrer_user_id;
    const referredId = order.user_id;
    const referralCode = webhookData.referral_code_used;

    // Self-referral check
    if (referrerId === referredId) {
      logStep("Self-referral detected, skipping");
      return new Response(JSON.stringify({ success: false, message: "Self-referral not allowed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check minimum order amount from system_settings
    const { data: minAmountSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'referral_min_order_amount')
      .single();

    const minOrderAmountUSD = minAmountSetting?.value ? parseFloat(String(minAmountSetting.value)) : 10;
    const orderAmountUSD = order.currency === 'THB' 
      ? (order.original_amount || order.total_amount) / 35 
      : (order.original_amount || order.total_amount);

    if (orderAmountUSD < minOrderAmountUSD) {
      logStep("Order below minimum", { orderAmountUSD, minOrderAmountUSD });
      return new Response(JSON.stringify({ success: false, message: "Order below minimum for referral reward" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate: has this referred user already been rewarded?
    const { data: existingReferral } = await supabase
      .from('user_referrals')
      .select('id')
      .eq('referred_id', referredId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingReferral) {
      logStep("Referred user already rewarded", { referredId });
      return new Response(JSON.stringify({ success: true, message: "Referral already processed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get referral reward amount from system_settings (default 5 USD = 175 THB)
    const { data: rewardSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'referral_reward_amount')
      .single();

    const rewardAmountUSD = rewardSetting?.value ? parseFloat(String(rewardSetting.value)) : 5;
    const REWARD_THB = rewardAmountUSD * 35; // 5 USD = 175 THB

    logStep("Crediting referrer", { referrerId, rewardTHB: REWARD_THB, rewardUSD: rewardAmountUSD });

    // Insert user_referrals record
    const { error: referralInsertError } = await supabase
      .from('user_referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        referral_code: referralCode,
        status: 'completed',
        reward_amount: rewardAmountUSD,
        order_id: order.id,
        order_amount: order.original_amount || order.total_amount,
        completed_at: new Date().toISOString(),
        reward_credited_at: new Date().toISOString(),
      });

    if (referralInsertError) {
      // Could be a duplicate constraint violation
      logStep("Failed to insert referral record", { error: referralInsertError });
      if (referralInsertError.code === '23505') {
        return new Response(JSON.stringify({ success: true, message: "Referral already recorded" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw referralInsertError;
    }

    // Credit referrer's Mobile11 Money balance
    const { error: balanceError } = await supabase
      .from('user_loyalty')
      .update({ 
        mobile11_money_balance: undefined as any // We'll use raw increment below
      })
      .eq('user_id', referrerId);

    // Use RPC or direct SQL increment for atomic balance update
    const { error: rpcError } = await supabase.rpc('increment_mobile11_money', {
      p_user_id: referrerId,
      p_amount: REWARD_THB
    });

    if (rpcError) {
      // Fallback: direct update
      logStep("RPC not available, using direct update", { error: rpcError });
      const { data: currentLoyalty } = await supabase
        .from('user_loyalty')
        .select('mobile11_money_balance')
        .eq('user_id', referrerId)
        .single();

      const currentBalance = currentLoyalty?.mobile11_money_balance || 0;
      await supabase
        .from('user_loyalty')
        .update({ mobile11_money_balance: currentBalance + REWARD_THB })
        .eq('user_id', referrerId);
    }

    // Get referred user's email for transaction description
    const { data: referredProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', referredId)
      .single();

    const referredEmail = referredProfile?.email || 'a friend';

    // Insert transaction record
    await supabase.from('mobile11_money_transactions').insert({
      user_id: referrerId,
      amount: REWARD_THB,
      type: 'referral_reward',
      description: `Referral reward - ${referredEmail} used your code`,
      order_id: order.id,
    });

    logStep("Referral reward credited successfully", { referrerId, amount: REWARD_THB });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Referral reward credited",
      reward_amount_thb: REWARD_THB,
      referrer_id: referrerId
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
