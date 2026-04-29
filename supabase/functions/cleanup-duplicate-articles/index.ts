import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Slugs to DELETE (duplicate short articles)
const SLUGS_TO_DELETE = [
  'my-esim-is-not-activating',
  'i-have-no-internet-connection',
  'esim-internet-slow',
  'my-internet-speed-is-slow',
  'my-internet-speed-slowed-down-suddenly-what-should-i-do',
  'esim-stuck-at-activating',
  'what-are-the-apn-settings-for-my-esim',
  'i-cannot-scan-the-qr-code',
  'my-qr-code-isn-t-working-what-should-i-do',
  'cellular-plans-cannot-be-added-error',
  // Short articles that will be replaced with comprehensive versions
  'cannot-make-calls-with-esim',
  'data-not-working-after-landing',
  'esim-data-depleted-before-expected',
  'esim-not-showing-in-settings',
  'esim-working-but-no-signal-bars',
  'how-to-change-network-selection',
  'how-to-delete-esim-from-device',
  'this-code-is-no-longer-valid-error',
  'my-esim-shows-4g-5g-but-there-s-no-internet-what-should-i-do',
  'how-do-i-fix-no-internet-connection-after-activating-my-esim',
  // Remaining duplicates found
  'how-do-i-fix-no-internet-connection-after-activating-the-esim',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const results: { action: string; count: number; details: string[] }[] = [];

    // Step 1: Delete duplicate slugs
    console.log('Deleting duplicate slugs...');
    const { data: deletedBySlugs, error: deleteError1 } = await adminClient
      .from('kb_articles')
      .delete()
      .eq('category', 'troubleshoot')
      .in('slug', SLUGS_TO_DELETE)
      .select('slug, language');

    if (deleteError1) {
      console.error('Error deleting by slugs:', deleteError1);
    } else {
      results.push({
        action: 'Deleted duplicate slugs',
        count: deletedBySlugs?.length || 0,
        details: deletedBySlugs?.map(a => `${a.slug} (${a.language})`) || []
      });
    }

    // Step 2: Delete malformed slugs (empty, numeric suffixes, etc.)
    console.log('Deleting malformed slugs...');
    const { data: allTroubleshoot } = await adminClient
      .from('kb_articles')
      .select('id, slug, language')
      .eq('category', 'troubleshoot');

    const malformedIds: string[] = [];
    const malformedDetails: string[] = [];
    
    allTroubleshoot?.forEach(article => {
      const slug = article.slug || '';
      // Malformed: empty, just numbers, ends with -1/-2/-3, or very short
      if (
        !slug ||
        slug.length < 3 ||
        /^-?\d+$/.test(slug) ||
        /^-\d+$/.test(slug) ||
        slug === '-' ||
        slug === '--'
      ) {
        malformedIds.push(article.id);
        malformedDetails.push(`"${slug}" (${article.language})`);
      }
    });

    if (malformedIds.length > 0) {
      const { error: deleteError2 } = await adminClient
        .from('kb_articles')
        .delete()
        .in('id', malformedIds);

      if (deleteError2) {
        console.error('Error deleting malformed slugs:', deleteError2);
      } else {
        results.push({
          action: 'Deleted malformed slugs',
          count: malformedIds.length,
          details: malformedDetails
        });
      }
    }

    // Step 3: Get remaining count
    const { count: remainingCount } = await adminClient
      .from('kb_articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'troubleshoot');

    console.log(`Cleanup complete. Remaining troubleshoot articles: ${remainingCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Cleanup completed successfully',
      results,
      remainingTroubleshootArticles: remainingCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
