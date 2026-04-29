import { useState } from 'react';
import { MoreHorizontal, Shield, Mail, Building2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationMember, OrgRole } from '@/types/organization';

interface TeamMemberCardProps {
  member: OrganizationMember;
  currentUserRole: OrgRole;
  currentUserId: string;
  onUpdateRole: (memberId: string, newRole: OrgRole) => void;
  onRemove: (memberId: string) => void;
  isUpdating?: boolean;
}

const roleColors: Record<OrgRole, string> = {
  owner: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  manager: 'bg-purple-100 text-purple-700 border-purple-200',
  member: 'bg-gray-100 text-gray-700 border-gray-200',
};

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};

export function TeamMemberCard({
  member,
  currentUserRole,
  currentUserId,
  onUpdateRole,
  onRemove,
  isUpdating,
}: TeamMemberCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OrgRole>(member.role);

  const profile = member.profiles;
  const isCurrentUser = member.user_id === currentUserId;
  const isOwner = member.role === 'owner';
  const canManage = (currentUserRole === 'owner' || currentUserRole === 'admin') && !isCurrentUser && !isOwner;
  const canChangeRole = currentUserRole === 'owner' && !isCurrentUser;

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : profile?.email || 'Unknown User';

  const initials = profile?.first_name 
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ''}`
    : 'U';

  const handleRoleChange = (newRole: OrgRole) => {
    setSelectedRole(newRole);
    onUpdateRole(member.id, newRole);
  };

  return (
    <>
      <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-gray-100">
                <AvatarImage src={profile?.line_picture_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{displayName}</span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                      You
                    </Badge>
                  )}
                </div>
                
                {profile?.email && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </div>
                )}
                
                {member.department && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Building2 className="h-3.5 w-3.5" />
                    {member.department}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canChangeRole ? (
                <Select
                  value={selectedRole}
                  onValueChange={(value) => handleRoleChange(value as OrgRole)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[120px] bg-white border-gray-200 text-gray-700 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100">
                    <SelectItem value="admin" className="text-gray-700">Admin</SelectItem>
                    <SelectItem value="manager" className="text-gray-700">Manager</SelectItem>
                    <SelectItem value="member" className="text-gray-700">Member</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={`${roleColors[member.role]} border`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {roleLabels[member.role]}
                </Badge>
              )}

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-gray-100">
                    <DropdownMenuLabel className="text-gray-700">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700 focus:bg-red-50"
                      onClick={() => setShowRemoveDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {member.joined_at && (
            <p className="text-xs text-gray-400 mt-3">
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-white border-gray-100 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Remove team member?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to remove {displayName} from the organization? 
              They will lose access to all organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600 rounded-lg"
              onClick={() => {
                onRemove(member.id);
                setShowRemoveDialog(false);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
