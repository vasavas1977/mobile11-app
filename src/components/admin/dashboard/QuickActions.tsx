import { Card, CardContent } from '@/components/ui/card';
import { Package, ShoppingCart, Tag, BarChart3, Users, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const actions = [
  { label: 'Packages', icon: Package, path: '/admin/provisioning', color: 'text-orange-500 bg-orange-500/10' },
  { label: 'Orders', icon: ShoppingCart, path: '/admin/orders', color: 'text-blue-600 bg-blue-500/10' },
  { label: 'Promos', icon: Tag, path: '/admin/promo-codes', color: 'text-purple-600 bg-purple-500/10' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics', color: 'text-emerald-600 bg-emerald-500/10' },
  { label: 'Customers', icon: Users, path: '/admin/users', color: 'text-blue-600 bg-blue-500/10' },
  { label: 'Support', icon: Headphones, path: '/admin/contact-center', color: 'text-orange-600 bg-orange-500/10' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {actions.map((action) => {
            const [textColor, bgColor] = action.color.split(' ');
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors group"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
                  <action.icon className={cn("h-4.5 w-4.5", textColor)} />
                </div>
                <span className="text-[11px] font-medium text-[#9CA3AF] group-hover:text-[#1A1A1A] transition-colors">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
