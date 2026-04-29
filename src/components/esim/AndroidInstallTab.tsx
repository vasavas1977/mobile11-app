import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstallationStep } from './InstallationStep';
import { Smartphone, QrCode, Download, Copy, CheckCircle, Settings } from 'lucide-react';
import { downloadQRCode } from '@/lib/installationHelpers';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface AndroidInstallTabProps {
  qrCode: string;
  downloadLink: string;
  orderId: string;
  onCopy: (text: string, label: string) => void;
}

export function AndroidInstallTab({ qrCode, downloadLink, orderId, onCopy }: AndroidInstallTabProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Compatibility Info */}
      <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong>{t('esim.installDialog.android.compatible')}</strong>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>{t('esim.installDialog.android.deviceList.samsung')}</li>
            <li>{t('esim.installDialog.android.deviceList.pixel')}</li>
            <li>{t('esim.installDialog.android.deviceList.oneplus')}</li>
            <li>{t('esim.installDialog.android.deviceList.others')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* QR Code Display */}
      <div className="text-center p-6 bg-muted/30 rounded-lg border">
        <div className="bg-white p-6 rounded-lg mb-4 inline-block shadow-md border-2">
          <img 
            src={qrCode}
            alt="eSIM QR Code"
            className="w-48 h-48"
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-4">
          {t('esim.installDialog.android.scanQr')}
        </p>
        
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant="outline"
            onClick={() => downloadQRCode(
              qrCode,
              orderId,
              (message) => toast({ title: t('esim.installDialog.toast.success'), description: t('esim.installDialog.toast.qrDownloaded') }),
              () => toast({ title: t('esim.installDialog.toast.openedInTab'), description: t('esim.installDialog.toast.saveFromTab') })
            )}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('esim.installDialog.android.downloadQr')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => onCopy(downloadLink, 'Installation Code')}
          >
            <Copy className="h-4 w-4 mr-2" />
            {t('esim.installDialog.android.copyCode')}
          </Button>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">{t('esim.installDialog.android.stepsTitle')}</h4>
        
        <InstallationStep
          stepNumber={1}
          title={t('esim.installDialog.android.steps.step1.title')}
          description={t('esim.installDialog.android.steps.step1.description')}
          icon={<Settings className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={2}
          title={t('esim.installDialog.android.steps.step2.title')}
          description={t('esim.installDialog.android.steps.step2.description')}
          icon={<Smartphone className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={3}
          title={t('esim.installDialog.android.steps.step3.title')}
          description={t('esim.installDialog.android.steps.step3.description')}
          icon={<Smartphone className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={4}
          title={t('esim.installDialog.android.steps.step4.title')}
          description={t('esim.installDialog.android.steps.step4.description')}
          icon={<QrCode className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={5}
          title={t('esim.installDialog.android.steps.step5.title')}
          description={t('esim.installDialog.android.steps.step5.description')}
          icon={<Download className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={6}
          title={t('esim.installDialog.android.steps.step6.title')}
          description={t('esim.installDialog.android.steps.step6.description')}
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      {/* Device-Specific Help */}
      <Alert className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <AlertDescription>
          <strong>{t('esim.installDialog.android.cantFind')}</strong>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li><strong>Samsung:</strong> {t('esim.installDialog.android.deviceTips.samsung').replace('Samsung: ', '')}</li>
            <li><strong>Google Pixel:</strong> {t('esim.installDialog.android.deviceTips.pixel').replace('Google Pixel: ', '')}</li>
            <li><strong>OnePlus:</strong> {t('esim.installDialog.android.deviceTips.oneplus').replace('OnePlus: ', '')}</li>
            <li>{t('esim.installDialog.android.deviceTips.check')}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
