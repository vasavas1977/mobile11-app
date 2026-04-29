import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { OrganizationInvitation, OrgRole } from '@/types/organization';

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function useOrganizationInvitations(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-invitations', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationInvitation[];
    },
    enabled: !!orgId,
  });
}

export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ['invitation-by-token', token],
    queryFn: async () => {
      if (!token) return null;

      // Use edge function to securely validate token (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('validate-invitation-token', {
        body: { token },
      });

      if (error) {
        console.error('Error validating invitation token:', error);
        return null;
      }

      if (!data?.invitation) {
        return null;
      }

      return data.invitation as OrganizationInvitation & { 
        organizations: { id: string; name: string; logo_url: string | null } 
      };
    },
    enabled: !!token,
  });
}

export function useCreateInvitation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      orgName,
      email,
      role,
      department,
    }: {
      orgId: string;
      orgName: string;
      email: string;
      role: OrgRole;
      department?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if there's already a pending invitation
      const { data: existing } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existing) {
        throw new Error('An invitation has already been sent to this email');
      }

      // Check if user is already a member
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .single();

      if (profiles?.user_id) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', orgId)
          .eq('user_id', profiles.user_id)
          .eq('is_active', true)
          .single();

        if (member) {
          throw new Error('This user is already a member of the organization');
        }
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: orgId,
          email: email.toLowerCase(),
          role,
          department,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Get inviter's name
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      const inviterName = inviterProfile?.first_name 
        ? `${inviterProfile.first_name} ${inviterProfile.last_name || ''}`.trim()
        : inviterProfile?.email || 'A team member';

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: email.toLowerCase(),
          organizationName: orgName,
          inviterName,
          role,
          token,
          language: 'en',
        },
      });

      if (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't throw - invitation is created, email failure shouldn't rollback
      }

      return invitation as OrganizationInvitation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', variables.orgId] });
      toast({
        title: 'Invitation sent',
        description: `Invitation has been sent to ${variables.email}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    },
  });
}

export function useAcceptInvitation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!user?.id) throw new Error('Please sign in to accept the invitation');

      // Use edge function to securely accept invitation (bypasses RLS for token validation)
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token },
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        throw new Error(error.message || 'Failed to accept invitation');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return { organizationId: data.organizationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Welcome!',
        description: 'You have joined the organization successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    },
  });
}

export function useRevokeInvitation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, orgId }: { invitationId: string; orgId: string }) => {
      const { error } = await supabase
        .from('organization_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId);

      if (error) throw error;
      return { invitationId, orgId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', variables.orgId] });
      toast({
        title: 'Invitation revoked',
        description: 'The invitation has been cancelled.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke invitation',
        variant: 'destructive',
      });
    },
  });
}

export function useResendInvitation() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      invitation,
      orgName,
    }: {
      invitation: OrganizationInvitation;
      orgName: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get inviter's name
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      const inviterName = inviterProfile?.first_name 
        ? `${inviterProfile.first_name} ${inviterProfile.last_name || ''}`.trim()
        : inviterProfile?.email || 'A team member';

      // Resend email
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          organizationName: orgName,
          inviterName,
          role: invitation.role,
          token: invitation.token,
          language: 'en',
        },
      });

      if (emailError) throw emailError;

      return invitation;
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Invitation resent',
        description: `Invitation has been resent to ${variables.invitation.email}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    },
  });
}
