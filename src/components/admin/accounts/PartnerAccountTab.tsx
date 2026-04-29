import { Building2, Globe, Wallet, Shield, Code, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  tabKey: string;
  title: string;
  description: string;
}

// Placeholder for Corporate, Resellers, Distributors, API Partners
// These will connect to real data as the partner tables are built out
export function PartnerAccountTab({ tabKey, title, description }: Props) {
  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Schema fields preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Account Type', icon: Users },
              { label: 'Territory', icon: Globe },
              { label: 'Wallet Balance', icon: Wallet },
              { label: 'API Enabled', icon: Code },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Account</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Price Plan</TableHead>
                  <TableHead className="hidden lg:table-cell">Orders</TableHead>
                  <TableHead className="hidden lg:table-cell">Revenue</TableHead>
                  <TableHead className="hidden xl:table-cell">KYC</TableHead>
                  <TableHead className="hidden xl:table-cell">API</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="text-center py-16">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Building2 className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">No {title.toLowerCase()} yet</p>
                      <p className="text-xs text-muted-foreground/70">
                        Partner accounts will appear here once onboarded.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Field Schema Reference */}
          <div className="mt-6 p-4 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-xs font-semibold text-muted-foreground mb-2">RECORD SCHEMA</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {[
                'Account Type', 'Parent Tenant', 'Territory', 'Wallet Balance',
                'Credit Limit', 'Price Plan', 'Support SLA', 'Contract Status',
                'KYC Status', 'White-Label', 'API Enabled', 'Active Users',
                'Total Orders', 'Lifetime Revenue', 'Margin Contribution', 'Support Volume'
              ].map(field => (
                <div key={field} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <span className="text-[11px] text-muted-foreground">{field}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
