import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, getNextLanguage, getNextLanguageLabel } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, AlertCircle, Globe, Home } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logo from '@/assets/logo.png';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, session, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Note: we intentionally do NOT auto-redirect to /auth when session is missing.
  // During password recovery, the session may take a moment to be established from the URL hash.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(password);

    if (!error) {
      // Return to stored path or home page after password reset
      const next = sessionStorage.getItem('post_auth_next') || '/';
      sessionStorage.removeItem('post_auth_next');
      navigate(next);
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4">
        <Card className="w-full max-w-md bg-white border-gray-100 shadow-lg rounded-2xl">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-gray-900">
               {t('resetPassword.unableToReset')}
            </CardTitle>
            <CardDescription className="text-gray-600">{t('resetPassword.invalidLink')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
                }, 100);
              }} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-semibold"
            >
              {t('resetPassword.backToSignIn')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full h-12">
              {t('resetPassword.backToHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
     <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4">
      <Card className="w-full max-w-md bg-white border-gray-100 shadow-lg rounded-2xl">
        <CardHeader className="space-y-4 text-center relative">
          {/* Language Switcher */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(getNextLanguage(language))}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{getNextLanguageLabel(language)}</span>
            </Button>
          </div>
          
          <div className="flex justify-center">
            <img src={logo} alt="mobile11" className="h-20 w-auto" />
          </div>
           <CardTitle className="text-2xl font-bold text-gray-900">{t('auth.resetPassword')}</CardTitle>
           <CardDescription className="text-gray-600">
            {t('auth.enterNewPasswordDesc')}
           </CardDescription>
           <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 text-sm text-orange-500 hover:text-orange-600 hover:underline"
          >
            <Home className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900">{t('auth.newPassword')}</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                   placeholder={t('auth.enterNewPassword')}
                   className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-900">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirm-password"
                  type="password"
                   placeholder={t('auth.confirmNewPassword')}
                   className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

             <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.updatingPassword')}
                </>
              ) : (
                t('auth.updatePassword')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
