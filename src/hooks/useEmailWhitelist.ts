import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhitelistEntry {
  id: string;
  email: string;
  added_by: string | null;
  reason: string | null;
  created_at: string;
}

export function useEmailWhitelist() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchWhitelist = async () => {
    try {
      const { data, error } = await supabase
        .from('email_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWhitelist((data || []) as WhitelistEntry[]);
    } catch (error) {
      console.error('Error fetching whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email whitelist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const addToWhitelist = async (email: string, reason?: string) => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if already exists
      const existing = whitelist.find(w => w.email.toLowerCase() === normalizedEmail);
      if (existing) {
        toast({
          title: 'Already whitelisted',
          description: `${email} is already in the whitelist`,
        });
        return existing;
      }

      const { data, error } = await supabase
        .from('email_whitelist')
        .insert({
          email: normalizedEmail,
          added_by: userData.user?.id,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      setWhitelist(prev => [data as WhitelistEntry, ...prev]);
      toast({
        title: 'Email whitelisted',
        description: `${email} has been added to the whitelist`,
      });
      return data as WhitelistEntry;
    } catch (error: any) {
      console.error('Error adding to whitelist:', error);
      // Handle unique constraint violation
      if (error.code === '23505') {
        toast({
          title: 'Already whitelisted',
          description: `${email} is already in the whitelist`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add email to whitelist',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const removeFromWhitelist = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWhitelist(prev => prev.filter(w => w.id !== id));
      toast({
        title: 'Email removed',
        description: 'Email has been removed from the whitelist',
      });
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove email from whitelist',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const isWhitelisted = (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    return whitelist.some(w => w.email.toLowerCase() === normalizedEmail);
  };

  return {
    whitelist,
    loading,
    saving,
    addToWhitelist,
    removeFromWhitelist,
    isWhitelisted,
    refetch: fetchWhitelist,
  };
}
