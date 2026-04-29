
-- Update kb_articles: Replace old plan names with new user-facing names
-- Mapping: Limitless → Unlimited, Max Speed → Low usage, Day Pass → Standard
-- Only updating display text, not internal package_type values

-- First pass: Replace "Limitless" with "Unlimited" (but not "Unlimited/Limitless" patterns - handle carefully)
UPDATE kb_articles 
SET content = REPLACE(content, 'Limitless', 'Unlimited'),
    title = REPLACE(title, 'Limitless', 'Unlimited'),
    updated_at = now()
WHERE content ILIKE '%Limitless%' OR title ILIKE '%Limitless%';

-- Second pass: Replace "Max Speed" with "Low usage"
UPDATE kb_articles 
SET content = REPLACE(content, 'Max Speed', 'Low usage'),
    title = REPLACE(title, 'Max Speed', 'Low usage'),
    updated_at = now()
WHERE content ILIKE '%Max Speed%' OR title ILIKE '%Max Speed%';

-- Third pass: Replace "Day Pass" with "Standard"  
UPDATE kb_articles 
SET content = REPLACE(content, 'Day Pass', 'Standard'),
    title = REPLACE(title, 'Day Pass', 'Standard'),
    updated_at = now()
WHERE content ILIKE '%Day Pass%' OR title ILIKE '%Day Pass%';

-- Fix any double-replacement: "Unlimited/Unlimited" back to just "Unlimited"
UPDATE kb_articles 
SET content = REPLACE(content, 'Unlimited/Unlimited', 'Unlimited'),
    updated_at = now()
WHERE content LIKE '%Unlimited/Unlimited%';
