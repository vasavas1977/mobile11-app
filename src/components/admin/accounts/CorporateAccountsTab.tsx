import { useState } from 'react';
import { Search, Building2, Users, CreditCard, MoreHorizontal, Plus, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminOrganizations } from '@/hooks/useOrganizationCredit';
import { TopUpCreditDialog } from '../TopUpCreditDialog';
import { OrgTransactionsDialog } from '../OrgTransactionsDialog';
import { formatDistanceToNow } from 'date-fns';

export function CorporateAccountsTab() {
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const { data: organizations = [], isLoading } = useAdminOrganizations();

  const filtered = organizations.filter(org => {
    if (!search) return true;
    const s = search.toLowerCase();
    return org.name?.toLowerCase().includes(s) ||
      org.billing_email?.toLowerCase().includes(s) ||
      org.slug?.toLowerCase().includes(s);
  });

  const totalCredit = organizations.reduce((sum, org) => sum + (org.credit_balance || 0), 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{organizations.length}</p>
                <p className="text-xs text-muted-foreground">Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CreditCard className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold">฿{totalCredit.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Credit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {organizations.reduce((sum, org) => sum + (org.organization_members?.[0]?.count || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Corporate Accounts</CardTitle>
          <CardDescription>Manage organization credit balances and memberships</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{search ? 'No organizations found' : 'No organizations yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.billing_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {org.organization_members?.[0]?.count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        ฿{(org.credit_balance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedOrg(org); setShowTopUp(true); }}>
                              <Plus className="h-4 w-4 mr-2" /> Top Up Credit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedOrg(org); setShowTx(true); }}>
                              <History className="h-4 w-4 mr-2" /> View Transactions
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrg && <TopUpCreditDialog open={showTopUp} onOpenChange={setShowTopUp} organization={selectedOrg} />}
      {selectedOrg && <OrgTransactionsDialog open={showTx} onOpenChange={setShowTx} organization={selectedOrg} />}
    </div>
  );
}
