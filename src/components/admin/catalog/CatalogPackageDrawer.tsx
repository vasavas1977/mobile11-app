import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Star, Copy, AlertTriangle, TrendingUp, BookOpen, Headphones } from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  data_amount: string;
  validity_days: number;
  price: number;
  cost_price: number;
  currency: string;
  description?: string;
  package_id: string;
  is_active: boolean;
  is_featured: boolean;
  purchase_count: number;
  package_type?: string;
  provider_name?: string;
  provider_code?: string;
  carrier?: string;
  network_type?: string;
  qos_speed?: string;
  sim_type?: string;
  category?: string;
  access_type?: string;
  activation_note?: string;
  updated_at: string;
}

interface CatalogPackageDrawerProps {
  pkg: PackageData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (pkg: PackageData) => void;
  onClone: (pkg: PackageData) => void;
  onToggleActive: (pkg: PackageData) => void;
}

function Field({ label, value, mono }: { label: string; value: string | number | undefined | null; mono?: boolean }) {
  return (
    <div className="space-y-0.5 py-2 px-2.5 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB]/60">
      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold text-[#1A1A1A] ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2.5">{children}</h4>;
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#F3F0EB]">
      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${accent || 'text-[#1A1A1A]'}`}>{value}</p>
    </div>
  );
}

export function CatalogPackageDrawer({ pkg, open, onOpenChange, onEdit, onClone, onToggleActive }: CatalogPackageDrawerProps) {
  if (!pkg) return null;

  const margin = pkg.cost_price > 0 ? ((pkg.price - pkg.cost_price) / pkg.cost_price) * 100 : 0;
  const resellerPrice = pkg.cost_price > 0 ? pkg.cost_price * 1.15 : pkg.price * 0.85;
  const distributorPrice = pkg.cost_price > 0 ? pkg.cost_price * 1.08 : pkg.price * 0.75;
  const apiPrice = pkg.cost_price > 0 ? pkg.cost_price * 1.05 : pkg.price * 0.70;
  const estRevenue = pkg.purchase_count * pkg.price;
  const estMarginContribution = pkg.purchase_count * (pkg.price - (pkg.cost_price || 0));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 bg-white border-l border-[#F3F0EB] flex flex-col">
        {/* Header */}
        <div className={`p-5 border-b border-[#F3F0EB] ${pkg.is_active ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-[#D1D5DB]'}`}>
          <SheetHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              {pkg.is_active ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5 hover:bg-emerald-50">Live</Badge>
              ) : (
                <Badge variant="outline" className="bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] text-[10px] font-semibold px-2 py-0.5">Hidden</Badge>
              )}
              {pkg.is_featured && (
                <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-semibold px-2 py-0.5 hover:bg-amber-50">
                  <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500" />Featured
                </Badge>
              )}
            </div>
            <SheetTitle className="text-base font-bold text-[#1A1A1A] leading-tight">{pkg.name}</SheetTitle>
            <SheetDescription className="text-[11px] font-mono text-[#9CA3AF]">{pkg.package_id}</SheetDescription>
          </SheetHeader>

          {/* Quick Actions */}
          <div className="flex gap-1.5 mt-3">
            <Button size="sm" className="h-7 text-xs gap-1 bg-[#1A1A1A] hover:bg-[#333] text-white" onClick={() => { onEdit(pkg); onOpenChange(false); }}>Edit</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-[#E5E7EB]" onClick={() => { onClone(pkg); onOpenChange(false); }}>
              <Copy className="h-3 w-3" />Clone
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-[#E5E7EB]" onClick={() => onToggleActive(pkg)}>
              {pkg.is_active ? <><EyeOff className="h-3 w-3" />Hide</> : <><Eye className="h-3 w-3" />Go Live</>}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-5 mt-3 h-8 justify-start bg-[#F9FAFB] border border-[#F3F0EB] rounded-lg">
            <TabsTrigger value="overview" className="text-[11px] h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="pricing" className="text-[11px] h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Pricing</TabsTrigger>
            <TabsTrigger value="sourcing" className="text-[11px] h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Sourcing</TabsTrigger>
            <TabsTrigger value="visibility" className="text-[11px] h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Visibility</TabsTrigger>
            <TabsTrigger value="performance" className="text-[11px] h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Performance</TabsTrigger>
            <TabsTrigger value="support" className="text-[11px] h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Support</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Overview */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div>
                <SectionTitle>Package Details</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Destination" value={pkg.country_name} />
                  <Field label="Country Code" value={pkg.country_code} mono />
                  <Field label="Data" value={pkg.data_amount} />
                  <Field label="Validity" value={`${pkg.validity_days} days`} />
                  <Field label="Package Type" value={pkg.package_type || pkg.category} />
                  <Field label="SIM Type" value={pkg.sim_type} />
                </div>
              </div>
              <Separator className="bg-[#F3F0EB]" />
              <div>
                <SectionTitle>Network</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Carrier" value={pkg.carrier} />
                  <Field label="Network" value={pkg.network_type} />
                  <Field label="QoS Speed" value={pkg.qos_speed} />
                  <Field label="Access Type" value={pkg.access_type} />
                </div>
              </div>
              {pkg.activation_note && (
                <>
                  <Separator className="bg-[#F3F0EB]" />
                  <div>
                    <SectionTitle>Activation Note</SectionTitle>
                    <p className="text-xs text-[#6B7280] leading-relaxed bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]/60">{pkg.activation_note}</p>
                  </div>
                </>
              )}
              {pkg.description && (
                <>
                  <Separator className="bg-[#F3F0EB]" />
                  <div>
                    <SectionTitle>Description</SectionTitle>
                    <p className="text-xs text-[#6B7280] leading-relaxed bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]/60">{pkg.description}</p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="mt-0 space-y-4">
              <div>
                <SectionTitle>Direct Pricing</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Retail Price" value={`$${pkg.price.toFixed(2)}`} mono />
                  <Field label="Internal Cost" value={pkg.cost_price ? `$${pkg.cost_price.toFixed(2)}` : '—'} mono />
                  <Field label="Margin %" value={pkg.cost_price > 0 ? `${margin.toFixed(1)}%` : '—'} />
                  <Field label="Currency" value={pkg.currency} />
                </div>
              </div>
              <Separator className="bg-[#F3F0EB]" />
              <div>
                <SectionTitle>Tier Pricing (Estimated)</SectionTitle>
                <div className="space-y-1.5">
                  {[
                    { label: 'Reseller', value: resellerPrice, pct: '15%' },
                    { label: 'Distributor', value: distributorPrice, pct: '8%' },
                    { label: 'API Partner', value: apiPrice, pct: '5%' },
                  ].map(tier => (
                    <div key={tier.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB]/60">
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{tier.label}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Cost + {tier.pct} markup</p>
                      </div>
                      <p className="text-sm font-mono font-bold text-[#1A1A1A]">${tier.value.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-2">* Estimated from default markup rules. Actual prices may vary.</p>
              </div>
            </TabsContent>

            {/* Sourcing */}
            <TabsContent value="sourcing" className="mt-0 space-y-4">
              <div>
                <SectionTitle>Primary Supplier</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Supplier" value={pkg.provider_name} />
                  <Field label="Provider Code" value={pkg.provider_code} mono />
                  <Field label="Option ID" value={pkg.package_id} mono />
                  <Field label="Category" value={pkg.category} />
                </div>
              </div>
              <Separator className="bg-[#F3F0EB]" />
              <div>
                <SectionTitle>Backup Supplier</SectionTitle>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-xs text-amber-700 font-medium">No backup supplier configured</p>
                </div>
              </div>
            </TabsContent>

            {/* Visibility */}
            <TabsContent value="visibility" className="mt-0 space-y-4">
              <div>
                <SectionTitle>Channel Visibility</SectionTitle>
                <div className="space-y-1.5">
                  {['Direct Store', 'Reseller Portal', 'Distributor Portal', 'API Partner', 'Affiliate Channel'].map(channel => (
                    <div key={channel} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB]/60">
                      <span className="text-xs font-semibold text-[#1A1A1A]">{channel}</span>
                      <Switch checked={pkg.is_active} disabled className="scale-90" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-2">Channel-level visibility is read-only here. Manage via the Visibility tab.</p>
              </div>
            </TabsContent>

            {/* Performance */}
            <TabsContent value="performance" className="mt-0 space-y-4">
              <div>
                <SectionTitle>Sales Performance</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="Total Sales" value={(pkg.purchase_count || 0).toLocaleString()} />
                  <MetricCard label="Est. Revenue" value={`$${estRevenue.toLocaleString()}`} />
                  <MetricCard label="Margin Contribution" value={`$${estMarginContribution.toLocaleString()}`} accent="text-emerald-600" />
                  <MetricCard label="Avg Rating" value="—" accent="text-[#9CA3AF]" />
                </div>
              </div>
              <Separator className="bg-[#F3F0EB]" />
              <div>
                <SectionTitle>Refund Rate</SectionTitle>
                <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#F3F0EB] text-center">
                  <p className="text-xs text-[#9CA3AF] font-medium">Refund tracking coming soon</p>
                </div>
              </div>
            </TabsContent>

            {/* Support Signals */}
            <TabsContent value="support" className="mt-0 space-y-4">
              <div>
                <SectionTitle>Support Signals</SectionTitle>
                <div className="space-y-1.5">
                  {[
                    { icon: Headphones, label: 'Support Ticket Rate', value: '—', note: 'Correlation not yet built' },
                    { icon: AlertTriangle, label: 'Dead-Air Incidents', value: '—', note: 'Requires scoring pipeline' },
                    { icon: TrendingUp, label: 'Common Problem Tags', value: '—', note: 'No tags linked yet' },
                    { icon: BookOpen, label: 'KB Articles Linked', value: '0', note: 'Link KB articles to this package' },
                  ].map(signal => (
                    <div key={signal.label} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-[#FAFAF8] border border-[#F3F0EB]/60">
                      <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] flex items-center justify-center flex-shrink-0">
                        <signal.icon className="h-3.5 w-3.5 text-[#6B7280]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A1A1A]">{signal.label}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{signal.note}</p>
                      </div>
                      <span className="text-sm font-mono font-bold text-[#9CA3AF]">{signal.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t border-[#F3F0EB] bg-[#FAFAF8]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#9CA3AF]">
              Last updated: {new Date(pkg.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-[#6B7280]" onClick={() => { onEdit(pkg); onOpenChange(false); }}>Edit</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-[#6B7280]" onClick={() => { onClone(pkg); onOpenChange(false); }}>Clone</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
