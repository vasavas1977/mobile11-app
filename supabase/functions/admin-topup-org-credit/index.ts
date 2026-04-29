import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-TOPUP-ORG-CREDIT] ${step}${detailsStr}`);
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

    // Initialize client with user token to check admin status
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

    // Check if user is admin
    const { data: roles } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      logStep("Not admin", { userId: user.id });
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { organization_id, amount, note } = await req.json();
    logStep("Request received", { organization_id, amount, note, adminId: user.id });

    if (!organization_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid organization_id or amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
    const newBalance = currentBalance + amount;

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
        amount: amount,
        type: 'topup',
        description: note || `Credit top-up by admin`,
        performed_by: user.id,
        balance_after: newBalance
      });

    if (txError) {
      logStep("Failed to create transaction record", { error: txError });
      // Don't fail the operation, just log
    }

    logStep("Top-up complete", { 
      organization: org.name,
      previousBalance: currentBalance,
      added: amount,
      newBalance 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        previous_balance: currentBalance,
        added_amount: amount,
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
