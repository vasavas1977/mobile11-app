import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify caller
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      const msg = userError?.message || '';
      const isDeletedUser = msg.includes('not exist') || msg.includes('sub claim');
      return new Response(JSON.stringify({ error: isDeletedUser ? 'session_expired' : 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, newEmail } = await req.json();

    // Ensure the caller can only update their own email
    if (user.id !== userId) {
      return new Response(JSON.stringify({ error: 'You can only update your own email' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate email
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminHeaders = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
    };

    // Check if email is already taken using direct REST API
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
      headers: adminHeaders,
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const users = listData.users || listData || [];
      if (Array.isArray(users)) {
        const existingUser = users.find(
          (u: any) => u.email?.toLowerCase() === newEmail.toLowerCase() && u.id !== userId
        );
        if (existingUser) {
          // Email belongs to an existing account — return transfer signal instead of error
          console.log(`Email ${newEmail} belongs to existing user ${existingUser.id}, signaling order transfer`);
          return new Response(JSON.stringify({ 
            orderTransfer: true, 
            targetUserId: existingUser.id,
            targetEmail: newEmail 
          }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    } else {
      const listBody = await listRes.text();
      console.error('List users API error:', listRes.status, listBody);
    }

    // Update auth email using direct REST API (bypasses broken SDK)
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ email: newEmail, email_confirm: true }),
    });

    if (!updateRes.ok) {
      const errorBody = await updateRes.text();
      console.error('Auth update REST API error:', updateRes.status, errorBody);
      return new Response(JSON.stringify({ error: `Failed to update email: ${errorBody}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    await updateRes.text(); // consume body

    // Sync profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    console.log(`Guest email updated: ${userId} -> ${newEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
