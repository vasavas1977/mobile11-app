import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstallationStep } from './InstallationStep';
import { Smartphone, Wifi, CheckCircle, Settings, Zap, Clock, Copy, Link, ExternalLink } from 'lucide-react';
import { createAppleEsimUrl } from '@/lib/installationHelpers';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickInstallTabProps {
  downloadLink: string;
}

export function QuickInstallTab({ downloadLink }: QuickInstallTabProps) {
  const { t } = useLanguage();
  const appleEsimUrl = useMemo(() => createAppleEsimUrl(downloadLink), [downloadLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appleEsimUrl);
    toast.success(t('esim.quickInstall.linkCopied'));
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
          {t('esim.installDialog.quick.title')}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t('esim.installDialog.quick.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t('esim.installDialog.quick.estimatedTime')}</span>
        </div>
      </div>

      {/* Compatibility Check */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>{t('esim.installDialog.quick.compatibilityTitle')}</strong>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>{t('esim.installDialog.quick.requirements.device')}</li>
            <li>{t('esim.installDialog.quick.requirements.ios')}</li>
            <li>{t('esim.installDialog.quick.requirements.wifi')}</li>
            <li>{t('esim.installDialog.quick.requirements.carrier')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Installation Steps */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">{t('esim.installDialog.quick.stepsTitle')}</h4>
        
        <InstallationStep
          stepNumber={1}
          title={t('esim.installDialog.quick.steps.step1.title')}
          description={t('esim.installDialog.quick.steps.step1.description')}
          icon={<Wifi className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={2}
          title={t('esim.installDialog.quick.steps.step2.title')}
          description={t('esim.installDialog.quick.steps.step2.description')}
          icon={<Smartphone className="h-4 w-4" />}
        />

        <div className="my-4 space-y-3">
          <Button 
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            onClick={() => window.open(appleEsimUrl, '_blank')}
          >
            <Zap className="h-5 w-5 mr-2" />
            {t('esim.installDialog.quick.installButton')}
          </Button>

          {/* Installation Link Section */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('esim.quickInstall.installationLink')}</span>
            </div>
            
            <a 
              href={appleEsimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline break-all block mb-3"
            >
              {appleEsimUrl}
              <ExternalLink className="h-3 w-3 inline-block ml-1" />
            </a>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('esim.quickInstall.copyLinkToShare')}
            </Button>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('esim.quickInstall.shareNote')}
            </p>
          </div>
        </div>

        <InstallationStep
          stepNumber={3}
          title={t('esim.installDialog.quick.steps.step3.title')}
          description={t('esim.installDialog.quick.steps.step3.description')}
          icon={<Smartphone className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={4}
          title={t('esim.installDialog.quick.steps.step4.title')}
          description={t('esim.installDialog.quick.steps.step4.description')}
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      {/* Troubleshooting Note */}
      <Alert>
        <AlertDescription>
          <strong>{t('esim.installDialog.quick.notWorking').split('?')[0]}?</strong> {t('esim.installDialog.quick.notWorking').split('?')[1]}
        </AlertDescription>
      </Alert>
    </div>
  );
}
