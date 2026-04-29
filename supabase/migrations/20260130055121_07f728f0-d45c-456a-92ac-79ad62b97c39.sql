-- Add unique constraint on slug, category, language for upsert support
ALTER TABLE kb_articles 
ADD CONSTRAINT kb_articles_slug_category_language_unique 
UNIQUE (slug, category, language);