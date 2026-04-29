import { useState } from 'react';
import { Search, UserPlus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AccountRecord } from './types';
import { getUserPrimaryRole } from './types';

interface Props {
  users: AccountRecord[];
}

export function AffiliatesTab({ users }: Props) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const affiliates = users.filter(u => getUserPrimaryRole(u.user_roles) === 'affiliate');

  const filtered = affiliates.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.email?.toLowerCase().includes(s) ||
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search affiliates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/affiliates')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Manage Affiliates
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Affiliate Accounts ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="text-center py-12">
                        <UserPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{search ? 'No affiliates match your search.' : 'No affiliate accounts found.'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-semibold text-emerald-600">
                          {(user.first_name?.[0] || '?').toUpperCase()}
                        </div>
                        <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.user_id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
