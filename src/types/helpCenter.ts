// Help Center Types - Database-aligned types for kb_articles

export interface TableOfContentsItem {
  id: string;
  title: string;
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  slug: string | null;
  description: string | null;
  table_of_contents: TableOfContentsItem[] | null;
  display_order: number | null;
  source: 'website' | 'chatbot' | 'both' | null;
  is_published: boolean;
  is_internal: boolean;
  view_count: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// Category configuration for UI elements (icons, display names)
export interface HelpCategoryConfig {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  nameJa?: string;
  description: string;
  descriptionTh: string;
  icon: string;
  [key: string]: string | undefined;
}
