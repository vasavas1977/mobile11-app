import React from 'react';
import { AiraloBottomSheet } from './AiraloBottomSheet';
import { useLanguage } from '@/contexts/LanguageContext';

interface Transaction {
  id: string;
  amount: number;
  type: string | null;
  description: string | null;
  created_at: string | null;
  order_id: string | null;
  orders?: { created_at: string } | null;
}

interface MoneyHistorySheetProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

const TYPE_LABELS: Record<string, string> = {
  earned: 'Purchase Reward',
  redeemed: 'Mobile11 Money Spent',
  redemption: 'Mobile11 Money Spent',
  bonus: 'Bonus Reward',
  voucher: 'Voucher Redeemed',
  topup: 'Top Up Reward',
  referral: 'Referral Bonus',
};

function getLabel(type: string | null): string {
  if (!type) return 'Transaction';
  return TYPE_LABELS[type.toLowerCase()] || type;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MoneyHistorySheet: React.FC<MoneyHistorySheetProps> = ({
  open,
  onClose,
  transactions,
}) => {
  const { currency } = useLanguage();

  return (
    <AiraloBottomSheet open={open} onClose={onClose} title="Mobile11 Money history">
      <div className="p-5">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              const dateStr = tx.orders?.created_at || tx.created_at;
              return (
                <div key={tx.id} className="flex items-start gap-3 py-3.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      isCredit ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">
                      {getLabel(tx.type)}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(dateStr)}</p>
                  </div>
                  <span
                    className={`text-[15px] font-bold flex-shrink-0 ${
                      isCredit ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isCredit ? '+' : ''}
                    {tx.amount.toFixed(2)} {currency}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AiraloBottomSheet>
  );
};
