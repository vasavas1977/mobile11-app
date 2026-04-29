import { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatEmailVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
}

export function ChatEmailVerification({
  email,
  onVerify,
  onResend,
  isLoading,
  onBack,
}: ChatEmailVerificationProps) {
  const { t } = useLanguage();
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      await onVerify(value);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    await onResend();
    setResendCooldown(60);

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-base font-semibold">{t('chatEmailVerify.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('chatEmailVerify.subtitle')}</p>
        <p className="text-sm font-medium text-foreground">{email}</p>
      </div>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={isLoading}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('chatEmailVerify.verifying')}
        </div>
      )}

      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={handleResend} disabled={resendCooldown > 0 || isLoading}>
          {resendCooldown > 0 ? (
            (t('chatEmailVerify.resendIn') as string).replace('{n}', String(resendCooldown))
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              {t('chatEmailVerify.resendCode')}
            </>
          )}
        </Button>

        <Button variant="ghost" className="w-full" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('chatEmailVerify.backToEdit')}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {t('chatEmailVerify.checkSpam')}
      </p>
    </div>
  );
}
