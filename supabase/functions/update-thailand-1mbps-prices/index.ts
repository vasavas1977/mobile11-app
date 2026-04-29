import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Thailand 1Mbps Limitless package cost updates from Excel
const COST_UPDATES = [
  { package_id: '33FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 1, old_cost: 0.80, new_cost: 1.60 },
  { package_id: '34FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 2, old_cost: 1.57, new_cost: 2.48 },
  { package_id: '35FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 3, old_cost: 2.34, new_cost: 4.25 },
  { package_id: '36FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 4, old_cost: 2.83, new_cost: 4.89 },
  { package_id: '37FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 5, old_cost: 3.29, new_cost: 5.74 },
  { package_id: '38FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 7, old_cost: 3.91, new_cost: 6.54 },
  { package_id: '39FB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 10, old_cost: 4.57, new_cost: 7.21 },
  { package_id: '3AFB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 12, old_cost: 5.43, new_cost: 8.95 },
  { package_id: '3BFB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 15, old_cost: 6.57, new_cost: 11.52 },
  { package_id: '3CFB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 20, old_cost: 8.43, new_cost: 13.80 },
  { package_id: '3DFB98E5-12B6-EE11-B65E-6045BD45CB1E', days: 30, old_cost: 12.00, new_cost: 15.82 },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting Thailand 1Mbps Limitless price updates...')

    const results = {
      updated: [] as any[],
      errors: [] as any[],
      skipped: [] as any[],
    }

    for (const update of COST_UPDATES) {
      // First, fetch the current package data
      const { data: pkg, error: fetchError } = await supabase
        .from('esim_packages')
        .select('id, package_id, name, cost_price, price, validity_days, is_active')
        .eq('package_id', update.package_id)
        .single()

      if (fetchError || !pkg) {
        console.error(`Package not found: ${update.package_id}`, fetchError)
        results.errors.push({
          package_id: update.package_id,
          days: update.days,
          error: fetchError?.message || 'Package not found'
        })
        continue
      }

      // Calculate new selling price maintaining current margin ratio
      const currentMarginRatio = pkg.price / pkg.cost_price
      const newSellingPrice = Math.round(update.new_cost * currentMarginRatio * 100) / 100

      console.log(`Updating ${update.days}-day package:`)
      console.log(`  - Old cost: $${pkg.cost_price} -> New cost: $${update.new_cost}`)
      console.log(`  - Old price: $${pkg.price} -> New price: $${newSellingPrice}`)
      console.log(`  - Margin ratio maintained: ${currentMarginRatio.toFixed(2)}`)

      // Update the package
      const { error: updateError } = await supabase
        .from('esim_packages')
        .update({
          cost_price: update.new_cost,
          price: newSellingPrice,
          updated_at: new Date().toISOString()
        })
        .eq('package_id', update.package_id)

      if (updateError) {
        console.error(`Failed to update package ${update.package_id}:`, updateError)
        results.errors.push({
          package_id: update.package_id,
          days: update.days,
          error: updateError.message
        })
      } else {
        results.updated.push({
          package_id: update.package_id,
          days: update.days,
          name: pkg.name,
          old_cost: pkg.cost_price,
          new_cost: update.new_cost,
          old_price: pkg.price,
          new_price: newSellingPrice,
          margin_ratio: currentMarginRatio.toFixed(2),
          is_active: pkg.is_active
        })
      }
    }

    console.log(`Update complete. Updated: ${results.updated.length}, Errors: ${results.errors.length}`)

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total_packages: COST_UPDATES.length,
        updated: results.updated.length,
        errors: results.errors.length,
      },
      updated_packages: results.updated,
      errors: results.errors,
      message: `Successfully updated ${results.updated.length} Thailand 1Mbps Limitless packages. Packages remain inactive - activate via admin if desired.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
