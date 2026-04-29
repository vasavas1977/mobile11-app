import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

const INCLUDED_COUNTRIES_AU_NZ = [
  {
    name: "Australia",
    code: "AU",
    carriers: [{ name: "Optus/Vodafone", networks: ["4G", "5G"] }]
  },
  {
    name: "New Zealand",
    code: "NZ",
    carriers: [{ name: "Vodafone/Spark", networks: ["4G"] }]
  }
];

function getPackageType(product: any): string {
  if (product.product_type === 'DATA_PACK') return 'max_speed';
  if (product.product_type === 'DAILY_PACK') {
    if (product.high_speed === 'Unlimited') return 'limitless';
    return 'day_pass';
  }
  return 'max_speed';
}

function parseDataAmount(product: any): string {
  if (product.data_total != null && product.data_unit) {
    return `${product.data_total}${product.data_unit}`;
  }
  if (product.high_speed) {
    if (product.high_speed === 'Unlimited') return 'Unlimited';
    let speed = product.high_speed;
    if (/^\d+M$/i.test(speed)) speed = speed + 'B';
    if (product.product_type === 'DAILY_PACK') return `${speed}/day`;
    return speed;
  }
  return '0MB';
}

function parseValidityDays(product: any): number {
  if (product.duration != null) return Number(product.duration);
  return 30;
}

function buildName(countryName: string, dataAmount: string, validityDays: number, packageType: string): string {
  return `${countryName} ${dataAmount} ${validityDays}Days ${packageType === 'limitless' ? 'Limitless' : packageType === 'day_pass' ? 'DayPass' : 'MaxSpeed'}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[BULK-IMPORT] Starting ep1 NZ + AU/NZ import...');

    // Fetch NZ-only ep1 products (AU variants only - auto-activate)
    const { data: nzProducts, error: nzError } = await supabase
      .from('tuge_product_cache')
      .select('*')
      .eq('card_type', 'ep1')
      .like('product_code', '%AU%')
      .contains('countries', '["NZ"]')
      .not('countries', 'cs', '["AU"]')
      .limit(500);

    if (nzError) {
      console.error('[BULK-IMPORT] NZ fetch error:', nzError);
      return new Response(JSON.stringify({ error: nzError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch AU+NZ combo ep1 products (AU variants only - auto-activate)
    const { data: comboProducts, error: comboError } = await supabase
      .from('tuge_product_cache')
      .select('*')
      .eq('card_type', 'ep1')
      .like('product_code', '%AU%')
      .contains('countries', '["AU"]')
      .contains('countries', '["NZ"]')
      .limit(500);

    if (comboError) {
      console.error('[BULK-IMPORT] Combo fetch error:', comboError);
      return new Response(JSON.stringify({ error: comboError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const products = [...(nzProducts || []), ...(comboProducts || [])];

    if (products.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No ep1 NZ/AU+NZ products found', stats: { total: 0 } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[BULK-IMPORT] Found ${nzProducts?.length || 0} NZ-only + ${comboProducts?.length || 0} AU+NZ combo = ${products.length} total`);

    const results = { inserted: 0, updated: 0, errors: [] as any[], skipped: 0 };

    for (const product of products) {
      try {
        const countries: string[] = product.countries || [];
        const isCombo = countries.includes('AU') && countries.includes('NZ');
        const isNZOnly = countries.length === 1 && countries[0] === 'NZ';

        if (!isCombo && !isNZOnly) {
          results.skipped++;
          continue;
        }

        const costPrice = Number(product.net_price || 0);
        const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
        const dataAmount = parseDataAmount(product);
        const validityDays = Number(product.usage_period || 30);
        const packageType = getPackageType(product);

        let countryCode: string;
        let countryName: string;
        let carrier: string;
        let includedCountries: any | null;

        if (isNZOnly) {
          countryCode = 'NZ';
          countryName = 'New Zealand';
          carrier = 'Vodafone/Spark';
          includedCountries = null;
        } else {
          // AU+NZ combo
          countryCode = 'AU';
          countryName = 'Australia & New Zealand';
          carrier = 'Australia: Optus/Vodafone, New Zealand: Vodafone/Spark';
          includedCountries = INCLUDED_COUNTRIES_AU_NZ;
        }

        const name = buildName(countryName, dataAmount, validityDays, packageType);
        const packageId = product.product_code;

        // Determine speed fields
        let qosSpeed: string | null = null;
        let speedAfterLimit: string | null = null;
        if (packageType === 'limitless') {
          qosSpeed = 'Unlimited';
        } else if (packageType === 'day_pass') {
          speedAfterLimit = product.limit_speed || '128Kbps';
        } else if (product.high_speed && product.high_speed !== 'Unlimited') {
          qosSpeed = product.high_speed;
        }

        const record = {
          package_id: packageId,
          name,
          country_code: countryCode,
          country_name: countryName,
          data_amount: dataAmount,
          validity_days: validityDays,
          price: retailPrice,
          normal_price: 0,
          currency: 'USD',
          is_active: false,
          carrier,
          package_type: packageType,
          provider_id: TUGE_PROVIDER_ID,
          included_countries: includedCountries,
          cost_price: costPrice,
          network_type: '4G',
          sim_type: 'eSIM',
          qos_speed: qosSpeed,
          speed_after_limit: speedAfterLimit,
          daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
          daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
          category: isCombo ? 'regional' : 'country',
          top_up: true,
          provider_metadata: { card_type: 'ep1', source: 'bulk-import' },
        };

        const { error: upsertError } = await supabase
          .from('esim_packages')
          .upsert(record, { onConflict: 'package_id' });

        if (upsertError) {
          console.error(`[BULK-IMPORT] Upsert error for ${packageId}:`, upsertError);
          results.errors.push({ package_id: packageId, error: upsertError.message });
        } else {
          results.inserted++;
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[BULK-IMPORT] Error processing product:`, msg);
        results.errors.push({ product_id: product.id, error: msg });
      }
    }

    console.log(`[BULK-IMPORT] Complete. Inserted/Updated: ${results.inserted}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_ep1_products: products.length,
        imported: results.inserted,
        skipped: results.skipped,
        errors: results.errors.length,
      },
      errors: results.errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[BULK-IMPORT] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
