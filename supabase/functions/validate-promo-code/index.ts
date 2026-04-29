import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const validatePromoSchema = z.object({
  code: z.string()
    .min(1, 'Promo code is required')
    .max(50, 'Promo code too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid promo code format'),
  packageId: z.string().uuid('Invalid package ID format').optional(),
  totalAmount: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === undefined || val === null || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  })
}).refine(data => data.packageId || data.totalAmount !== undefined, {
  message: 'Either packageId or totalAmount is required'
});

// Referral reward amount in USD
const REFERRAL_DISCOUNT_USD = 5.00;

// Stripe minimum charge amount in USD
const MINIMUM_PAYMENT_USD = 0.50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    
    // Validate input with Zod schema
    const validationResult = validatePromoSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log("[VALIDATE-PROMO] Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: validationResult.error.errors[0]?.message || 'Invalid input data'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { code, packageId, totalAmount } = validationResult.data;

    console.log(`[VALIDATE-PROMO] Validating code: ${code} for ${totalAmount !== undefined ? 'total: $' + totalAmount : 'package: ' + packageId}`);

    // First, check if this is a referral code (stored in user_loyalty table)
    const { data: referralOwner, error: referralError } = await supabaseClient
      .from("user_loyalty")
      .select("user_id, referral_code")
      .ilike("referral_code", code)
      .single();

    if (!referralError && referralOwner) {
      console.log("[VALIDATE-PROMO] Found referral code owned by user:", referralOwner.user_id);
      
      // Get original price
      let originalPrice: number;
      if (totalAmount !== undefined) {
        originalPrice = totalAmount;
      } else if (packageId) {
        const { data: packageData, error: packageError } = await supabaseClient
          .from("esim_packages")
          .select("price")
          .eq("id", packageId)
          .single();

        if (packageError || !packageData) {
          return new Response(
            JSON.stringify({ valid: false, message: "Package not found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        originalPrice = parseFloat(packageData.price);
      } else {
        return new Response(
          JSON.stringify({ valid: false, message: "Unable to calculate discount" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Calculate referral discount ($5 fixed) with minimum payment cap
      let discount = Math.min(REFERRAL_DISCOUNT_USD, originalPrice);
      let finalPrice = originalPrice - discount;

      // Cap discount to ensure final price is either $0 or at least minimum payment amount
      if (finalPrice > 0 && finalPrice < MINIMUM_PAYMENT_USD) {
        finalPrice = MINIMUM_PAYMENT_USD;
        discount = originalPrice - finalPrice;
        console.log(`[VALIDATE-PROMO] Capped referral discount to maintain minimum payment: $${MINIMUM_PAYMENT_USD}`);
      }

      console.log(`[VALIDATE-PROMO] Referral code valid! Original: $${originalPrice}, Discount: $${discount}, Final: $${finalPrice}`);

      return new Response(
        JSON.stringify({
          valid: true,
          isReferral: true,
          referrerUserId: referralOwner.user_id,
          referralCode: referralOwner.referral_code,
          discount: discount.toFixed(2),
          finalPrice: finalPrice.toFixed(2),
          originalPrice: originalPrice.toFixed(2),
          message: "Referral code applied successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If not a referral code, check promo_codes table
    const { data: promoCode, error: promoError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .single();

    if (promoError || !promoCode) {
      console.log("[VALIDATE-PROMO] Code not found in promo_codes or user_loyalty");
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid promo code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if this is a Mobile11 Money topup code (not for checkout use)
    if (promoCode.discount_type === 'mobile11_money_topup') {
      console.log("[VALIDATE-PROMO] This is a top-up code, not applicable at checkout");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          isTopupCode: true,
          topupAmount: promoCode.topup_amount || promoCode.discount_value,
          message: "This is a Mobile11 Money top-up code. Redeem it in your Profile to add balance, then use Mobile11 Money at checkout."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if active
    if (!promoCode.is_active) {
      console.log("[VALIDATE-PROMO] Code is inactive");
      return new Response(
        JSON.stringify({ valid: false, message: "This promo code is no longer active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check expiration
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      console.log("[VALIDATE-PROMO] Code not yet valid");
      return new Response(
        JSON.stringify({ valid: false, message: "This promo code is not yet valid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      console.log("[VALIDATE-PROMO] Code expired");
      return new Response(
        JSON.stringify({ valid: false, message: "This promo code has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check usage limit
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      console.log("[VALIDATE-PROMO] Code usage limit reached");
      return new Response(
        JSON.stringify({ valid: false, message: "This promo code has reached its usage limit" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get original price - either from totalAmount or fetch package price
    let originalPrice: number;
    
    if (totalAmount !== undefined) {
      originalPrice = totalAmount;
      console.log(`[VALIDATE-PROMO] Using provided total amount: $${originalPrice}`);
    } else {
      // Fetch package price for backward compatibility
      const { data: packageData, error: packageError } = await supabaseClient
        .from("esim_packages")
        .select("price")
        .eq("id", packageId)
        .single();

      if (packageError || !packageData) {
        console.log("[VALIDATE-PROMO] Package not found");
        return new Response(
          JSON.stringify({ valid: false, message: "Package not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      originalPrice = parseFloat(packageData.price);
      console.log(`[VALIDATE-PROMO] Using package price: $${originalPrice}`);
    }
    let discount = 0;
    let finalPrice = originalPrice;

    // USD to THB conversion rate (approximate)
    const USD_TO_THB = 35;

    // Calculate discount
    if (promoCode.discount_type === "free") {
      discount = originalPrice;
      finalPrice = 0;
    } else if (promoCode.discount_type === "percentage") {
      discount = (originalPrice * parseFloat(promoCode.discount_value)) / 100;
      finalPrice = originalPrice - discount;
    } else if (promoCode.discount_type === "fixed_amount") {
      let discountValue = parseFloat(promoCode.discount_value);
      const promoCurrency = promoCode.currency || 'USD';
      
      // Convert discount to USD if promo is in THB (since prices are stored in USD)
      if (promoCurrency === 'THB') {
        discountValue = discountValue / USD_TO_THB;
        console.log(`[VALIDATE-PROMO] Converting THB discount: ฿${promoCode.discount_value} → $${discountValue.toFixed(2)}`);
      }
      
      discount = Math.min(discountValue, originalPrice);
      finalPrice = originalPrice - discount;
    }

    // Ensure final price is not negative
    finalPrice = Math.max(0, finalPrice);

    // Cap discount to ensure final price is either $0 or at least minimum payment amount
    if (finalPrice > 0 && finalPrice < MINIMUM_PAYMENT_USD) {
      finalPrice = MINIMUM_PAYMENT_USD;
      console.log(`[VALIDATE-PROMO] Capped discount to maintain minimum payment: $${MINIMUM_PAYMENT_USD}`);
    }
    
    discount = originalPrice - finalPrice;

    console.log(`[VALIDATE-PROMO] Valid! Original: $${originalPrice}, Discount: $${discount}, Final: $${finalPrice}`);

    return new Response(
      JSON.stringify({
        valid: true,
        promoCodeId: promoCode.id,
        discount: discount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        originalPrice: originalPrice.toFixed(2),
        message: "Promo code applied successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[VALIDATE-PROMO] Error:", error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Unable to validate promo code. Please try again.' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
