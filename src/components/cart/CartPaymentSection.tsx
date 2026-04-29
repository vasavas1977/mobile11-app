import { useState, useEffect } from 'react';
import { CreditCard, Loader2, Wallet, ChevronRight, QrCode, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Mobile11MoneyDialog } from './Mobile11MoneyDialog';

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  name: string;
  isDefault: boolean;
}

export type PaymentMethod = 'saved_card' | 'new_card' | 'mobile11_money' | 'qr_code' | 'truemoney';

interface CartPaymentSectionProps {
  selectedMethod: PaymentMethod;
  selectedCardId: string | null;
  onMethodChange: (method: PaymentMethod) => void;
  onCardSelect: (cardId: string) => void;
  cartTotal?: number;
  mobile11MoneyApplied?: number;
  onApplyMobile11Money?: (amount: number) => void;
  onRemoveMobile11Money?: () => void;
  onApplyPromoCode?: (code: string) => void;
  existingPromoCode?: string;
  // Promo state from parent
  promoApplied?: boolean;
  promoDiscount?: number;
  onRemovePromoCode?: () => void;
  currency?: 'USD' | 'THB';
  // Promo validation state
  promoError?: string | null;
  promoValidating?: boolean;
  isTopupCodeError?: boolean;
}

const CardBrandIcon = ({ brand }: { brand: string }) => {
  const brandLower = brand.toLowerCase();
  
  const brandColors: Record<string, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    discover: '#FF6000',
    jcb: '#0E4C96',
    unionpay: '#D32029',
  };

  return (
    <div 
      className="w-10 h-6 rounded flex items-center justify-center text-xs font-bold text-white uppercase"
      style={{ backgroundColor: brandColors[brandLower] || '#6B7280' }}
    >
      {brand.slice(0, 4)}
    </div>
  );
};

export function CartPaymentSection({
  selectedMethod,
  selectedCardId,
  onMethodChange,
  onCardSelect,
  cartTotal = 0,
  mobile11MoneyApplied = 0,
  onApplyMobile11Money,
  onRemoveMobile11Money,
  onApplyPromoCode,
  existingPromoCode,
  promoApplied = false,
  promoDiscount = 0,
  onRemovePromoCode,
  currency,
  promoError,
  promoValidating = false,
  isTopupCodeError = false,
}: CartPaymentSectionProps) {
  const { user } = useAuth();
  const { t, formatPrice } = useLanguage();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobile11MoneyDialogOpen, setMobile11MoneyDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('list-payment-methods', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      setCards(data?.cards || []);

      // Auto-select default card ONLY on initial mount, not after user interaction
      // The selectedMethod === 'new_card' check prevents overwriting explicit user selections (like 'qr_code')
      if (data?.cards?.length > 0 && !selectedCardId && selectedMethod === 'new_card') {
        const defaultCard = data.cards.find((c: SavedCard) => c.isDefault);
        if (defaultCard) {
          onCardSelect(defaultCard.id);
          onMethodChange('saved_card');
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatExpiry = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  };

  const handleMobile11MoneyClick = () => {
    setMobile11MoneyDialogOpen(true);
  };

  const handleApplyMoney = (amount: number) => {
    if (onApplyMobile11Money) {
      onApplyMobile11Money(amount);
    }
  };

  const handleApplyCode = (code: string) => {
    if (onApplyPromoCode) {
      onApplyPromoCode(code);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('cart.payWith') || 'Pay with'}
        </h2>

        {/* Saved Cards Section */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : cards.length > 0 && (
          <>
            {/* Section Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">
                  {t('cart.payWithSavedCard') || 'Pay with saved card'}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {cards.map((card) => (
                <label
                  key={card.id}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                    selectedMethod === 'saved_card' && selectedCardId === card.id
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onMethodChange('saved_card');
                    onCardSelect(card.id);
                  }}
                >
                  <CardBrandIcon brand={card.brand} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      •••• •••• •••• {card.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('cart.expires') || 'Expires'} {formatExpiry(card.exp_month, card.exp_year)}
                    </p>
                  </div>
                  {selectedMethod === 'saved_card' && selectedCardId === card.id ? (
                    <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                </label>
              ))}
            </div>
          </>
        )}

        {/* Section Divider for New Card */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-500">
              {t('cart.payWithNewCard') || 'Pay with credit card'}
            </span>
          </div>
        </div>

        {/* Pay with Credit Card Option - Radio selection */}
        <button
          type="button"
          onClick={() => onMethodChange('new_card')}
          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border w-full mb-4 ${
            selectedMethod === 'new_card'
              ? 'border-orange-500 bg-orange-50 shadow-sm'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 text-sm">
              {t('cart.addNewCard') || 'Pay with credit card'}
            </p>
            <p className="text-xs text-gray-500">
              {t('cart.supportedCards') || 'Visa, Mastercard, AMEX, JCB'}
            </p>
          </div>
          {selectedMethod === 'new_card' ? (
            <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
          )}
        </button>

        {/* Pay with QR Code Section - Only show for THB */}
        {currency === 'THB' && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">
                  {t('cart.payWithQRCode') || 'Pay with QR code'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onMethodChange('qr_code')}
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border w-full mb-4 ${
                selectedMethod === 'qr_code'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 text-sm">
                  {t('cart.payWithQR') || 'Pay with QR code'}
                </p>
                <p className="text-xs text-gray-500">
                  PromptPay, Mobile Banking
                </p>
              </div>
              {selectedMethod === 'qr_code' ? (
                <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
            </button>
          </>
        )}

        {/* TrueMoney e-Wallet Section */}
        {currency === 'THB' && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">
                  {t('cart.payWithTrueMoney') || 'Pay with TrueMoney'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onMethodChange('truemoney')}
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border w-full mb-4 ${
                selectedMethod === 'truemoney'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 text-sm">
                  TrueMoney Wallet
                </p>
                <p className="text-xs text-gray-500">
                  TrueMoney e-Wallet
                </p>
              </div>
              {selectedMethod === 'truemoney' ? (
                <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
            </button>
          </>
        )}

        {/* Section Divider for Mobile11 Money */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-500">
              {t('cart.mobile11MoneyOrCode') || 'Mobile11 Money or code'}
            </span>
          </div>
        </div>

        {/* Applied Mobile11 Money Summary */}
        {mobile11MoneyApplied > 0 ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-orange-200 shadow-sm">
            <div>
              <p className="text-lg font-bold text-gray-900">{formatPrice(mobile11MoneyApplied)}</p>
              <p className="text-sm text-gray-500">{t('cart.usedMobile11Money') || 'Used Mobile11 Money'}</p>
            </div>
            <button
              type="button"
              onClick={onRemoveMobile11Money}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              {t('cart.remove') || 'Remove'}
            </button>
          </div>
        ) : (
          /* Mobile11 Money Option - Opens Dialog */
          <button
            type="button"
            onClick={handleMobile11MoneyClick}
            className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border border-gray-200 hover:bg-gray-50 w-full"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 text-sm">
                {t('cart.useMobile11Money') || 'Use Mobile11 Money or code'}
              </p>
              <p className="text-xs text-gray-500">
                {t('cart.applyBalanceOrPromo') || 'Apply balance or promo code at checkout'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dialogs */}
      <Mobile11MoneyDialog
        open={mobile11MoneyDialogOpen}
        onOpenChange={setMobile11MoneyDialogOpen}
        onApplyMoney={handleApplyMoney}
        onApplyCode={handleApplyCode}
        cartTotal={cartTotal}
        existingPromoCode={existingPromoCode}
        isCodeApplied={promoApplied}
        onRemoveCode={onRemovePromoCode}
        appliedDiscount={promoDiscount}
        promoError={promoError}
        promoValidating={promoValidating}
        isTopupCodeError={isTopupCodeError}
      />
    </>
  );
}
