import React, { useState } from 'react';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import type { OrgRole } from '@/types/organization';

const roleColors: Record<OrgRole, string> = {
  owner: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  manager: 'bg-purple-100 text-purple-700 border-purple-200',
  member: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function OrganizationSwitcher() {
  const { organizations, currentOrg, setCurrentOrgId, isLoading } = useOrganizationContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className="w-[200px] bg-white border-gray-200 text-gray-400"
      >
        <Building2 className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (organizations.length === 0) {
    return (
      <>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
        <CreateOrganizationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-auto min-w-[200px] justify-between bg-white border-gray-200 text-gray-900 hover:bg-gray-50 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentOrg?.logo_url || ''} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-semibold">
                  {currentOrg?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[120px] text-gray-900">{currentOrg?.name || 'Select Org'}</span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-[280px] bg-white border-gray-100 shadow-lg"
        >
          <DropdownMenuLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            Organizations
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-100" />
          
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setCurrentOrgId(org.id)}
              className={cn(
                "cursor-pointer py-3 focus:bg-orange-50",
                currentOrg?.id === org.id && "bg-orange-50"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={org.logo_url || ''} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold">
                      {org.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{org.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0 w-fit border", roleColors[org.userRole])}
                    >
                      {org.userRole}
                    </Badge>
                  </div>
                </div>
                {currentOrg?.id === org.id && (
                  <Check className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuItem 
            onClick={() => setShowCreateDialog(true)}
            className="cursor-pointer py-3 text-orange-600 focus:text-orange-700 focus:bg-orange-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrganizationDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
