import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[UPSERT-ESIM-PACKAGE] Request received");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Step 1: Authenticate user with anon key
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error("[UPSERT-ESIM-PACKAGE] No authorization header");
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) {
    console.error("[UPSERT-ESIM-PACKAGE] Authentication failed");
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Step 2: Verify admin role
  const { data: isAdmin } = await supabaseAnon.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  if (!isAdmin) {
    console.error("[UPSERT-ESIM-PACKAGE] User is not admin:", user.id);
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log("[UPSERT-ESIM-PACKAGE] Admin access verified for user:", user.id);

  // Step 3: NOW safe to use service role for admin operations
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { package: pkg } = await req.json();
    console.log("[UPSERT-ESIM-PACKAGE] Payload received", pkg?.id);

    if (!pkg) {
      console.error("[UPSERT-ESIM-PACKAGE] Missing package payload");
      throw new Error("Invalid request data");
    }
    if (!pkg.id) {
      console.error("[UPSERT-ESIM-PACKAGE] Package id is required");
      throw new Error("Invalid request data");
    }

    // Fetch existing record so we don't accidentally overwrite critical fields
    const { data: existing, error: fetchErr } = await supabase
      .from("esim_packages")
      .select("id, package_id, name, description, country_code, country_name, data_amount, validity_days, price, currency, is_active")
      .eq("id", pkg.id)
      .maybeSingle();

    if (fetchErr) {
      console.warn("[UPSERT-ESIM-PACKAGE] Warning fetching existing record", fetchErr);
    }

    // Determine the correct provider option id to store
    let effectivePackageId: string | null = null;
    if (existing) {
      effectivePackageId = pkg.package_id ?? existing.package_id ?? null;
    } else {
      // For brand new records, require an explicit provider package_id
      if (!pkg.package_id) {
        console.error("[UPSERT-ESIM-PACKAGE] package_id required for new packages");
        throw new Error("Invalid request data");
      }
      effectivePackageId = pkg.package_id;
    }

    // Sync price with normal_price to ensure admin console and end-user prices match
    const normalPrice = pkg.normal_price !== undefined ? Number(pkg.normal_price) : undefined;
    const syncedPrice = normalPrice ?? Number(pkg.price ?? existing?.price ?? 0);

    const record = {
      id: pkg.id,
      package_id: effectivePackageId!,
      name: (pkg.name ?? existing?.name ?? "eSIM Package") as string,
      description: (pkg.description ?? existing?.description ?? null) as string | null,
      country_code: (pkg.country_code ?? existing?.country_code ?? "GLOBAL") as string,
      country_name: (pkg.country_name ?? existing?.country_name ?? "Global") as string,
      data_amount: (pkg.data_amount ?? existing?.data_amount ?? "0MB") as string,
      validity_days: Number(pkg.validity_days ?? existing?.validity_days ?? 30),
      price: syncedPrice,
      normal_price: normalPrice,
      currency: (pkg.currency ?? existing?.currency ?? "USD") as string,
      is_active: (existing?.is_active ?? true) as boolean,
      
      // Additional package fields
      short_name: pkg.short_name ?? null,
      category: pkg.category ?? null,
      package_type: pkg.package_type ?? null,
      daily_data_reset: pkg.daily_data_reset ?? null,
      daily_reset_amount: pkg.daily_reset_amount ?? null,
      carrier: pkg.carrier ?? null,
      network_type: pkg.network_type ?? null,
      qos_speed: pkg.qos_speed ?? null,
      speed_after_limit: pkg.speed_after_limit ?? null,
      sim_type: pkg.sim_type ?? null,
      validity_period: pkg.validity_period ?? null,
      access_type: pkg.access_type ?? null,
      apn: pkg.apn ?? null,
      support_data: pkg.support_data ?? null,
      support_voice: pkg.support_voice ?? null,
      support_sms: pkg.support_sms ?? null,
      hot_spot: pkg.hot_spot ?? null,
      top_up: pkg.top_up ?? null,
      kyc: pkg.kyc ?? null,
      pre_installation: pkg.pre_installation ?? null,
      activation_note: pkg.activation_note ?? null,
      is_cancelable: pkg.is_cancelable ?? null,
      cost_price: pkg.cost_price ?? null,
      min_sell_price: pkg.min_sell_price ?? null,
      markup_percentage: pkg.markup_percentage ?? null,
      markup_fixed: pkg.markup_fixed ?? null,
      is_featured: pkg.is_featured ?? null,
      featured_order: pkg.featured_order ?? null,
      purchase_count: pkg.purchase_count ?? null,
      availability: pkg.availability ?? null,
      service_type: pkg.service_type ?? null,
      included_countries: pkg.included_countries ?? null,
      initialize_policy: pkg.initialize_policy ?? null,
    };

    const { error } = await supabase
      .from("esim_packages")
      .upsert(record, { onConflict: "id" });

    if (error) {
      console.error("[UPSERT-ESIM-PACKAGE] Upsert error", error);
      throw error;
    }

    console.log("[UPSERT-ESIM-PACKAGE] Upsert success", record.id);

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[UPSERT-ESIM-PACKAGE] ERROR", message);
    return new Response(JSON.stringify({ error: 'Unable to save package. Please try again.' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});