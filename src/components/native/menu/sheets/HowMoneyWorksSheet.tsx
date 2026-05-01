import React from 'react';
import { AiraloBottomSheet } from './AiraloBottomSheet';

interface HowMoneyWorksSheetProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    number: '1',
    title: 'Earn on every purchase',
    description: 'Get cashback in Mobile11 Money every time you buy an eSIM plan. Your loyalty tier determines the percentage.',
  },
  {
    number: '2',
    title: 'Spend at checkout',
    description: 'Apply your Mobile11 Money balance as a discount on your next purchase. It works just like a coupon.',
  },
  {
    number: '3',
    title: 'Top up via voucher',
    description: 'Redeem voucher codes to add more Mobile11 Money to your balance instantly.',
  },
];

export const HowMoneyWorksSheet: React.FC<HowMoneyWorksSheetProps> = ({
  open,
  onClose,
}) => {
  return (
    <AiraloBottomSheet open={open} onClose={onClose} title="How Mobile11 Money works">
      <div className="p-5 space-y-6">
        {STEPS.map((step) => (
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
      </div>
    </AiraloBottomSheet>
  );
};
