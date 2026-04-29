import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

interface CarrierInfo { carrier: string; network: string }
interface CountryConfig {
  code: string;
  name: string;
  cardTypes: string[];
  carriers: Record<string, CarrierInfo>;
}

// ── Batch 1: Carrier Diversification (Asia + Middle East) ──
// ── Batch 2: New SEA Destinations ──
// ── Batch 3: New European Destinations ──
const COUNTRY_CONFIGS: CountryConfig[] = [
  // Batch 1 — Carrier diversification
  { code: 'TW', name: 'Taiwan', cardTypes: ['C4', 'ac2'],
    carriers: { C4: { carrier: 'Chunghwa/FarEasTone', network: '4G/5G' }, ac2: { carrier: 'Taiwan Mobile/APT', network: '4G/5G' } } },
  { code: 'KR', name: 'South Korea', cardTypes: ['C4', 'P1'],
    carriers: { C4: { carrier: 'KT/SKT', network: '4G/5G' }, P1: { carrier: 'LG U+/KT', network: '4G/5G' } } },
  { code: 'TR', name: 'Turkey', cardTypes: ['ep1', 'ep2'],
    carriers: { ep1: { carrier: 'Vodafone/Turkcell', network: '4G' }, ep2: { carrier: 'Turk Telekom', network: '4G' } } },
  { code: 'SA', name: 'Saudi Arabia', cardTypes: ['C4'],
    carriers: { C4: { carrier: 'STC/Mobily/Zain', network: '4G/5G' } } },

  // Batch 2 — New SEA destinations
  { code: 'ID', name: 'Indonesia', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Telkomsel/XL', network: '4G' }, ep1: { carrier: 'Indosat/Tri', network: '4G' } } },
  { code: 'PH', name: 'Philippines', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Globe/Smart', network: '4G' }, ep1: { carrier: 'DITO/Globe', network: '4G' } } },
  { code: 'SG', name: 'Singapore', cardTypes: ['C4'],
    carriers: { C4: { carrier: 'Singtel/StarHub', network: '4G/5G' } } },
  { code: 'KH', name: 'Cambodia', cardTypes: ['C4'],
    carriers: { C4: { carrier: 'Smart/Cellcard', network: '4G' } } },
  { code: 'LA', name: 'Laos', cardTypes: ['V1'],
    carriers: { V1: { carrier: 'Unitel/LaoTel', network: '4G' } } },

  // Batch 3 — New European destinations
  { code: 'RO', name: 'Romania', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Vodafone/Orange', network: '4G/5G' }, ep1: { carrier: 'Digi/Orange', network: '4G' } } },
  { code: 'BG', name: 'Bulgaria', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'A1/Telenor', network: '4G' }, ep1: { carrier: 'Vivacom/A1', network: '4G' } } },
  { code: 'AL', name: 'Albania', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Vodafone/One', network: '4G' }, ep1: { carrier: 'ALBtelecom', network: '4G' } } },
  { code: 'UA', name: 'Ukraine', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Kyivstar/Vodafone', network: '4G' }, ep1: { carrier: 'lifecell', network: '4G' } } },
  { code: 'SI', name: 'Slovenia', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Telekom/A1', network: '4G/5G' }, ep1: { carrier: 'Telemach', network: '4G' } } },
  { code: 'SK', name: 'Slovakia', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Orange/T-Mobile', network: '4G/5G' }, ep1: { carrier: 'O2/Swan', network: '4G' } } },
  { code: 'LT', name: 'Lithuania', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Telia/Bite', network: '4G/5G' }, ep1: { carrier: 'Tele2', network: '4G' } } },
  { code: 'LV', name: 'Latvia', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'LMT/Tele2', network: '4G/5G' }, ep1: { carrier: 'Bite', network: '4G' } } },
  { code: 'EE', name: 'Estonia', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Telia/Elisa', network: '4G/5G' }, ep1: { carrier: 'Tele2', network: '4G' } } },
  { code: 'CY', name: 'Cyprus', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Cyta/Epic', network: '4G' }, ep1: { carrier: 'PrimeTel', network: '4G' } } },
  { code: 'MT', name: 'Malta', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'GO/Vodafone', network: '4G' }, ep1: { carrier: 'Melita', network: '4G' } } },
  { code: 'LU', name: 'Luxembourg', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'POST/Tango', network: '4G/5G' }, ep1: { carrier: 'Orange', network: '4G/5G' } } },
  { code: 'RS', name: 'Serbia', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Telekom/A1', network: '4G' }, ep1: { carrier: 'Yettel', network: '4G' } } },
  { code: 'ME', name: 'Montenegro', cardTypes: ['C4', 'ep1'],
    carriers: { C4: { carrier: 'Crnogorski/Telenor', network: '4G' }, ep1: { carrier: 'M:Tel', network: '4G' } } },
  { code: 'BA', name: 'Bosnia & Herzegovina', cardTypes: ['C4'],
    carriers: { C4: { carrier: 'BH Telecom/m:tel', network: '4G' } } },
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

function buildName(countryName: string, dataAmount: string, validityDays: number, packageType: string): string {
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

    let filterCountry: string | null = null;
    let filterBatch: string | null = null;
    try {
      const body = await req.json();
      filterCountry = body?.country_code || null;
      filterBatch = body?.batch || null;
    } catch { /* no body */ }

    let configs = COUNTRY_CONFIGS;
    if (filterCountry) {
      configs = configs.filter(c => c.code === filterCountry!.toUpperCase());
    } else if (filterBatch) {
      const batchMap: Record<string, string[]> = {
        '1': ['TW', 'KR', 'TR', 'SA'],
        '2': ['ID', 'PH', 'SG', 'KH', 'LA'],
        '3': ['RO', 'BG', 'AL', 'UA', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'RS', 'ME', 'BA'],
      };
      const codes = batchMap[filterBatch] || [];
      configs = configs.filter(c => codes.includes(c.code));
    }

    console.log(`[BULK-EXPANSION] Starting import for ${configs.length} countries...`);

    const totalResults = { imported: 0, skipped: 0, errors: [] as any[], byCountry: {} as Record<string, number> };

    for (const config of configs) {
      console.log(`[BULK-EXPANSION] Processing ${config.name} (${config.code}) — card types: ${config.cardTypes.join(', ')}`);

      for (const cardType of config.cardTypes) {
        const carrierInfo = config.carriers[cardType];

        const { data: products, error: fetchError } = await supabase
          .from('tuge_product_cache')
          .select('*')
          .eq('card_type', cardType)
          .like('product_code', '%AU%')
          .contains('countries', JSON.stringify([config.code]))
          .limit(500);

        if (fetchError) {
          console.error(`[BULK-EXPANSION] Fetch error ${config.code}/${cardType}:`, fetchError);
          totalResults.errors.push({ country: config.code, card_type: cardType, error: fetchError.message });
          continue;
        }

        const singleCountryProducts = (products || []).filter((p: any) => {
          const countries: string[] = p.countries || [];
          return countries.length === 1 && countries[0] === config.code;
        });

        console.log(`[BULK-EXPANSION] ${config.code}/${cardType}: ${singleCountryProducts.length} single-country AU products`);

        // Build records in memory, then batch upsert
        const records: any[] = [];
        for (const product of singleCountryProducts) {
          try {
            const costPrice = Number(product.net_price || 0);
            const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
            const dataAmount = parseDataAmount(product);
            const validityDays = Number(product.usage_period || product.duration || 30);
            const packageType = getPackageType(product);
            const packageId = product.product_code;

            let qosSpeed: string | null = null;
            let speedAfterLimit: string | null = null;
            if (packageType === 'limitless') {
              qosSpeed = 'Unlimited';
            } else if (packageType === 'day_pass') {
              speedAfterLimit = product.limit_speed || '128Kbps';
            } else if (product.high_speed && product.high_speed !== 'Unlimited') {
              qosSpeed = product.high_speed;
            }

            const name = buildName(config.name, dataAmount, validityDays, packageType);

            records.push({
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
              provider_metadata: { card_type: cardType, source: 'bulk-import-expansion' },
            });
          } catch (e: any) {
            const msg = e instanceof Error ? e.message : String(e);
            totalResults.errors.push({ product_id: product.id, error: msg });
          }
        }

        // Batch upsert in chunks of 50
        for (let i = 0; i < records.length; i += 50) {
          const chunk = records.slice(i, i + 50);
          const { error: upsertError } = await supabase
            .from('esim_packages')
            .upsert(chunk, { onConflict: 'package_id' });

          if (upsertError) {
            console.error(`[BULK-EXPANSION] Batch upsert error ${config.code}/${cardType} chunk ${i}:`, upsertError);
            totalResults.errors.push({ country: config.code, card_type: cardType, chunk: i, error: upsertError.message });
          } else {
            totalResults.imported += chunk.length;
            totalResults.byCountry[config.code] = (totalResults.byCountry[config.code] || 0) + chunk.length;
          }
        }
      }
    }

    console.log(`[BULK-EXPANSION] Complete. Imported: ${totalResults.imported}, Errors: ${totalResults.errors.length}`);
    console.log(`[BULK-EXPANSION] By country:`, totalResults.byCountry);

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
    console.error('[BULK-EXPANSION] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
