-- Phase 1: Enhance kb_articles schema for Help Center unification
-- Add new columns for website routing and content management

ALTER TABLE kb_articles 
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS table_of_contents jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'both' CHECK (source IN ('website', 'chatbot', 'both'));

-- Create unique index for slug per category+language (for URL routing)
CREATE UNIQUE INDEX IF NOT EXISTS kb_articles_slug_cat_lang_idx 
  ON kb_articles(slug, category, language) 
  WHERE slug IS NOT NULL;

-- Phase 2: Standardize categories (merge duplicates)
UPDATE kb_articles SET category = 'troubleshoot' WHERE category = 'troubleshooting';
UPDATE kb_articles SET category = 'esim-data-plan' WHERE category IN ('plans', 'coverage', 'usage', 'management');
UPDATE kb_articles SET category = 'payments-billing' WHERE category IN ('billing', 'payment');
UPDATE kb_articles SET category = 'account' WHERE category = 'ordering';
UPDATE kb_articles SET category = 'about-esim' WHERE category IN ('device', 'company');

-- Add comment explaining the schema
COMMENT ON COLUMN kb_articles.slug IS 'URL-friendly identifier for website routing (unique per category+language)';
COMMENT ON COLUMN kb_articles.description IS 'Short summary for list views and SEO meta descriptions';
COMMENT ON COLUMN kb_articles.table_of_contents IS 'Array of {id, title} objects for in-page navigation';
COMMENT ON COLUMN kb_articles.display_order IS 'Sort order within category (lower = first)';
COMMENT ON COLUMN kb_articles.source IS 'Controls visibility: website, chatbot, or both';