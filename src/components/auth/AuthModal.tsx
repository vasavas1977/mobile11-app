import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, Globe, Eye, EyeOff } from 'lucide-react';
import { SocialLoginButtons } from './SocialLoginButtons';
import { OTPInput } from './OTPInput';
import { useLanguage, getNextLanguage, getNextLanguageLabel } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.png';
import { trackSignUp, trackLogin } from '@/lib/gtmUtils';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { isInAppBrowser, getInAppBrowserName } from '@/utils/browserDetection';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ open, onOpenChange, defaultTab = 'signin' }: AuthModalProps) {
  const { signUp, signIn, resendVerification, verifyOTP, signInWithOAuth, signInWithLine, resetPassword } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'line' | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Reset state when modal opens with new default tab
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setActiveTab(defaultTab);
      setShowForgotPassword(false);
      setResetEmailSent(false);
      setShowOTPInput(false);
    }
    onOpenChange(newOpen);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.firstName,
      signUpData.lastName
    );
    
    if (!error) {
      setShowOTPInput(true);
      setSignUpEmail(signUpData.email);
    }
    
    setIsLoading(false);
  };

  const handleVerifyOTP = async (code: string) => {
    setIsLoading(true);
    
    const { error } = await verifyOTP(signUpEmail, code);
    
    if (!error) {
      trackSignUp('email');
      onOpenChange(false);
      // Stay on current page - header will update automatically
    }
    
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    await resendVerification(signUpEmail);
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (!error) {
      trackLogin('email');
      onOpenChange(false);
      // Stay on current page - header will update automatically
    }
    
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    trackLogin(provider);
    await signInWithOAuth(provider);
    setSocialLoading(null);
  };

  const handleLineLogin = async () => {
    if (isInAppBrowser()) {
      const browserName = getInAppBrowserName();
      toast({
        title: t('auth2.openInBrowser'),
        description: (t('auth2.openInBrowserDesc') as string).replace('{browser}', browserName ? ` (${(t('auth2.usingBrowser') as string).replace('{name}', browserName)})` : ''),
        variant: "default",
      });
    }
    
    setSocialLoading('line');
    trackLogin('line');
    await signInWithLine(language);
    setSocialLoading(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(forgotPasswordEmail);
    if (!error) {
      setResetEmailSent(true);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-3xl overflow-hidden gap-0 border-0">
        <DialogTitle className="sr-only">
          {activeTab === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </DialogTitle>
        
        {/* Beige Header with Tabs */}
        <div className="bg-[#FAF7F2] px-8 pt-6 pb-0">
          {/* Language Switcher */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(getNextLanguage(language))}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">{getNextLanguageLabel(language)}</span>
            </button>
          </div>
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logo} alt="mobile11" className="h-16 w-auto" />
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('signin'); setShowForgotPassword(false); }}
              className={cn(
                "flex-1 pb-4 text-lg font-semibold transition-colors",
                activeTab === 'signin' 
                  ? "text-gray-900 border-b-2 border-gray-900" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setShowForgotPassword(false); }}
              className={cn(
                "flex-1 pb-4 text-lg font-semibold transition-colors",
                activeTab === 'signup' 
                  ? "text-gray-900 border-b-2 border-gray-900" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t('auth.signUp')}
            </button>
          </div>
        </div>
        
        {/* White Content Area */}
        <div className="bg-white px-8 py-6">
          {activeTab === 'signin' ? (
            showForgotPassword ? (
              // Forgot Password Form
              <div className="space-y-4">
                {resetEmailSent ? (
                  <div className="space-y-4 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{t('auth.checkEmail')}</h3>
                      <p className="text-sm text-gray-500">{t('auth.resetLinkSent')}</p>
                      <p className="text-sm font-medium text-gray-900">{forgotPasswordEmail}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-xl"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setForgotPasswordEmail('');
                      }}
                    >
                      {t('auth.backToSignIn')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{t('auth.resetPassword')}</h3>
                      <p className="text-sm text-gray-500">{t('auth.resetPasswordDesc')}</p>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <Input
                        type="email"
                        placeholder={t('auth.email')}
                        className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.sendResetLink')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-gray-600 hover:text-gray-900"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        {t('auth.backToSignIn')}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              // Sign In Form
              <div className="space-y-5">
                {/* Social Login Buttons */}
                <SocialLoginButtons 
                  onProviderClick={handleSocialLogin}
                  onLineClick={handleLineLogin}
                  isLoading={socialLoading}
                />
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-400">{t('auth.orContinueWith')}</span>
                  </div>
                </div>
                
                {/* Email/Password Form */}
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder={t('auth.email')}
                    className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('auth.password')}
                      className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500 pr-12"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Remember Me + Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="data-[state=unchecked]:bg-white data-[state=unchecked]:border data-[state=unchecked]:border-gray-300 data-[state=checked]:bg-orange-500"
                      />
                      <span className="text-sm text-gray-600">{t('auth.rememberMe')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signIn')}
                  </Button>
                </form>
              </div>
            )
          ) : (
            // Sign Up Form
            <div className="space-y-5">
              {showOTPInput ? (
                <OTPInput
                  email={signUpEmail}
                  onVerify={handleVerifyOTP}
                  onResend={handleResendOTP}
                  isLoading={isLoading}
                  onBack={() => setActiveTab('signin')}
                />
              ) : (
                <>
                  {/* Social Login Buttons */}
                  <SocialLoginButtons 
                    onProviderClick={handleSocialLogin}
                    onLineClick={handleLineLogin}
                    isLoading={socialLoading}
                  />
                  
                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-gray-400">{t('auth.orContinueWith')}</span>
                    </div>
                  </div>
                  
                  {/* Sign Up Form */}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder={t('auth.firstName')}
                        className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                      />
                      <Input
                        placeholder={t('auth.lastName')}
                        className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder={t('auth.email')}
                      className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('auth.password')}
                        className="h-14 rounded-xl border-gray-200 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500 pr-12"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {t('auth.passwordHint')}
                    </p>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signUp')}
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>

    </Dialog>
  );
}