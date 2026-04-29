import { Wallet, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, Receipt, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getActivePartners } from './walletMockData';

const partners = getActivePartners();

const totalWallet = partners.reduce((s, p) => s + p.wallet_balance, 0);
const lowBalance = partners.filter(p => p.wallet_balance < p.credit_limit * 0.1 && p.settlement_model === 'prepaid');
const negativeBalance = partners.filter(p => p.wallet_balance < 0);
const totalCredit = partners.reduce((s, p) => s + p.credit_limit, 0);
const totalMargin = partners.reduce((s, p) => s + p.monthly_margin, 0);

const kpis = [
  { label: 'Total Wallet Balances', value: `$${totalWallet.toLocaleString()}`, icon: Wallet, iconColor: 'text-orange-500', trend: '+4.2%', trendUp: true },
  { label: 'Total Credit Extended', value: `$${totalCredit.toLocaleString()}`, icon: CreditCard, iconColor: 'text-blue-500' },
  { label: 'Low Balance Partners', value: lowBalance.length.toString(), icon: AlertTriangle, iconColor: 'text-amber-500', alert: lowBalance.length > 0 },
  { label: 'Negative Balances', value: negativeBalance.length.toString(), icon: ArrowDownRight, iconColor: 'text-red-500', alert: negativeBalance.length > 0 },
  { label: 'Pending Settlements', value: '3', icon: Clock, iconColor: 'text-blue-500' },
  { label: 'Pending Payouts', value: '$74,900', icon: ArrowUpRight, iconColor: 'text-orange-500' },
  { label: 'Overdue Receivables', value: '$13,673', icon: Receipt, iconColor: 'text-red-500', alert: true },
  { label: 'Monthly Partner Margin', value: `$${totalMargin.toLocaleString()}`, icon: TrendingUp, iconColor: 'text-emerald-500', trend: '+8.1%', trendUp: true },
];

const marginByChannel = [
  { channel: 'Distributors', margin: 32900, pct: 38 },
  { channel: 'API Partners', margin: 42000, pct: 48 },
  { channel: 'Resellers', margin: 3800, pct: 4 },
  { channel: 'Corporate', margin: 7200, pct: 8 },
  { channel: 'Affiliates', margin: 1800, pct: 2 },
];

export function WalletOverviewTab() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#F3F0EB] p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{kpi.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <p className={`text-xl font-bold font-mono ${kpi.alert ? 'text-red-600' : 'text-[#1A1A1A]'}`}>{kpi.value}</p>
              {kpi.trend && (
                <span className={`text-[11px] font-medium ${kpi.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Balance Alerts */}
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Low Balance Alerts</h3>
          {lowBalance.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">All partners have sufficient balance.</p>
          ) : (
            <div className="space-y-2">
              {lowBalance.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#F3F0EB] last:border-0">
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A]">{p.company_name}</span>
                    <span className="text-[11px] text-[#9CA3AF] ml-2">{p.country}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-medium text-amber-600">${p.wallet_balance.toLocaleString()}</span>
                    <span className="text-[10px] text-[#9CA3AF] ml-1">/ ${p.credit_limit.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Margin by Channel */}
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Margin by Channel</h3>
          <div className="space-y-3">
            {marginByChannel.map(ch => (
              <div key={ch.channel}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-[#4B5563]">{ch.channel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-mono font-medium text-[#1A1A1A]">${ch.margin.toLocaleString()}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{ch.pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#F3F0EB] rounded-full h-1.5">
                  <div className="h-full rounded-full bg-orange-400" style={{ width: `${ch.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Wallet Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F3F0EB]">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Partner Wallet Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Model</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Balance</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Credit Limit</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Utilization</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Monthly Margin</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => {
                const util = p.credit_limit > 0 ? ((p.credit_limit - p.wallet_balance) / p.credit_limit * 100) : 0;
                const isLow = p.wallet_balance < p.credit_limit * 0.1 && p.settlement_model === 'prepaid';
                return (
                  <tr key={p.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#1A1A1A]">{p.company_name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{p.country}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280]">{p.partner_type}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[10px] bg-[#FAF7F2] text-[#6B7280] border-[#F3F0EB]">{p.settlement_model}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-mono font-medium ${p.wallet_balance < 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#1A1A1A]'}`}>
                        ${p.wallet_balance.toLocaleString()}
                      </span>
                      {isLow && <AlertTriangle className="inline h-3 w-3 text-amber-500 ml-1" />}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#6B7280]">${p.credit_limit.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 bg-[#F3F0EB] rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${util > 80 ? 'bg-red-500' : util > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, util)}%` }} />
                        </div>
                        <span className="text-[11px] text-[#6B7280] font-mono w-8 text-right">{util.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600">${p.monthly_margin.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
