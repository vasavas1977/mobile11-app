import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

interface CountryConfig {
  code: string;
  name: string;
  cardTypes: string[];
  carriers: Record<string, { carrier: string; network: string }>;
}

const COUNTRY_CONFIGS: CountryConfig[] = [
  {
    code: 'ZA', name: 'South Africa',
    cardTypes: ['ep2'],
    carriers: { ep2: { carrier: 'Cell C/Vodacom', network: '4G' } },
  },
  {
    code: 'BR', name: 'Brazil',
    cardTypes: ['ep1'],
    carriers: { ep1: { carrier: 'Vivo', network: '4G' } },
  },
  {
    code: 'GR', name: 'Greece',
    cardTypes: ['ep1'],
    carriers: { ep1: { carrier: 'Wind/Cosmote/Vodafone', network: '4G/5G' } },
  },
  {
    code: 'HR', name: 'Croatia',
    cardTypes: ['C4', 'ep1'],
    carriers: {
      C4: { carrier: 'T-Mobile/A1/Telemach', network: '4G/5G' },
      ep1: { carrier: 'Tele2/Hrvatski', network: '4G/5G' },
    },
  },
  {
    code: 'IS', name: 'Iceland',
    cardTypes: ['C4', 'ep1'],
    carriers: {
      C4: { carrier: 'Siminn/Vodafone', network: '4G' },
      ep1: { carrier: 'Fjarskipti/Nova', network: '4G' },
    },
  },
  {
    code: 'FI', name: 'Finland',
    cardTypes: ['ep1'],
    carriers: { ep1: { carrier: 'Elisa/DNA', network: '4G/5G' } },
  },
  {
    code: 'HU', name: 'Hungary',
    cardTypes: ['C4', 'ep1'],
    carriers: {
      C4: { carrier: 'Telenor/Vodafone', network: '4G/5G' },
      ep1: { carrier: 'T-Mobile/Telenor', network: '4G/5G' },
    },
  },
  {
    code: 'PL', name: 'Poland',
    cardTypes: ['C4', 'ep1'],
    carriers: {
      C4: { carrier: 'Polkomtel/Orange/T-Mobile', network: '4G/5G' },
      ep1: { carrier: 'Polkomtel', network: '4G/5G' },
    },
  },
  {
    code: 'BE', name: 'Belgium',
    cardTypes: ['C4', 'ep1'],
    carriers: {
      C4: { carrier: 'Proximus/Orange/Base', network: '4G/5G' },
      ep1: { carrier: 'Telenet/Orange', network: '4G/5G' },
    },
  },
  {
    code: 'NO', name: 'Norway',
    cardTypes: ['ep1'],
    carriers: { ep1: { carrier: 'Telia/Telenor', network: '4G/5G' } },
  },
  {
    code: 'CZ', name: 'Czech Republic',
    cardTypes: ['C4', 'ep1'],
    carriers: {
      C4: { carrier: 'Vodafone/T-Mobile', network: '4G/5G' },
      ep1: { carrier: 'T-Mobile/O2', network: '4G/5G' },
    },
  },
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

function buildName(countryName: string, dataAmount: string, validityDays: number, packageType: string, carrier: string): string {
  const typeLabel = packageType === 'limitless' ? 'Limitless' : packageType === 'day_pass' ? 'DayPass' : 'MaxSpeed';
  return `${countryName} ${dataAmount} ${validityDays}Days ${typeLabel}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: filter to specific country
    let filterCountry: string | null = null;
    try {
      const body = await req.json();
      filterCountry = body?.country_code || null;
    } catch { /* no body */ }

    const configs = filterCountry
      ? COUNTRY_CONFIGS.filter(c => c.code === filterCountry.toUpperCase())
      : COUNTRY_CONFIGS;

    console.log(`[BULK-MULTI] Starting import for ${configs.length} countries...`);

    const totalResults = { imported: 0, skipped: 0, errors: [] as any[], byCountry: {} as Record<string, number> };

    for (const config of configs) {
      console.log(`[BULK-MULTI] Processing ${config.name} (${config.code}) with card types: ${config.cardTypes.join(', ')}`);

      for (const cardType of config.cardTypes) {
        const carrierInfo = config.carriers[cardType];

        // Query tuge_product_cache: single-country, AU variant
        const { data: products, error: fetchError } = await supabase
          .from('tuge_product_cache')
          .select('*')
          .eq('card_type', cardType)
          .like('product_code', '%AU%')
          .contains('countries', JSON.stringify([config.code]))
          .limit(500);

        if (fetchError) {
          console.error(`[BULK-MULTI] Fetch error for ${config.code}/${cardType}:`, fetchError);
          totalResults.errors.push({ country: config.code, card_type: cardType, error: fetchError.message });
          continue;
        }

        // Filter to single-country only (jsonb_array_length check)
        const singleCountryProducts = (products || []).filter((p: any) => {
          const countries: string[] = p.countries || [];
          return countries.length === 1 && countries[0] === config.code;
        });

        console.log(`[BULK-MULTI] ${config.code}/${cardType}: ${singleCountryProducts.length} single-country AU products`);

        for (const product of singleCountryProducts) {
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

            const name = buildName(config.name, dataAmount, validityDays, packageType, carrierInfo.carrier);

            const record = {
              package_id: packageId,
              name,
              country_code: config.code,
              country_name: config.name,
              data_amount: dataAmount,
              validity_days: validityDays,
              price: retailPrice,
              normal_price: 0,
              currency: 'USD',
              is_active: false,
              is_local_sim: false,
              carrier: carrierInfo.carrier,
              package_type: packageType,
              provider_id: TUGE_PROVIDER_ID,
              included_countries: null,
              cost_price: costPrice,
              network_type: carrierInfo.network,
              sim_type: 'eSIM',
              qos_speed: qosSpeed,
              speed_after_limit: speedAfterLimit,
              daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
              daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
              category: 'country',
              top_up: true,
              provider_metadata: { card_type: cardType, source: 'bulk-import-multi' },
            };

            const { error: upsertError } = await supabase
              .from('esim_packages')
              .upsert(record, { onConflict: 'package_id' });

            if (upsertError) {
              console.error(`[BULK-MULTI] Upsert error for ${packageId}:`, upsertError);
              totalResults.errors.push({ package_id: packageId, error: upsertError.message });
            } else {
              totalResults.imported++;
              totalResults.byCountry[config.code] = (totalResults.byCountry[config.code] || 0) + 1;
            }
          } catch (e: any) {
            const msg = e instanceof Error ? e.message : String(e);
            totalResults.errors.push({ product_id: product.id, error: msg });
          }
        }
      }
    }

    console.log(`[BULK-MULTI] Complete. Imported: ${totalResults.imported}, Errors: ${totalResults.errors.length}`);
    console.log(`[BULK-MULTI] By country:`, totalResults.byCountry);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_imported: totalResults.imported,
        errors: totalResults.errors.length,
        by_country: totalResults.byCountry,
      },
      errors: totalResults.errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[BULK-MULTI] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
