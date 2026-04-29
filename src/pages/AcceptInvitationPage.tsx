import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  LogIn,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header as Navbar } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useInvitationByToken, useAcceptInvitation } from '@/hooks/useOrganizationInvitations';
import { setPostAuthNext } from '@/utils/postAuthNext';
import type { OrgRole } from '@/types/organization';

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};

const roleDescriptions: Record<OrgRole, string> = {
  owner: 'Full control over the organization',
  admin: 'Manage team, purchase eSIMs, and view reports',
  manager: 'Purchase eSIMs and assign to team members',
  member: 'View and manage assigned eSIMs',
};

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const { data: invitation, isLoading: inviteLoading, error: inviteError } = useInvitationByToken(token || null);
  const acceptInvitation = useAcceptInvitation();

  const isLoading = authLoading || inviteLoading;
  const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false;
  const isAlreadyAccepted = invitation?.status === 'accepted';
  const isRevoked = invitation?.status === 'revoked';

  const handleAccept = async () => {
    if (!token) return;
    
    const result = await acceptInvitation.mutateAsync(token);
    if (result) {
      setAccepted(true);
      // Redirect to business dashboard after a short delay
      setTimeout(() => {
        navigate('/business/team');
      }, 2000);
    }
  };

  // If not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Sign in to continue</CardTitle>
              <CardDescription>
                Please sign in or create an account to accept this invitation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => {
                  setPostAuthNext(`/business/invite/${token}`);
                  navigate('/auth');
                }}
              >
                Sign In / Sign Up
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Make sure to use the email address the invitation was sent to.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // Invalid or not found
  if (!invitation || inviteError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>
                This invitation link is invalid or has been removed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Expired
  if (isExpired || isRevoked) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Invitation {isRevoked ? 'Revoked' : 'Expired'}</CardTitle>
              <CardDescription>
                {isRevoked 
                  ? 'This invitation has been cancelled by the organization admin.'
                  : 'This invitation has expired. Please contact the organization admin to request a new one.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Already accepted
  if (isAlreadyAccepted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Already Accepted</CardTitle>
              <CardDescription>
                This invitation has already been accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/business/team')}
              >
                Go to Team Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state
  if (accepted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Welcome to {invitation.organizations?.name}!</CardTitle>
              <CardDescription>
                You've successfully joined the organization. Redirecting to the team dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Show invitation details
  const org = invitation.organizations;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4">
              <Avatar className="h-16 w-16 mx-auto">
                <AvatarImage src={org?.logo_url || undefined} alt={org?.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {org?.name?.[0]?.toUpperCase() || 'O'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5" />
              Join {org?.name}
            </CardTitle>
            <CardDescription>
              You've been invited to join this organization
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Invitation details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Invited as</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {roleLabels[invitation.role]}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {roleDescriptions[invitation.role]}
              </p>
              
              {invitation.department && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <span className="text-sm font-medium">{invitation.department}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{invitation.email}</span>
              </div>
            </div>

            {/* Email mismatch warning */}
            {user?.email?.toLowerCase() !== invitation.email.toLowerCase() && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-600">
                  ⚠️ This invitation was sent to <strong>{invitation.email}</strong>. 
                  You are currently signed in as <strong>{user?.email}</strong>. 
                  Please sign in with the correct email to accept.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleAccept}
                disabled={acceptInvitation.isPending || user?.email?.toLowerCase() !== invitation.email.toLowerCase()}
              >
                {acceptInvitation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Decline
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By accepting, you agree to join this organization and share your profile information with its admins.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
