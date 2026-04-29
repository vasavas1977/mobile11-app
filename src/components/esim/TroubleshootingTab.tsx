import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle, Signal, QrCode, HelpCircle, Phone, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface TroubleshootingTabProps {
  smdpAddress?: string;
  activationCode?: string;
  onCopy: (text: string, label: string) => void;
}

export function TroubleshootingTab({ smdpAddress, activationCode, onCopy }: TroubleshootingTabProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
        <h3 className="text-lg font-semibold mb-1">{t('esim.installDialog.troubleshooting.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('esim.installDialog.troubleshooting.subtitle')}
        </p>
      </div>

      {/* Common Issues */}
      <div className="space-y-4">
        {/* Issue 1 */}
        <Alert className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-red-900 dark:text-red-100">
                {t('esim.installDialog.troubleshooting.issues.unableToComplete.title')}
              </p>
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>{t('esim.installDialog.troubleshooting.issues.unableToComplete.solutions')}</strong>
              </p>
              <ul className="text-sm text-red-800 dark:text-red-200 list-disc list-inside space-y-1">
                <li>{t('esim.installDialog.troubleshooting.issues.unableToComplete.items.restart')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.unableToComplete.items.update')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.unableToComplete.items.carrierLock')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.unableToComplete.items.wifi')}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Issue 2 */}
        <Alert className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <QrCode className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-orange-900 dark:text-orange-100">
                {t('esim.installDialog.troubleshooting.issues.qrWontScan.title')}
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>{t('esim.installDialog.troubleshooting.issues.qrWontScan.solutions')}</strong>
              </p>
              <ul className="text-sm text-orange-800 dark:text-orange-200 list-disc list-inside space-y-1">
                <li>{t('esim.installDialog.troubleshooting.issues.qrWontScan.items.brightness')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.qrWontScan.items.anotherDevice')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.qrWontScan.items.manual')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.qrWontScan.items.cleanLens')}</li>
              </ul>
              
              {(smdpAddress || activationCode) && (
                <div className="mt-3 space-y-2 p-3 bg-background rounded border">
                  <p className="text-xs font-medium">{t('esim.installDialog.troubleshooting.issues.qrWontScan.manualCodes')}</p>
                  {smdpAddress && (
                    <div>
                      <span className="text-xs font-medium">{t('esim.installDialog.manualIos.smdpAddress')}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
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
                        <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
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
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Issue 3 */}
        <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <Signal className="h-5 w-5 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {t('esim.installDialog.troubleshooting.issues.noService.title')}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{t('esim.installDialog.troubleshooting.issues.noService.solutions')}</strong>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
                <li><strong>{t('esim.installDialog.troubleshooting.issues.noService.items.dataRoaming').split(' - ')[0]}</strong> - {t('esim.installDialog.troubleshooting.issues.noService.items.dataRoaming').split(' - ')[1]}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.noService.items.selectLine')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.noService.items.wait')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.noService.items.airplane')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.noService.items.restart')}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Issue 4 */}
        <Alert className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                {t('esim.installDialog.troubleshooting.issues.cantFindOption.title')}
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>{t('esim.installDialog.troubleshooting.issues.cantFindOption.reasons')}</strong>
              </p>
              <ul className="text-sm text-purple-800 dark:text-purple-200 list-disc list-inside space-y-1">
                <li>{t('esim.installDialog.troubleshooting.issues.cantFindOption.items.notSupported')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.cantFindOption.items.oldVersion')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.cantFindOption.items.carrierLocked')}</li>
                <li>{t('esim.installDialog.troubleshooting.issues.cantFindOption.items.disabledByCarrier')}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Important Notes */}
      <Alert>
        <AlertDescription>
          <strong>{t('esim.installDialog.troubleshooting.importantNotes.title')}</strong>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li><strong>{t('esim.installDialog.troubleshooting.importantNotes.oneTimeUse').split(':')[0]}:</strong> {t('esim.installDialog.troubleshooting.importantNotes.oneTimeUse').split(':')[1]}</li>
            <li><strong>{t('esim.installDialog.troubleshooting.importantNotes.wifiRequired').split(':')[0]}:</strong> {t('esim.installDialog.troubleshooting.importantNotes.wifiRequired').split(':')[1]}</li>
            <li><strong>{t('esim.installDialog.troubleshooting.importantNotes.dataRoaming').split(':')[0]}:</strong> {t('esim.installDialog.troubleshooting.importantNotes.dataRoaming').split(':')[1]}</li>
            <li><strong>{t('esim.installDialog.troubleshooting.importantNotes.activationTime').split(':')[0]}:</strong> {t('esim.installDialog.troubleshooting.importantNotes.activationTime').split(':')[1]}</li>
            <li><strong>{t('esim.installDialog.troubleshooting.importantNotes.multipleEsims').split(':')[0]}:</strong> {t('esim.installDialog.troubleshooting.importantNotes.multipleEsims').split(':')[1]}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Contact Support */}
      <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border">
        <Phone className="h-8 w-8 mx-auto mb-3 text-primary" />
        <h4 className="font-semibold mb-2">{t('esim.installDialog.troubleshooting.support.title')}</h4>
        <p className="text-sm text-muted-foreground mb-4">
          {t('esim.installDialog.troubleshooting.support.subtitle')}
        </p>
        <Button 
          onClick={() => navigate('/support')}
          className="w-full max-w-xs"
        >
          <Phone className="h-4 w-4 mr-2" />
          {t('esim.installDialog.troubleshooting.support.button')}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          {t('esim.installDialog.troubleshooting.support.responseTime')}
        </p>
      </div>
    </div>
  );
}
