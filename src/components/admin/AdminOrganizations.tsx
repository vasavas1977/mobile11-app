import { useState } from 'react';
import { 
  Building2, 
  Search, 
  Users, 
  CreditCard, 
  MoreHorizontal,
  Plus,
  History,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminOrganizations } from '@/hooks/useOrganizationCredit';
import { TopUpCreditDialog } from './TopUpCreditDialog';
import { OrgTransactionsDialog } from './OrgTransactionsDialog';
import { formatDistanceToNow } from 'date-fns';

export function AdminOrganizations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);

  const { data: organizations = [], isLoading } = useAdminOrganizations();

  const filteredOrgs = organizations.filter(org => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      org.name?.toLowerCase().includes(search) ||
      org.billing_email?.toLowerCase().includes(search) ||
      org.slug?.toLowerCase().includes(search)
    );
  });

  const totalCredit = organizations.reduce((sum, org) => sum + (org.credit_balance || 0), 0);

  const handleTopUp = (org: any) => {
    setSelectedOrg(org);
    setShowTopUpDialog(true);
  };

  const handleViewTransactions = (org: any) => {
    setSelectedOrg(org);
    setShowTransactionsDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Organizations
        </h1>
        <p className="text-muted-foreground">
          Manage business organizations and their credit balances
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organizations.length}</p>
                <p className="text-sm text-muted-foreground">Total Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">฿{totalCredit.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Credit Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {organizations.reduce((sum, org) => sum + (org.organization_members?.[0]?.count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            View and manage organization credit balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No organizations found matching your search' : 'No organizations yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Credit Balance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.billing_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {org.organization_members?.[0]?.count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{(org.credit_balance || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTopUp(org)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Top Up Credit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewTransactions(org)}>
                            <History className="h-4 w-4 mr-2" />
                            View Transactions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Up Dialog */}
      {selectedOrg && (
        <TopUpCreditDialog
          open={showTopUpDialog}
          onOpenChange={setShowTopUpDialog}
          organization={selectedOrg}
        />
      )}

      {/* Transactions Dialog */}
      {selectedOrg && (
        <OrgTransactionsDialog
          open={showTransactionsDialog}
          onOpenChange={setShowTransactionsDialog}
          organization={selectedOrg}
        />
      )}
    </div>
  );
}
