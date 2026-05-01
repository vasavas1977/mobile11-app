import React from 'react';
import { 
  User, 
  Monitor, 
  Coins, 
  CreditCard, 
  Gift, 
  Package, 
  Briefcase,
  Inbox
} from 'lucide-react';
import { ProfileSection } from './ProfileLayout';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobileApp } from '@/hooks/useIsMobileApp';

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
}

const menuItems: { id: ProfileSection; labelKey: string; icon: React.ElementType; mobileOnly?: boolean }[] = [
  { id: 'account', labelKey: 'profile.sidebar.account', icon: User },
  { id: 'devices', labelKey: 'profile.sidebar.devices', icon: Monitor },
  { id: 'loyalty', labelKey: 'profile.sidebar.loyalty', icon: Coins },
  { id: 'cards', labelKey: 'profile.sidebar.cards', icon: CreditCard },
  { id: 'referrals', labelKey: 'profile.sidebar.referrals', icon: Gift },
  { id: 'orders', labelKey: 'profile.sidebar.orders', icon: Package },
  { id: 'business', labelKey: 'profile.sidebar.business', icon: Briefcase },
  { id: 'inbox', labelKey: 'profile.sidebar.inbox', icon: Inbox, mobileOnly: true },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobileApp();

  const visibleItems = isMobile
    ? menuItems
    : menuItems.filter((item) => !item.mobileOnly);

  return (
    <nav className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <ul className="divide-y divide-gray-100">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const label = item.id === 'inbox' ? 'Inbox' : t(item.labelKey);
          
          return (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors relative",
                  "hover:bg-gray-50",
                  isActive && "bg-orange-50/50"
                )}
              >
                {/* Orange active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                )}
                
                <Icon 
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-orange-500" : "text-gray-400"
                  )} 
                />
                <span 
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-gray-900" : "text-gray-600"
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};