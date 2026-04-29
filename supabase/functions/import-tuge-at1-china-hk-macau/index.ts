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
    usimsaDeactivated: 0,
    errors: [] as string[],
  };

  try {
    // ── Step 1: Fetch TUGE AT1 AU products for China/HK/Macau ──
    const { data: tugeProducts, error: fetchErr } = await supabase
      .from("tuge_product_cache")
      .select("*")
      .eq("card_type", "at1")
      .like("product_code", "%AU%")
      .contains("countries", JSON.stringify(["CN"]));

    if (fetchErr) throw new Error(`Failed to fetch tuge_product_cache: ${fetchErr.message}`);
    if (!tugeProducts || tugeProducts.length === 0) throw new Error("No TUGE at1 AU products with CN found");

    console.log(`[IMPORT-AT1-CHN-HK-MO] Found ${tugeProducts.length} TUGE at1 products`);

    // Separate by type
    const dailyPacks = tugeProducts.filter((p: any) => p.product_type === "DAILY_PACK" && p.high_speed !== "Unlimited");
    const limitlessPacks = tugeProducts.filter((p: any) => p.product_type === "DAILY_PACK" && p.high_speed === "Unlimited");
    const dataPacks = tugeProducts.filter((p: any) => p.product_type === "DATA_PACK");

    console.log(`[IMPORT-AT1-CHN-HK-MO] Daily: ${dailyPacks.length}, Limitless: ${limitlessPacks.length}, Data: ${dataPacks.length}`);

    // ── Helper: parse data amount ──
    function parseDataAmount(highSpeed: string): string {
      if (highSpeed === "Unlimited") return "Unlimited";
      if (highSpeed.endsWith("M") && !highSpeed.endsWith("MB")) {
        return highSpeed + "B";
      }
      return highSpeed;
    }

    // ── Helper: build package name ──
    const DEST_NAME = "China/Hong Kong/Macau";
    function buildName(type: string, dataAmt: string, days: number): string {
      if (type === "limitless") return `${DEST_NAME} Unlimited ${days}-Day`;
      if (type === "day_pass") return `${DEST_NAME} ${dataAmt}/day ${days}-Day`;
      return `${DEST_NAME} ${dataAmt} ${days}-Day`;
    }

    // ── Step 2: Import day_pass packages ──
    for (const p of dailyPacks) {
      const usagePeriod = Number(p.usage_period);
      const dataRaw = parseDataAmount(p.high_speed);
      const costPrice = Number(p.net_price);
      const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
      const dataAmount = dataRaw + "/day";

      const record = {
        package_id: p.product_code,
        provider_id: TUGE_PROVIDER_ID,
        name: buildName("day_pass", dataRaw, usagePeriod),
        country_code: "HK",
        country_name: DEST_NAME,
        package_type: "day_pass",
        validity_days: usagePeriod,
        data_amount: dataAmount,
        daily_data_reset: true,
        daily_reset_amount: dataRaw,
        speed_after_limit: p.limit_speed || "384kbps",
        carrier: "CTExcel",
        cost_price: costPrice,
        price: retailPrice,
        normal_price: retailPrice,
        currency: "USD",
        is_active: true,
        sim_type: "eSIM",
        support_data: true,
        hot_spot: true,
        top_up: true,
        supports_extension: true,
        kyc: false,
        validity_period: `${p.validity_period}Days`,
        provider_metadata: { card_type: "at1", source: "bulk-import-at1-china-hk-macau" },
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

    // ── Step 3: Import max_speed packages ──
    for (const dp of dataPacks) {
      const usagePeriod = Number(dp.usage_period);
      const dataRaw = parseDataAmount(dp.high_speed);
      const costPrice = Number(dp.net_price);
      const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;

      const record = {
        package_id: dp.product_code,
        provider_id: TUGE_PROVIDER_ID,
        name: buildName("max_speed", dataRaw, usagePeriod),
        country_code: "HK",
        country_name: DEST_NAME,
        package_type: "max_speed",
        validity_days: usagePeriod,
        data_amount: dataRaw,
        qos_speed: "Max Speed",
        carrier: "CTExcel",
        cost_price: costPrice,
        price: retailPrice,
        normal_price: retailPrice,
        currency: "USD",
        is_active: true,
        sim_type: "eSIM",
        support_data: true,
        hot_spot: true,
        top_up: true,
        supports_extension: true,
        kyc: false,
        validity_period: `${dp.validity_period}Days`,
        provider_metadata: { card_type: "at1", source: "bulk-import-at1-china-hk-macau" },
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
        country_code: "HK",
        country_name: DEST_NAME,
        package_type: "limitless",
        validity_days: usagePeriod,
        data_amount: "Unlimited",
        qos_speed: "Unlimited",
        carrier: "CTExcel",
        cost_price: costPrice,
        price: retailPrice,
        normal_price: retailPrice,
        currency: "USD",
        is_active: true,
        sim_type: "eSIM",
        support_data: true,
        hot_spot: true,
        top_up: true,
        supports_extension: true,
        kyc: false,
        validity_period: `${lp.validity_period}Days`,
        provider_metadata: { card_type: "at1", source: "bulk-import-at1-china-hk-macau" },
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

    // ── Step 5: Deactivate all USIMSA packages for HK, HK/Macau, China/HK/Macau ──
    const deactivateNames = ["Hong Kong", "Macau", "Hong Kong/Macau", "China/Hong Kong/Macau"];

    for (const destName of deactivateNames) {
      const { data: usimsaPkgs, error: fetchUErr } = await supabase
        .from("esim_packages")
        .select("id")
        .eq("provider_id", USIMSA_PROVIDER_ID)
        .eq("country_name", destName)
        .eq("is_active", true);

      if (fetchUErr) {
        summary.errors.push(`Fetch USIMSA ${destName}: ${fetchUErr.message}`);
        continue;
      }

      if (usimsaPkgs && usimsaPkgs.length > 0) {
        const ids = usimsaPkgs.map((p: any) => p.id);
        const { error: deactErr } = await supabase
          .from("esim_packages")
          .update({ is_active: false })
          .in("id", ids);

        if (deactErr) {
          summary.errors.push(`Deactivate USIMSA ${destName}: ${deactErr.message}`);
        } else {
          summary.usimsaDeactivated += usimsaPkgs.length;
          console.log(`[IMPORT-AT1-CHN-HK-MO] Deactivated ${usimsaPkgs.length} USIMSA packages for ${destName}`);
        }
      }
    }

    console.log("[IMPORT-AT1-CHN-HK-MO] Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify({
      success: true,
      summary,
      message: `Imported ${summary.dayPassImported} day_pass, ${summary.maxSpeedImported} max_speed, ${summary.limitlessImported} limitless. Deactivated ${summary.usimsaDeactivated} USIMSA packages.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[IMPORT-AT1-CHN-HK-MO] ERROR:", message);
    return new Response(JSON.stringify({ error: message, summary }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
