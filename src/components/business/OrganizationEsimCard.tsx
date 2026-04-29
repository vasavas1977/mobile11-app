import { Smartphone, User, Calendar, MapPin, MoreVertical, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssignEsimDialog } from './AssignEsimDialog';
import type { EsimAssignment } from '@/hooks/useOrganizationEsims';
import { format } from 'date-fns';

interface OrganizationEsimCardProps {
  assignment?: EsimAssignment;
  unassignedOrder?: {
    id: string;
    order_id: string;
    iccid: string | null;
    esim_packages?: {
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
    };
  };
  orgId: string;
  isManager: boolean;
  onUnassign?: (assignmentId: string) => void;
  onMarkInUse?: (assignmentId: string) => void;
}

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_use: 'bg-amber-100 text-amber-700 border-amber-200',
  returned: 'bg-gray-100 text-gray-700 border-gray-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const statusLabels: Record<string, string> = {
  assigned: 'Assigned',
  in_use: 'In Use',
  returned: 'Returned',
  expired: 'Expired',
  available: 'Available',
};

export function OrganizationEsimCard({
  assignment,
  unassignedOrder,
  orgId,
  isManager,
  onUnassign,
  onMarkInUse,
}: OrganizationEsimCardProps) {
  // Determine if this is an assigned or unassigned eSIM
  const isAssigned = !!assignment;
  const order = assignment?.order || unassignedOrder;
  const pkg = order?.esim_packages;
  const status = assignment?.status || 'available';

  if (!order || !pkg) return null;

  const assigneeName = assignment?.assignee_profile
    ? `${assignment.assignee_profile.first_name || ''} ${assignment.assignee_profile.last_name || ''}`.trim() || assignment.assignee_profile.email
    : null;

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="bg-white border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: eSIM Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Country Flag */}
            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {pkg.country_code ? (
                <span className={`fi fi-${pkg.country_code.toLowerCase()} text-2xl`} />
              ) : (
                <MapPin className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {/* Package Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{pkg.country_name}</h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs border ${statusColors[status]}`}
                >
                  {statusLabels[status]}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-500 truncate">{pkg.name}</p>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  {pkg.data_amount}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {pkg.validity_days} days
                </span>
              </div>

              {/* Assignment Info */}
              {isAssigned && assigneeName && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignment.assignee_profile?.line_picture_url || ''} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                      {getInitials(assigneeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{assigneeName}</p>
                    {assignment.trip_start_date && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(assignment.trip_start_date), 'MMM d')}
                        {assignment.trip_end_date && ` - ${format(new Date(assignment.trip_end_date), 'MMM d, yyyy')}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {assignment?.assignment_note && (
                <p className="text-xs text-gray-500 mt-2 italic truncate">
                  "{assignment.assignment_note}"
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="shrink-0 flex items-center gap-2">
            {!isAssigned && isManager && (
              <AssignEsimDialog
                orgId={orgId}
                orderId={order.id}
                packageName={pkg.name}
                countryName={pkg.country_name}
              />
            )}

            {isAssigned && isManager && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-100">
                  {status === 'assigned' && (
                    <DropdownMenuItem 
                      onClick={() => onMarkInUse?.(assignment.id)}
                      className="cursor-pointer text-gray-700"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mark as In Use
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => onUnassign?.(assignment.id)}
                    className="cursor-pointer text-gray-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Return to Pool
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
