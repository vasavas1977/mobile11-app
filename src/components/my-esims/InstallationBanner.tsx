import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InstallationBannerProps {
  isInstalled?: boolean;
}

export function InstallationBanner({ isInstalled = true }: InstallationBannerProps) {
  const { t } = useLanguage();
  
  if (!isInstalled) return null;
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-5 h-5 text-white" />
      </div>
      <p className="text-green-800 text-sm font-medium">
        {t('myEsims.esimInstalled')}
      </p>
    </div>
  );
}
