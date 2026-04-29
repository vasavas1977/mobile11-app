import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

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

function buildName(dataAmount: string, validityDays: number, packageType: string): string {
  const typeLabel = packageType === 'limitless' ? 'Limitless' : packageType === 'day_pass' ? 'DayPass' : 'MaxSpeed';
  return `India ${dataAmount} ${validityDays}Days ${typeLabel}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[INDIA-IMPORT] Starting India ac1 AU import...');

    // Fetch India ac1 products with AU in product code
    const { data: products, error: fetchError } = await supabase
      .from('tuge_product_cache')
      .select('*')
      .eq('card_type', 'ac1')
      .contains('countries', '["IN"]')
      .like('product_code', '%AU%')
      .limit(500);

    if (fetchError) {
      console.error('[INDIA-IMPORT] Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No India ac1 AU products found', stats: { total: 0 } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[INDIA-IMPORT] Found ${products.length} India ac1 AU products`);

    const results = { inserted: 0, errors: [] as any[], skipped: 0 };

    for (const product of products) {
      try {
        const costPrice = Number(product.net_price || 0);
        const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
        const dataAmount = parseDataAmount(product);
        const validityDays = Number(product.usage_period || 30);
        const packageType = getPackageType(product);
        const name = buildName(dataAmount, validityDays, packageType);
        const packageId = product.product_code;

        // Determine speed fields
        let qosSpeed: string | null = null;
        let speedAfterLimit: string | null = null;
        if (packageType === 'limitless') {
          qosSpeed = 'Unlimited';
        } else if (packageType === 'day_pass') {
          speedAfterLimit = product.limit_speed || '384kbps';
        } else if (product.high_speed && product.high_speed !== 'Unlimited') {
          qosSpeed = product.high_speed;
        }

        const record = {
          package_id: packageId,
          name,
          country_code: 'IN',
          country_name: 'India',
          data_amount: dataAmount,
          validity_days: validityDays,
          price: retailPrice,
          normal_price: 0,
          currency: 'USD',
          is_active: false,
          carrier: 'Reliance Jio/Bharti Airtel',
          package_type: packageType,
          provider_id: TUGE_PROVIDER_ID,
          included_countries: null,
          cost_price: costPrice,
          network_type: '4G/5G',
          sim_type: 'eSIM',
          qos_speed: qosSpeed,
          speed_after_limit: speedAfterLimit,
          daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
          daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
          category: 'country',
          top_up: true,
          provider_metadata: { card_type: 'ac1', source: 'bulk-import-india' },
        };

        const { error: upsertError } = await supabase
          .from('esim_packages')
          .upsert(record, { onConflict: 'package_id' });

        if (upsertError) {
          console.error(`[INDIA-IMPORT] Upsert error for ${packageId}:`, upsertError);
          results.errors.push({ package_id: packageId, error: upsertError.message });
        } else {
          results.inserted++;
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[INDIA-IMPORT] Error processing product:`, msg);
        results.errors.push({ product_id: product.id, error: msg });
      }
    }

    console.log(`[INDIA-IMPORT] Complete. Imported: ${results.inserted}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_products: products.length,
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
    console.error('[INDIA-IMPORT] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
