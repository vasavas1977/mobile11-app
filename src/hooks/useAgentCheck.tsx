import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useAgentCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAgent, setIsAgent] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If auth is still loading, stay in loading state
    if (authLoading) {
      setLoading(true);
      return;
    }

    // No user — not loading, no roles
    if (!user) {
      setIsAgent(false);
      setIsSupervisor(false);
      setIsAdmin(false);
      checkedUserIdRef.current = null;
      setLoading(false);
      return;
    }

    // If the user changed, reset roles immediately and mark loading
    if (checkedUserIdRef.current !== user.id) {
      setIsAgent(false);
      setIsSupervisor(false);
      setIsAdmin(false);
      setLoading(true);
    }

    async function checkRoles() {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user!.id);

        // Guard: user may have changed while query was in flight
        if (user!.id !== checkedUserIdRef.current && checkedUserIdRef.current !== null) {
          return; // stale response, ignore
        }

        if (error) {
          console.error('Error checking roles:', error);
          setIsAgent(false);
          setIsSupervisor(false);
          setIsAdmin(false);
        } else {
          const roles = data?.map(r => r.role) || [];
          setIsAgent(roles.includes('agent') || roles.includes('supervisor') || roles.includes('admin'));
          setIsSupervisor(roles.includes('supervisor') || roles.includes('admin'));
          setIsAdmin(roles.includes('admin'));
        }
      } catch (error) {
        console.error('Unexpected error checking roles:', error);
        setIsAgent(false);
        setIsSupervisor(false);
        setIsAdmin(false);
      } finally {
        checkedUserIdRef.current = user!.id;
        setLoading(false);
      }
    }

    checkRoles();
  }, [user, authLoading]);

  return { isAgent, isSupervisor, isAdmin, loading };
}
