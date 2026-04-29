import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { 
  Organization, 
  OrganizationMember, 
  OrganizationWithRole,
  CreateOrganizationInput,
  OrgRole 
} from '@/types/organization';

export function useOrganizations() {
  // Use AuthContext directly to avoid throwing when called during provider initialization
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const authLoading = authContext?.loading ?? true;

  return useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get organizations where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (memberError) throw memberError;
      if (!memberships?.length) return [];

      const orgIds = memberships.map(m => m.organization_id);

      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .eq('status', 'active');

      if (orgError) throw orgError;

      // Attach user's role to each org
      return (orgs || []).map(org => ({
        ...org,
        userRole: memberships.find(m => m.organization_id === org.id)?.role as OrgRole
      })) as OrganizationWithRole[];
    },
    enabled: !!user?.id && !authLoading,
  });
}

export function useOrganization(orgId: string | null) {
  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
  });
}

export function useOrganizationMembers(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // First get members
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (membersError) throw membersError;
      if (!members?.length) return [];

      // Get profiles for each member
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, line_picture_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      return members.map(member => ({
        ...member,
        profiles: profiles?.find(p => p.user_id === member.user_id) || null
      })) as OrganizationMember[];
    },
    enabled: !!orgId,
  });
}

export function useUserOrgRole(orgId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-org-role', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user?.id) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) return null;
      return data?.role as OrgRole;
    },
    enabled: !!orgId && !!user?.id,
  });
}

export function useCreateOrganization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Generate slug
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_org_slug', { org_name: input.name });

      if (slugError) throw slugError;

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: input.name,
          slug: slugData,
          billing_email: input.billing_email,
          tax_id: input.tax_id,
          industry: input.industry,
          company_size: input.company_size,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        // Rollback org creation
        await supabase.from('organizations').delete().eq('id', org.id);
        throw memberError;
      }

      return org as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organization created',
        description: 'Your organization has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateOrganization() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, billing_email, tax_id, industry, company_size, logo_url }: { 
      id: string;
      name?: string;
      billing_email?: string;
      tax_id?: string;
      industry?: string;
      company_size?: string;
      logo_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update({ name, billing_email, tax_id, industry, company_size, logo_url })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization', data.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organization updated',
        description: 'Changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMemberRole() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      orgId, 
      newRole 
    }: { 
      memberId: string; 
      orgId: string; 
      newRole: OrgRole 
    }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.orgId] });
      toast({
        title: 'Role updated',
        description: 'Member role has been changed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveMember() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, orgId }: { memberId: string; orgId: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;
      return { memberId, orgId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.orgId] });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the organization.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });
}
