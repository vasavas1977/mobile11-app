import { useState, useMemo } from 'react';
import {
  Search, Wallet, AlertTriangle, Clock, DollarSign, FileText,
  MoreHorizontal, Users, TrendingUp, CreditCard, Receipt,
  ArrowUpDown, ChevronRight, HeadphonesIcon, Eye, Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SampleModeBadge } from './SampleModeGuards';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AdminKPICard } from '../ui/AdminKPICard';
import { PartnerDataModeToggle } from './PartnerDataModeToggle';
import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { SAMPLE_PARTNERS } from './sampleData';
import {
  SAMPLE_LEDGER, SAMPLE_SETTLEMENTS, SAMPLE_PAYOUTS, SAMPLE_INVOICES,
} from './sampleData';
import { STATUS_STYLES, PARTNER_TYPE_LABELS, type Partner } from './types';
import {
  TX_TYPE_STYLES, SETTLEMENT_STATUS_STYLES, PAYOUT_STATUS_STYLES, INVOICE_STATUS_STYLES,
  type LedgerEntry, type Settlement, type Payout, type Invoice,
} from './wallets/walletMockData';

// ── Main Page ───────────────────────────────────────────────
export function WalletsPage() {
  const { isSampleMode } = usePartnerDataMode();
  const partners = useMemo(() => (isSampleMode ? SAMPLE_PARTNERS : []).filter(p => p.status !== 'terminated'), [isSampleMode]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [settlementFilter, setSettlementFilter] = useState('all');
  const [selected, setSelected] = useState<Partner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return partners.filter(p => {
      if (search && !p.company_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && p.partner_type !== typeFilter) return false;
      if (walletFilter === 'low' && p.wallet_balance >= p.credit_limit * 0.15) return false;
      if (walletFilter === 'negative' && p.wallet_balance >= 0) return false;
      if (walletFilter === 'healthy' && p.wallet_balance < p.credit_limit * 0.15) return false;
      if (settlementFilter === 'prepaid' && p.settlement_model !== 'prepaid') return false;
      if (settlementFilter === 'postpaid' && p.settlement_model !== 'postpaid') return false;
      if (settlementFilter === 'hybrid' && p.settlement_model !== 'hybrid') return false;
      return true;
    });
  }, [partners, search, typeFilter, walletFilter, settlementFilter]);

  const totalBalance = partners.reduce((s, p) => s + p.wallet_balance, 0);
  const lowAlerts = partners.filter(p => p.wallet_balance < p.credit_limit * 0.15 && p.wallet_balance >= 0).length;
  const negativeAlerts = partners.filter(p => p.wallet_balance < 0).length;
  const pendingSettlements = isSampleMode ? SAMPLE_SETTLEMENTS.filter(s => s.status === 'pending' || s.status === 'processing').length : 0;
  const pendingPayouts = isSampleMode ? SAMPLE_PAYOUTS.filter(p => p.status !== 'completed' && p.status !== 'rejected').length : 0;
  const overdueInvoices = isSampleMode ? SAMPLE_INVOICES.filter(i => i.status === 'overdue').length : 0;
  const marginPaidOut = isSampleMode ? SAMPLE_PAYOUTS.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0) : 0;

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Total Balance', value: `$${(totalBalance / 1000).toFixed(0)}K`, icon: Wallet, accent: 'default' },
    { label: 'Low Wallet Alerts', value: String(lowAlerts + negativeAlerts), icon: AlertTriangle, accent: lowAlerts + negativeAlerts > 0 ? 'warning' : 'default' },
    { label: 'Pending Settlements', value: String(pendingSettlements), icon: ArrowUpDown, accent: pendingSettlements > 0 ? 'warning' : 'default' },
    { label: 'Pending Payouts', value: String(pendingPayouts), icon: CreditCard, accent: pendingPayouts > 0 ? 'warning' : 'default' },
    { label: 'Overdue Receivables', value: String(overdueInvoices), icon: Receipt, accent: overdueInvoices > 0 ? 'error' : 'default' },
    { label: 'Margin Paid Out', value: `$${(marginPaidOut / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
  ];

  const openDetail = (p: Partner) => { setSelected(p); setDrawerOpen(true); };

  if (!isSampleMode && partners.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Wallets & Settlements</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Partner financial operations — wallets, settlements, payouts, and invoicing</p>
          </div>
          <div className="flex items-center gap-3">
            <SampleModeBadge />
            <PartnerDataModeToggle />
          </div>
        </div>
        <AdminEmptyState
          title="No wallet activity yet"
          description="Wallet transactions will appear here once partners start transacting."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Wallets & Settlements</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Partner financial operations — wallets, settlements, payouts, and invoicing</p>
        </div>
        <div className="flex items-center gap-3">
          <SampleModeBadge />
          <PartnerDataModeToggle />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpis.map(kpi => <AdminKPICard key={kpi.label} {...kpi} />)}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <Input placeholder="Search partner..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#1A1A1A] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="bg-white border-[#F3F0EB]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="distributor">Distributor</SelectItem>
            <SelectItem value="reseller">Reseller</SelectItem>
            <SelectItem value="api_partner">API Partner</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={walletFilter} onValueChange={setWalletFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Wallet" /></SelectTrigger>
          <SelectContent className="bg-white border-[#F3F0EB]">
            <SelectItem value="all">All Wallets</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="low">Low Balance</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>
        <Select value={settlementFilter} onValueChange={setSettlementFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#F3F0EB] text-[13px] text-[#4B5563]"><SelectValue placeholder="Settlement" /></SelectTrigger>
          <SelectContent className="bg-white border-[#F3F0EB]">
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="prepaid">Prepaid</SelectItem>
            <SelectItem value="postpaid">Postpaid</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Wallet Balance</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Credit Limit</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Available</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Settlement</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Pending Settl.</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Pending Payout</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Last Txn</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-[#9CA3AF] text-[13px]">No partners found</td></tr>
              ) : filtered.map(p => {
                const available = p.credit_limit - Math.max(0, -p.wallet_balance);
                const pendingSettl = isSampleMode ? SAMPLE_SETTLEMENTS.filter(s => s.partner_id === p.id && (s.status === 'pending' || s.status === 'processing')).reduce((s, x) => s + x.net_payable, 0) : 0;
                const pendingPay = isSampleMode ? SAMPLE_PAYOUTS.filter(x => x.partner_id === p.id && x.status !== 'completed' && x.status !== 'rejected').reduce((s, x) => s + x.amount, 0) : 0;
                const lastTxn = isSampleMode ? SAMPLE_LEDGER.find(l => l.partner_id === p.id) : null;
                const walletHealth = p.wallet_balance < 0 ? 'negative' : p.wallet_balance < p.credit_limit * 0.15 ? 'low' : 'healthy';
                const healthStyles = { healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200', low: 'bg-amber-50 text-amber-700 border-amber-200', negative: 'bg-red-50 text-red-700 border-red-200' };

                return (
                  <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => openDetail(p)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[12px] text-[#1A1A1A]">{p.company_name}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{p.country}</div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280]">{PARTNER_TYPE_LABELS[p.partner_type] || p.partner_type}</Badge></td>
                    <td className={`px-4 py-3 text-right font-mono text-[11px] font-medium ${p.wallet_balance < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>${p.wallet_balance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-[#6B7280]">${p.credit_limit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-[#6B7280]">${available.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] text-[#6B7280] capitalize">{p.settlement_model}</td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">{pendingSettl > 0 ? `$${pendingSettl.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-[#1A1A1A]">{pendingPay > 0 ? `$${pendingPay.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-[#9CA3AF]">{lastTxn ? new Date(lastTxn.date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${healthStyles[walletHealth]}`}>{walletHealth}</Badge></td>
                    <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#FAF7F2]">
                            <MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border-[#F3F0EB]">
                          <DropdownMenuItem onClick={() => openDetail(p)} className="text-[12px] text-[#1A1A1A]"><Eye className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Wallet</DropdownMenuItem>
                          <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Pencil className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Add Adjustment</DropdownMenuItem>
                          <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><FileText className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Ledger</DropdownMenuItem>
                          <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><CreditCard className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />Approve Payout</DropdownMenuItem>
                          <DropdownMenuItem className="text-[12px] text-[#1A1A1A]"><Receipt className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />View Invoices</DropdownMenuItem>
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

      {/* Detail Drawer */}
      <WalletDetailDrawer partner={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

// ── Detail Drawer ───────────────────────────────────────────
function WalletDetailDrawer({ partner, open, onOpenChange }: { partner: Partner | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!partner) return null;
  const p = partner;
  const walletPct = p.credit_limit > 0 ? Math.max(0, Math.min(100, (p.wallet_balance / p.credit_limit) * 100)) : 0;
  const ledger = SAMPLE_LEDGER.filter(l => l.partner_id === p.id);
  const settlements = SAMPLE_SETTLEMENTS.filter(s => s.partner_id === p.id);
  const payouts = SAMPLE_PAYOUTS.filter(x => x.partner_id === p.id);
  const invoices = SAMPLE_INVOICES.filter(i => i.partner_id === p.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[560px] lg:w-[640px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-[#1A1A1A]">{p.company_name}</SheetTitle>
                <SheetDescription className="text-xs text-[#9CA3AF] mt-1">Wallet · {p.partner_type.replace('_', ' ')} · {p.country}</SheetDescription>
              </div>
              <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview">
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  {['overview', 'ledger', 'settlements', 'payouts', 'invoices', 'notes'].map(tab => (
                    <TabsTrigger key={tab} value={tab} className="h-9 px-0 capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">
                      {tab === 'settlements' ? 'Settl.' : tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField icon={<Wallet className="h-3.5 w-3.5" />} label="Wallet Balance" value={`$${p.wallet_balance.toLocaleString()}`} />
                  <DrawerField icon={<CreditCard className="h-3.5 w-3.5" />} label="Credit Limit" value={`$${p.credit_limit.toLocaleString()}`} />
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Wallet Utilization</span>
                    <span className="text-[11px] font-mono text-[#1A1A1A]">{walletPct.toFixed(0)}%</span>
                  </div>
                  <Progress value={walletPct} className="h-1.5" />
                </div>
                {p.wallet_balance < 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Wallet is in deficit. Partner may be unable to place orders.
                  </div>
                )}
                <Separator className="bg-[#F3F0EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <MetaField label="Settlement Model" value={p.settlement_model} />
                  <MetaField label="Pricing Plan" value={p.default_pricing_plan} />
                  <MetaField label="Revenue/mo" value={`$${p.monthly_revenue.toLocaleString()}`} />
                  <MetaField label="Margin/mo" value={`$${p.monthly_margin.toLocaleString()}`} />
                  <MetaField label="Orders" value={p.total_orders.toLocaleString()} />
                  <MetaField label="Support" value={p.support_volume.toString()} />
                </div>
              </TabsContent>

              <TabsContent value="ledger" className="px-6 py-4 space-y-3 mt-0">
                {ledger.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] text-center py-8">No ledger entries</p>
                ) : ledger.map(l => {
                  const style = TX_TYPE_STYLES[l.type];
                  return (
                    <div key={l.id} className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={`text-[10px] ${style.color}`}>{style.label}</Badge>
                        <span className="text-[10px] text-[#9CA3AF]">{new Date(l.date).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-[#1A1A1A]">{l.description}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                        {l.debit > 0 && <span className="text-red-600 font-mono">-${l.debit.toLocaleString()}</span>}
                        {l.credit > 0 && <span className="text-emerald-600 font-mono">+${l.credit.toLocaleString()}</span>}
                        {l.debit === 0 && l.credit === 0 && <span className="text-[#9CA3AF]">—</span>}
                        <span className="text-[#9CA3AF] font-mono">Bal: ${l.balance_after.toLocaleString()}</span>
                      </div>
                      {l.admin_note && <p className="text-[10px] text-[#9CA3AF] mt-1 italic">{l.admin_note}</p>}
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="settlements" className="px-6 py-4 space-y-3 mt-0">
                {settlements.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] text-center py-8">No settlements</p>
                ) : settlements.map(s => (
                  <div key={s.id} className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-[#1A1A1A]">{s.period}</span>
                      <Badge variant="outline" className={`text-[10px] ${SETTLEMENT_STATUS_STYLES[s.status]}`}>{s.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                      <div><span className="text-[#9CA3AF]">Revenue</span><span className="block font-mono text-[#1A1A1A]">${s.gross_revenue.toLocaleString()}</span></div>
                      <div><span className="text-[#9CA3AF]">Commission</span><span className="block font-mono text-[#1A1A1A]">${s.commission.toLocaleString()}</span></div>
                      <div><span className="text-[#9CA3AF]">Net Payable</span><span className="block font-mono text-[#1A1A1A]">${s.net_payable.toLocaleString()}</span></div>
                      <div><span className="text-[#9CA3AF]">Due</span><span className="block text-[#1A1A1A]">{s.due_date}</span></div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="payouts" className="px-6 py-4 space-y-3 mt-0">
                {payouts.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] text-center py-8">No payouts</p>
                ) : payouts.map(x => (
                  <div key={x.id} className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-mono font-bold text-[#1A1A1A]">${x.amount.toLocaleString()}</span>
                      <Badge variant="outline" className={`text-[10px] ${PAYOUT_STATUS_STYLES[x.status]}`}>{x.status}</Badge>
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] space-y-0.5">
                      <p>{x.method} · {x.id}</p>
                      <p>Requested: {new Date(x.requested_at).toLocaleDateString()}</p>
                      {x.processed_at && <p>Processed: {new Date(x.processed_at).toLocaleDateString()} by {x.processed_by}</p>}
                      {x.bank_reference && <p>Ref: {x.bank_reference}</p>}
                    </div>
                    {x.notes && <p className="text-[10px] text-[#9CA3AF] mt-1 italic">{x.notes}</p>}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="invoices" className="px-6 py-4 space-y-3 mt-0">
                {invoices.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] text-center py-8">No invoices</p>
                ) : invoices.map(i => (
                  <div key={i.id} className="bg-[#FAFAF8] rounded-lg p-3 border border-[#F3F0EB]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-[#1A1A1A]">{i.invoice_number}</span>
                      <Badge variant="outline" className={`text-[10px] ${INVOICE_STATUS_STYLES[i.status]}`}>{i.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                      <div><span className="text-[#9CA3AF]">Amount</span><span className="block font-mono text-[#1A1A1A]">${i.amount.toLocaleString()}</span></div>
                      <div><span className="text-[#9CA3AF]">Tax</span><span className="block font-mono text-[#1A1A1A]">${i.tax.toLocaleString()}</span></div>
                      <div><span className="text-[#9CA3AF]">Total</span><span className="block font-mono font-bold text-[#1A1A1A]">${i.total.toLocaleString()}</span></div>
                      <div><span className="text-[#9CA3AF]">Due</span><span className="block text-[#1A1A1A]">{i.due_date}</span></div>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">Period: {i.period}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="notes" className="px-6 py-4 space-y-4 mt-0">
                <p className="text-[11px] text-[#9CA3AF]">No notes added for this partner's financial account.</p>
                <Button variant="outline" size="sm" className="text-xs h-8 border-[#F3F0EB]">Add Note</Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Field Helpers ──────────────────────────────────── */
function DrawerField({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#9CA3AF]">{icon}</div>
      <div className="min-w-0">
        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
        <p className="text-sm font-medium truncate text-[#1A1A1A]">{value}</p>
        {sub && <p className="text-[11px] text-[#6B7280] truncate">{sub}</p>}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
      <p className="text-xs text-[#1A1A1A]">{value}</p>
    </div>
  );
}
