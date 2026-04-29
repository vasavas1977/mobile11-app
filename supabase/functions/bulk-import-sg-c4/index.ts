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
  return `Singapore ${dataAmount} ${validityDays}Days ${typeLabel}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Deactivate existing Singapore TUGE packages ONLY
    console.log('[SG-C4] Deactivating existing Singapore TUGE packages...');
    const { data: deactivated, error: deactivateError } = await supabase
      .from('esim_packages')
      .update({ is_active: false })
      .eq('country_code', 'SG')
      .eq('provider_id', TUGE_PROVIDER_ID)
      .select('id');

    if (deactivateError) {
      console.error('[SG-C4] Deactivate error:', deactivateError);
      throw new Error(`Failed to deactivate: ${deactivateError.message}`);
    }
    console.log(`[SG-C4] Deactivated ${deactivated?.length || 0} existing Singapore TUGE packages`);

    // Step 2: Fetch SG+MY+TH C4 AU products from tuge_product_cache
    const { data: products, error: fetchError } = await supabase
      .from('tuge_product_cache')
      .select('*')
      .eq('card_type', 'C4')
      .like('product_code', '%AU%')
      .contains('countries', JSON.stringify(['SG', 'MY', 'TH']))
      .limit(500);

    if (fetchError) {
      console.error('[SG-C4] Fetch error:', fetchError);
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    // Filter to exactly SG+MY+TH (3 countries)
    const targetProducts = (products || []).filter((p: any) => {
      const countries: string[] = p.countries || [];
      return countries.length === 3 &&
        countries.includes('SG') &&
        countries.includes('MY') &&
        countries.includes('TH');
    });

    console.log(`[SG-C4] Found ${targetProducts.length} SG+MY+TH C4 AU products to import`);

    let imported = 0;
    const errors: any[] = [];

    for (const product of targetProducts) {
      try {
        const costPrice = Number(product.net_price || 0);
        const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
        const dataAmount = parseDataAmount(product);
        const validityDays = Number(product.usage_period || product.duration || 30);
        const packageType = getPackageType(product);
        const packageId = product.product_code;

        // Speed fields
        let qosSpeed: string | null = null;
        let speedAfterLimit: string | null = null;
        if (packageType === 'limitless') {
          qosSpeed = 'Unlimited';
        } else if (packageType === 'day_pass') {
          speedAfterLimit = product.limit_speed || '128Kbps';
        } else if (product.high_speed && product.high_speed !== 'Unlimited') {
          qosSpeed = product.high_speed;
        }

        const name = buildName(dataAmount, validityDays, packageType);

        const record = {
          package_id: packageId,
          name,
          country_code: 'SG',
          country_name: 'Singapore',
          data_amount: dataAmount,
          validity_days: validityDays,
          price: retailPrice,
          normal_price: 0,
          currency: 'USD',
          is_active: false,
          is_local_sim: false,
          carrier: 'Singtel',
          package_type: packageType,
          provider_id: TUGE_PROVIDER_ID,
          included_countries: {
            countries: [
              { name: 'Singapore', code: 'SG' },
              { name: 'Malaysia', code: 'MY' },
              { name: 'Thailand', code: 'TH' },
            ],
          },
          cost_price: costPrice,
          network_type: '5G',
          sim_type: 'eSIM',
          qos_speed: qosSpeed,
          speed_after_limit: speedAfterLimit,
          daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
          daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
          category: 'country',
          top_up: true,
          provider_metadata: { card_type: 'C4', source: 'bulk-import-sg-c4' },
        };

        const { error: upsertError } = await supabase
          .from('esim_packages')
          .upsert(record, { onConflict: 'package_id' });

        if (upsertError) {
          console.error(`[SG-C4] Upsert error for ${packageId}:`, upsertError);
          errors.push({ package_id: packageId, error: upsertError.message });
        } else {
          imported++;
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ product_id: product.id, error: msg });
      }
    }

    console.log(`[SG-C4] Complete. Imported: ${imported}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        deactivated: deactivated?.length || 0,
        imported,
        errors: errors.length,
      },
      errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[SG-C4] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
