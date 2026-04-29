import { useState } from 'react';
import { Search, Shield, Eye, Headphones, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AccountRecord } from './types';
import { getRoleBadgeClass, getUserPrimaryRole } from './types';

interface Props {
  users: AccountRecord[];
  onUpdateRole: (userId: string, newRole: string) => Promise<void>;
}

export function InternalAdminsTab({ users, onUpdateRole }: Props) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AccountRecord | null>(null);

  const admins = users.filter(u => {
    const role = getUserPrimaryRole(u.user_roles);
    return ['admin', 'supervisor', 'agent', 'partner_manager'].includes(role);
  });

  const filtered = admins.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.email?.toLowerCase().includes(s) ||
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Internal Admin & Staff ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const role = getUserPrimaryRole(user.user_roles);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-semibold text-red-600">
                            {(user.first_name?.[0] || '?').toUpperCase()}
                          </div>
                          <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeClass(role)}>
                          {role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                              <Shield className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Manage Role</DialogTitle>
                            </DialogHeader>
                            {selectedUser && selectedUser.id === user.id && (
                              <div className="space-y-4">
                                <div>
                                  <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                                <Alert>
                                  <Shield className="h-4 w-4" />
                                  <AlertDescription>
                                    Current: <Badge className={getRoleBadgeClass(getUserPrimaryRole(selectedUser.user_roles))}>{getUserPrimaryRole(selectedUser.user_roles).replace('_', ' ')}</Badge>
                                  </AlertDescription>
                                </Alert>
                                <div className="grid grid-cols-2 gap-2">
                                  {['customer', 'agent', 'supervisor', 'admin'].map(r => (
                                    <Button
                                      key={r}
                                      variant={getUserPrimaryRole(selectedUser.user_roles) === r ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => onUpdateRole(selectedUser.user_id, r)}
                                    >
                                      {r === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                      {r === 'agent' && <Headphones className="h-3 w-3 mr-1" />}
                                      {r === 'supervisor' && <Eye className="h-3 w-3 mr-1" />}
                                      {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No internal staff found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
