import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { XCircle, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { safeRedirectToPayment } from '@/lib/paymentRedirect';

export function PaymentCanceledPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [retryingPayment, setRetryingPayment] = useState(false);
  
  const orderId = searchParams.get('order_id');
  const parentOrderId = searchParams.get('parent_order_id');

  const retryPayment = async () => {
    const retryOrderId = orderId || parentOrderId;
    if (!retryOrderId) {
      navigate('/cart');
      return;
    }

    setRetryingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('retry-payment', {
        body: { orderId: retryOrderId, language }
      });

      if (error || !data?.success || !data?.checkoutUrl) {
        throw new Error(data?.error || 'Failed to create payment session');
      }

      safeRedirectToPayment(data.checkoutUrl);
    } catch (err: any) {
      console.error('[PaymentCanceled] Retry failed:', err);
      toast({
        title: t('common.error'),
        description: err.message || 'Payment retry failed',
        variant: 'destructive',
      });
      setRetryingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Canceled Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-50 rounded-full">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('paymentCanceled.title')}
            </h1>
            <p className="text-gray-600">
              {t('paymentCanceled.subtitle')}
            </p>
          </div>

          {/* Why Was Payment Canceled */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('paymentCanceled.whyTitle')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>{t('paymentCanceled.reasons.closed')}</li>
              <li>{t('paymentCanceled.reasons.declined')}</li>
              <li>{t('paymentCanceled.reasons.timeout')}</li>
              <li>{t('paymentCanceled.reasons.cancelled')}</li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('paymentCanceled.troubleshootingTitle')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>{t('paymentCanceled.troubleshootingTips.funds')}</li>
              <li>{t('paymentCanceled.troubleshootingTips.details')}</li>
              <li>{t('paymentCanceled.troubleshootingTips.contact')}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {(orderId || parentOrderId) && (
              <button
                onClick={retryPayment}
                disabled={retryingPayment}
                className="w-full h-11 px-8 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-full transition-colors text-sm"
              >
                {retryingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {t('paymentCanceled.tryAgain')}
              </button>
            )}
            
            <button
              onClick={() => navigate('/packages')}
              className="w-full h-11 px-8 inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-full transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('paymentCanceled.browsePackages')}
            </button>
          </div>
        </div>
      </div>
      
      <FooterAiralo />
    </div>
  );
}