import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting Max Speed QoS fix...')

    // Fetch all max_speed packages
    const { data: packages, error: fetchError } = await supabase
      .from('esim_packages')
      .select('id, name, country_name, network_type, qos_speed')
      .eq('package_type', 'max_speed')

    if (fetchError) {
      console.error('Error fetching packages:', fetchError)
      throw fetchError
    }

    console.log(`Found ${packages?.length || 0} Max Speed packages to update`)

    // Update each package to set qos_speed = network_type
    const updates = []
    for (const pkg of packages || []) {
      if (pkg.network_type && pkg.network_type !== pkg.qos_speed) {
        const { error: updateError } = await supabase
          .from('esim_packages')
          .update({ 
            qos_speed: pkg.network_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id)

        if (updateError) {
          console.error(`Error updating package ${pkg.id}:`, updateError)
        } else {
          updates.push({
            id: pkg.id,
            name: pkg.name,
            country: pkg.country_name,
            old_qos: pkg.qos_speed,
            new_qos: pkg.network_type
          })
        }
      }
    }

    console.log(`Successfully updated ${updates.length} packages`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} Max Speed packages`,
        total_found: packages?.length || 0,
        updated: updates
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
