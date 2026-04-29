import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { pageId, action = 'list-templates' } = body

    if (!pageId) {
      return new Response(JSON.stringify({ error: 'pageId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up page access token from channel_connections
    const { data: connection, error: connError } = await supabase
      .from('channel_connections')
      .select('access_token')
      .eq('channel_type', 'facebook')
      .eq('external_id', pageId)
      .eq('status', 'active')
      .single()

    if (connError || !connection?.access_token) {
      console.error('Connection lookup error:', connError)
      return new Response(JSON.stringify({ error: 'No active Facebook connection found for this page' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = connection.access_token

    // ── ACTION: list-templates ──
    if (action === 'list-templates') {
      const graphUrl = `https://graph.facebook.com/v21.0/${pageId}/message_templates?access_token=${accessToken}`
      console.log(`Calling GET /${pageId}/message_templates for pages_utility_messaging verification`)

      const graphResponse = await fetch(graphUrl)
      const graphData = await graphResponse.json()

      console.log('Graph API response status:', graphResponse.status)
      console.log('Graph API response:', JSON.stringify(graphData))

      if (!graphResponse.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: graphData.error?.message || 'Graph API call failed',
          graphError: graphData.error,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'API call successful! Meta should register this within 24 hours.',
        templates: graphData.data || [],
        templateCount: graphData.data?.length || 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── ACTION: create-template ──
    if (action === 'create-template') {
      const templateName = body.templateName || 'order_confirmation'
      const templateBody = body.templateBody || 'Thank you for your order! 🎉\n\nPackage: {{1}}\nCountry: {{2}}\nData: {{3}}\nValidity: {{4}} days\nAmount: ${{5}}\nOrder ID: {{6}}\n\nYour eSIM is ready to install. Thank you for choosing Mobile11!'

      console.log(`Creating template "${templateName}" for page ${pageId}`)

      const graphUrl = `https://graph.facebook.com/v21.0/${pageId}/message_templates`
      const graphResponse = await fetch(graphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          name: templateName,
          language: 'en_US',
          category: 'UTILITY',
          components: [
            {
              type: 'BODY',
              text: templateBody,
              example: {
                body_text: [[
                  'Japan 5GB',
                  'Japan',
                  '5GB',
                  '7',
                  '15.00',
                  'ORD-TEST-001',
                ]],
              },
            },
          ],
        }),
      })

      const graphData = await graphResponse.json()
      console.log('Create template response:', JSON.stringify(graphData))

      if (!graphResponse.ok) {
        const errMsg = graphData.error?.error_user_msg || graphData.error?.error_user_title || graphData.error?.message || ''
        const alreadyExists = graphData.error?.error_subcode === 2018423 || errMsg.toLowerCase().includes('already exists')
        return new Response(JSON.stringify({
          success: false,
          alreadyExists,
          error: alreadyExists ? 'Template already exists for this page' : (errMsg || 'Failed to create template'),
          graphError: graphData.error,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Template "${templateName}" created successfully.`,
        templateId: graphData.id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── ACTION: send-test ──
    if (action === 'send-test') {
      const { recipientPsid, placeholders } = body

      if (!recipientPsid) {
        return new Response(JSON.stringify({ error: 'recipientPsid is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build the message text from template + placeholders
      const p = placeholders || {}
      const messageText = `📦 Order Confirmation\n\nThank you for your order! 🎉\n\nPackage: ${p.packageName || 'Japan 5GB'}\nCountry: ${p.country || 'Japan'}\nData: ${p.data || '5GB'}\nValidity: ${p.validity || '7'} days\nAmount: $${p.amount || '15.00'}\nOrder ID: ${p.orderId || 'ORD-TEST-001'}\n\nYour eSIM is ready to install. Thank you for choosing Mobile11!`

      console.log(`Sending test utility message to PSID ${recipientPsid}`)

      const graphUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${accessToken}`
      const graphResponse = await fetch(graphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_type: 'MESSAGE_TAG',
          tag: 'POST_PURCHASE_UPDATE',
          recipient: { id: recipientPsid },
          message: { text: messageText },
        }),
      })

      const graphData = await graphResponse.json()
      console.log('Send test response:', JSON.stringify(graphData))

      if (!graphResponse.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: graphData.error?.message || 'Failed to send message',
          graphError: graphData.error,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Test message sent to PSID ${recipientPsid}! Check Messenger to see it.`,
        messageId: graphData.message_id,
        recipientId: graphData.recipient_id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('facebook-utility-test error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
