import { useState, useMemo } from 'react';
import { Search, Plus, FileText, AlertTriangle, CheckCircle, Clock, Upload, PenLine, Ban, RefreshCcw, MoreHorizontal, Calendar, Shield, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminKPICard } from '../ui/AdminKPICard';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { SampleModeActionGuard, SampleModeBadge } from './SampleModeGuards';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_CONTRACTS, SampleContract } from './sampleData';
import { PARTNER_TYPE_LABELS, PartnerType } from './types';

const SIGNATURE_STYLES: Record<string, { label: string; type: 'success' | 'warning' | 'error' | 'neutral' }> = {
  signed: { label: 'Signed', type: 'success' },
  countersigned: { label: 'Countersigned', type: 'success' },
  pending_signature: { label: 'Pending Signature', type: 'warning' },
  unsigned: { label: 'Unsigned', type: 'neutral' },
};

const RENEWAL_STYLES: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'neutral' }> = {
  auto_renew: { label: 'Auto Renew', type: 'success' },
  renewal_pending: { label: 'Renewal Pending', type: 'warning' },
  manual_review: { label: 'Manual Review', type: 'info' },
  not_due: { label: 'Not Due', type: 'neutral' },
};

const STATUS_TYPE_MAP: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  expired: 'error',
  suspended: 'error',
  draft: 'neutral',
};

function getContractHealth(c: SampleContract) {
  const end = new Date(c.end_date);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft;
}

export function ContractsPage() {
  const { isSampleMode } = usePartnerDataMode();
  const contracts = useMemo(() => (isSampleMode ? SAMPLE_CONTRACTS : []), [isSampleMode]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sigFilter, setSigFilter] = useState('all');
  const [renewalFilter, setRenewalFilter] = useState('all');
  const [selected, setSelected] = useState<SampleContract | null>(null);

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (search && !c.contract_name.toLowerCase().includes(search.toLowerCase()) && !c.partner_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && c.partner_type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (sigFilter !== 'all' && c.signature_status !== sigFilter) return false;
      if (renewalFilter !== 'all' && c.renewal_status !== renewalFilter) return false;
      return true;
    });
  }, [contracts, search, typeFilter, statusFilter, sigFilter, renewalFilter]);

  const activeCount = contracts.filter(c => c.status === 'active').length;
  const expiringCount = contracts.filter(c => { const d = getContractHealth(c); return c.status === 'active' && d > 0 && d < 60; }).length;
  const pendingSigCount = contracts.filter(c => c.signature_status === 'pending_signature' || c.signature_status === 'unsigned').length;
  const renewalThisQ = contracts.filter(c => c.renewal_status === 'renewal_pending' || c.renewal_status === 'manual_review').length;
  const suspendedCount = contracts.filter(c => c.status === 'suspended').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Contracts</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Track partner agreements, signatures, renewals, and compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
          <SampleModeActionGuard>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />New Contract
            </Button>
          </SampleModeActionGuard>
        </div>
      </div>

      {!isSampleMode && contracts.length === 0 ? (
        <AdminEmptyState
          title="No contracts found"
          description="Create your first partner contract to track agreements, renewals, and compliance."
          actionLabel="New Contract"
          onAction={() => {}}
        />
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <AdminKPICard label="Active Contracts" value={activeCount.toString()} icon={CheckCircle} accent="success" />
            <AdminKPICard label="Expiring Soon" value={expiringCount.toString()} icon={Clock} accent={expiringCount > 0 ? 'warning' : 'default'} />
            <AdminKPICard label="Pending Signature" value={pendingSigCount.toString()} icon={PenLine} accent={pendingSigCount > 0 ? 'warning' : 'default'} />
            <AdminKPICard label="Renewals This Quarter" value={renewalThisQ.toString()} icon={RefreshCcw} accent={renewalThisQ > 0 ? 'warning' : 'default'} />
            <AdminKPICard label="Suspended Contracts" value={suspendedCount.toString()} icon={Ban} accent={suspendedCount > 0 ? 'error' : 'default'} />
          </div>

          {/* Expiring alert */}
          {expiringCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">{expiringCount} contract{expiringCount > 1 ? 's' : ''} expiring within 60 days</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A] h-9 text-xs" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9 text-xs bg-white border-[#F3F0EB]"><SelectValue placeholder="Partner Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(PARTNER_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9 text-xs bg-white border-[#F3F0EB]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sigFilter} onValueChange={setSigFilter}>
              <SelectTrigger className="w-40 h-9 text-xs bg-white border-[#F3F0EB]"><SelectValue placeholder="Signature" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signatures</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="countersigned">Countersigned</SelectItem>
                <SelectItem value="pending_signature">Pending Signature</SelectItem>
                <SelectItem value="unsigned">Unsigned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={renewalFilter} onValueChange={setRenewalFilter}>
              <SelectTrigger className="w-40 h-9 text-xs bg-white border-[#F3F0EB]"><SelectValue placeholder="Renewal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Renewals</SelectItem>
                <SelectItem value="auto_renew">Auto Renew</SelectItem>
                <SelectItem value="renewal_pending">Renewal Pending</SelectItem>
                <SelectItem value="manual_review">Manual Review</SelectItem>
                <SelectItem value="not_due">Not Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                    {['Contract', 'Partner', 'Type', 'Country', 'Status', 'Signature', 'Start', 'End', 'Renewal', 'Manager', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12 text-sm text-[#9CA3AF]">No contracts match your filters</td></tr>
                  ) : filtered.map(c => {
                    const days = getContractHealth(c);
                    const sig = SIGNATURE_STYLES[c.signature_status];
                    const ren = RENEWAL_STYLES[c.renewal_status];
                    return (
                      <tr key={c.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1A1A1A] text-xs">{c.contract_name}</div>
                          <div className="text-[10px] text-[#9CA3AF]">{c.id} · v{c.version}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1A1A1A]">{c.partner_name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280]">
                            {PARTNER_TYPE_LABELS[c.partner_type as PartnerType] || c.partner_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6B7280]">{c.country}</td>
                        <td className="px-4 py-3">
                          <AdminStatusBadge status={c.status} type={STATUS_TYPE_MAP[c.status]} />
                        </td>
                        <td className="px-4 py-3">
                          <AdminStatusBadge status={c.signature_status} type={sig.type} label={sig.label} />
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6B7280] tabular-nums">{c.start_date}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#6B7280] tabular-nums">{c.end_date}</span>
                          {c.status === 'active' && days > 0 && days < 60 && (
                            <span className="ml-1.5 text-[10px] text-amber-600 font-medium">({days}d)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <AdminStatusBadge status={c.renewal_status} type={ren.type} label={ren.label} />
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6B7280]">{c.account_manager}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#6B7280] hover:bg-[#FAF7F2]">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => setSelected(c)}><FileText className="h-3.5 w-3.5 mr-2" />View Contract</DropdownMenuItem>
                              <DropdownMenuItem><PenLine className="h-3.5 w-3.5 mr-2" />Edit Contract</DropdownMenuItem>
                              <DropdownMenuItem><Upload className="h-3.5 w-3.5 mr-2" />Upload New Version</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem><CheckCircle className="h-3.5 w-3.5 mr-2" />Mark Signed</DropdownMenuItem>
                              <DropdownMenuItem><RefreshCcw className="h-3.5 w-3.5 mr-2" />Renew</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600"><Ban className="h-3.5 w-3.5 mr-2" />Suspend</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto bg-[#FAFAF8]">
          {selected && <ContractDrawer contract={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ContractDrawer({ contract: c, onClose }: { contract: SampleContract; onClose: () => void }) {
  const days = getContractHealth(c);
  const sig = SIGNATURE_STYLES[c.signature_status];
  const ren = RENEWAL_STYLES[c.renewal_status];

  return (
    <>
      <SheetHeader className="pb-4 border-b border-[#F3F0EB]">
        <SheetTitle className="text-base font-bold text-[#1A1A1A]">{c.contract_name}</SheetTitle>
        <SheetDescription className="text-xs text-[#6B7280]">{c.id} · Version {c.version} · {c.partner_name}</SheetDescription>
        <div className="flex items-center gap-2 mt-2">
          <AdminStatusBadge status={c.status} type={STATUS_TYPE_MAP[c.status]} size="md" />
          <AdminStatusBadge status={c.signature_status} type={sig.type} label={sig.label} size="md" />
        </div>
      </SheetHeader>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="w-full bg-[#F3F0EB]/60 p-0.5 h-8">
          {['Overview', 'Versions', 'Renewal', 'Linked Partner', 'Notes'].map(t => (
            <TabsTrigger key={t} value={t.toLowerCase().replace(' ', '_')} className="text-[10px] h-7 px-2.5 data-[state=active]:bg-white">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Partner', value: c.partner_name },
              { label: 'Partner Type', value: PARTNER_TYPE_LABELS[c.partner_type as PartnerType] || c.partner_type },
              { label: 'Country', value: c.country },
              { label: 'Territory', value: c.territory },
              { label: 'Start Date', value: c.start_date },
              { label: 'End Date', value: c.end_date },
              { label: 'Account Manager', value: c.account_manager },
              { label: 'Days Remaining', value: days > 0 ? `${days} days` : 'Expired' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-[#F3F0EB] p-3">
                <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-0.5">{item.label}</div>
                <div className="text-xs font-medium text-[#1A1A1A]">{item.value}</div>
              </div>
            ))}
          </div>
          {days > 0 && days < 60 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs text-amber-800">This contract expires in {days} days. Consider starting renewal.</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="versions" className="space-y-3 mt-4">
          {Array.from({ length: c.version }, (_, i) => c.version - i).map(v => (
            <div key={v} className="bg-white rounded-lg border border-[#F3F0EB] p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[#1A1A1A]">Version {v}</div>
                <div className="text-[10px] text-[#9CA3AF]">{v === c.version ? 'Current version' : 'Previous version'}</div>
              </div>
              <div className="flex items-center gap-2">
                {v === c.version && <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">Current</Badge>}
                <Button variant="outline" size="sm" className="h-6 text-[10px] border-[#F3F0EB]">
                  <FileText className="h-3 w-3 mr-1" />View
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="renewal" className="space-y-4 mt-4">
          <div className="bg-white rounded-lg border border-[#F3F0EB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Renewal Status</span>
              <AdminStatusBadge status={c.renewal_status} type={ren.type} label={ren.label} size="md" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Current End Date</span>
              <span className="text-xs font-medium text-[#1A1A1A] tabular-nums">{c.end_date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Days Until Expiry</span>
              <span className={`text-xs font-medium tabular-nums ${days < 60 ? 'text-amber-600' : days < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                {days > 0 ? `${days} days` : 'Expired'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8">
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />Start Renewal
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 border-[#F3F0EB]">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />Schedule Review
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="linked_partner" className="space-y-3 mt-4">
          <div className="bg-white rounded-lg border border-[#F3F0EB] p-4 space-y-3">
            {[
              { label: 'Partner Name', value: c.partner_name },
              { label: 'Partner ID', value: c.partner_id },
              { label: 'Type', value: PARTNER_TYPE_LABELS[c.partner_type as PartnerType] || c.partner_type },
              { label: 'Country', value: c.country },
              { label: 'Territory', value: c.territory },
              { label: 'Account Manager', value: c.account_manager },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">{item.label}</span>
                <span className="text-xs font-medium text-[#1A1A1A]">{item.value}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8 border-[#F3F0EB]">
            <Shield className="h-3.5 w-3.5 mr-1.5" />View Partner Profile
          </Button>
        </TabsContent>

        <TabsContent value="notes" className="space-y-3 mt-4">
          <div className="bg-white rounded-lg border border-[#F3F0EB] p-4">
            {c.notes ? (
              <p className="text-xs text-[#1A1A1A] leading-relaxed">{c.notes}</p>
            ) : (
              <p className="text-xs text-[#9CA3AF] italic">No notes added to this contract.</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8 border-[#F3F0EB]">
            <PenLine className="h-3.5 w-3.5 mr-1.5" />Add Note
          </Button>
        </TabsContent>
      </Tabs>
    </>
  );
}
