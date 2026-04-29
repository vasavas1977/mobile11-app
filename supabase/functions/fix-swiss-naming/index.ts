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

    console.log('Starting Swiss to Switzerland naming fix...')

    // Fetch all packages with "Swiss" or incorrect country code
    const { data: packages, error: fetchError } = await supabase
      .from('esim_packages')
      .select('id, name, country_name, country_code')
      .or('country_name.eq.Swiss,and(country_name.eq.Switzerland,country_code.neq.CH)')

    if (fetchError) {
      console.error('Error fetching packages:', fetchError)
      throw fetchError
    }

    console.log(`Found ${packages?.length || 0} packages to update`)

    // Update each package
    const updates = []
    for (const pkg of packages || []) {
      const newName = pkg.name.replace(/Swiss/g, 'Switzerland')
      
      const { error: updateError } = await supabase
        .from('esim_packages')
        .update({ 
          country_name: 'Switzerland',
          country_code: 'CH',
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', pkg.id)

      if (updateError) {
        console.error(`Error updating package ${pkg.id}:`, updateError)
      } else {
        updates.push({
          id: pkg.id,
          old_name: pkg.name,
          new_name: newName,
          old_country: pkg.country_name,
          old_code: pkg.country_code
        })
      }
    }

    console.log(`Successfully updated ${updates.length} packages`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Standardized ${updates.length} packages to "Switzerland"`,
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
