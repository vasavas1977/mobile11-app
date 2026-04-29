import React from 'react';
import { Compass, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  userName: string;
  tier: string;
  avatarUrl?: string | null;
}

const tierConfig: Record<string, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  explorer: { 
    icon: Compass, 
    label: 'Explorer', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500'
  },
  silver: { 
    icon: Medal, 
    label: 'Silver Explorer', 
    color: 'text-gray-400',
    bgColor: 'bg-gray-400'
  },
  gold: { 
    icon: Crown, 
    label: 'Gold Explorer', 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500'
  },
  platinum: { 
    icon: Crown, 
    label: 'Platinum Explorer', 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500'
  },
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  userName, 
  tier, 
  avatarUrl 
}) => {
  const tierInfo = tierConfig[tier] || tierConfig.explorer;
  const TierIcon = tierInfo.icon;
  
  // Get initials for avatar fallback
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={userName}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md",
            tierInfo.bgColor
          )}>
            {initials}
          </div>
        )}
        
        {/* Tier badge overlay */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
          tierInfo.bgColor,
          "border-2 border-white shadow-sm"
        )}>
          <TierIcon className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Name and tier */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          <TierIcon className={cn("w-4 h-4", tierInfo.color)} />
          <span className={cn("text-sm font-medium", tierInfo.color)}>
            {tierInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};
