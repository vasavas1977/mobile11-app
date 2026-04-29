import { Users, Building2, UserPlus, Store, Truck, Code, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AccountRecord } from './types';
import { getUserPrimaryRole } from './types';

interface Props {
  users: AccountRecord[];
}

export function AccountKPIStrip({ users }: Props) {
  const counts = {
    total: users.length,
    customers: users.filter(u => getUserPrimaryRole(u.user_roles) === 'customer').length,
    affiliates: users.filter(u => getUserPrimaryRole(u.user_roles) === 'affiliate').length,
    admins: users.filter(u => ['admin', 'supervisor', 'agent'].includes(getUserPrimaryRole(u.user_roles))).length,
  };

  const kpis = [
    { label: 'Total Accounts', value: counts.total, icon: Users, color: 'text-primary' },
    { label: 'End Customers', value: counts.customers, icon: Users, color: 'text-blue-600' },
    { label: 'Affiliates', value: counts.affiliates, icon: UserPlus, color: 'text-emerald-600' },
    { label: 'Internal Staff', value: counts.admins, icon: Shield, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">{kpi.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
