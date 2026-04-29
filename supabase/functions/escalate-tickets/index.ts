import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    let escalatedCount = 0;

    // Escalate Low to Medium (> 24 hours old)
    const { data: lowTickets, error: lowError } = await supabaseClient
      .from('support_tickets')
      .select('id, ticket_number, created_at')
      .eq('status', 'open')
      .eq('priority', 'low')
      .lt('created_at', twentyFourHoursAgo.toISOString());

    if (lowError) {
      console.error('Error fetching low priority tickets:', lowError);
    } else if (lowTickets && lowTickets.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('support_tickets')
        .update({
          priority: 'medium',
          auto_escalated: true,
          auto_escalated_at: now.toISOString()
        })
        .in('id', lowTickets.map(t => t.id));

      if (!updateError) {
        escalatedCount += lowTickets.length;
        console.log(`Escalated ${lowTickets.length} tickets from Low to Medium`);
      }
    }

    // Escalate Medium to High (> 48 hours old)
    const { data: mediumTickets, error: mediumError } = await supabaseClient
      .from('support_tickets')
      .select('id, ticket_number, created_at')
      .eq('status', 'open')
      .eq('priority', 'medium')
      .lt('created_at', fortyEightHoursAgo.toISOString());

    if (mediumError) {
      console.error('Error fetching medium priority tickets:', mediumError);
    } else if (mediumTickets && mediumTickets.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('support_tickets')
        .update({
          priority: 'high',
          auto_escalated: true,
          auto_escalated_at: now.toISOString()
        })
        .in('id', mediumTickets.map(t => t.id));

      if (!updateError) {
        escalatedCount += mediumTickets.length;
        console.log(`Escalated ${mediumTickets.length} tickets from Medium to High`);
      }
    }

    // Escalate High to Urgent (> 72 hours old)
    const { data: highTickets, error: highError } = await supabaseClient
      .from('support_tickets')
      .select('id, ticket_number, created_at')
      .eq('status', 'open')
      .eq('priority', 'high')
      .lt('created_at', seventyTwoHoursAgo.toISOString());

    if (highError) {
      console.error('Error fetching high priority tickets:', highError);
    } else if (highTickets && highTickets.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('support_tickets')
        .update({
          priority: 'urgent',
          auto_escalated: true,
          auto_escalated_at: now.toISOString()
        })
        .in('id', highTickets.map(t => t.id));

      if (!updateError) {
        escalatedCount += highTickets.length;
        console.log(`Escalated ${highTickets.length} tickets from High to Urgent`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        escalated_count: escalatedCount,
        message: `Successfully escalated ${escalatedCount} tickets`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in escalate-tickets function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
