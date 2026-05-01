import React from 'react';
import { AiraloBottomSheet } from './AiraloBottomSheet';
import { Check } from 'lucide-react';

interface LoyaltyBenefitsSheetProps {
  open: boolean;
  onClose: () => void;
  currentTier: string;
}

const TIERS = [
  {
    id: 'explorer',
    name: 'Explorer',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    cashback: '5.0%',
    perks: ['5% cashback on every purchase', 'Access to all eSIM plans', 'Standard support'],
  },
  {
    id: 'silver',
    name: 'Silver',
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    cashback: '7.0%',
    perks: ['7% cashback on every purchase', 'Priority email support', 'Early access to promotions'],
  },
  {
    id: 'gold',
    name: 'Gold',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    cashback: '10.0%',
    perks: ['10% cashback on every purchase', 'Faster support response', 'Exclusive deals & bundles', 'Birthday bonus reward'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    cashback: '15.0%',
    perks: ['15% cashback on every purchase', 'Dedicated support agent', 'Exclusive deals & early access', 'Birthday bonus reward', 'VIP partner perks'],
  },
];

export const LoyaltyBenefitsSheet: React.FC<LoyaltyBenefitsSheetProps> = ({
  open,
  onClose,
  currentTier,
}) => {
  return (
    <AiraloBottomSheet open={open} onClose={onClose} title="Loyalty Benefits">
      <div className="p-5 space-y-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.id === currentTier;
          return (
            <div
              key={tier.id}
              className={`rounded-2xl border p-4 ${
                isCurrent ? `${tier.border} ${tier.bg}` : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-extrabold ${tier.color}`}>{tier.name}</h3>
                {isCurrent && (
                  <span className="text-xs font-semibold bg-orange-500 text-gray-900 px-2.5 py-1 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Earns {tier.cashback} cashback
              </p>
              <ul className="space-y-2">
                {tier.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AiraloBottomSheet>
  );
};
