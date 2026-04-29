import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstallationStep } from './InstallationStep';
import { Smartphone, Wifi, QrCode, Settings, Download, Copy, CheckCircle } from 'lucide-react';
import { downloadQRCode } from '@/lib/installationHelpers';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManualInstallTabProps {
  qrCode: string;
  downloadLink: string;
  orderId: string;
  smdpAddress?: string;
  activationCode?: string;
  onCopy: (text: string, label: string) => void;
}

export function ManualInstallTab({ 
  qrCode, 
  downloadLink, 
  orderId, 
  smdpAddress, 
  activationCode,
  onCopy 
}: ManualInstallTabProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Compatibility Info */}
      <Alert className="border-primary/20 bg-primary/5">
        <CheckCircle className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>{t('esim.installDialog.manualIos.compatible').split(':')[0]}:</strong> {t('esim.installDialog.manualIos.compatible').split(':')[1]}
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
          {t('esim.installDialog.manualIos.scanQr')}
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
            {t('esim.installDialog.manualIos.downloadQr')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => onCopy(downloadLink, 'Installation Code')}
          >
            <Copy className="h-4 w-4 mr-2" />
            {t('esim.installDialog.manualIos.copyCode')}
          </Button>
        </div>
      </div>

      {/* Before You Start */}
      <Alert className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
        <AlertDescription>
          <strong>{t('esim.installDialog.manualIos.beforeStart')}</strong>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>{t('esim.installDialog.manualIos.beforeStartItems.wifi')}</li>
            <li>{t('esim.installDialog.manualIos.beforeStartItems.unlock')}</li>
            <li>{t('esim.installDialog.manualIos.beforeStartItems.closeApps')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Installation Steps */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">{t('esim.installDialog.manualIos.stepsTitle')}</h4>
        
        <InstallationStep
          stepNumber={1}
          title={t('esim.installDialog.manualIos.steps.step1.title')}
          description={t('esim.installDialog.manualIos.steps.step1.description')}
          icon={<Settings className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={2}
          title={t('esim.installDialog.manualIos.steps.step2.title')}
          description={t('esim.installDialog.manualIos.steps.step2.description')}
          icon={<Smartphone className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={3}
          title={t('esim.installDialog.manualIos.steps.step3.title')}
          description={t('esim.installDialog.manualIos.steps.step3.description')}
          icon={<Smartphone className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={4}
          title={t('esim.installDialog.manualIos.steps.step4.title')}
          description={t('esim.installDialog.manualIos.steps.step4.description')}
          icon={<QrCode className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={5}
          title={t('esim.installDialog.manualIos.steps.step5.title')}
          description={t('esim.installDialog.manualIos.steps.step5.description')}
          icon={<CheckCircle className="h-4 w-4" />}
        />

        <InstallationStep
          stepNumber={6}
          title={t('esim.installDialog.manualIos.steps.step6.title')}
          description={t('esim.installDialog.manualIos.steps.step6.description')}
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      {/* Manual Installation Code */}
      {(smdpAddress || activationCode) && (
        <Alert>
          <AlertDescription>
            <strong>{t('esim.installDialog.manualIos.cantScan')}</strong>
            <div className="mt-3 space-y-2">
              {smdpAddress && (
                <div>
                  <span className="text-xs font-medium">{t('esim.installDialog.manualIos.smdpAddress')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                      {smdpAddress}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onCopy(smdpAddress, 'SM-DP+ Address')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {activationCode && (
                <div>
                  <span className="text-xs font-medium">{t('esim.installDialog.manualIos.activationCode')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                      {activationCode}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onCopy(activationCode, 'Activation Code')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
