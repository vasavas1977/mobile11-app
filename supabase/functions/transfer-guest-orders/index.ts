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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { guestUserId, targetEmail, parentOrderId } = await req.json();

    // Caller must be the guest user
    if (user.id !== guestUserId) {
      return new Response(JSON.stringify({ error: 'You can only transfer your own orders' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify OTP was already completed for this order group
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, email_verified')
      .eq('parent_order_id', parentOrderId)
      .eq('user_id', guestUserId);

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ error: 'No orders found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const allVerified = orders.every(o => o.email_verified === true);
    if (!allVerified) {
      return new Response(JSON.stringify({ error: 'Email must be verified before transfer' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find target user by email using admin API
    const adminHeaders = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
    };

    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
      headers: adminHeaders,
    });

    if (!listRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to look up target user' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const listData = await listRes.json();
    const users = listData.users || listData || [];
    const targetUser = Array.isArray(users)
      ? users.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase())
      : null;

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'Target account not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const targetUserId = targetUser.id;
    const orderIds = orders.map(o => o.id);

    console.log(`Transferring ${orderIds.length} orders from guest ${guestUserId} to ${targetUserId}`);

    // Transfer orders
    const { error: orderErr } = await supabaseAdmin
      .from('orders')
      .update({ 
        user_id: targetUserId,
        guest_email: targetEmail,
        notification_email: targetEmail
      })
      .eq('parent_order_id', parentOrderId)
      .eq('user_id', guestUserId);

    if (orderErr) {
      console.error('Order transfer error:', orderErr);
      return new Response(JSON.stringify({ error: 'Failed to transfer orders' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transfer payments
    for (const orderId of orderIds) {
      await supabaseAdmin
        .from('payments')
        .update({ user_id: targetUserId })
        .eq('order_id', orderId)
        .eq('user_id', guestUserId);
    }

    // Transfer mobile11_money_transactions
    await supabaseAdmin
      .from('mobile11_money_transactions')
      .update({ user_id: targetUserId })
      .eq('user_id', guestUserId);

    // Send order confirmation emails to the target account
    for (const orderId of orderIds) {
      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, overrideEmail: targetEmail }),
        });
        console.log(`Confirmation email for order ${orderId}: ${emailRes.status}`);
      } catch (emailErr) {
        console.error('Failed to send confirmation for transferred order:', orderId, emailErr);
      }
    }

    // Delete guest auth account
    try {
      const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${guestUserId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (!deleteRes.ok) {
        console.error('Failed to delete guest account:', await deleteRes.text());
      } else {
        console.log(`Guest account ${guestUserId} deleted`);
      }
    } catch (delErr) {
      console.error('Error deleting guest account:', delErr);
    }

    console.log(`Transfer complete: ${orderIds.length} orders moved to ${targetUserId}`);

    return new Response(JSON.stringify({ success: true, signOut: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Transfer error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
