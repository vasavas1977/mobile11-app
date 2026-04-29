import { ShieldAlert, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface KycVerificationBannerProps {
  carrier?: string;
}

// Detect if carrier is CMLink-family (CMHK, CTM, CMCC)
function isCmlinkCarrier(carrier?: string): boolean {
  if (!carrier) return false;
  const upper = carrier.toUpperCase();
  return upper.includes('CMHK') || upper.includes('CTM') || upper.includes('CMCC');
}

export function KycVerificationBanner({ carrier }: KycVerificationBannerProps) {
  const { t } = useLanguage();
  
  const cmlink = isCmlinkCarrier(carrier);
  
  const kycUrl = cmlink
    ? 'https://global.cmlink.com/en/real-name'
    : 'https://kyc.cloud.ais.th';
  
  const title = cmlink
    ? t('paymentSuccess.cmlinkRequired')
    : t('paymentSuccess.kycRequired');
  
  const description = cmlink
    ? t('paymentSuccess.cmlinkDescription')
    : t('paymentSuccess.kycDescription');
  
  const buttonText = cmlink
    ? t('paymentSuccess.cmlinkButtonText')
    : t('paymentSuccess.kycButtonText');
  
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-orange-800 text-lg mb-2">
            {title}
          </h3>
          <p className="text-orange-700 text-sm mb-4">
            {description}
          </p>
          <a
            href={kycUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {buttonText}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
