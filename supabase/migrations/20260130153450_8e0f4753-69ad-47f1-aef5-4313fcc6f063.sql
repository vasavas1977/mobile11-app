-- Phase 2: Now run the category migrations

-- Rename esim-data-plan to using-esim
UPDATE kb_articles SET category = 'using-esim' WHERE category = 'esim-data-plan';

-- Rename about-esim to about-mobile11
UPDATE kb_articles SET category = 'about-mobile11' WHERE category = 'about-esim';

-- Merge payments-billing into account
UPDATE kb_articles SET category = 'account' WHERE category = 'payments-billing';

-- Distribute FAQ articles to relevant categories:
-- Installation-related FAQs go to getting-started
UPDATE kb_articles 
SET category = 'getting-started' 
WHERE category = 'faq' 
  AND (
    slug ILIKE '%install%' 
    OR slug ILIKE '%setup%' 
    OR slug ILIKE '%purchase%'
    OR slug ILIKE '%buy%'
    OR slug ILIKE '%activate%'
    OR slug ILIKE '%compatible%'
  );

-- Usage-related FAQs go to using-esim
UPDATE kb_articles 
SET category = 'using-esim' 
WHERE category = 'faq' 
  AND (
    slug ILIKE '%data%' 
    OR slug ILIKE '%usage%' 
    OR slug ILIKE '%hotspot%'
    OR slug ILIKE '%top-up%'
    OR slug ILIKE '%topup%'
    OR slug ILIKE '%renew%'
    OR slug ILIKE '%transfer%'
  );

-- Account-related FAQs go to account
UPDATE kb_articles 
SET category = 'account' 
WHERE category = 'faq' 
  AND (
    slug ILIKE '%account%' 
    OR slug ILIKE '%login%' 
    OR slug ILIKE '%password%'
    OR slug ILIKE '%money%'
    OR slug ILIKE '%loyalty%'
    OR slug ILIKE '%refund%'
    OR slug ILIKE '%payment%'
  );

-- Remaining FAQ articles go to about-mobile11 (general info)
UPDATE kb_articles 
SET category = 'about-mobile11' 
WHERE category = 'faq';