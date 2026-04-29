import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrganizationCreditTransaction {
  id: string;
  organization_id: string;
  amount: number;
  type: 'topup' | 'purchase' | 'refund' | 'adjustment';
  description: string | null;
  reference_id: string | null;
  performed_by: string | null;
  balance_after: number;
  created_at: string;
}

export function useOrganizationCreditTransactions(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-credit-transactions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('organization_credit_transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationCreditTransaction[];
    },
    enabled: !!orgId,
  });
}

export function useOrganizationCredit(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-credit', orgId],
    queryFn: async () => {
      if (!orgId) return { credit_balance: 0, credit_limit: 0 };
      
      const { data, error } = await supabase
        .from('organizations')
        .select('credit_balance, credit_limit')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// Admin mutation to top up organization credit
export function useAdminTopUpCredit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      amount, 
      note 
    }: { 
      organizationId: string; 
      amount: number; 
      note?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-topup-org-credit', {
        body: { organization_id: organizationId, amount, note }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to top up credit');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-credit', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-credit-transactions', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({
        title: 'Credit Added',
        description: `Successfully added ฿${variables.amount.toLocaleString()} to organization credit.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add credit',
        variant: 'destructive',
      });
    },
  });
}

// Hook to deduct credit for organization purchases
export function useDeductOrgCredit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      orderId, 
      amount 
    }: { 
      organizationId: string; 
      orderId: string; 
      amount: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('deduct-org-credit', {
        body: { organization_id: organizationId, order_id: orderId, amount }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to deduct credit');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-credit', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-credit-transactions', variables.organizationId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Insufficient Credit',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    },
  });
}

// Hook for admin to fetch all organizations with credit info
export function useAdminOrganizations() {
  return useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
