import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { clearGuestFlag } from '@/utils/guestCheckout';
import { useLanguage } from '@/contexts/LanguageContext';

export function SetPasswordPrompt() {
  const { t, language } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t('checkout.passwordMinLength'));
      return;
    }
    if (password !== confirm) {
      setError(t('checkout.passwordsNoMatch'));
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    clearGuestFlag();
    setDone(true);
    setLoading(false);

    // Fire-and-forget welcome email
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        supabase.functions.invoke('send-welcome-email', {
          body: { email: user.email, language: language as string },
        });
      }
    } catch (e) {
      console.error('Welcome email failed:', e);
    }
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <p className="text-sm text-green-800 font-medium">
          {t('checkout.passwordSet')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-orange-500" />
        <h3 className="font-bold text-gray-900 text-lg">
          {t('checkout.setPasswordTitle')}
        </h3>
      </div>
      <p className="text-sm text-gray-600">
        {t('checkout.setPasswordDescription')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('checkout.passwordPlaceholder')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            disabled={loading}
            className="rounded-xl h-11 pr-10 bg-white border-gray-300 !text-gray-900 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder={t('checkout.confirmPasswordPlaceholder')}
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          disabled={loading}
          className="rounded-xl h-11 bg-white border-gray-300 !text-gray-900 placeholder:text-gray-400"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('checkout.setPasswordButton')}
        </Button>
      </form>
    </div>
  );
}