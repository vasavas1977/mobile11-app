import { Eye, TrendingUp, Star, Globe, AlertTriangle, DollarSign, BarChart3, Percent, ShoppingBag } from 'lucide-react';
import { AdminKPICard } from '@/components/admin/ui/AdminKPICard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CatalogKPIStripProps {
  packages: any[];
}

export function CatalogKPIStrip({ packages }: CatalogKPIStripProps) {
  const total = packages.length;
  const active = packages.filter(p => p.is_active).length;
  const featured = packages.filter(p => p.is_featured).length;

  const { data: countryCarriers } = useQuery({
    queryKey: ['country-carriers-count'],
    queryFn: async () => {
      const { data } = await supabase.from('country_carriers').select('country_name');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const totalCountries = new Set(countryCarriers?.map(c => c.country_name).filter(Boolean)).size;

  const withCost = packages.filter(p => p.cost_price > 0);
  const avgMargin = withCost.length > 0
    ? withCost.reduce((sum, p) => sum + ((p.price - p.cost_price) / p.cost_price) * 100, 0) / withCost.length
    : 0;

  const totalRevenuePotential = packages.reduce((sum, p) => sum + (p.price * (p.purchase_count || 0)), 0);

  const destinations = new Set(packages.map(p => p.country_name)).size;
  const destinationsWithActive = new Set(packages.filter(p => p.is_active).map(p => p.country_name)).size;
  const visibilityCoverage = destinations > 0 ? Math.round((destinationsWithActive / destinations) * 100) : 0;

  const destPackageCounts: Record<string, number> = {};
  packages.forEach(p => { destPackageCounts[p.country_name] = (destPackageCounts[p.country_name] || 0) + 1; });
  const competitiveGaps = Object.values(destPackageCounts).filter(count => count < 3).length;

  const bestSellers = packages.filter(p => (p.purchase_count || 0) > 10).length;

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error'; subtitle?: string }[] = [
    { label: 'Live Products', value: active.toLocaleString(), icon: Eye, accent: 'success', subtitle: `of ${total.toLocaleString()} total` },
    { label: 'Total Countries', value: totalCountries.toLocaleString(), icon: Globe, accent: 'success', subtitle: 'covered worldwide' },
    { label: 'Avg Margin', value: `${avgMargin.toFixed(0)}%`, icon: Percent, accent: avgMargin >= 100 ? 'success' : 'warning', subtitle: `${withCost.length} priced` },
    { label: 'Revenue Potential', value: totalRevenuePotential > 1000 ? `$${(totalRevenuePotential / 1000).toFixed(0)}k` : `$${totalRevenuePotential.toFixed(0)}`, icon: DollarSign, accent: 'default', subtitle: 'lifetime est.' },
    { label: 'Featured', value: featured.toLocaleString(), icon: Star, accent: 'warning', subtitle: 'promoted' },
    { label: 'Best Sellers', value: bestSellers.toLocaleString(), icon: ShoppingBag, accent: 'success', subtitle: '>10 orders' },
    { label: 'Visibility', value: `${visibilityCoverage}%`, icon: Globe, accent: visibilityCoverage >= 90 ? 'success' : 'warning', subtitle: `${destinationsWithActive} destinations` },
    { label: 'Gaps', value: competitiveGaps.toLocaleString(), icon: AlertTriangle, accent: competitiveGaps > 10 ? 'error' : 'default', subtitle: '<3 packages' },
  ];

  return (
    <div className="space-y-3">
      {/* Commercial summary bar */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-[#1A1A1A] uppercase tracking-wider">Commercial Overview</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#6B7280]">
          <span><span className="font-semibold text-emerald-600 tabular-nums">{active}</span> live</span>
          <span className="text-[#E5E7EB]">|</span>
          <span><span className="font-semibold text-[#1A1A1A] tabular-nums">{destinations}</span> destinations</span>
          <span className="text-[#E5E7EB]">|</span>
          <span><span className="font-semibold text-amber-600 tabular-nums">{featured}</span> featured</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#F3F0EB] p-3 transition-shadow hover:shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                kpi.accent === 'success' ? 'bg-emerald-50 text-emerald-600' :
                kpi.accent === 'warning' ? 'bg-amber-50 text-amber-600' :
                kpi.accent === 'error' ? 'bg-red-50 text-red-600' :
                'bg-[#FAF7F2] text-[#6B7280]'
              }`}>
                <kpi.icon className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide truncate">{kpi.label}</span>
            </div>
            <p className={`text-base font-bold tabular-nums ${
              kpi.accent === 'success' ? 'text-emerald-700' :
              kpi.accent === 'warning' ? 'text-amber-700' :
              kpi.accent === 'error' ? 'text-red-700' :
              'text-[#1A1A1A]'
            }`}>{kpi.value}</p>
            {kpi.subtitle && <p className="text-[9px] text-[#9CA3AF] mt-0.5">{kpi.subtitle}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
