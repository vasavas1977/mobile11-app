import { Mail, Clock, Building2, RefreshCw, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { OrganizationInvitation, OrgRole } from '@/types/organization';

interface PendingInvitationCardProps {
  invitation: OrganizationInvitation;
  orgName: string;
  onResend: () => void;
  onRevoke: () => void;
  isResending?: boolean;
  isRevoking?: boolean;
}

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};

const roleColors: Record<OrgRole, string> = {
  owner: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  manager: 'bg-purple-100 text-purple-700 border-purple-200',
  member: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function PendingInvitationCard({
  invitation,
  orgName,
  onResend,
  onRevoke,
  isResending,
  isRevoking,
}: PendingInvitationCardProps) {
  const isExpired = new Date(invitation.expires_at) < new Date();
  const expiresIn = Math.ceil(
    (new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <Mail className="h-4 w-4 text-gray-400" />
                {invitation.email}
              </div>
              <Badge variant="outline" className={`${roleColors[invitation.role]} border`}>
                {roleLabels[invitation.role]}
              </Badge>
              {isExpired && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                  Expired
                </Badge>
              )}
            </div>

            {invitation.department && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Building2 className="h-3.5 w-3.5" />
                {invitation.department}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {isExpired ? (
                <span className="text-red-500">Expired on {new Date(invitation.expires_at).toLocaleDateString()}</span>
              ) : (
                <span>Expires in {expiresIn} day{expiresIn !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onResend}
              disabled={isResending || isRevoking}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Resend
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRevoke}
              disabled={isResending || isRevoking}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
            >
              {isRevoking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Invited on {new Date(invitation.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
