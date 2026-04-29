import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header as Navbar } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { setPostAuthNext } from '@/utils/postAuthNext';

export default function BusinessLoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signInWithOAuth, getLineAuthUrl } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'line' | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/business/team', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      // Post-login navigation handled by useEffect
    } catch (error: any) {
      toast({ 
        title: 'Sign in failed', 
        description: error?.message || 'Please check your credentials',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setPostAuthNext('/business/team');
    try {
      await signInWithOAuth(provider);
    } catch (error: any) {
      toast({ 
        title: 'Login failed', 
        description: error?.message || 'Please try again',
        variant: 'destructive' 
      });
      setSocialLoading(null);
    }
  };

  const handleLineLogin = async () => {
    setSocialLoading('line');
    setPostAuthNext('/business/team');
    try {
      const result = await getLineAuthUrl();
      const url = typeof result === 'string' ? result : result?.authUrl;
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({ 
        title: 'LINE login failed', 
        description: error?.message || 'Please try again',
        variant: 'destructive' 
      });
      setSocialLoading(null);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md bg-white border-gray-100 shadow-lg rounded-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-2xl w-fit">
              <Building2 className="h-10 w-10 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Business Portal
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to manage your organization's eSIMs
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Social Login */}
            <SocialLoginButtons
              onProviderClick={handleSocialLogin}
              onLineClick={handleLineLogin}
              isLoading={socialLoading}
            />
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500">or continue with email</span>
              </div>
            </div>
            
            {/* Email/Password Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl h-12"
                  disabled={isSubmitting}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            {/* Back link */}
            <div className="text-center pt-2">
              <Button
                variant="link"
                onClick={() => navigate('/business')}
                className="text-gray-500 hover:text-gray-700 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Business page
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
