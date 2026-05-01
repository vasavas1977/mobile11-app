import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileMenuShell } from './MobileMenuShell';
import { LoyaltyBenefitsSheet } from './sheets/LoyaltyBenefitsSheet';
import { HowMoneyWorksSheet } from './sheets/HowMoneyWorksSheet';
import { MoneyHistorySheet } from './sheets/MoneyHistorySheet';
import { RedeemVoucherSheet } from './sheets/RedeemVoucherSheet';

// Tier thresholds in THB
const TIER_THRESHOLDS = {
  explorer: 0,
  silver: 1750,
  gold: 3500,
  platinum: 7000,
};

const TIER_CASHBACK: Record<string, string> = {
  explorer: '5.0',
  silver: '7.0',
  gold: '10.0',
  platinum: '15.0',
};

const TIER_COLORS: Record<string, string> = {
  explorer: 'text-orange-500',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-orange-600',
};

const TIER_ORDER = ['explorer', 'silver', 'gold', 'platinum'];

function getNextTier(current: string): string | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

function convertThbToUsd(thb: number): number {
  return thb / 35; // approximate conversion
}

export const MobileLoyaltyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency, formatPrice } = useLanguage();

  const [showBenefits, setShowBenefits] = useState(false);
  const [showHowMoney, setShowHowMoney] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);

  // Fetch loyalty data
  const { data: loyalty } = useQuery({
    queryKey: ['user-loyalty', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code === 'PGRST116') {
        const { data: newLoyalty } = await supabase
          .from('user_loyalty')
          .insert({ user_id: user.id })
          .select()
          .single();
        return newLoyalty;
      }
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['money-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('mobile11_money_transactions')
        .select('*, orders:order_id(created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).filter((tx: any) => tx.amount !== 0);
    },
    enabled: !!user?.id,
  });

  const tier = loyalty?.tier || 'explorer';
  const totalSpent = loyalty?.total_spent || 0;
  const balance = loyalty?.mobile11_money_balance || 0;
  const balanceExpires = loyalty?.balance_expires_at;
  const nextTier = getNextTier(tier);

  // Progress bar calculations
  const currentThreshold = TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS] || 0;
  const nextThreshold = nextTier
    ? TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS]
    : TIER_THRESHOLDS.platinum;
  const progressRange = nextThreshold - currentThreshold;
  const progressValue = Math.min(totalSpent - currentThreshold, progressRange);
  const progressPercent = progressRange > 0 ? (progressValue / progressRange) * 100 : 100;
  const toNextTier = Math.max(0, nextThreshold - totalSpent);

  const displayThreshold = (thb: number) => {
    if (currency === 'THB') return `฿${thb.toLocaleString()}`;
    return formatPrice(convertThbToUsd(thb));
  };

  const previewTransactions = transactions.slice(0, 2);

  return (
    <MobileMenuShell title="Loyalty and Mobile11 Money">
      <div className="p-4 space-y-4">
        {/* 1. Referral CTA row */}
        <button
          onClick={() => navigate('/profile?section=referrals')}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🪙</span>
          </div>
          <span className="flex-1 text-left text-[15px] font-semibold text-gray-900">
            Get {formatPrice(5)} in Mobile11 Money for each referral
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </button>

        {/* 2. Loyalty level card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Your loyalty level</p>
          <h2 className={`text-[34px] font-extrabold ${TIER_COLORS[tier] || 'text-orange-500'} capitalize`}>
            {tier}
          </h2>
          <p className="text-[15px] text-gray-700 mb-4">
            Earns {TIER_CASHBACK[tier] || '5.0'}% cashback
          </p>

          {/* Progress bar */}
          <div className="relative mb-3">
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div
                className="h-1.5 bg-gray-400 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            {/* Current position dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-[#FAF7F2]"
              style={{ left: `${Math.min(progressPercent, 97)}%` }}
            />
            {/* End dot */}
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 rounded-full bg-gray-900" />
          </div>

          {/* Spent / To next */}
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <p className="text-sm text-gray-500">Total spent</p>
              <p className="text-[15px] font-bold text-gray-900">{displayThreshold(totalSpent)}</p>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="text-sm text-gray-500">To {nextTier}</p>
                <p className="text-[15px] font-bold text-gray-500">{displayThreshold(toNextTier)}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowBenefits(true)}
            className="w-full h-12 rounded-full bg-white border border-gray-300 text-gray-900 font-semibold text-[15px]"
          >
            Explore loyalty benefits
          </button>
        </div>

        {/* 3. Mobile11 Money balance card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-3 right-3 flex gap-1">
            <div className="w-6 h-6 rounded-full bg-orange-200 opacity-60" />
            <div className="w-4 h-4 rounded-full bg-orange-300 opacity-40 mt-2" />
            <div className="w-3 h-3 rounded-full bg-orange-400 opacity-30 mt-4" />
          </div>

          <p className="text-sm text-gray-500 mb-1">Mobile11 Money</p>
          <h2 className="text-[34px] font-extrabold text-gray-900">
            {balance.toFixed(2)} <span className="text-lg font-bold text-gray-500">{currency}</span>
          </h2>
          {balanceExpires && (
            <p className="text-sm text-gray-500 mt-1">
              Valid until {new Date(balanceExpires).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <button
            onClick={() => setShowHowMoney(true)}
            className="w-full h-12 rounded-full bg-white border border-gray-300 text-gray-900 font-semibold text-[15px] mt-4"
          >
            How Mobile11 Money works
          </button>
        </div>

        {/* 4. History card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-[17px] font-bold text-gray-900 mb-3">Mobile11 Money history</h3>

          {previewTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No transactions yet</p>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100">
              {previewTransactions.map((tx: any) => {
                const isCredit = tx.amount > 0;
                const dateStr = tx.orders?.created_at || tx.created_at;
                const label = getLabel(tx.type);
                return (
                  <div key={tx.id} className="flex items-start gap-3 py-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        isCredit ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-900 truncate">{label}</p>
                      <p className="text-sm text-gray-500">{formatDate(dateStr)}</p>
                    </div>
                    <span
                      className={`text-[15px] font-bold flex-shrink-0 ${
                        isCredit ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isCredit ? '+' : ''}{tx.amount.toFixed(2)} {currency}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setShowHistory(true)}
            className="w-full h-12 rounded-full bg-white border border-gray-300 text-gray-900 font-semibold text-[15px] mt-3"
          >
            Show history
          </button>

          {/* Voucher sub-section */}
          <div className="border-t border-gray-100 mt-4 pt-4">
            <h4 className="text-[15px] font-bold text-gray-900 mb-1">
              Mobile11 Money or eSIM voucher code
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Have a voucher code? Redeem it to add credit to your account.
            </p>
            <button
              onClick={() => setShowRedeem(true)}
              className="w-full h-12 rounded-full bg-white border border-gray-300 text-gray-900 font-semibold text-[15px]"
            >
              Redeem voucher
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheets */}
      <LoyaltyBenefitsSheet open={showBenefits} onClose={() => setShowBenefits(false)} currentTier={tier} />
      <HowMoneyWorksSheet open={showHowMoney} onClose={() => setShowHowMoney(false)} />
      <MoneyHistorySheet open={showHistory} onClose={() => setShowHistory(false)} transactions={transactions} />
      <RedeemVoucherSheet open={showRedeem} onClose={() => setShowRedeem(false)} />
    </MobileMenuShell>
  );
};

// Helpers
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
