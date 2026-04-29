import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://mobile11.com';
const TODAY = new Date().toISOString().split('T')[0];

// Static pages with their config
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly', hreflang: [{ lang: 'en', suffix: '?lang=en' }, { lang: 'th', suffix: '?lang=th' }] },
  { path: '/packages', priority: '0.9', changefreq: 'daily', hreflang: [{ lang: 'en', suffix: '' }] },
  { path: '/what-is-esim', priority: '0.8', changefreq: 'monthly', hreflang: [{ lang: 'en', suffix: '?lang=en' }, { lang: 'th', suffix: '?lang=th' }] },
  { path: '/thailand-local', priority: '0.8', changefreq: 'weekly', hreflang: [{ lang: 'en', suffix: '?lang=en' }, { lang: 'th', suffix: '?lang=th' }] },
  { path: '/how-it-works', priority: '0.7', changefreq: 'monthly' },
  { path: '/installation-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/guide', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/data-deletion', priority: '0.4', changefreq: 'yearly' },
  { path: '/how-renewals-work', priority: '0.5', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly', hreflang: [{ lang: 'en', suffix: '?lang=en' }, { lang: 'th', suffix: '?lang=th' }] },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/support', priority: '0.6', changefreq: 'monthly' },
  { path: '/business', priority: '0.6', changefreq: 'monthly' },
  { path: '/affiliate', priority: '0.5', changefreq: 'monthly' },
  { path: '/loyalty-program', priority: '0.5', changefreq: 'monthly' },
  { path: '/th/sim-roaming', priority: '0.8', changefreq: 'weekly', hreflang: [{ lang: 'th', suffix: '' }, { lang: 'en', suffix: '' }] },
  { path: '/th/sim-tangprathet', priority: '0.7', changefreq: 'weekly', hreflang: [{ lang: 'th', suffix: '' }] },
  { path: '/refer-and-earn', priority: '0.5', changefreq: 'monthly' },
  { path: '/our-values', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
];

// Blog article slugs (from static blogArticles.ts - these are the canonical slugs)
const BLOG_SLUGS = [
  'best-esim-japan-travel-2025',
  'how-to-use-esim-korea',
  'esim-vs-physical-sim-which-is-better',
  'europe-esim-guide-2025',
  'china-esim-vpn-access',
  'usa-esim-guide',
  'best-esim-singapore-travel-guide',
  'best-esim-taiwan-travel-guide',
  'best-esim-hong-kong-travel-guide',
  'best-esim-vietnam-travel-guide',
  'best-esim-malaysia-travel-guide',
  'best-esim-australia-travel-guide',
  'best-esim-uk-travel-guide',
  'best-esim-france-travel-guide',
  'best-esim-germany-travel-guide',
  'best-esim-italy-travel-guide',
  'best-esim-spain-travel-guide',
  'best-esim-switzerland-travel-guide',
  'best-esim-netherlands-travel-guide',
  'europe-42-countries-esim-guide',
  // Thai articles
  'esim-\u0E04\u0E37\u0E2D\u0E2D\u0E30\u0E44\u0E23-2025',
  '\u0E0B\u0E34\u0E21\u0E0D\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E19-\u0E04\u0E48\u0E32\u0E22\u0E44\u0E2B\u0E19\u0E14\u0E35-2025',
  '\u0E42\u0E23\u0E21\u0E21\u0E34\u0E48\u0E07-vs-esim-2025',
  '\u0E0B\u0E34\u0E21\u0E15\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28-\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21-2025',
];

// Thai SEO landing pages with their English counterparts
const THAI_LANDING_PAGES: Record<string, string> = {
  'japan': 'japan',
  'korea': 'korea',
  'taiwan': 'taiwan',
  'hongkong': 'hong-kong',
  'europe': 'europe',
  'singapore': 'singapore',
  'malaysia': 'malaysia',
  'vietnam': 'vietnam',
  'china': 'china',
  'usa': 'usa',
};

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function countryNameToSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[&+]/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function buildUrlEntry(loc: string, lastmod: string, changefreq: string, priority: string, hreflangLinks?: { lang: string; href: string }[]): string {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
  if (hreflangLinks) {
    for (const link of hreflangLinks) {
      entry += `    <xhtml:link rel="alternate" hreflang="${link.lang}" href="${escapeXml(link.href)}"/>\n`;
    }
  }
  entry += '  </url>\n';
  return entry;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch distinct active country names from esim_packages
    const { data: countryRows } = await supabase
      .from('esim_packages')
      .select('country_name, country_code')
      .eq('is_active', true);

    // Deduplicate and build country slugs
    // Filter to single-country packages (no "/" or "Countries" in name indicating regional)
    const countryMap = new Map<string, { name: string; code: string; slug: string }>();
    if (countryRows) {
      for (const row of countryRows) {
        const name = row.country_name;
        // Skip regional/multi-country packages
        if (name.includes('/') || name.includes('Countries') || name.includes('Stopover') || name.includes('Global')) continue;
        const key = name.toLowerCase();
        if (!countryMap.has(key)) {
          countryMap.set(key, {
            name,
            code: row.country_code?.toUpperCase() || 'XX',
            slug: countryNameToSlug(name),
          });
        }
      }
    }

    const countries = Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // 2. Fetch blog article slugs from kb_articles or use blogArticles
    // Blog articles are stored as static data, but we can try to query any blog-related data
    // For now, we'll query distinct slugs from the blog article pattern
    // Since blog articles aren't in DB, we'll generate from the country-based blog pattern

    // Actually - let's fetch all published KB articles to include support articles too
    const { data: kbArticles } = await supabase
      .from('kb_articles')
      .select('slug, category, updated_at, language')
      .eq('is_published', true)
      .eq('is_internal', false)
      .order('category');

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';

    // Static pages
    for (const page of STATIC_PAGES) {
      const hreflangLinks = page.hreflang?.map(h => ({
        lang: h.lang,
        href: `${BASE_URL}${page.path}${h.suffix}`,
      }));
      if (hreflangLinks) {
        hreflangLinks.push({ lang: 'x-default', href: `${BASE_URL}${page.path}` });
      }
      xml += buildUrlEntry(`${BASE_URL}${page.path}`, TODAY, page.changefreq, page.priority, hreflangLinks);
    }

    xml += '\n  <!-- Country eSIM Pages (auto-generated from database) -->\n';

    // Country pages
    for (const country of countries) {
      const slug = country.slug;
      const thaiKey = Object.entries(THAI_LANDING_PAGES).find(([_, enSlug]) => enSlug === slug)?.[0];

      const hreflangLinks = [
        { lang: 'en', href: `${BASE_URL}/esim/${slug}` },
        { lang: 'x-default', href: `${BASE_URL}/esim/${slug}` },
      ];
      if (thaiKey) {
        hreflangLinks.push({ lang: 'th', href: `${BASE_URL}/th/esim-${thaiKey}` });
      }

      xml += buildUrlEntry(`${BASE_URL}/esim/${slug}`, TODAY, 'weekly', '0.8', hreflangLinks);
    }

    // Thai SEO landing pages
    xml += '\n  <!-- Thai SEO Landing Pages -->\n';
    for (const [thaiSlug, enSlug] of Object.entries(THAI_LANDING_PAGES)) {
      xml += buildUrlEntry(
        `${BASE_URL}/th/esim-${thaiSlug}`,
        TODAY,
        'weekly',
        '0.8',
        [
          { lang: 'th', href: `${BASE_URL}/th/esim-${thaiSlug}` },
          { lang: 'en', href: `${BASE_URL}/esim/${enSlug}` },
        ]
      );
    }

    // Blog articles
    xml += '\n  <!-- Blog Articles -->\n';
    for (const slug of BLOG_SLUGS) {
      const encodedSlug = encodeURIComponent(slug).replace(/%2F/g, '/');
      xml += buildUrlEntry(`${BASE_URL}/blog/${encodedSlug}`, TODAY, 'monthly', '0.7');
    }

    // Support/KB articles (deduplicated)
    if (kbArticles && kbArticles.length > 0) {
      xml += '\n  <!-- Help Center Articles (auto-generated from database) -->\n';

      // Group by category for category pages
      const categories = new Set<string>();
      for (const article of kbArticles) {
        categories.add(article.category);
      }
      for (const category of categories) {
        xml += buildUrlEntry(`${BASE_URL}/support/${category}`, TODAY, 'weekly', '0.6');
      }

      // Individual articles - deduplicate by category+slug
      const seenArticles = new Set<string>();
      for (const article of kbArticles) {
        const key = `${article.category}/${article.slug}`;
        if (seenArticles.has(key)) continue;
        seenArticles.add(key);
        const lastmod = article.updated_at ? article.updated_at.split('T')[0] : TODAY;
        xml += buildUrlEntry(
          `${BASE_URL}/support/${article.category}/${article.slug}`,
          lastmod,
          'monthly',
          '0.5'
        );
      }
    }

    xml += '\n</urlset>\n';

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    return new Response(`Error generating sitemap: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
