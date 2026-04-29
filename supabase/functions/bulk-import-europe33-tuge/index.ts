import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

const INCLUDED_COUNTRIES = [
  { name: 'Austria', code: 'AT', carriers: [{ name: 'H3G', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }, { name: 'A1', networks: ['5G'] }] },
  { name: 'Belgium', code: 'BE', carriers: [{ name: 'Telenet', networks: ['4G'] }, { name: 'ORANGE', networks: ['5G'] }] },
  { name: 'Bulgaria', code: 'BG', carriers: [{ name: 'Mobiltel', networks: ['5G'] }, { name: 'Telenor', networks: ['LTE'] }, { name: 'Vivacom', networks: ['5G'] }] },
  { name: 'Switzerland', code: 'CH', carriers: [{ name: 'Swisscom', networks: ['5G'] }, { name: 'Sunrise', networks: ['5G'] }, { name: 'Salt', networks: ['5G'] }] },
  { name: 'Cyprus', code: 'CY', carriers: [{ name: 'CYTA', networks: ['LTE'] }, { name: 'Primetel', networks: ['3G'] }, { name: 'Epic', networks: ['4G'] }] },
  { name: 'Czech Republic', code: 'CZ', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'O2', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }] },
  { name: 'Germany', code: 'DE', carriers: [{ name: 'T-Mobile', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
  { name: 'Denmark', code: 'DK', carriers: [{ name: 'Telenor', networks: ['LTE'] }, { name: 'HI3G', networks: ['LTE'] }, { name: 'Telia', networks: ['5G'] }, { name: 'TDC', networks: ['5G'] }, { name: 'nuuday', networks: ['4G'] }] },
  { name: 'Spain', code: 'ES', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }, { name: 'Yoigo', networks: ['LTE'] }] },
  { name: 'Estonia', code: 'EE', carriers: [{ name: 'Telia', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }] },
  { name: 'Finland', code: 'FI', carriers: [{ name: 'DNA', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
  { name: 'France', code: 'FR', carriers: [{ name: 'Orange', networks: ['5G'] }, { name: 'Bouygues', networks: ['5G'] }, { name: 'Free Mobile', networks: ['5G'] }] },
  { name: 'United Kingdom', code: 'GB', carriers: [{ name: 'H3G', networks: ['5G'] }, { name: 'EE', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
  { name: 'Greece', code: 'GR', carriers: [{ name: 'Cosmote', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }, { name: 'Wind(Nova)', networks: ['5G'] }] },
  { name: 'Croatia', code: 'HR', carriers: [{ name: 'Hrvatski', networks: ['5G'] }, { name: 'Tele2', networks: ['LTE'] }, { name: 'VIPnet', networks: ['LTE'] }] },
  { name: 'Hungary', code: 'HU', carriers: [{ name: 'Telenor', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }] },
  { name: 'Ireland', code: 'IE', carriers: [{ name: 'H3G', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
  { name: 'Iceland', code: 'IS', carriers: [{ name: 'Landssiminn - ISLPS', networks: ['5G'] }] },
  { name: 'Italy', code: 'IT', carriers: [{ name: 'ILIAD', networks: ['5G'] }, { name: 'H3G', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Telecom', networks: ['5G'] }, { name: 'Wind', networks: ['5G'] }] },
  { name: 'Liechtenstein', code: 'LI', carriers: [{ name: 'Orange', networks: ['4G'] }, { name: 'Telecom AG', networks: ['LTE'] }] },
  { name: 'Lithuania', code: 'LT', carriers: [{ name: 'Tele2', networks: ['5G'] }, { name: 'Bite', networks: ['5G'] }, { name: 'Omnitel', networks: ['5G'] }] },
  { name: 'Luxembourg', code: 'LU', carriers: [{ name: 'Orange', networks: ['5G'] }] },
  { name: 'Latvia', code: 'LV', carriers: [{ name: 'Tele2', networks: ['5G'] }, { name: 'Bite', networks: ['LTE'] }, { name: 'Mobilais', networks: ['4G'] }] },
  { name: 'Moldova', code: 'MD', carriers: [{ name: 'Orange', networks: ['4G'] }] },
  { name: 'Malta', code: 'MT', carriers: [{ name: 'GO', networks: ['LTE'] }, { name: 'Vodafone', networks: ['5G'] }] },
  { name: 'Netherlands', code: 'NL', carriers: [{ name: 'Vodafone', networks: ['5G'] }, { name: 'Odido', networks: ['5G'] }, { name: 'KPN', networks: ['5G'] }, { name: 'Telfort', networks: ['4G'] }] },
  { name: 'Norway', code: 'NO', carriers: [{ name: 'Telia', networks: ['5G'] }, { name: 'Network AS', networks: ['4G'] }, { name: 'Telenor', networks: ['5G'] }] },
  { name: 'Portugal', code: 'PT', carriers: [{ name: 'Optimus', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }] },
  { name: 'Romania', code: 'RO', carriers: [{ name: 'DIGI', networks: ['4G'] }, { name: 'Telekom', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }] },
  { name: 'Slovakia', code: 'SK', carriers: [{ name: 'Slovak Telekom (DT)', networks: ['5G'] }, { name: 'Orange', networks: ['5G'] }, { name: 'O2', networks: ['LTE'] }] },
  { name: 'Slovenia', code: 'SI', carriers: [{ name: 'Telekom', networks: ['5G'] }, { name: 'A1', networks: ['LTE'] }, { name: 'Telemach', networks: ['5G'] }] },
  { name: 'Sweden', code: 'SE', carriers: [{ name: 'Telenor (Vodafone)', networks: ['5G'] }, { name: 'H3G', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
  { name: 'Ukraine', code: 'UA', carriers: [{ name: 'lifecell', networks: ['LTE'] }, { name: 'KyivStar', networks: ['LTE'] }, { name: 'Beeline', networks: ['LTE'] }, { name: 'KyivStar-RS', networks: ['LTE'] }, { name: 'MTS', networks: ['LTE'] }] },
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

function buildName(dataAmount: string, validityDays: number, packageType: string): string {
  return `Europe 33 Countries ${dataAmount} ${validityDays}Days ${packageType === 'limitless' ? 'Limitless' : packageType === 'day_pass' ? 'DayPass' : 'MaxSpeed'}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[BULK-IMPORT-EU33] Starting eO1 Europe 33 import...');

    // Fetch eO1 AU products with exactly 33 countries
    const { data: products, error: fetchError } = await supabase
      .from('tuge_product_cache')
      .select('*')
      .eq('card_type', 'eo1')
      .like('product_code', '%AU%')
      .limit(500);

    if (fetchError) {
      console.error('[BULK-IMPORT-EU33] Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter to only 33-country products
    const eu33Products = (products || []).filter(p => {
      const countries: string[] = p.countries || [];
      return countries.length === 33;
    });

    if (eu33Products.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No eO1 Europe 33 products found', stats: { total: 0 } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[BULK-IMPORT-EU33] Found ${eu33Products.length} eO1 AU Europe 33 products`);

    const results = { inserted: 0, errors: [] as any[], skipped: 0 };

    // Build carrier summary string
    const carrierSummary = INCLUDED_COUNTRIES.map(c => 
      `${c.name}: ${c.carriers.map(cr => cr.name).join('/')}`
    ).join(', ');

    for (const product of eu33Products) {
      try {
        const costPrice = Number(product.net_price || 0);
        const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
        const dataAmount = parseDataAmount(product);
        const validityDays = Number(product.usage_period || 30);
        const packageType = getPackageType(product);
        const packageId = product.product_code;
        const name = buildName(dataAmount, validityDays, packageType);

        // Speed fields
        let qosSpeed: string | null = null;
        let speedAfterLimit: string | null = null;
        if (packageType === 'limitless') {
          qosSpeed = 'Unlimited';
        } else if (packageType === 'day_pass') {
          speedAfterLimit = product.limit_speed || '512kbps';
        } else if (packageType === 'max_speed') {
          qosSpeed = 'Max Speed';
        }

        const record = {
          package_id: packageId,
          name,
          country_code: 'EU',
          country_name: 'Europe 33 Countries',
          data_amount: dataAmount,
          validity_days: validityDays,
          price: retailPrice,
          normal_price: 0,
          currency: 'USD',
          is_active: true,
          carrier: carrierSummary,
          package_type: packageType,
          provider_id: TUGE_PROVIDER_ID,
          included_countries: INCLUDED_COUNTRIES,
          cost_price: costPrice,
          network_type: '5G',
          sim_type: 'eSIM',
          qos_speed: qosSpeed,
          speed_after_limit: speedAfterLimit,
          daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
          daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
          category: 'regional',
          top_up: true,
          provider_metadata: { card_type: 'eo1', source: 'bulk-import-europe33' },
          supports_extension: true,
          is_local_sim: false,
        };

        const { error: upsertError } = await supabase
          .from('esim_packages')
          .upsert(record, { onConflict: 'package_id' });

        if (upsertError) {
          console.error(`[BULK-IMPORT-EU33] Upsert error for ${packageId}:`, upsertError);
          results.errors.push({ package_id: packageId, error: upsertError.message });
        } else {
          results.inserted++;
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[BULK-IMPORT-EU33] Error processing product:`, msg);
        results.errors.push({ product_id: product.id, error: msg });
      }
    }

    console.log(`[BULK-IMPORT-EU33] Complete. Inserted: ${results.inserted}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_products: eu33Products.length,
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
    console.error('[BULK-IMPORT-EU33] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
