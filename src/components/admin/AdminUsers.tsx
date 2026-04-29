import { useState, useEffect } from 'react';
import { Users, Building2, UserPlus, Store, Truck, Code, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminActivityLog } from '@/hooks/useAdminActivityLog';
import { AccountKPIStrip } from './accounts/AccountKPIStrip';
import { EndCustomersTab } from './accounts/EndCustomersTab';
import { CorporateAccountsTab } from './accounts/CorporateAccountsTab';
import { AffiliatesTab } from './accounts/AffiliatesTab';
import { InternalAdminsTab } from './accounts/InternalAdminsTab';
import { PartnerAccountTab } from './accounts/PartnerAccountTab';
import type { AccountRecord } from './accounts/types';

export function AdminUsers() {
  const [users, setUsers] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logActivity } = useAdminActivityLog();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);
          return { ...profile, user_roles: roleData || [] } as AccountRecord;
        })
      );
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const user = users.find(u => u.user_id === userId);
      const oldRole = user?.user_roles?.[0]?.role || 'none';
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role: newRole as any }]);
      if (error) throw error;
      await logActivity({
        actionType: 'user_role_change', entityType: 'user', entityId: userId,
        oldValue: { role: oldRole }, newValue: { role: newRole },
        description: `User ${user?.email || userId} role changed from ${oldRole} to ${newRole}`,
      });
      fetchUsers();
      toast({ title: "Success", description: "User role updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/delete-user`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ userId }) }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete user');
      fetchUsers();
      toast({ title: "Success", description: "User deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const TABS = [
    { key: 'end_customers', label: 'End Customers', icon: Users },
    { key: 'corporate', label: 'Corporate', icon: Building2 },
    { key: 'affiliates', label: 'Affiliates', icon: UserPlus },
    { key: 'resellers', label: 'Resellers', icon: Store },
    { key: 'distributors', label: 'Distributors', icon: Truck },
    { key: 'api_partners', label: 'API Partners', icon: Code },
    { key: 'internal_admins', label: 'Internal', icon: Shield },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accounts & Tenants</h1>
        <p className="text-sm text-muted-foreground">Unified customer, partner, and staff management</p>
      </div>

      <AccountKPIStrip users={users} />

      <Tabs defaultValue="end_customers" className="space-y-4">
        <div className="overflow-x-auto -mx-3 px-3">
          <TabsList className="inline-flex h-10 w-auto min-w-full sm:min-w-0 bg-muted/50 p-1">
            {TABS.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5 text-xs sm:text-sm whitespace-nowrap px-2.5 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="end_customers">
          <EndCustomersTab users={users} onRefresh={fetchUsers} onUpdateRole={updateUserRole} onDeleteUser={deleteUser} />
        </TabsContent>

        <TabsContent value="corporate">
          <CorporateAccountsTab />
        </TabsContent>

        <TabsContent value="affiliates">
          <AffiliatesTab users={users} />
        </TabsContent>

        <TabsContent value="resellers">
          <PartnerAccountTab tabKey="resellers" title="Resellers" description="Manage reseller accounts, white-label settings, and margin tiers." />
        </TabsContent>

        <TabsContent value="distributors">
          <PartnerAccountTab tabKey="distributors" title="Distributors" description="Manage distributor accounts, territories, and wholesale pricing." />
        </TabsContent>

        <TabsContent value="api_partners">
          <PartnerAccountTab tabKey="api_partners" title="API Partners" description="Manage API partner integrations, credentials, and usage." />
        </TabsContent>

        <TabsContent value="internal_admins">
          <InternalAdminsTab users={users} onUpdateRole={updateUserRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
