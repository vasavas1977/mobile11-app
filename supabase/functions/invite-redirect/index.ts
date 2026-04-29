const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response('Missing token', { status: 400, headers: corsHeaders })
  }

  // Redirect to the actual invitation page on the custom domain
  const redirectUrl = `https://mobile11.com/business/invite/${token}`

  console.log(`Redirecting invitation token to: ${redirectUrl}`)

  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl,
      ...corsHeaders
    }
  })
})
