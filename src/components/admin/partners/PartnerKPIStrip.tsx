import { Handshake, Truck, Store, Code, DollarSign, Wallet, TrendingUp, Headphones } from 'lucide-react';
import { AdminKPICard } from '../ui/AdminKPICard';
import { Partner } from './types';

interface PartnerKPIStripProps {
  partners: Partner[];
}

export function PartnerKPIStrip({ partners }: PartnerKPIStripProps) {
  const active = partners.filter(p => p.status === 'active').length;
  const distributors = partners.filter(p => p.partner_type === 'distributor').length;
  const resellers = partners.filter(p => p.partner_type === 'reseller').length;
  const apiPartners = partners.filter(p => p.partner_type === 'api_partner').length;
  const totalRevenue = partners.reduce((s, p) => s + p.monthly_revenue, 0);
  const totalMargin = partners.reduce((s, p) => s + p.monthly_margin, 0);
  const totalWallet = partners.reduce((s, p) => s + p.wallet_balance, 0);
  const totalSupport = partners.reduce((s, p) => s + p.support_volume, 0);

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Active Partners', value: String(active), icon: Handshake, accent: 'default' },
    { label: 'Distributors', value: String(distributors), icon: Truck, accent: 'default' },
    { label: 'Resellers', value: String(resellers), icon: Store, accent: 'default' },
    { label: 'API Partners', value: String(apiPartners), icon: Code, accent: 'default' },
    { label: 'Monthly Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, accent: 'success' },
    { label: 'Monthly Margin', value: `$${(totalMargin / 1000).toFixed(0)}K`, icon: TrendingUp, accent: 'success' },
    { label: 'Wallet Balances', value: `$${(totalWallet / 1000).toFixed(0)}K`, icon: Wallet, accent: 'warning' },
    { label: 'Support Volume', value: String(totalSupport), icon: Headphones, accent: 'default' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {kpis.map((kpi) => (
        <AdminKPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
