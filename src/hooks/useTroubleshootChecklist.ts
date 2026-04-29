import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TroubleshootSymptom, SYMPTOM_TO_KB_SLUG } from '@/components/chat/flows/types';
import { TableOfContentsItem } from '@/types/helpCenter';

export interface ChecklistItem {
  id: string;
  textEn: string;
  textTh: string;
  textJa: string;
}

/**
 * Fetches troubleshooting checklist items from kb_articles.
 * Uses table_of_contents to generate checklist steps.
 */
export function useTroubleshootChecklist(symptom: TroubleshootSymptom | undefined) {
  const slug = symptom ? SYMPTOM_TO_KB_SLUG[symptom] : undefined;

  return useQuery({
    queryKey: ['troubleshoot-checklist', slug],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!slug) return [];

      // Fetch EN, TH, and JA versions in parallel
      const [enResult, thResult, jaResult] = await Promise.all([
        supabase
          .from('kb_articles')
          .select('table_of_contents, content')
          .eq('slug', slug)
          .eq('language', 'en')
          .eq('category', 'troubleshoot')
          .eq('is_published', true)
          .maybeSingle(),
        supabase
          .from('kb_articles')
          .select('table_of_contents, content')
          .eq('slug', slug)
          .eq('language', 'th')
          .eq('category', 'troubleshoot')
          .eq('is_published', true)
          .maybeSingle(),
        supabase
          .from('kb_articles')
          .select('table_of_contents, content')
          .eq('slug', slug)
          .eq('language', 'ja')
          .eq('category', 'troubleshoot')
          .eq('is_published', true)
          .maybeSingle(),
      ]);

      const enArticle = enResult.data;
      const thArticle = thResult.data;
      const jaArticle = jaResult.data;

      if (!enArticle?.table_of_contents) {
        return [];
      }

      const enToc = enArticle.table_of_contents as unknown as TableOfContentsItem[];
      const thToc = (thArticle?.table_of_contents as unknown as TableOfContentsItem[]) || [];
      const jaToc = (jaArticle?.table_of_contents as unknown as TableOfContentsItem[]) || [];

      const checklistItems: ChecklistItem[] = enToc
        .filter((_, index) => index > 0)
        .slice(0, 8)
        .map((tocItem, index) => {
          const thItem = thToc[index + 1];
          const jaItem = jaToc[index + 1];
          
          return {
            id: `ts-${tocItem.id || index}`,
            textEn: tocItem.title,
            textTh: thItem?.title || tocItem.title,
            textJa: jaItem?.title || tocItem.title,
          };
        });

      return checklistItems;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - articles don't change often
  });
}
