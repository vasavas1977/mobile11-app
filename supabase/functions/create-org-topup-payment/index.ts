import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { amount, organizationId, paymentMethod = 'stripe', language } = await req.json();
    console.log('[ORG-TOPUP] Request received:', { amount, organizationId, paymentMethod });

    // Validate amount
    if (!amount || amount < 1000) {
      return new Response(JSON.stringify({ error: "Minimum top-up amount is ฿1,000" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData?.user) {
      console.error('[ORG-TOPUP] Auth error:', authError);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    console.log('[ORG-TOPUP] User authenticated:', user.email);

    // Verify user is admin/owner of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      console.error('[ORG-TOPUP] Membership error:', membershipError);
      return new Response(JSON.stringify({ error: "Not a member of this organization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Only organization admins can top up credit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, billing_email')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('[ORG-TOPUP] Org error:', orgError);
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Create topup request record
    const { data: topupRequest, error: topupError } = await supabase
      .from('organization_topup_requests')
      .insert({
        organization_id: organizationId,
        amount,
        payment_method: paymentMethod,
        created_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (topupError) {
      console.error('[ORG-TOPUP] Failed to create topup request:', topupError);
      return new Response(JSON.stringify({ error: "Failed to create top-up request" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('[ORG-TOPUP] Created topup request:', topupRequest.id);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_PROD_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customerEmail = org.billing_email || user.email;
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe Checkout Session
    const origin = req.headers.get("origin") || "https://esimflow-connect.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      locale: language || 'auto',
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `Organization Credit Top-Up`,
              description: `Credit top-up for ${org.name}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to satang
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/business/transactions?topup=success&amount=${amount}`,
      cancel_url: `${origin}/business/transactions?topup=cancelled`,
      metadata: {
        type: 'org_credit_topup',
        organization_id: organizationId,
        topup_request_id: topupRequest.id,
        amount: amount.toString(),
        user_id: user.id,
      },
    });

    // Update topup request with Stripe session ID
    await supabase
      .from('organization_topup_requests')
      .update({ 
        stripe_session_id: session.id,
        payment_reference: session.id 
      })
      .eq('id', topupRequest.id);

    console.log('[ORG-TOPUP] Stripe session created:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      topupRequestId: topupRequest.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[ORG-TOPUP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
