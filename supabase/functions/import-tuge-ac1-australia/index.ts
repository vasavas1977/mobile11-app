import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TUGE_PROVIDER_ID = "4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac";
const USIMSA_PROVIDER_ID = "ed79f1a9-1c6f-450f-aae3-7fefc5cc2692";
const MARKUP = 4.0;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const summary = {
    dayPassImported: 0,
    maxSpeedImported: 0,
    limitlessImported: 0,
    usimsakDeactivated: 0,
    errors: [] as string[],
  };

  try {
    // ── Step 1: Fetch all TUGE ac1 AU products with validity_period=60 ──
    const { data: tugeProducts, error: fetchErr } = await supabase
      .from("tuge_product_cache")
      .select("*")
      .eq("card_type", "ac1")
      .eq("validity_period", 60)
      .contains("countries", JSON.stringify(["AU"]));

    if (fetchErr) throw new Error(`Failed to fetch tuge_product_cache: ${fetchErr.message}`);
    if (!tugeProducts || tugeProducts.length === 0) throw new Error("No TUGE ac1 AU products found");

    console.log(`[IMPORT-AC1-AU] Found ${tugeProducts.length} TUGE ac1 AU products`);

    // Separate by type
    const dailyPacks = tugeProducts.filter((p: any) => p.product_type === "DAILY_PACK" && p.high_speed !== "Unlimited");
    const limitlessPacks = tugeProducts.filter((p: any) => p.product_type === "DAILY_PACK" && p.high_speed === "Unlimited");
    const dataPacks = tugeProducts.filter((p: any) => p.product_type === "DATA_PACK");

    console.log(`[IMPORT-AC1-AU] Daily: ${dailyPacks.length}, Limitless: ${limitlessPacks.length}, Data: ${dataPacks.length}`);

    // ── Helper: parse data amount ──
    function parseDataAmount(highSpeed: string): string {
      if (highSpeed === "Unlimited") return "Unlimited";
      // "500M" -> "500MB", "1GB" -> "1GB"
      if (highSpeed.endsWith("M") && !highSpeed.endsWith("MB")) {
        return highSpeed + "B";
      }
      return highSpeed;
    }

    // ── Helper: build package name ──
    function buildName(type: string, dataAmt: string, days: number): string {
      if (type === "limitless") return `Australia Unlimited ${days}-Day`;
      if (type === "day_pass") return `Australia ${dataAmt}/day ${days}-Day`;
      return `Australia ${dataAmt} ${days}-Day`;
    }

    // ── Step 2: Import day_pass packages (exclude 30d/2GB and 30d/3GB) ──
    for (const p of dailyPacks) {
      const usagePeriod = Number(p.usage_period);
      const dataRaw = parseDataAmount(p.high_speed);

      // Exclude 30d/2GB and 30d/3GB day_pass — USIMSA is cheaper
      if (usagePeriod === 30 && (dataRaw === "2GB" || dataRaw === "3GB")) {
        console.log(`[IMPORT-AC1-AU] Skipping day_pass ${usagePeriod}d/${dataRaw} (USIMSA cheaper)`);
        continue;
      }

      const costPrice = Number(p.net_price);
      const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
      const dataAmount = dataRaw + "/day";

      const record = {
        package_id: p.product_code,
        provider_id: TUGE_PROVIDER_ID,
        name: buildName("day_pass", dataRaw, usagePeriod),
        country_code: "AU",
        country_name: "Australia",
        package_type: "day_pass",
        validity_days: usagePeriod,
        data_amount: dataAmount,
        daily_data_reset: true,
        daily_reset_amount: dataRaw,
        speed_after_limit: p.limit_speed || "384kbps",
        carrier: "Optus/Vodafone",
        cost_price: costPrice,
        price: retailPrice,
        normal_price: retailPrice,
        currency: "USD",
        is_active: true,
        sim_type: "eSIM",
        support_data: true,
        hot_spot: true,
        top_up: true,
        validity_period: `${p.validity_period}Days`,
        provider_metadata: { card_type: "ac1", source: "bulk-import-ac1" },
      };

      const { error } = await supabase
        .from("esim_packages")
        .upsert(record, { onConflict: "package_id" });

      if (error) {
        summary.errors.push(`day_pass ${p.product_code}: ${error.message}`);
      } else {
        summary.dayPassImported++;
      }
    }

    // ── Step 3: Import max_speed packages (only tiers where TUGE is cheaper) ──
    // Target: 30d/1GB, 30d/3GB, 30d/5GB, 30d/10GB, 7d/1GB
    const maxSpeedTargets = [
      { days: 30, data: "1GB" },
      { days: 30, data: "3GB" },
      { days: 30, data: "5GB" },
      { days: 30, data: "10GB" },
      { days: 7, data: "1GB" },
    ];

    for (const dp of dataPacks) {
      const usagePeriod = Number(dp.usage_period);
      const dataRaw = parseDataAmount(dp.high_speed);

      const isTarget = maxSpeedTargets.some(t => t.days === usagePeriod && t.data === dataRaw);
      if (!isTarget) {
        // Still import as additional offerings but keep them — all TUGE max_speed tiers are useful
        // For non-target tiers, import them too as new offerings
      }

      const costPrice = Number(dp.net_price);
      const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;

      const record = {
        package_id: dp.product_code,
        provider_id: TUGE_PROVIDER_ID,
        name: buildName("max_speed", dataRaw, usagePeriod),
        country_code: "AU",
        country_name: "Australia",
        package_type: "max_speed",
        validity_days: usagePeriod,
        data_amount: dataRaw,
        qos_speed: "Max Speed",
        carrier: "Optus/Vodafone",
        cost_price: costPrice,
        price: retailPrice,
        normal_price: retailPrice,
        currency: "USD",
        is_active: true,
        sim_type: "eSIM",
        support_data: true,
        hot_spot: true,
        top_up: true,
        validity_period: `${dp.validity_period}Days`,
        provider_metadata: { card_type: "ac1", source: "bulk-import-ac1" },
      };

      const { error } = await supabase
        .from("esim_packages")
        .upsert(record, { onConflict: "package_id" });

      if (error) {
        summary.errors.push(`max_speed ${dp.product_code}: ${error.message}`);
      } else {
        summary.maxSpeedImported++;
      }
    }

    // ── Step 4: Import limitless packages ──
    for (const lp of limitlessPacks) {
      const usagePeriod = Number(lp.usage_period);
      const costPrice = Number(lp.net_price);
      const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;

      const record = {
        package_id: lp.product_code,
        provider_id: TUGE_PROVIDER_ID,
        name: buildName("limitless", "Unlimited", usagePeriod),
        country_code: "AU",
        country_name: "Australia",
        package_type: "limitless",
        validity_days: usagePeriod,
        data_amount: "Unlimited",
        qos_speed: "Unlimited",
        carrier: "Optus/Vodafone",
        cost_price: costPrice,
        price: retailPrice,
        normal_price: retailPrice,
        currency: "USD",
        is_active: true,
        sim_type: "eSIM",
        support_data: true,
        hot_spot: true,
        top_up: true,
        validity_period: `${lp.validity_period}Days`,
        provider_metadata: { card_type: "ac1", source: "bulk-import-ac1" },
      };

      const { error } = await supabase
        .from("esim_packages")
        .upsert(record, { onConflict: "package_id" });

      if (error) {
        summary.errors.push(`limitless ${lp.product_code}: ${error.message}`);
      } else {
        summary.limitlessImported++;
      }
    }

    // ── Step 5: Deactivate replaced USIMSA packages ──
    // Deactivate 26 USIMSA day_pass (all except 30d/2GB and 30d/3GB)
    const { data: usimsDayPass, error: dpFetchErr } = await supabase
      .from("esim_packages")
      .select("id, validity_days, data_amount, package_type")
      .eq("provider_id", USIMSA_PROVIDER_ID)
      .eq("country_name", "Australia")
      .eq("package_type", "day_pass")
      .eq("is_active", true);

    if (dpFetchErr) {
      summary.errors.push(`Fetch USIMSA day_pass: ${dpFetchErr.message}`);
    } else if (usimsDayPass) {
      const toDeactivate = usimsDayPass.filter((pkg: any) => {
        // Keep 30d/2GB and 30d/3GB
        if (pkg.validity_days === 30 && (pkg.data_amount === "2GB/day" || pkg.data_amount === "3GB/day")) {
          return false;
        }
        return true;
      });

      for (const pkg of toDeactivate) {
        const { error } = await supabase
          .from("esim_packages")
          .update({ is_active: false })
          .eq("id", pkg.id);

        if (error) {
          summary.errors.push(`Deactivate USIMSA dp ${pkg.id}: ${error.message}`);
        } else {
          summary.usimsakDeactivated++;
        }
      }
    }

    // Deactivate 5 USIMSA max_speed tiers where TUGE is cheaper
    const msDeactivateTargets = [
      { days: 30, data: "1GB" },
      { days: 30, data: "3GB" },
      { days: 30, data: "5GB" },
      { days: 30, data: "10GB" },
      { days: 7, data: "1GB" },
    ];

    const { data: usimsMaxSpeed, error: msFetchErr } = await supabase
      .from("esim_packages")
      .select("id, validity_days, data_amount, package_type")
      .eq("provider_id", USIMSA_PROVIDER_ID)
      .eq("country_name", "Australia")
      .eq("package_type", "max_speed")
      .eq("is_active", true);

    if (msFetchErr) {
      summary.errors.push(`Fetch USIMSA max_speed: ${msFetchErr.message}`);
    } else if (usimsMaxSpeed) {
      const toDeactivateMs = usimsMaxSpeed.filter((pkg: any) => {
        return msDeactivateTargets.some(t => t.days === pkg.validity_days && t.data === pkg.data_amount);
      });

      for (const pkg of toDeactivateMs) {
        const { error } = await supabase
          .from("esim_packages")
          .update({ is_active: false })
          .eq("id", pkg.id);

        if (error) {
          summary.errors.push(`Deactivate USIMSA ms ${pkg.id}: ${error.message}`);
        } else {
          summary.usimsakDeactivated++;
        }
      }
    }

    console.log("[IMPORT-AC1-AU] Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify({
      success: true,
      summary,
      message: `Imported ${summary.dayPassImported} day_pass, ${summary.maxSpeedImported} max_speed, ${summary.limitlessImported} limitless. Deactivated ${summary.usimsakDeactivated} USIMSA packages.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[IMPORT-AC1-AU] ERROR:", message);
    return new Response(JSON.stringify({ error: message, summary }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
