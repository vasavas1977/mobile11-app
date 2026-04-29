import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useConversationRating(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversation-rating', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversation_ratings')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useConversationRatingsBatch(conversationIds: string[]) {
  return useQuery({
    queryKey: ['conversation-ratings-batch', conversationIds.join(',')],
    queryFn: async () => {
      if (conversationIds.length === 0) return new Map<string, number>();
      const { data } = await supabase
        .from('conversation_ratings')
        .select('conversation_id, rating')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });
      
      const map = new Map<string, number>();
      (data || []).forEach((r) => {
        if (!map.has(r.conversation_id!)) {
          map.set(r.conversation_id!, r.rating);
        }
      });
      return map;
    },
    enabled: conversationIds.length > 0,
  });
}
