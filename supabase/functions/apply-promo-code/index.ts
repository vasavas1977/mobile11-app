import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const promoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required').max(50, 'Promo code too long').regex(/^[A-Za-z0-9_-]+$/, 'Invalid promo code format'),
  orderId: z.string().uuid('Invalid order ID format'),
  packageId: z.string().uuid('Invalid package ID format'),
  language: z.string().max(10).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('[AUTH] No authorization header provided');
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('[AUTH] User authentication failed:', userError);
      throw new Error("Authentication required");
    }

    const user = userData.user;

    // Validate input
    const body = await req.json();
    const validationResult = promoCodeSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('[VALIDATION] Input validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request data', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, orderId, packageId, language } = validationResult.data;

    console.log(`[APPLY-PROMO] User ${user.id} applying code ${code} to order ${orderId}`);

    // Validate promo code first
    const { data: promoCode, error: promoError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .single();

    if (promoError || !promoCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid promo code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check all validations
    const now = new Date();
    if (!promoCode.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: "Promo code is inactive" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return new Response(
        JSON.stringify({ success: false, error: "Promo code has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return new Response(
        JSON.stringify({ success: false, error: "Promo code usage limit reached" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get package price
    const { data: packageData, error: packageError } = await supabaseClient
      .from("esim_packages")
      .select("price")
      .eq("id", packageId)
      .single();

    if (packageError || !packageData) {
      return new Response(
        JSON.stringify({ success: false, error: "Package not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const originalPrice = parseFloat(packageData.price);
    let discount = 0;

    // Calculate discount
    if (promoCode.discount_type === "free") {
      discount = originalPrice;
    } else if (promoCode.discount_type === "percentage") {
      discount = (originalPrice * parseFloat(promoCode.discount_value)) / 100;
    } else if (promoCode.discount_type === "fixed_amount") {
      discount = Math.min(parseFloat(promoCode.discount_value), originalPrice);
    }

    const finalPrice = Math.max(0, originalPrice - discount);

    console.log(`[APPLY-PROMO] Calculated - Original: ${originalPrice}, Discount: ${discount}, Final: ${finalPrice}`);

    // Update order with promo code info
    const { error: orderUpdateError } = await supabaseClient
      .from("orders")
      .update({
        promo_code_id: promoCode.id,
        discount_amount: discount,
        original_amount: originalPrice,
        total_amount: finalPrice,
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      console.error("[APPLY-PROMO] Order update error:", orderUpdateError);
      throw new Error("Unable to apply promo code. Please try again.");
    }

    // Increment promo code usage
    const { error: usageUpdateError } = await supabaseClient
      .from("promo_codes")
      .update({ current_uses: promoCode.current_uses + 1 })
      .eq("id", promoCode.id);

    if (usageUpdateError) {
      console.error("[APPLY-PROMO] Usage update error:", usageUpdateError);
    }

    // Record usage
    const { error: usageRecordError } = await supabaseClient
      .from("promo_code_usage")
      .insert({
        promo_code_id: promoCode.id,
        order_id: orderId,
        user_id: user.id,
        discount_applied: discount,
      });

    if (usageRecordError) {
      console.error("[APPLY-PROMO] Usage record error:", usageRecordError);
    }

    // If final price is 0, mark payment as completed
    if (finalPrice === 0) {
      console.log("[APPLY-PROMO] Free order - marking as completed");
      
      const { error: paymentUpdateError } = await supabaseClient
        .from("payments")
        .update({
          status: "completed",
          payment_method: "promo_code",
        })
        .eq("order_id", orderId);

      if (paymentUpdateError) {
        console.error("[APPLY-PROMO] Payment update error:", paymentUpdateError);
      }

      const { error: orderStatusError } = await supabaseClient
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      if (orderStatusError) {
        console.error("[APPLY-PROMO] Order status update error:", orderStatusError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          requiresPayment: false,
          finalPrice: 0,
          message: "Promo code applied - order is free!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If there's still a price, create Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_PROD_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      locale: language || 'auto',
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `eSIM Package (Discounted)`,
              description: `Original price: $${originalPrice.toFixed(2)} - Discount: $${discount.toFixed(2)}`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        orderId: orderId,
        promoCode: code,
      },
    });

    console.log("[APPLY-PROMO] Stripe session created for discounted order");

    return new Response(
      JSON.stringify({
        success: true,
        requiresPayment: true,
        checkoutUrl: session.url,
        finalPrice: finalPrice,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[APPLY-PROMO] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'Unable to apply promo code. Please try again.' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
