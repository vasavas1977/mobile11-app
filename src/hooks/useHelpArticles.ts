import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KBArticle, TableOfContentsItem } from '@/types/helpCenter';

// Helper to transform database response to typed article
function transformArticle(row: any): KBArticle {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    language: row.language,
    slug: row.slug,
    description: row.description,
    table_of_contents: row.table_of_contents as TableOfContentsItem[] | null,
    display_order: row.display_order,
    source: row.source as 'website' | 'chatbot' | 'both' | null,
    is_published: row.is_published,
    is_internal: row.is_internal,
    view_count: row.view_count,
    tags: row.tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Get article counts per category for website-visible articles
export function useHelpCategoryCounts(language: string) {
  return useQuery({
    queryKey: ['help-category-counts', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('category')
        .eq('is_published', true)
        .eq('is_internal', false)
        .eq('language', language)
        .or('source.eq.website,source.eq.both');

      if (error) throw error;

      // Count articles per category
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        counts[row.category] = (counts[row.category] || 0) + 1;
      });
      return counts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get articles for a specific category
export function useHelpArticles(categorySlug: string, language: string) {
  return useQuery({
    queryKey: ['help-articles', categorySlug, language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('category', categorySlug)
        .eq('language', language)
        .eq('is_published', true)
        .eq('is_internal', false)
        .or('source.eq.website,source.eq.both')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(transformArticle);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get a single article by category and slug
export function useHelpArticle(categorySlug: string, articleSlug: string, language: string) {
  return useQuery({
    queryKey: ['help-article', categorySlug, articleSlug, language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('category', categorySlug)
        .eq('slug', articleSlug)
        .eq('language', language)
        .eq('is_published', true)
        .eq('is_internal', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data ? transformArticle(data) : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Search articles
export function useSearchHelpArticles(query: string, language: string) {
  return useQuery({
    queryKey: ['help-search', query, language],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];

      const searchTerm = `%${query.trim()}%`;
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('language', language)
        .eq('is_published', true)
        .eq('is_internal', false)
        .or('source.eq.website,source.eq.both')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .limit(10);

      if (error) throw error;
      return (data || []).map(transformArticle);
    },
    enabled: query.trim().length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute for search
  });
}

// Get popular/featured articles by slugs
export function usePopularHelpArticles(slugs: string[], language: string) {
  return useQuery({
    queryKey: ['help-popular', slugs, language],
    queryFn: async () => {
      if (!slugs.length) return [];

      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('language', language)
        .eq('is_published', true)
        .eq('is_internal', false)
        .in('slug', slugs)
        .or('source.eq.website,source.eq.both');

      if (error) throw error;

      // Sort by the order provided in slugs array
      const articles = (data || []).map(transformArticle);
      return slugs
        .map(slug => articles.find(a => a.slug === slug))
        .filter((a): a is KBArticle => a !== undefined);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Increment view count for an article (using direct update)
export async function incrementArticleViewCount(articleId: string) {
  try {
    // First get current count, then increment
    const { data } = await supabase
      .from('kb_articles')
      .select('view_count')
      .eq('id', articleId)
      .single();
    
    if (data) {
      await supabase
        .from('kb_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', articleId);
    }
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
}
