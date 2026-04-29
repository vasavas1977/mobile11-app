import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Mail, QrCode, FileText, BookOpen, Copy, Check } from 'lucide-react';

interface OrderFlowProps {
  userData: {
    email?: string;
  };
  onNavigateToStep: (step: string, data?: any) => void;
  onUpdateData: (data: any) => void;
}

type OrderStep = 'identify' | 'order-details' | 'manual-install';

export function OrderFlow({ userData, onNavigateToStep, onUpdateData }: OrderFlowProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<OrderStep>('identify');
  const [email, setEmail] = useState(userData.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    // Simulate lookup
    await new Promise(r => setTimeout(r, 1000));
    onUpdateData({ email });
    
    // Mock order data
    setOrderData({
      orderId: 'ORD-2024-ABC123',
      destination: 'Japan',
      package: 'Limitless 7 Days',
      status: 'Active',
      purchaseDate: '2024-01-15',
      qrCode: 'data:image/png;base64,mock',
      smdpAddress: 'lpa.example.com',
      activationCode: 'ABC123XYZ789',
    });
    
    setStep('order-details');
    setIsLoading(false);
  };

  const handleResendQR = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setResendSuccess(true);
    setIsLoading(false);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (step === 'identify') {
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-800 mb-4">
            {t('chatbot.order.findOrder')}
          </p>
          
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              {t('chatbot.order.enterEmail')}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('chatbot.checkout.emailPlaceholder')}
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 
                       rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <button
              onClick={handleEmailSubmit}
              disabled={!email || isLoading}
              className="w-full px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl
                       hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('cart.findOrder')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'order-details') {
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">
              {t('chatbot.order.latestOrder')}
            </h3>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {orderData?.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-medium text-gray-800">{orderData?.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('chatbot.order.destination')}:</span>
              <span className="font-medium text-gray-800">{orderData?.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('chatbot.order.package')}:</span>
              <span className="font-medium text-gray-800">{orderData?.package}</span>
            </div>
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-2 mb-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                {t('chatbot.order.qrSent')}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResendQR}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {t('chatbot.order.resendQr')}
            </button>
            <button
              onClick={() => setStep('manual-install')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              {t('chatbot.order.manualInstall')}
            </button>
            <button
              onClick={() => window.open('/invoice/' + orderData?.orderId, '_blank')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <FileText className="h-4 w-4" />
              {t('chatbot.order.viewInvoice')}
            </button>
            <button
              onClick={() => onNavigateToStep('install')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              {t('chatbot.order.installGuide')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'manual-install') {
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="font-medium text-gray-800 mb-3">
            {t('chatbot.order.manualDetails')}
          </h3>
          
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{t('chatbot.order.smdpAddress')}</span>
                <button
                  onClick={() => handleCopy('smdp', orderData?.smdpAddress)}
                  className="text-orange-500 hover:text-orange-600 transition-colors"
                >
                  {copiedField === 'smdp' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <code className="text-sm text-gray-800 break-all">{orderData?.smdpAddress}</code>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{t('chatbot.order.activationCode')}</span>
                <button
                  onClick={() => handleCopy('code', orderData?.activationCode)}
                  className="text-orange-500 hover:text-orange-600 transition-colors"
                >
                  {copiedField === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <code className="text-sm text-gray-800 break-all">{orderData?.activationCode}</code>
            </div>
          </div>

          <button
            onClick={() => setStep('order-details')}
            className="w-full mt-3 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            {t('chatbot.order.back')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
