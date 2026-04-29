import { useContext, useState } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, KeyRound, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fallback translations for when context is unavailable
const fallbackTranslations: Record<string, Record<string, string>> = {
  en: {
    'auth.lineConsent.title': 'Welcome to mobile11!',
    'auth.lineConsent.subtitle': 'Your LINE account has been connected successfully',
    'auth.lineConsent.emailUsageTitle': 'Your email address is used solely for:',
    'auth.lineConsent.emailFromLineTitle': 'Your email address (shared by LINE) is used solely for:',
    'auth.lineConsent.accountIdentification': 'Account Identification',
    'auth.lineConsent.accountIdentificationDesc': 'Logging into your account securely',
    'auth.lineConsent.accountRecovery': 'Account Recovery',
    'auth.lineConsent.accountRecoveryDesc': 'Password reset and account verification',
    'auth.lineConsent.noSharing': 'We do not share your email with third parties.',
    'auth.lineConsent.privacyLink': 'Privacy Policy',
    'auth.lineConsent.termsLink': 'Terms of Service',
    'auth.lineConsent.consentCheckbox': 'I agree to how mobile11 uses my email address',
    'auth.lineConsent.agreeButton': 'Continue',
  },
  th: {
    'auth.lineConsent.title': 'ยินดีต้อนรับสู่ mobile11!',
    'auth.lineConsent.subtitle': 'บัญชี LINE ของคุณเชื่อมต่อเรียบร้อยแล้ว',
    'auth.lineConsent.emailUsageTitle': 'อีเมลของคุณใช้สำหรับ:',
    'auth.lineConsent.emailFromLineTitle': 'อีเมลของคุณ (ที่ได้จาก LINE) ใช้สำหรับ:',
    'auth.lineConsent.accountIdentification': 'ยืนยันตัวตน',
    'auth.lineConsent.accountIdentificationDesc': 'เข้าสู่ระบบบัญชีของคุณอย่างปลอดภัย',
    'auth.lineConsent.accountRecovery': 'กู้คืนบัญชี',
    'auth.lineConsent.accountRecoveryDesc': 'รีเซ็ตรหัสผ่านและยืนยันบัญชี',
    'auth.lineConsent.noSharing': 'เราไม่แชร์อีเมลของคุณกับบุคคลที่สาม',
    'auth.lineConsent.privacyLink': 'นโยบายความเป็นส่วนตัว',
    'auth.lineConsent.termsLink': 'ข้อกำหนดการให้บริการ',
    'auth.lineConsent.consentCheckbox': 'ฉันยอมรับวิธีที่ mobile11 ใช้อีเมลของฉัน',
    'auth.lineConsent.agreeButton': 'ดำเนินการต่อ',
  },
  zh: {
    'auth.lineConsent.title': '欢迎来到mobile11！',
    'auth.lineConsent.subtitle': '您的LINE账户已成功连接',
    'auth.lineConsent.emailUsageTitle': '您的邮箱地址仅用于：',
    'auth.lineConsent.emailFromLineTitle': '您的邮箱地址（由LINE提供）仅用于：',
    'auth.lineConsent.accountIdentification': '账户识别',
    'auth.lineConsent.accountIdentificationDesc': '安全登录您的账户',
    'auth.lineConsent.accountRecovery': '账户恢复',
    'auth.lineConsent.accountRecoveryDesc': '密码重置和账户验证',
    'auth.lineConsent.noSharing': '我们不会与第三方共享您的邮箱。',
    'auth.lineConsent.privacyLink': '隐私政策',
    'auth.lineConsent.termsLink': '服务条款',
    'auth.lineConsent.consentCheckbox': '我同意mobile11使用我的邮箱地址的方式',
    'auth.lineConsent.agreeButton': '继续',
  },
};

interface LineConsentDialogProps {
  open: boolean;
  email: string;
  displayName?: string;
  isEmailFromLine?: boolean;
  onAccept: () => void;
}

export default function LineConsentDialog({
  open,
  email,
  displayName,
  isEmailFromLine = false,
  onAccept,
}: LineConsentDialogProps) {
  // Safe context access with fallback for chunk loading issues
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const [hasConsented, setHasConsented] = useState(false);
  
  // Translation function with fallback
  const t = (key: string): string => {
    if (langContext?.t) {
      try {
        const result = langContext.t(key);
        if (result) return result;
      } catch {
        // Context unavailable, use fallback
      }
    }
    return fallbackTranslations[language]?.[key] || fallbackTranslations['en'][key] || key;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          {/* LINE Logo / Success Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-[#00B900]/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-[#00B900]" />
          </div>
          
          <DialogTitle className="text-xl font-bold text-center">
            {t('auth.lineConsent.title')}
            {displayName && (
              <span className="block text-lg font-normal text-muted-foreground mt-1">
                {displayName}
              </span>
            )}
          </DialogTitle>
          
          <DialogDescription className="text-center">
            {t('auth.lineConsent.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Usage Notice */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">
              {isEmailFromLine 
                ? t('auth.lineConsent.emailFromLineTitle') 
                : t('auth.lineConsent.emailUsageTitle')}
            </p>
            <p className="text-sm font-mono bg-background px-2 py-1 rounded border truncate">
              {email}
            </p>
          </div>

          {/* Email Usage Points */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-medium block">
                  {t('auth.lineConsent.accountIdentification')}
                </span>
                <span className="text-muted-foreground">
                  {t('auth.lineConsent.accountIdentificationDesc')}
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-medium block">
                  {t('auth.lineConsent.accountRecovery')}
                </span>
                <span className="text-muted-foreground">
                  {t('auth.lineConsent.accountRecoveryDesc')}
                </span>
              </div>
            </div>
          </div>

          {/* No Sharing Notice */}
          <p className="text-xs text-muted-foreground text-center">
            {t('auth.lineConsent.noSharing')}
          </p>

          {/* Links */}
          <div className="flex justify-center gap-4 text-xs">
            <Link 
              to="/privacy-policy" 
              target="_blank"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {t('auth.lineConsent.privacyLink')}
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link 
              to="/terms-of-service" 
              target="_blank"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {t('auth.lineConsent.termsLink')}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox 
              id="email-consent"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked === true)}
              className="mt-0.5"
            />
            <label 
              htmlFor="email-consent" 
              className="text-sm cursor-pointer leading-tight"
            >
              {t('auth.lineConsent.consentCheckbox')}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={onAccept}
            disabled={!hasConsented}
            className="w-full bg-[#00B900] hover:bg-[#00A000] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('auth.lineConsent.agreeButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
