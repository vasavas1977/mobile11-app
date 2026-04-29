import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SpamRule {
  id: string;
  rule_type: 'keyword' | 'domain' | 'email' | 'regex';
  value: string;
  description: string | null;
  is_active: boolean;
  match_in: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SpamLogEntry {
  id: string;
  from_email: string;
  to_email: string | null;
  subject: string | null;
  message_preview: string | null;
  matched_rules: string[] | null;
  raw_payload: {
    data?: {
      html?: string;
      text?: string;
    };
  } | null;
  created_at: string;
}

export function useSpamRules() {
  const [rules, setRules] = useState<SpamRule[]>([]);
  const [spamLog, setSpamLog] = useState<SpamLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('spam_filter_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []) as SpamRule[]);
    } catch (error) {
      console.error('Error fetching spam rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch spam rules',
        variant: 'destructive',
      });
    }
  };

  const fetchSpamLog = async () => {
    try {
      const { data, error } = await supabase
        .from('spam_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSpamLog((data || []) as SpamLogEntry[]);
    } catch (error) {
      console.error('Error fetching spam log:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRules(), fetchSpamLog()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const addRule = async (rule: Omit<SpamRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('spam_filter_rules')
        .insert({
          ...rule,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setRules(prev => [data as SpamRule, ...prev]);
      toast({
        title: 'Rule added',
        description: 'Spam filter rule has been created',
      });
      return data as SpamRule;
    } catch (error) {
      console.error('Error adding spam rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add spam rule',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (id: string, updates: Partial<SpamRule>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('spam_filter_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setRules(prev => prev.map(r => r.id === id ? data as SpamRule : r));
      toast({
        title: 'Rule updated',
        description: 'Spam filter rule has been updated',
      });
      return data as SpamRule;
    } catch (error) {
      console.error('Error updating spam rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update spam rule',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    return updateRule(id, { is_active: isActive });
  };

  const deleteRule = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('spam_filter_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Rule deleted',
        description: 'Spam filter rule has been removed',
      });
    } catch (error) {
      console.error('Error deleting spam rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete spam rule',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const clearSpamLog = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('spam_log')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      setSpamLog([]);
      toast({
        title: 'Log cleared',
        description: 'Spam log has been cleared',
      });
    } catch (error) {
      console.error('Error clearing spam log:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear spam log',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    rules,
    spamLog,
    loading,
    saving,
    addRule,
    updateRule,
    toggleRule,
    deleteRule,
    clearSpamLog,
    refetchRules: fetchRules,
    refetchSpamLog: fetchSpamLog,
  };
}
