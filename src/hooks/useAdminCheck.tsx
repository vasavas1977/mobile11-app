import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user || authLoading) {
        setIsAdmin(false);
        setLoading(authLoading);
        return;
      }

      setLoading(true);

      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke('check-admin');

          if (!error) {
            setIsAdmin(data?.isAdmin || false);
            setLoading(false);
            return;
          }
          lastError = error;
          
          // Don't retry on non-network errors
          if (!error.message?.includes('Load failed') && !error.message?.includes('FunctionsFetchError')) {
            break;
          }
        } catch (error: any) {
          lastError = error;
          // Only retry on network errors
          if (!error.message?.includes('Load failed') && !error.message?.includes('FunctionsFetchError')) {
            break;
          }
        }
        
        // Wait before retry: 500ms, 1000ms, 2000ms
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
        }
      }
      
      console.error('Error checking admin role after retries:', lastError);
      setIsAdmin(false);
      setLoading(false);
    }

    checkAdminRole();
  }, [user, authLoading]);

  return { isAdmin, loading };
}