import { useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OTPInputProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
}

export function OTPInput({ email, onVerify, onResend, isLoading, onBack }: OTPInputProps) {
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const { t } = useLanguage();

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      await onVerify(value);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    await onResend();
    setResendCooldown(60);
    
    // Countdown timer
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
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-semibold">{t('auth.checkEmail')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('auth.verificationCodeSent')}
        </p>
        <p className="text-sm font-medium text-foreground">
          {email}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            disabled={isLoading}
          >
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
            {t('auth.verifyingCode')}
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          {t('auth.enterCode')}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
        >
          {resendCooldown > 0 ? (
            `${t('auth.resendCodeIn')} ${resendCooldown}s`
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              {t('auth.resendCode')}
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onBack}
          disabled={isLoading}
        >
          {t('auth.backToSignIn')}
        </Button>
      </div>
    </div>
  );
}
