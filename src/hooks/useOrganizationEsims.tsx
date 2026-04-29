import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrganizationOrder {
  id: string;
  order_id: string;
  organization_id: string;
  purchased_by: string;
  cost_center: string | null;
  project_code: string | null;
  notes: string | null;
  created_at: string;
  order?: {
    id: string;
    order_id: string;
    package_id: string;
    status: string;
    total_amount: number;
    currency: string;
    iccid: string | null;
    qr_code: string | null;
    created_at: string;
    esim_packages?: {
      id: string;
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
    };
  };
  purchaser_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export interface EsimAssignment {
  id: string;
  organization_id: string;
  order_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assignment_note: string | null;
  trip_start_date: string | null;
  trip_end_date: string | null;
  status: 'assigned' | 'in_use' | 'returned' | 'expired';
  created_at: string;
  updated_at: string;
  assignee_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    line_picture_url: string | null;
  } | null;
  assigner_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  order?: {
    id: string;
    order_id: string;
    package_id: string;
    status: string;
    iccid: string | null;
    esim_packages?: {
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
    };
  };
}

// Query: Fetch all orders linked to an organization
export function useOrganizationOrders(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-orders', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('organization_orders')
        .select(`
          *,
          order:orders(
            id,
            order_id,
            package_id,
            status,
            total_amount,
            currency,
            iccid,
            qr_code,
            created_at,
            esim_packages(
              id,
              name,
              country_name,
              country_code,
              data_amount,
              validity_days
            )
          )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as OrganizationOrder[];
    },
    enabled: !!orgId,
  });
}

// Query: Fetch all eSIM assignments for an organization
export function useOrganizationAssignments(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-assignments', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Fetch assignments
      const { data: assignments, error } = await supabase
        .from('organization_esim_assignments')
        .select(`
          *,
          order:orders(
            id,
            order_id,
            package_id,
            status,
            iccid,
            esim_packages(
              name,
              country_name,
              country_code,
              data_amount,
              validity_days
            )
          )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      // Get unique user IDs for profile lookup
      const userIds = [...new Set([
        ...assignments.map(a => a.assigned_to).filter(Boolean),
        ...assignments.map(a => a.assigned_by).filter(Boolean),
      ])] as string[];

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, line_picture_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich assignments with profile data
      return assignments.map(assignment => ({
        ...assignment,
        assignee_profile: assignment.assigned_to ? profileMap.get(assignment.assigned_to) || null : null,
        assigner_profile: assignment.assigned_by ? profileMap.get(assignment.assigned_by) || null : null,
      })) as unknown as EsimAssignment[];
    },
    enabled: !!orgId,
  });
}

// Query: Get orders that don't have assignments yet (available pool)
export function useUnassignedOrders(orgId: string | null) {
  return useQuery({
    queryKey: ['unassigned-orders', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // First get all org orders
      const { data: orgOrders, error: ordersError } = await supabase
        .from('organization_orders')
        .select(`
          order_id,
          order:orders(
            id,
            order_id,
            package_id,
            status,
            iccid,
            qr_code,
            created_at,
            esim_packages(
              id,
              name,
              country_name,
              country_code,
              data_amount,
              validity_days
            )
          )
        `)
        .eq('organization_id', orgId);

      if (ordersError) throw ordersError;

      // Get assigned order IDs
      const { data: assignments, error: assignError } = await supabase
        .from('organization_esim_assignments')
        .select('order_id')
        .eq('organization_id', orgId)
        .in('status', ['assigned', 'in_use']);

      if (assignError) throw assignError;

      const assignedOrderIds = new Set(assignments?.map(a => a.order_id) || []);

      // Filter to unassigned orders with completed payment
      return (orgOrders || [])
        .filter(o => 
          o.order && 
          !assignedOrderIds.has(o.order_id) && 
          o.order.status === 'completed'
        )
        .map(o => o.order!);
    },
    enabled: !!orgId,
  });
}

// Mutation: Assign an eSIM to a team member
export function useAssignEsim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      orderId,
      assignedTo,
      assignmentNote,
      tripStartDate,
      tripEndDate,
    }: {
      orgId: string;
      orderId: string;
      assignedTo: string;
      assignmentNote?: string;
      tripStartDate?: string;
      tripEndDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('organization_esim_assignments')
        .insert({
          organization_id: orgId,
          order_id: orderId,
          assigned_to: assignedTo,
          assigned_by: user.id,
          assignment_note: assignmentNote || null,
          trip_start_date: tripStartDate || null,
          trip_end_date: tripEndDate || null,
          status: 'assigned',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-assignments', variables.orgId] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-orders', variables.orgId] });
      toast.success('eSIM assigned successfully');
    },
    onError: (error) => {
      console.error('Failed to assign eSIM:', error);
      toast.error('Failed to assign eSIM');
    },
  });
}

// Mutation: Update an assignment (status, notes, dates)
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      orgId,
      updates,
    }: {
      assignmentId: string;
      orgId: string;
      updates: {
        status?: 'assigned' | 'in_use' | 'returned' | 'expired';
        assignment_note?: string | null;
        trip_start_date?: string | null;
        trip_end_date?: string | null;
      };
    }) => {
      const { data, error } = await supabase
        .from('organization_esim_assignments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-assignments', variables.orgId] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-orders', variables.orgId] });
      toast.success('Assignment updated');
    },
    onError: (error) => {
      console.error('Failed to update assignment:', error);
      toast.error('Failed to update assignment');
    },
  });
}

// Mutation: Unassign (return to pool)
export function useUnassignEsim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      orgId,
    }: {
      assignmentId: string;
      orgId: string;
    }) => {
      const { error } = await supabase
        .from('organization_esim_assignments')
        .update({
          status: 'returned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-assignments', variables.orgId] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-orders', variables.orgId] });
      toast.success('eSIM returned to pool');
    },
    onError: (error) => {
      console.error('Failed to unassign eSIM:', error);
      toast.error('Failed to unassign eSIM');
    },
  });
}
