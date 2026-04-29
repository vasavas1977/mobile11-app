import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  UserPlus, 
  Mail, 
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header as Navbar } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizationMembers, useUpdateMemberRole, useRemoveMember } from '@/hooks/useOrganization';
import { 
  useOrganizationInvitations, 
  useRevokeInvitation,
  useResendInvitation,
} from '@/hooks/useOrganizationInvitations';
import { TeamMemberCard } from '@/components/business/TeamMemberCard';
import { PendingInvitationCard } from '@/components/business/PendingInvitationCard';
import { InviteMemberDialog } from '@/components/business/InviteMemberDialog';
import { CreateOrganizationDialog } from '@/components/business/CreateOrganizationDialog';
import { BusinessPortalNav } from '@/components/business/BusinessPortalNav';
import type { OrgRole } from '@/types/organization';

export default function BusinessTeamPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isOrgAdmin, isLoading: orgLoading, organizations } = useOrganizationContext();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(currentOrg?.id || null);
  const { data: invitations = [], isLoading: invitationsLoading } = useOrganizationInvitations(currentOrg?.id || null);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();
  const resendInvitation = useResendInvitation();

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const name = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
    const email = member.profiles?.email?.toLowerCase() || '';
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const handleUpdateRole = (memberId: string, newRole: OrgRole) => {
    if (!currentOrg) return;
    updateRole.mutate({ memberId, orgId: currentOrg.id, newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!currentOrg) return;
    removeMember.mutate({ memberId, orgId: currentOrg.id });
  };

  // Wait for auth to fully load first
  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    );
  }

  // Only show login prompt after auth is fully loaded
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4 bg-white border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                <AlertCircle className="h-8 w-8 text-gray-500" />
              </div>
              <CardTitle className="text-gray-900">Sign in required</CardTitle>
              <CardDescription className="text-gray-600">
                Please sign in to access the business portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full" 
                onClick={() => navigate('/business/login')}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!organizations.length) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-xl w-fit">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-gray-900">No Organization</CardTitle>
              <CardDescription className="text-gray-600">
                Create an organization to start managing your team's eSIMs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateOrganizationDialog
                trigger={
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                    Create Organization
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <BusinessPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              Team Management
            </h1>
            <p className="text-gray-600">
              Manage your organization's team members
            </p>
          </div>
          
          {isOrgAdmin && currentOrg && (
            <InviteMemberDialog 
              orgId={currentOrg.id} 
              orgName={currentOrg.name}
            />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-500">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Mail className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
                  <p className="text-sm text-gray-500">Pending Invitations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{currentOrg?.name}</p>
                  <p className="text-sm text-gray-500">Organization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="bg-white border border-gray-100 shadow-sm rounded-xl p-1">
            <TabsTrigger 
              value="members" 
              className="gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
            >
              <Users className="h-4 w-4" />
              Members
              <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{members.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="invitations" 
              className="gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
            >
              <Mail className="h-4 w-4" />
              Pending Invitations
              {invitations.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">{invitations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <Card className="py-12 bg-white border-gray-100 shadow-sm rounded-xl">
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">
                    {searchQuery ? 'No members found matching your search' : 'No team members yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    currentUserRole={currentOrg?.userRole || 'member'}
                    currentUserId={user.id}
                    onUpdateRole={handleUpdateRole}
                    onRemove={handleRemoveMember}
                    isUpdating={updateRole.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {!isOrgAdmin && (
              <Alert className="bg-white border-gray-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <AlertDescription className="text-gray-600">
                  Only organization admins can manage invitations.
                </AlertDescription>
              </Alert>
            )}

            {invitationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : invitations.length === 0 ? (
              <Card className="py-12 bg-white border-gray-100 shadow-sm rounded-xl">
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                    <Mail className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">No pending invitations</p>
                  {isOrgAdmin && currentOrg && (
                    <InviteMemberDialog 
                      orgId={currentOrg.id} 
                      orgName={currentOrg.name}
                      trigger={
                        <Button variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Someone
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {invitations.map((invitation) => (
                  <PendingInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    orgName={currentOrg?.name || ''}
                    onResend={() => resendInvitation.mutate({ 
                      invitation, 
                      orgName: currentOrg?.name || '' 
                    })}
                    onRevoke={() => revokeInvitation.mutate({ 
                      invitationId: invitation.id, 
                      orgId: currentOrg?.id || '' 
                    })}
                    isResending={resendInvitation.isPending}
                    isRevoking={revokeInvitation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
