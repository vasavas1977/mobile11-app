import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, Ban, Pencil, ArrowUpDown, ArrowLeft, QrCode, Settings, X, Smartphone, Copy, ChevronDown, MessageCircle } from 'lucide-react';
import { ShareEsimOptions } from './ShareEsimOptions';
import { EsimQrCode } from './EsimQrCode';
import { detectDevice, DeviceInfo } from '@/lib/deviceDetection';
import { createAppleEsimUrl } from '@/lib/installationHelpers';
import { QRCodeSVG } from 'qrcode.react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type DialogStep = 'welcome' | 'methods' | 'share' | 'manual' | 'faq';

interface InstallEsimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    order_id: string;
    short_code?: string;
    qr_code?: string;
    smdp_address?: string;
    activation_code?: string;
    download_link?: string;
    esim_packages?: {
      country_name: string;
      data_amount: string;
      validity_days: number;
    };
  };
}

// Apple logo icon component
const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export function InstallEsimDialog({ open, onOpenChange, order }: InstallEsimDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState<DialogStep>('welcome');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(order.short_code || null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('installEsimFlow.copied'),
        description: label,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate short_code on demand if missing
  const ensureShortCode = useCallback(async () => {
    if (shortCode || generatingCode) return;
    setGeneratingCode(true);
    try {
      // Generate a short code
      const { data: code, error: codeErr } = await supabase.rpc('generate_order_short_code');
      if (codeErr || !code) throw codeErr;
      
      // Save it to the order
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ short_code: code })
        .eq('id', order.id);
      if (updateErr) throw updateErr;
      
      setShortCode(code);
    } catch (err) {
      console.error('Failed to generate short code:', err);
    } finally {
      setGeneratingCode(false);
    }
  }, [shortCode, generatingCode, order.id]);

  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  // When navigating to share step, ensure short code exists
  useEffect(() => {
    if (step === 'share') {
      ensureShortCode();
    }
  }, [step, ensureShortCode]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setStep('welcome'), 300);
  };

  const handleDirectInstall = () => {
    if (order.download_link) {
      const appleEsimUrl = createAppleEsimUrl(order.download_link);
      window.open(appleEsimUrl, '_blank');
    }
  };

  const tips = [
    { icon: Wifi, text: t('installEsimFlow.tips.stayConnected') },
    { icon: Ban, text: t('installEsimFlow.tips.dontExit') },
    { icon: Pencil, text: t('installEsimFlow.tips.uniqueLabel') },
    { icon: ArrowUpDown, text: t('installEsimFlow.tips.chooseForData') },
  ];

  const esimName = order.esim_packages?.country_name || 'eSIM';
  const baseUrl = window.location.origin;
  const shareUrl = shortCode ? `${baseUrl}/install/${shortCode}` : (order.download_link || order.qr_code || '');
  const showDirectInstall = deviceInfo?.supportsOneClick && order.download_link;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[#FAF7F2] border-0 rounded-2xl max-h-[90vh] overflow-y-auto">
        {step === 'welcome' && (
          <div className="p-6">
            {/* Close button */}
            <button 
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Illustration */}
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                <QrCode className="w-16 h-16 text-orange-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {t('installEsimFlow.title')}
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              {t('installEsimFlow.subtitle')}
            </p>

            {/* Tips section */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <p className="font-semibold text-gray-800 text-sm mb-3">
                {t('installEsimFlow.avoidIssues')}
              </p>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <tip.icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-gray-700 text-sm">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* View options button */}
            <Button 
              onClick={() => setStep('methods')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl"
            >
              {t('installEsimFlow.viewOptions')}
            </Button>
          </div>
        )}

        {step === 'methods' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setStep('welcome')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1">
                {t('installEsimFlow.installationMethods')}
              </h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Installation Card - iOS 17.4+ only */}
            {showDirectInstall && (
              <div className="bg-white rounded-xl p-5 mb-4 shadow-sm border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <AppleIcon className="w-5 h-5 text-gray-800" />
                  <h3 className="font-semibold text-gray-800">
                    {t('installEsimFlow.directInstallation')}
                  </h3>
                  <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    {t('installEsimFlow.recommended')}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {t('installEsimFlow.directInstallDescription')}
                </p>
                
                <Button 
                  onClick={handleDirectInstall}
                  className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {t('installEsimFlow.installEsimButton')}
                </Button>
              </div>
            )}

            {/* QR Code Installation Card */}
            <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">
                  {t('installEsimFlow.qrCodeInstallation')}
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {t('installEsimFlow.qrCodeDescription')}
              </p>
              
              {/* QR Code */}
              <div className="flex justify-center mb-4">
              {(order.download_link || order.qr_code) ? (
                <div className="bg-white p-3 rounded-lg">
                  <EsimQrCode
                    qrCode={order.qr_code}
                    downloadLink={order.download_link}
                    size={200}
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              )}
              </div>
              
              <p className="text-gray-500 text-xs text-center mb-4">
                {t('installEsimFlow.scanQrHint')}
              </p>
              
              <Button 
                onClick={() => setStep('share')}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
              >
                {t('installEsimFlow.shareEsim')}
              </Button>
            </div>

            {/* Manual Installation Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">
                  {t('installEsimFlow.manualInstallation')}
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {t('installEsimFlow.manualDescription')}
              </p>
              
              <Button 
                onClick={() => setStep('manual')}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
              >
                {t('installEsimFlow.viewInstructions')}
              </Button>
            </div>
          </div>
        )}

        {step === 'share' && (
          <ShareEsimOptions
            qrCodeUrl={order.qr_code || ''}
            downloadLink={shareUrl}
            esimName={esimName}
            onBack={() => setStep('methods')}
            onClose={handleClose}
          />
        )}

        {step === 'manual' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setStep('methods')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1">
                {t('installEsimFlow.manualInstructions')}
              </h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SM-DP+ Address and Activation Code */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
              {/* SM-DP+ Address */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-sm mb-1">{t('installEsimFlow.smdpAddress')}</p>
                    <p className="text-gray-800 font-medium text-sm break-all">
                      {order.smdp_address || t('installEsimFlow.notAvailable')}
                    </p>
                  </div>
                  {order.smdp_address && (
                    <button
                      onClick={() => handleCopy(order.smdp_address!, t('installEsimFlow.smdpAddress'))}
                      className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Copy className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Activation Code */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-sm mb-1">{t('installEsimFlow.activationCode')}</p>
                    <p className="text-gray-800 font-medium text-sm break-all font-mono">
                      {order.activation_code || t('installEsimFlow.notAvailable')}
                    </p>
                  </div>
                  {order.activation_code && (
                    <button
                      onClick={() => handleCopy(order.activation_code!, t('installEsimFlow.activationCode'))}
                      className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Copy className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Step-by-step Instructions */}
            <div className="space-y-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map((stepNum) => (
                <p key={stepNum} className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-semibold">{stepNum}.</span>{' '}
                  {t(`installEsimFlow.manualSteps.step${stepNum}`)}
                </p>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-gray-600 text-sm mb-4">
                {t('installEsimFlow.faqDescription')}
              </p>
              <Button 
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                onClick={() => setStep('faq')}
              >
                {t('installEsimFlow.needMoreHelp')}
              </Button>
            </div>
          </div>
        )}

        {step === 'faq' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setStep('manual')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1">
                {t('installEsimFlow.faqTitle')}
              </h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FAQ Accordion */}
            <Accordion type="single" collapsible className="space-y-3 mb-6">
              {[1, 2, 3, 4, 5].map((faqNum) => (
                <AccordionItem 
                  key={faqNum} 
                  value={`faq-${faqNum}`}
                  className="bg-white rounded-xl border-0 shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-4 hover:no-underline text-left text-gray-800 font-medium text-sm [&[data-state=open]>svg]:rotate-180">
                    {t(`howToConnect.faq${faqNum}Title`)}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                    {t(`howToConnect.faq${faqNum}Content`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Need More Help Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                {t('howToConnect.needMoreHelp')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('howToConnect.needMoreHelpDescription')}
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                  onClick={() => window.open('/help', '_blank')}
                >
                  {t('howToConnect.goToHelpCenter')}
                </Button>
                <Button 
                  className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                  onClick={() => window.open('/help/contact', '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('howToConnect.contactSupport')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}