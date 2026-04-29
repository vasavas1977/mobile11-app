import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Compass, Medal, Crown, Gem, Coins, Trophy, Plane, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RedeemVoucherModal } from '../modals/RedeemVoucherModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertThbToUsd } from '@/lib/currencyUtils';
import { getDateLocale } from '@/lib/dateLocale';

interface LoyaltySectionProps {
  loyalty: {
    id: string;
    user_id: string;
    tier: string;
    total_spent: number;
    mobile11_money_balance: number;
    referral_code: string | null;
    balance_expires_at: string | null;
  } | null | undefined;
}

const tierConfig: Record<string, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  cashbackRate: number;
  nextTier: string | null;
  nextTierThreshold: number;
}> = {
  explorer: { 
    icon: Compass, 
    label: 'Explorer', 
    color: 'text-orange-500',
    cashbackRate: 5,
    nextTier: 'Silver Explorer',
    nextTierThreshold: 1750,
  },
  silver: { 
    icon: Medal, 
    label: 'Silver Explorer', 
    color: 'text-gray-400',
    cashbackRate: 7,
    nextTier: 'Gold Explorer',
    nextTierThreshold: 3500,
  },
  gold: { 
    icon: Crown, 
    label: 'Gold Explorer', 
    color: 'text-yellow-500',
    cashbackRate: 10,
    nextTier: 'Platinum Explorer',
    nextTierThreshold: 7000,
  },
  platinum: { 
    icon: Gem, 
    label: 'Platinum Explorer', 
    color: 'text-purple-500',
    cashbackRate: 15,
    nextTier: null,
    nextTierThreshold: 0,
  },
};

const isCredit = (type: string | null) => 
  ['earned', 'bonus', 'referral', 'voucher', 'topup'].includes(type || '');

export const LoyaltySection: React.FC<LoyaltySectionProps> = ({ loyalty }) => {
  const { user } = useAuth();
  const { currency, t, language } = useLanguage();
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  
  const locale = getDateLocale(language);
  
  const totalSpent = loyalty?.total_spent || 0;
  const balance = loyalty?.mobile11_money_balance || 0;
  
  // Calculate the CORRECT tier based on total_spent (in case DB is stale)
  const calculateCorrectTier = (spent: number): string => {
    if (spent >= 7000) return 'platinum';
    if (spent >= 3500) return 'gold';
    if (spent >= 1750) return 'silver';
    return 'explorer';
  };
  
  const correctTier = calculateCorrectTier(totalSpent);
  const tierInfo = tierConfig[correctTier] || tierConfig.explorer;
  const TierIcon = tierInfo.icon;
  
  // Calculate progress to next tier using correct tier
  const currentThreshold = correctTier === 'platinum' ? 7000 : (correctTier === 'gold' ? 3500 : (correctTier === 'silver' ? 1750 : 0));
  const nextThreshold = tierInfo.nextTierThreshold;
  const progress = nextThreshold > 0 
    ? Math.min(100, ((totalSpent - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;
  const amountToNextTier = nextThreshold > 0 ? Math.max(0, nextThreshold - totalSpent) : 0;

  // Helper function for transaction labels
  const getTransactionLabel = (type: string | null) => {
    switch (type) {
      case 'earned': return t('profile.loyalty.purchaseReward');
      case 'redeemed': return t('profile.loyalty.moneySpent');
      case 'redemption': return t('profile.loyalty.moneySpent');
      case 'bonus': return t('profile.loyalty.bonusReward');
      case 'voucher': return t('profile.loyalty.voucherRedeemed');
      case 'topup': return t('profile.loyalty.topUpAdded') || 'Top-up Added';
      case 'referral': return t('profile.loyalty.referralBonus');
      default: return t('profile.loyalty.transaction');
    }
  };

  // Fetch transactions with order dates
  const { data: transactions = [] } = useQuery({
    queryKey: ['loyalty-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('mobile11_money_transactions')
        .select(`
          *,
          orders:order_id (
            created_at
          )
        `)
        .eq('user_id', user.id)
        .limit(50);
      if (error) throw error;
      
      // Filter out zero-amount transactions (invalid cashback entries)
      const filteredData = data.filter(tx => tx.amount !== 0);
      
      // Sort by order date (actual purchase date), not transaction creation date
      const sortedData = [...filteredData].sort((a, b) => {
        const dateA = (a as any).orders?.created_at || a.created_at;
        const dateB = (b as any).orders?.created_at || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      return sortedData;
    },
    enabled: !!user?.id,
  });

  const displayedTransactions = transactions.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('profile.loyalty.title')}</h2>
        
        {/* Balance and Membership Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Balance Card */}
          <div className="bg-orange-50 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm text-gray-600 mb-1">{t('profile.loyalty.balance')}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  {tierInfo.cashbackRate}% {t('profile.loyalty.cashback')}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center justify-center">
                      <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="bottom" 
                    className="w-72 bg-white text-gray-700 p-3 text-xs leading-relaxed shadow-lg border"
                  >
                    <p className="whitespace-pre-line">
                      {t('profile.loyalty.balancePolicy').replace(
                        '{expirationDate}', 
                        loyalty?.balance_expires_at 
                          ? new Date(loyalty.balance_expires_at).toLocaleDateString(locale, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })
                          : '-'
                      )}
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {currency === 'THB' 
                  ? `฿ ${Math.round(balance)}` 
                  : `$ ${convertThbToUsd(balance).toFixed(2)}`}
              </p>
            </div>
            {/* Coins Illustration */}
            <div className="absolute bottom-2 right-2 opacity-20">
              <Coins className="w-20 h-20 text-orange-500" />
            </div>
          </div>

          {/* Membership Level Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">{t('profile.loyalty.membershipLevel')}</p>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                loyalty?.tier === 'platinum' ? 'bg-purple-500' :
                loyalty?.tier === 'gold' ? 'bg-yellow-500' :
                loyalty?.tier === 'silver' ? 'bg-gray-400' : 'bg-orange-500'
              )}>
                <TierIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <p className={cn("text-xl font-bold mb-2", tierInfo.color)}>
              {tierInfo.label}
            </p>
            
            <div className="flex items-baseline gap-1 text-gray-600 text-sm mb-1">
              <span>
                {currency === 'THB' 
                  ? `฿ ${Math.round(totalSpent)}` 
                  : `$ ${convertThbToUsd(totalSpent).toFixed(2)}`}
              </span>
              {tierInfo.nextTier && (
                <>
                  <span>/</span>
                  <span>
                    {currency === 'THB' 
                      ? `฿ ${Math.round(nextThreshold)}` 
                      : `$ ${convertThbToUsd(nextThreshold).toFixed(2)}`}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">{t('profile.loyalty.totalEarned')}</p>
            
            <Progress value={progress} className="h-2 mb-2" />
            
            {tierInfo.nextTier && (
              <p className="text-xs text-gray-500">
                {t('profile.loyalty.earnToNextTier')
                  .replace('{amount}', currency === 'THB' 
                    ? `฿${Math.round(amountToNextTier)}` 
                    : `$${convertThbToUsd(amountToNextTier).toFixed(2)}`)
                  .replace('{tier}', tierInfo.nextTier)}
              </p>
            )}
          </div>
        </div>

        {/* Voucher Redemption */}
        <div className="border-t border-gray-100 pt-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">
            {t('profile.loyalty.voucherTitle')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('profile.loyalty.voucherDescription')}
          </p>
          <Button 
            className="rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800"
            onClick={() => setVoucherModalOpen(true)}
          >
            {t('profile.loyalty.redeemVoucher')}
          </Button>
        </div>

        {/* Transaction History */}
        <div className="border-t border-gray-100 pt-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t('profile.loyalty.transactionHistory')}
          </h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('profile.loyalty.noTransactions')}</p>
            </div>
          ) : (
            <div>
              {displayedTransactions.map((tx) => {
                // Use order date if available, otherwise fall back to transaction date
                const displayDate = (tx as any).orders?.created_at || tx.created_at;
                
                return (
                  <div 
                    key={tx.id}
                    className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0"
                  >
                    {/* Colored dot indicator */}
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1.5 flex-shrink-0",
                      isCredit(tx.type) ? "bg-green-600" : "bg-red-600"
                    )} />
                    
                    {/* Label and date */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {getTransactionLabel(tx.type)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(displayDate!).toLocaleDateString(locale, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    
                    {/* Amount with + or - prefix - matches Airalo format */}
                    <span className={cn(
                      "font-semibold whitespace-nowrap",
                      isCredit(tx.type) ? "text-green-700" : "text-red-700"
                    )}>
                      {isCredit(tx.type) ? '+ ' : '- '}
                      {currency === 'THB' 
                        ? `THB ฿${Math.abs(tx.amount).toFixed(2)}` 
                        : `USD $${(Math.abs(tx.amount) / 35).toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
              
              {/* Show more button */}
              {transactions.length > 4 && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="rounded-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    onClick={() => setTransactionModalOpen(true)}
                  >
                    {t('profile.loyalty.showMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Earn Mobile11 Money Section */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-semibold text-gray-900 mb-6">
            {t('profile.loyalty.earnTitle')}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-orange-50 rounded-2xl">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-orange-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {t('profile.loyalty.earnCashback')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('profile.loyalty.earnCashbackDesc')}
              </p>
            </div>
            
            <div className="text-center p-6 bg-yellow-50 rounded-2xl">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {t('profile.loyalty.levelUp')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('profile.loyalty.levelUpDesc')}
              </p>
            </div>
            
            <div className="text-center p-6 bg-sky-50 rounded-2xl">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-sky-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {t('profile.loyalty.spendAnytime')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('profile.loyalty.spendAnytimeDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Modal */}
      <RedeemVoucherModal
        open={voucherModalOpen}
        onOpenChange={setVoucherModalOpen}
      />

      {/* Transaction History Modal */}
      <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <DialogContent className="bg-white sm:max-w-md max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t('profile.loyalty.transactionHistory')}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-6 pb-6">
            {transactions.map((tx) => {
              const displayDate = (tx as any).orders?.created_at || tx.created_at;
              
              return (
                <div 
                  key={tx.id}
                  className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0"
                >
                  {/* Colored dot indicator */}
                  <div className={cn(
                    "w-3 h-3 rounded-full mt-1.5 flex-shrink-0",
                    isCredit(tx.type) ? "bg-green-600" : "bg-red-600"
                  )} />
                  
                  {/* Label and date */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {getTransactionLabel(tx.type)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(displayDate!).toLocaleDateString(locale, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  {/* Amount */}
                  <span className={cn(
                    "font-semibold whitespace-nowrap",
                    isCredit(tx.type) ? "text-green-700" : "text-red-700"
                  )}>
                    {isCredit(tx.type) ? '+ ' : '- '}
                    {currency === 'THB' 
                      ? `THB ฿${Math.abs(tx.amount).toFixed(2)}` 
                      : `USD $${(Math.abs(tx.amount) / 35).toFixed(2)}`}
                  </span>
                </div>
              );
            })}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};