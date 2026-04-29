import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Settings, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { hapticImpact, ImpactStyle } from '@/lib/haptics';

interface AgentMobileNavProps {
  inboxCount?: number;
}

export function AgentMobileNav({ inboxCount = 0 }: AgentMobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/agent', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/agent/inbox', icon: Inbox, label: 'Inbox', badge: inboxCount },
    { to: '/agent/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F3F0EB] md:hidden safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-18 py-2">
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => hapticImpact(ImpactStyle.Light)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-5 py-2 min-w-[72px] transition-all relative rounded-2xl',
                isActive ? 'text-orange-500' : 'text-[#9CA3AF]'
              )}
            >
              <div className={cn(
                'relative p-2 rounded-2xl transition-colors',
                isActive && 'bg-orange-500/10'
              )}>
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-semibold', isActive && 'text-orange-500')}>{item.label}</span>
            </NavLink>
          );
        })}
        
        {/* Exit to site */}
        <button
          onClick={() => { hapticImpact(ImpactStyle.Light); navigate('/'); }}
          className="flex flex-col items-center justify-center gap-1 px-5 py-2 min-w-[72px] text-[#9CA3AF] transition-colors"
        >
          <div className="p-2">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold">Exit</span>
        </button>
      </div>
    </nav>
  );
}
