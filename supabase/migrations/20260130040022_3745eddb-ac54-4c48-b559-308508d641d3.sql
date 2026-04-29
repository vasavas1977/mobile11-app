-- Generate unique slugs for existing articles
-- First, create a function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_unique_kb_slug(p_title text, p_category text, p_language text, p_article_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title
  base_slug := LOWER(
    TRIM(BOTH '-' FROM 
      REGEXP_REPLACE(
        REGEXP_REPLACE(p_title, '[^a-zA-Z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      )
    )
  );
  
  -- Truncate if too long
  IF LENGTH(base_slug) > 80 THEN
    base_slug := LEFT(base_slug, 80);
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add suffix if needed
  WHILE EXISTS(
    SELECT 1 FROM kb_articles 
    WHERE slug = final_slug 
      AND category = p_category 
      AND language = p_language
      AND id != p_article_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Update all articles without slugs
UPDATE kb_articles 
SET slug = generate_unique_kb_slug(title, category, language, id)
WHERE slug IS NULL;