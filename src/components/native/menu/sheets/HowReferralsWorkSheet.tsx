import React from 'react';
import { AiraloBottomSheet } from './AiraloBottomSheet';
import { useLanguage } from '@/contexts/LanguageContext';

interface HowReferralsWorkSheetProps {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
}

export const HowReferralsWorkSheet: React.FC<HowReferralsWorkSheetProps> = ({
  open,
  onClose,
  onShare,
}) => {
  const { formatPrice } = useLanguage();

  const steps = [
    {
      number: '1',
      title: 'Share your code',
      description: 'Send your unique referral code to friends via message, email, or social media.',
    },
    {
      number: '2',
      title: 'Friend redeems',
      description: `Your friend applies your code at checkout and gets ${formatPrice(5)} off their first eSIM purchase.`,
    },
    {
      number: '3',
      title: 'You both earn',
      description: `Once they complete their purchase, you receive ${formatPrice(5)} in Mobile11 Money. Everyone wins!`,
    },
  ];

  return (
    <AiraloBottomSheet open={open} onClose={onClose} title="How referrals work">
      <div className="p-5 space-y-6">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-gray-900">{step.number}</span>
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-[15px] font-bold text-gray-900 mb-1">{step.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            onShare();
            onClose();
          }}
          className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold text-[15px] transition-colors"
        >
          Share my code
        </button>
      </div>
    </AiraloBottomSheet>
  );
};
