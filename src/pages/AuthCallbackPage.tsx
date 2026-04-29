import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmailOtpType } from '@supabase/supabase-js';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendVerification } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the next redirect path from sessionStorage or query params
        const storedNext = sessionStorage.getItem('post_auth_next');
        const next = storedNext || searchParams.get('next') || '/';
        
        // Clear stored path after retrieving
        if (storedNext) {
          sessionStorage.removeItem('post_auth_next');
        }
        
        // Check for code in query params (OAuth PKCE flow)
        const code = searchParams.get('code');
        
        if (code) {
          console.log('Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Code exchange error:', error);
            setError(error.message);
            setEmail(data?.user?.email || '');
            setIsProcessing(false);
            return;
          }
          
          if (data?.session) {
            console.log('Session established, redirecting to:', next);

            // Send welcome email for new OAuth users (created within last 60s)
            const oauthUser = data.session.user;
            const isNewUser = (Date.now() - new Date(oauthUser.created_at).getTime()) < 60000;
            if (isNewUser && oauthUser.email) {
              supabase.functions.invoke('send-welcome-email', {
                body: { email: oauthUser.email, language: localStorage.getItem('language') || 'en' },
              }).catch(e => console.error('Welcome email failed:', e));
            }

            navigate(next, { replace: true });
            return;
          }
        }
        
        // Check for existing session (fallback)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setIsProcessing(false);
          return;
        }
        
        if (session) {
          console.log('Existing session found, redirecting to:', next);
          navigate(next, { replace: true });
          return;
        }
        
        // No session found - redirect to home and open auth modal
        console.log('No session found, redirecting to home with auth modal');
        navigate('/', { replace: true });
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
        }, 100);
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);


  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <CardTitle>Confirming your email...</CardTitle>
            <CardDescription>Please wait while we verify your account</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              navigate('/', { replace: true });
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
              }, 100);
            }} 
            className="w-full"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
