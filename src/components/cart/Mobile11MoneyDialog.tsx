import { useState, useEffect } from 'react';
import { Loader2, Coins, Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { convertThbToUsd } from '@/lib/currencyUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Mobile11MoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyMoney: (amount: number) => void;
  onApplyCode: (code: string) => void;
  cartTotal: number;
  existingPromoCode?: string;
  isCodeApplied?: boolean;
  onRemoveCode?: () => void;
  appliedDiscount?: number;
  promoError?: string | null;
  promoValidating?: boolean;
  isTopupCodeError?: boolean;
}

export function Mobile11MoneyDialog({
  open,
  onOpenChange,
  onApplyMoney,
  onApplyCode,
  cartTotal,
  existingPromoCode,
  isCodeApplied = false,
  onRemoveCode,
  appliedDiscount = 0,
  promoError,
  promoValidating = false,
  isTopupCodeError = false,
}: Mobile11MoneyDialogProps) {
  const { t, formatPrice } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'money' | 'code'>('money');
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [code, setCode] = useState(existingPromoCode || '');
  const [pendingValidation, setPendingValidation] = useState(false);

  // Safety timeout to prevent infinite "Validating..." spinner
  useEffect(() => {
    if (pendingValidation) {
      const timeout = setTimeout(() => {
        setPendingValidation(false);
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [pendingValidation]);

  useEffect(() => {
    if (open && user) {
      fetchBalance();
    }
  }, [open, user]);

  useEffect(() => {
    if (isCodeApplied && existingPromoCode) {
      setCode(existingPromoCode);
    } else if (!isCodeApplied) {
      setCode('');
    }
  }, [existingPromoCode, isCodeApplied]);

  // Close dialog only when validation succeeds (code applied, not validating, no error)
  useEffect(() => {
    if (pendingValidation && !promoValidating) {
      if (isCodeApplied && !promoError) {
        // Validation succeeded, close dialog
        onOpenChange(false);
        setPendingValidation(false);
      } else if (promoError) {
        // Validation failed, keep dialog open and stop pending state
        setPendingValidation(false);
      }
    }
  }, [pendingValidation, promoValidating, isCodeApplied, promoError, onOpenChange]);

  const fetchBalance = async () => {
    if (!user) return;
    
    setLoadingBalance(true);
    try {
      const { data, error } = await supabase
        .from('user_loyalty')
        .select('mobile11_money_balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching balance:', error);
      }
      
      setBalance(data?.mobile11_money_balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Balance is stored in THB, convert to USD for cart calculations
  const balanceInUsd = convertThbToUsd(balance);

  // Minimum remaining balance constants
  const MIN_REMAINING_USD = 1.00;
  const MIN_REMAINING_THB = 35;

  // Calculate maximum usable amount with $1 minimum remaining balance rule
  const calculateMaxUsable = () => {
    // If balance can fully cover the cart, allow it (free order)
    if (cartTotal <= balanceInUsd) {
      return cartTotal;
    }
    // If balance is at or below minimum, user can spend it all
    if (balanceInUsd <= MIN_REMAINING_USD) {
      return Math.min(balanceInUsd, cartTotal);
    }
    // Otherwise, keep minimum balance for partial payments
    const maxUsable = balanceInUsd - MIN_REMAINING_USD;
    return Math.min(maxUsable, cartTotal);
  };

  const maxUsableAmount = calculateMaxUsable();
  const remainingBalanceAfterUse = balanceInUsd - maxUsableAmount;

  const handleApplyMoney = () => {
    // Apply the calculated max usable amount (respecting $1 minimum remaining)
    onApplyMoney(maxUsableAmount);
    onOpenChange(false);
  };

  const handleApplyCode = async () => {
    if (!code.trim()) return;
    
    // Start pending validation - dialog will close via useEffect when validation succeeds
    setPendingValidation(true);
    onApplyCode(code.toUpperCase());
    // Don't close dialog here - wait for validation result
  };

  // Minimum threshold: $1.00 USD worth of balance to use Mobile11 Money
  const canApplyMoney = balanceInUsd >= 1;
  const amountToApply = maxUsableAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-0 bg-white">
        {/* Header */}
        <div className="relative p-6 pb-4" style={{ backgroundColor: '#FAF7F2' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              {t('cart.useMobile11MoneyTitle') || 'Use Mobile11 Money or Code'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 text-center mt-2">
              {t('cart.mobile11MoneyDescription') || 'You can either apply Mobile11 Money, a discount code, or a referral code to your purchase.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'money' | 'code')} className="w-full">
          <TabsList className="w-full rounded-none border-b border-gray-200 bg-white h-auto p-0 text-gray-900">
            <TabsTrigger 
              value="money" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-500 py-3 font-medium !text-gray-900 data-[state=active]:shadow-none"
            >
              {t('cart.mobile11Money') || 'Mobile11 Money'}
            </TabsTrigger>
            <TabsTrigger 
              value="code" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-500 py-3 font-medium !text-gray-900 data-[state=active]:shadow-none"
            >
              {t('cart.code') || 'Code'}
            </TabsTrigger>
          </TabsList>

          {/* Mobile11 Money Tab */}
          <TabsContent value="money" className="p-6 pt-4 m-0 bg-white">
            <div className="space-y-5">
              {/* Current Balance Display */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                {loadingBalance ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Coins className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{t('cart.currentBalance') || 'Current balance'}</p>
                      <p className="text-2xl font-bold text-gray-900">฿{balance.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">≈ ${balanceInUsd.toFixed(2)} USD</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Preview - Will Apply & New Balance */}
              {canApplyMoney && !loadingBalance && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    {/* Will Deduct */}
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 mb-1">{t('cart.willDeduct') || 'Will deduct'}</p>
                      <p className="text-lg font-bold text-green-600">-{formatPrice(amountToApply)}</p>
                    </div>
                    
                    {/* Divider */}
                    <div className="w-px h-10 bg-gray-300 mx-3" />
                    
                    {/* New Balance */}
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 mb-1">{t('cart.newBalance') || 'New balance'}</p>
                      <p className="text-lg font-bold text-gray-900">
                        ฿{(balance - (amountToApply * 35)).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        ≈ ${remainingBalanceAfterUse.toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                  
                  {/* Minimum balance notice */}
                  {balanceInUsd > MIN_REMAINING_USD && cartTotal > balanceInUsd && remainingBalanceAfterUse >= MIN_REMAINING_USD && (
                    <p className="text-xs text-amber-600 text-center mt-3 pt-3 border-t border-gray-200">
                      {t('cart.minBalanceKept') || `$${MIN_REMAINING_USD.toFixed(2)} (฿${MIN_REMAINING_THB}) minimum balance will be kept`}
                    </p>
                  )}
                </div>
              )}

              {!canApplyMoney && !loadingBalance && (
                <p className="text-sm text-gray-500 text-center">
                  {t('cart.minBalanceRequired') || 'Minimum $1.00 balance required'}
                </p>
              )}

              {/* Apply Button */}
              <Button
                onClick={handleApplyMoney}
                disabled={!canApplyMoney || loadingBalance}
                className="w-full py-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base disabled:bg-gray-200 disabled:text-gray-500"
              >
                {t('cart.applyMobile11Money') || 'Apply Mobile11 Money'}
              </Button>
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="p-6 pt-4 m-0 bg-white">
            <div className="space-y-5">
              {/* Code Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder={t('cart.applyDiscountOrReferral') || 'Apply discount or referral code'}
                    value={code}
                    disabled={isCodeApplied}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                    }}
                    className={`bg-white rounded-xl py-6 text-center text-lg font-medium uppercase text-gray-900 placeholder:text-gray-400 pr-10 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 focus:border-orange-500 ${
                      isCodeApplied ? 'border-green-500 bg-green-50' : promoError ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {isCodeApplied && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {promoError && !isCodeApplied && (
                  <p className="text-sm text-red-500 text-center">{promoError}</p>
                )}
                {isCodeApplied && appliedDiscount > 0 && (
                  <p className="text-sm text-green-600 text-center">
                    {t('checkout.youSave') || 'You save'} {formatPrice(appliedDiscount)}
                  </p>
                )}
              </div>

              {/* Enter Code or Remove Code Button */}
              {isCodeApplied ? (
                <Button
                  onClick={() => {
                    setCode(''); // Clear local state first
                    onRemoveCode?.(); // Then update context
                    onOpenChange(false); // Close dialog to ensure clean state
                  }}
                  variant="outline"
                  className="w-full py-6 rounded-full bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold text-base"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('cart.removeCode') || 'Remove Code'}
                </Button>
              ) : (
                <Button
                  onClick={handleApplyCode}
                  disabled={!code.trim() || promoValidating || pendingValidation}
                  className="w-full py-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {(promoValidating || pendingValidation) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('cart.validating') || 'Validating...'}
                    </>
                  ) : (
                    t('cart.enterCodeButton') || 'Enter code'
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
