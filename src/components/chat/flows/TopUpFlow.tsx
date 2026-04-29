import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Check } from 'lucide-react';

interface TopUpFlowProps {
  userData: {
    email?: string;
    selectedEsim?: string;
  };
  onNavigateToStep: (step: string, data?: any) => void;
  onUpdateData: (data: any) => void;
}

type TopUpStep = 'identify' | 'select-esim' | 'select-package' | 'confirm' | 'success';

const TOP_UP_OPTIONS = [
  { id: 'small', labelKey: 'small', data: '1GB', price: 5 },
  { id: 'medium', labelKey: 'medium', data: '3GB', price: 12 },
  { id: 'large', labelKey: 'large', data: '5GB', price: 18 },
];

export function TopUpFlow({ userData, onNavigateToStep, onUpdateData }: TopUpFlowProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<TopUpStep>('identify');
  const [email, setEmail] = useState(userData.email || '');
  const [orderId, setOrderId] = useState('');
  const [selectedEsim, setSelectedEsim] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    // Simulate lookup
    await new Promise(r => setTimeout(r, 1000));
    onUpdateData({ email });
    setStep('select-esim');
    setIsLoading(false);
  };

  const handleOrderIdSubmit = async () => {
    if (!orderId) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    onUpdateData({ orderId });
    setStep('select-esim');
    setIsLoading(false);
  };

  const handleSelectEsim = (esimId: string) => {
    setSelectedEsim(esimId);
    onUpdateData({ selectedEsim: esimId });
    setStep('select-package');
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setStep('success');
    setIsLoading(false);
  };

  if (step === 'identify') {
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-800 mb-4">
            {t('chatbot.topup.findEsim')}
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {t('chatbot.topup.email')}
              </label>
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
                className="w-full mt-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl
                         hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('chatbot.topup.findByEmail')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{t('chatbot.topup.or')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {t('chatbot.topup.orderId')}
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ORD-XXXXXX"
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 
                         rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <button
                onClick={handleOrderIdSubmit}
                disabled={!orderId || isLoading}
                className="w-full mt-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl
                         hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('chatbot.topup.findByOrderId')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'select-esim') {
    // Mock eSIM data
    const mockEsims = [
      { id: '1', destination: 'Japan', data: `3GB ${t('chatbot.topup.remaining')}`, expiry: `5 ${t('chatbot.topup.daysLeft')}` },
      { id: '2', destination: 'Korea', data: `1GB ${t('chatbot.topup.remaining')}`, expiry: `2 ${t('chatbot.topup.daysLeft')}` },
    ];

    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-800 mb-3">
            {t('chatbot.topup.selectEsim')}
          </p>
          <div className="space-y-2">
            {mockEsims.map((esim) => (
              <button
                key={esim.id}
                onClick={() => handleSelectEsim(esim.id)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-left
                         hover:bg-orange-50 hover:border-orange-300 transition-all"
              >
                <div className="font-medium text-sm text-gray-800">{esim.destination}</div>
                <div className="text-xs text-gray-500">{esim.data} • {esim.expiry}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'select-package') {
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-800 mb-3">
            {t('chatbot.topup.selectPackage')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TOP_UP_OPTIONS.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center
                         hover:bg-orange-50 hover:border-orange-300 transition-all"
              >
                <div className="font-bold text-lg text-gray-800">{pkg.data}</div>
                <div className="text-xs text-gray-500 capitalize">{pkg.labelKey}</div>
                <div className="text-sm font-medium text-orange-600 mt-1">${pkg.price}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const pkg = TOP_UP_OPTIONS.find(p => p.id === selectedPackage);
    
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-800 mb-3">
            {t('chatbot.topup.confirmTopup')}
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{pkg?.data}</span> top-up
            </div>
            <div className="text-lg font-bold text-orange-600">${pkg?.price}</div>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            ✅ {t('chatbot.topup.appliesToEsim')}
          </p>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-xl
                     hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('chatbot.topup.payNow')}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="p-4 bg-[#FAF7F2] min-h-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">
            {t('chatbot.topup.success')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('chatbot.topup.dataAdded')}
          </p>
          <p className="text-sm text-gray-700 mb-3">
            {t('chatbot.topup.haveInternet')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigateToStep('home')}
              className="flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors"
            >
              {t('chatbot.install.yes')}
            </button>
            <button
              onClick={() => onNavigateToStep('troubleshoot')}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              {t('chatbot.install.no')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
