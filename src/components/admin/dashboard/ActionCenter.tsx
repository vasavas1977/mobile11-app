import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Package, UserPlus, RefreshCw, RotateCcw, 
  ThumbsDown, Wallet, Webhook
} from 'lucide-react';

const actions = [
  { label: 'Create Package', icon: Package, path: '/admin/catalog', color: 'text-orange-500 bg-orange-500/10' },
  { label: 'Create Reseller', icon: UserPlus, path: '/admin/partners/resellers', color: 'text-blue-600 bg-blue-500/10' },
  { label: 'Sync Supplier', icon: RefreshCw, path: '/admin/provisioning', color: 'text-emerald-600 bg-emerald-500/10' },
  { label: 'Retry Provisioning', icon: RotateCcw, path: '/admin/provisioning', color: 'text-purple-600 bg-purple-500/10' },
  { label: 'Low-Rated Chats', icon: ThumbsDown, path: '/admin/contact-center/ratings', color: 'text-red-500 bg-red-500/10' },
  { label: 'Pending Payouts', icon: Wallet, path: '/admin/affiliates', color: 'text-amber-600 bg-amber-500/10' },
  { label: 'Failed Webhooks', icon: Webhook, path: '/admin/settings', color: 'text-rose-600 bg-rose-500/10' },
];

export function ActionCenter() {
  const navigate = useNavigate();

  return (
    <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Action Center</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {actions.map((action) => {
            const [textColor, bgColor] = action.color.split(' ');
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-[#FAF7F2] transition-colors group"
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bgColor)}>
                  <action.icon className={cn("h-4 w-4", textColor)} />
                </div>
                <span className="text-[10px] font-medium text-[#9CA3AF] group-hover:text-[#1A1A1A] transition-colors text-center leading-tight">
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
