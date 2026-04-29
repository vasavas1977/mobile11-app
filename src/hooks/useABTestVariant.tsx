import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Get or create session ID for anonymous tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export interface ABTestVariant {
  testId: string | null;
  variantId: string | null;
  config: {
    orderingStrategy?: 'default' | 'popularity' | 'revenue' | 'random';
    layout?: 'grid' | 'list' | 'carousel';
    itemsPerRow?: number;
    showFlags?: boolean;
    [key: string]: any;
  } | null;
}

export const useABTestVariant = () => {
  const [variant, setVariant] = useState<ABTestVariant>({
    testId: null,
    variantId: null,
    config: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = user ? null : getSessionId();

        const { data, error } = await supabase.rpc('get_variant_assignment', {
          p_user_id: user?.id || null,
          p_session_id: sessionId
        });

        if (error) {
          console.error('Error fetching variant:', error);
          setVariant({ testId: null, variantId: null, config: null });
        } else if (data && data.length > 0) {
          const result = data[0];
          setVariant({
            testId: result.test_id,
            variantId: result.variant_id,
            config: result.config as ABTestVariant['config'] || null
          });
        } else {
          setVariant({ testId: null, variantId: null, config: null });
        }
      } catch (error) {
        console.error('Error in useABTestVariant:', error);
        setVariant({ testId: null, variantId: null, config: null });
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, []);

  return { variant, loading };
};
