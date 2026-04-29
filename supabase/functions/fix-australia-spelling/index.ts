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

    console.log('Starting Australia spelling fix...')

    // Fetch all packages with misspelled "Austrailia"
    const { data: packages, error: fetchError } = await supabase
      .from('esim_packages')
      .select('id, name, country_name, country_code')
      .eq('country_name', 'Austrailia')

    if (fetchError) {
      console.error('Error fetching packages:', fetchError)
      throw fetchError
    }

    console.log(`Found ${packages?.length || 0} packages with "Austrailia" spelling`)

    // Update each package
    const updates = []
    for (const pkg of packages || []) {
      const newName = pkg.name.replace(/Austrailia/g, 'Australia')
      
      const { error: updateError } = await supabase
        .from('esim_packages')
        .update({ 
          country_name: 'Australia',
          name: newName,
          country_code: 'AU',
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
          new_country: 'Australia'
        })
      }
    }

    console.log(`Successfully updated ${updates.length} packages`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed spelling for ${updates.length} packages`,
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
