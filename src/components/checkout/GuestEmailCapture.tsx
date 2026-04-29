import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, LogIn, MessageCircle } from 'lucide-react';
import { silentSignUp } from '@/utils/guestCheckout';
import { useLanguage } from '@/contexts/LanguageContext';

interface GuestEmailCaptureProps {
  onSignInClick: () => void;
}

export function GuestEmailCapture({ onSignInClick }: GuestEmailCaptureProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [countdown > 0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || countdown > 0) return;

    setLoading(true);
    setError(null);
    setNeedsSignIn(false);

    const result = await silentSignUp(email.trim());

    if (result.success) {
      return;
    }

    setLoading(false);

    if (result.rateLimitSeconds) {
      setCountdown(result.rateLimitSeconds);
      setError(t('checkout.guestEmailRateLimit').replace('{seconds}', String(result.rateLimitSeconds)));
    } else if (result.needsSignIn) {
      setNeedsSignIn(true);
      setError(t('checkout.guestEmailExists'));
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  const isDisabled = loading || !email.trim() || countdown > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-2 text-gray-800">
        <Mail className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold text-base">
          {t('checkout.guestEmailTitle')}
        </h3>
      </div>
      <p className="text-sm text-gray-500">
        {t('checkout.guestEmailDescription')}
      </p>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <MessageCircle className="h-3.5 w-3.5 text-green-500" />
        <span>{t('checkout.guestEmailMessengerNote')}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
            setNeedsSignIn(false);
          }}
          required
          disabled={loading}
          className="flex-1 rounded-xl h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
        />
        <Button
          type="submit"
          disabled={isDisabled}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 px-5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : countdown > 0 ? (
            `${countdown}s`
          ) : (
            t('checkout.guestEmailContinue')
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <span className="relative bg-white px-3 text-xs text-gray-400">
          {t('checkout.guestEmailOrLogin')}
        </span>
      </div>

      {/* Login button */}
      <Button
        type="button"
        variant="outline"
        onClick={onSignInClick}
        className="w-full rounded-xl h-11 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        <LogIn className="h-4 w-4 mr-2" />
        {t('checkout.guestEmailLoginButton')}
      </Button>

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-2 flex-wrap">
          <span>{countdown > 0 ? t('checkout.guestEmailRateLimitCountdown').replace('{seconds}', String(countdown)) : error}</span>
          {needsSignIn && (
            <Button
              variant="link"
              size="sm"
              className="text-orange-600 hover:text-orange-700 p-0 h-auto"
              onClick={onSignInClick}
            >
              <LogIn className="h-3.5 w-3.5 mr-1" />
              {t('checkout.guestEmailSignIn')}
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {t('checkout.guestEmailSetPasswordNote')}
      </p>
    </div>
  );
}
