// Help Center Types - Shared types to avoid circular dependencies

export interface HelpCategory {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  icon: string;
  articleCount: number;
}

export interface HelpArticle {
  id: string;
  categorySlug: string;
  slug: string;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  content: string;
  contentTh: string;
  updatedAt: string;
  tableOfContents: { id: string; title: string; titleTh: string }[];
}
