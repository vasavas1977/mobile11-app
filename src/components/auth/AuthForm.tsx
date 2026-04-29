import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, CheckCircle, Home, Globe } from 'lucide-react';
import { SocialLoginButtons } from './SocialLoginButtons';
import { Separator } from '@/components/ui/separator';
import { OTPInput } from './OTPInput';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage, getNextLanguage, getNextLanguageLabel } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.png';
import { trackSignUp, trackLogin } from '@/lib/gtmUtils';

export function AuthForm() {
  const { signUp, signIn, loading, resendVerification, verifyOTP, signInWithOAuth, signInWithLine, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'line' | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
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
      // Return to stored path or home page
      const next = sessionStorage.getItem('post_auth_next') || '/';
      sessionStorage.removeItem('post_auth_next');
      navigate(next);
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
    setShowResend(false);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error && error.message.includes('Invalid login credentials')) {
      setShowResend(true);
      setLastAttemptedEmail(signInData.email);
    } else if (!error) {
      trackLogin('email');
    }
    
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    await resendVerification(lastAttemptedEmail);
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    trackLogin(provider);
    await signInWithOAuth(provider);
    setSocialLoading(null);
  };

  const handleLineLogin = async () => {
    setSocialLoading('line');
    trackLogin('line');
    await signInWithLine();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
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
          <CardDescription className="text-gray-600">
            {t('auth.description')}
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
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
              setShowOTPInput(false);
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              {showForgotPassword ? (
                <div className="space-y-4">
                  {resetEmailSent ? (
                    <div className="space-y-4 py-6 text-center">
                      <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                           <CheckCircle className="h-8 w-8 text-orange-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                         <h3 className="text-xl font-semibold text-gray-900">{t('auth.checkEmail')}</h3>
                         <p className="text-sm text-gray-500">
                           {t('auth.resetLinkSent')}
                         </p>
                         <p className="text-sm font-medium text-gray-900">
                           {forgotPasswordEmail}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                         className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
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
                      <div className="space-y-2 text-center">
                         <h3 className="text-xl font-semibold text-gray-900">{t('auth.resetPassword')}</h3>
                         <p className="text-sm text-gray-500">
                           {t('auth.resetPasswordDesc')}
                         </p>
                      </div>
                      
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email" className="text-gray-900">{t('auth.email')}</Label>
                          <div className="relative">
                             <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="forgot-email"
                              type="email"
                               placeholder={t('auth.enterEmail')}
                               className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                               value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              required
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
                              {t('auth.sending')}
                            </>
                          ) : (
                            t('auth.sendResetLink')
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordEmail('');
                          }}
                        >
                          {t('auth.backToSignIn')}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <SocialLoginButtons 
                    onProviderClick={handleSocialLogin}
                    onLineClick={handleLineLogin}
                    isLoading={socialLoading}
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                       <span className="bg-white px-2 text-gray-500">{t('auth.orContinueWith')}</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-gray-900">{t('auth.email')}</Label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-email"
                          type="email"
                           placeholder={t('auth.enterEmail')}
                           className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-gray-900">{t('auth.password')}</Label>
                      <div className="relative">
                         <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-password"
                          type="password"
                           placeholder={t('auth.enterPassword')}
                           className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                          required
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
                          {t('auth.signingIn')}
                        </>
                      ) : (
                        t('auth.signIn')
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-orange-500 hover:text-orange-600 hover:underline"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    </div>

                    {showResend && (
                      <div className="space-y-3 pt-2">
                        <p className="text-sm text-gray-500 text-center">
                          {t('auth.verificationNotReceived')}
                        </p>
                        <Button
                          type="button"
                           variant="outline"
                           className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={handleResendVerification}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('auth.sending')}
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              {t('auth.resendVerification')}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <SocialLoginButtons 
                onProviderClick={handleSocialLogin}
                onLineClick={handleLineLogin}
                isLoading={socialLoading}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">{t('auth.orContinueWith')}</span>
                </div>
              </div>

              {showOTPInput ? (
                <OTPInput
                  email={signUpEmail}
                  onVerify={handleVerifyOTP}
                  onResend={handleResendOTP}
                  isLoading={isLoading}
                  onBack={() => setActiveTab('signin')}
                />
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-gray-900">{t('auth.firstName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="first-name"
                           placeholder={t('auth.firstName')}
                           className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-gray-900">{t('auth.lastName')}</Label>
                      <Input
                        id="last-name"
                         placeholder={t('auth.lastName')}
                         className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                         value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-900">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                         placeholder={t('auth.enterEmail')}
                         className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-900">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                         placeholder={t('auth.createPassword')}
                         className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
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
                        {t('auth.creatingAccount')}
                      </>
                    ) : (
                      t('auth.createAccount')
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
