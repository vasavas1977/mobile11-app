import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Headphones, LogIn, Loader2, User, Fingerprint, ScanFace } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { consumePostAuthNext } from '@/utils/postAuthNext';
import {
  isBiometricAvailable,
  hasBiometricCredential,
  getBiometricEmail,
  registerBiometric,
  authenticateWithBiometric,
  removeBiometricCredential,
} from '@/utils/biometric-auth';

export function AgentQuickLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const savedEmail = localStorage.getItem('agent_last_email') || '';
  const savedRemember = localStorage.getItem('agent_remember_me') === 'true';
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(savedRemember);
  const [showFullForm, setShowFullForm] = useState(!savedEmail || !savedRemember);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(hasBiometricCredential());
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricSupported);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (rememberMe) {
        localStorage.setItem('agent_last_email', email);
        localStorage.setItem('agent_remember_me', 'true');
      } else {
        localStorage.removeItem('agent_last_email');
        localStorage.removeItem('agent_remember_me');
      }
      // Offer biometric setup if supported and not yet registered
      if (biometricSupported && !hasBiometricCredential() && data.user) {
        setShowBiometricSetup(true);
        setLoading(false);
        return; // Don't navigate yet — show biometric setup prompt
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const result = await authenticateWithBiometric();
      if (!result.success) {
        toast({
          title: 'Biometric Failed',
          description: 'Please sign in with your password.',
          variant: 'destructive',
        });
        setShowFullForm(true);
        return;
      }
      // Check if Supabase session is still valid
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        toast({ title: 'Welcome back!', description: 'Signed in with biometrics.' });
        // Navigate to saved deep link or default agent page
        const destination = consumePostAuthNext('/agent');
        navigate(destination, { replace: true });
      } else {
        // Session expired — fall back to password
        toast({
          title: 'Session Expired',
          description: 'Please enter your password to sign in again.',
        });
        setEmail(result.email || savedEmail);
        setShowFullForm(false); // Show quick login with password
      }
    } catch {
      toast({
        title: 'Biometric Error',
        description: 'Something went wrong. Please try your password.',
        variant: 'destructive',
      });
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSetupBiometric = async () => {
    setBiometricLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const success = await registerBiometric(email, user.id);
        if (success) {
          setBiometricRegistered(true);
          toast({ title: 'Biometric Enabled', description: 'You can now sign in with Face ID or fingerprint.' });
        } else {
          toast({ title: 'Setup Skipped', description: 'You can enable biometrics later in settings.' });
        }
      }
    } catch {
      toast({ title: 'Setup Failed', description: 'Biometric registration could not complete.' });
    } finally {
      setBiometricLoading(false);
      setShowBiometricSetup(false);
    }
  };

  const handleSkipBiometric = () => {
    setShowBiometricSetup(false);
  };

  const biometricEmail = getBiometricEmail();

  // Biometric setup prompt (shown after successful password login)
  if (showBiometricSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2] px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
              <ScanFace className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Enable Biometric Login</h1>
            <p className="text-[#6B7280] mt-2 text-sm">
              Use Face ID or fingerprint to sign in instantly next time.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSetupBiometric}
              disabled={biometricLoading}
              className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg shadow-orange-500/20"
            >
              {biometricLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Enable Biometric Login
                </>
              )}
            </Button>
            <Button
              onClick={handleSkipBiometric}
              variant="ghost"
              className="w-full h-12 rounded-2xl text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F0EB] font-medium"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Headphones className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Agent Portal</h1>
          <p className="text-[#9CA3AF] mt-1">Sign in to continue</p>
        </div>

        {/* Biometric Login Button */}
        {biometricRegistered && biometricEmail && (
          <div className="mb-4">
            <Button
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              className="w-full h-14 rounded-2xl bg-[#1A1A1A] hover:bg-[#374151] text-white font-semibold text-base shadow-lg"
            >
              {biometricLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Sign in with Face ID / Fingerprint
                </>
              )}
            </Button>
            <p className="text-center text-xs text-[#9CA3AF] mt-2">{biometricEmail}</p>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              <span className="text-xs text-[#9CA3AF]">or</span>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>
          </div>
        )}

        {/* Quick Login Card */}
        {savedEmail && savedRemember && !showFullForm && !biometricRegistered && (
          <div className="mb-4">
            <div className="bg-white rounded-2xl shadow-md p-5 border border-[#F3F0EB]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Welcome back</p>
                  <p className="text-xs text-[#6B7280]">{savedEmail}</p>
                </div>
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="rounded-xl border-[#F3F0EB] bg-[#FAF7F2] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-orange-500 focus:ring-orange-500/20 h-12"
                  autoComplete="current-password"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg shadow-orange-500/20"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </div>
            <button
              onClick={() => setShowFullForm(true)}
              className="w-full text-center text-xs text-[#9CA3AF] hover:text-[#6B7280] mt-3 transition-colors"
            >
              Use a different account
            </button>
          </div>
        )}

        {/* Full Login Form */}
        {(showFullForm || biometricRegistered) && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 border border-[#F3F0EB]">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@company.com"
                  className="rounded-xl border-[#F3F0EB] bg-[#FAF7F2] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-orange-500 focus:ring-orange-500/20 h-12"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border-[#F3F0EB] bg-[#FAF7F2] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-orange-500 focus:ring-orange-500/20 h-12"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-[#D1D5DB] data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <label htmlFor="remember-me" className="text-sm text-[#374151] cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg shadow-orange-500/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        )}

        {/* Remove biometric link */}
        {biometricRegistered && (
          <button
            onClick={() => {
              removeBiometricCredential();
              setBiometricRegistered(false);
              toast({ title: 'Biometric Removed', description: 'Biometric login has been disabled.' });
            }}
            className="w-full text-center text-xs text-[#9CA3AF] hover:text-[#6B7280] mt-4 transition-colors"
          >
            Remove biometric login
          </button>
        )}
      </div>
    </div>
  );
}
