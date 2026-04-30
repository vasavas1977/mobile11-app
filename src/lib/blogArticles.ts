// Stub file - blog articles data
export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
}

export const blogArticles: BlogArticle[] = [];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find(a => a.slug === slug);
}

export function getRelatedArticles(slug: string, limit: number = 3): BlogArticle[] {
  const article = getArticleBySlug(slug);
  if (!article) return [];
  return blogArticles
    .filter(a => a.slug !== slug && a.category === article.category)
    .slice(0, limit);
}
