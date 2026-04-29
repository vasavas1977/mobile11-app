-- Step 1: Fix empty and duplicate slugs before migration
-- Generate unique slugs for articles with empty slugs

-- Fix empty slugs by generating from title
UPDATE kb_articles 
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')),
  '-',
  SUBSTRING(id::text, 1, 8)
)
WHERE slug IS NULL OR slug = '';

-- Fix duplicate slugs (-1, -2, -3, esim) in payments-billing before merging
UPDATE kb_articles 
SET slug = CONCAT(slug, '-pb-', SUBSTRING(id::text, 1, 8))
WHERE category = 'payments-billing' 
  AND slug IN ('-1', '-2', '-3', 'esim');

-- Fix duplicate slugs (-1, -2, -3, esim) in account 
UPDATE kb_articles 
SET slug = CONCAT(slug, '-acc-', SUBSTRING(id::text, 1, 8))
WHERE category = 'account' 
  AND slug IN ('-1', '-2', '-3', 'esim');