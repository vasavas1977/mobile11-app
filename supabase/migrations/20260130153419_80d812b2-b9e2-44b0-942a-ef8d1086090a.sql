-- Fix ALL duplicate slugs before category migration
-- Append category prefix to make slugs unique

-- Fix duplicates in faq category
UPDATE kb_articles 
SET slug = CONCAT('faq-', slug)
WHERE category = 'faq' 
  AND slug IN ('what-is-esim', 'is-my-phone-compatible', 'esim', 'esim-1', 'esim-2', 'esim-3', 'esim-4', 'esim-5', 'mobile11');

-- Fix duplicates in esim-data-plan category (for -1, -4, -5, -6 slugs)
UPDATE kb_articles 
SET slug = CONCAT('edp-', SUBSTRING(id::text, 1, 8))
WHERE category = 'esim-data-plan' 
  AND slug IN ('-1', '-4', '-5', '-6', 'esim', 'esim-1', 'esim-2', 'esim-3', 'esim-4', 'esim-5', 'mobile11', 'mobile11-1');

-- Fix duplicates in about-esim category
UPDATE kb_articles 
SET slug = CONCAT('abt-', SUBSTRING(id::text, 1, 8))
WHERE category = 'about-esim' 
  AND slug IN ('esim', 'esim-1', 'mobile11', 'mobile11-1');

-- Fix duplicates in troubleshoot category
UPDATE kb_articles 
SET slug = CONCAT('ts-', SUBSTRING(id::text, 1, 8))
WHERE category = 'troubleshoot' 
  AND slug IN ('esim', 'esim-1', 'esim-2', 'esim-3', 'esim-4');

-- Fix duplicates in affiliate category
UPDATE kb_articles 
SET slug = CONCAT('aff-', SUBSTRING(id::text, 1, 8))
WHERE category = 'affiliate' 
  AND slug = '-1';

-- Fix duplicates in payments-billing category
UPDATE kb_articles 
SET slug = CONCAT('pay-', SUBSTRING(id::text, 1, 8))
WHERE category = 'payments-billing' 
  AND slug IN ('-4', '-5', '-6');

-- Fix duplicates in account category (mobile11 slug)
UPDATE kb_articles 
SET slug = CONCAT('acc-', SUBSTRING(id::text, 1, 8))
WHERE category = 'account' 
  AND slug = 'mobile11';