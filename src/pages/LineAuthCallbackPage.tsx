import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { consumePostAuthNext } from '@/utils/postAuthNext';
import LineConsentDialog from '@/components/auth/LineConsentDialog';

export default function LineAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'processing' | 'success' | 'consent' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // New user consent state
  const [newUserData, setNewUserData] = useState<{
    email: string;
    displayName?: string;
    isEmailFromLine?: boolean;
    postAuthNext: string;
  } | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle LINE error response
      if (errorParam) {
        console.error('[LINE Callback] Error from LINE:', errorParam, errorDescription);
        setError(errorDescription || errorParam);
        setErrorDetails(`LINE returned error: ${errorParam}`);
        setStatus('error');
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setErrorDetails('The callback URL did not contain an authorization code from LINE.');
        setStatus('error');
        return;
      }

      // Verify state for CSRF protection
      const storedState = sessionStorage.getItem('line_auth_state');
      if (storedState && state && storedState !== state) {
        console.error('[LINE Callback] State mismatch - possible CSRF attack');
        setError('Security verification failed');
        setErrorDetails(`State mismatch: expected "${storedState.slice(0, 8)}..." but got "${state.slice(0, 8)}...". This may happen if you opened the login in a different tab.`);
        setStatus('error');
        return;
      }

      try {
        console.log('[LINE Callback] Processing authorization code...');
        console.log('[LINE Callback] Current window.location.origin:', window.location.origin);
        console.log('[LINE Callback] Current window.location.href:', window.location.href);
        
        // Use stored redirect_uri if available (must match exactly what was used in authorization)
        const storedRedirectUri = sessionStorage.getItem('line_redirect_uri');
        const computedRedirectUri = `${window.location.origin}/auth/line/callback`;
        const redirectUri = storedRedirectUri || computedRedirectUri;
        
        console.log('[LINE Callback] Stored redirect_uri:', storedRedirectUri);
        console.log('[LINE Callback] Computed redirect_uri:', computedRedirectUri);
        console.log('[LINE Callback] Using redirect_uri:', redirectUri);
        
        if (!storedRedirectUri) {
          console.warn('[LINE Callback] No stored redirect_uri, using computed value');
        } else if (storedRedirectUri !== computedRedirectUri) {
          console.warn('[LINE Callback] Redirect URI mismatch! Stored differs from current origin.');
        }
        
        // Exchange code for session via edge function
        let response: Response;
        let data: any;
        
        try {
          response = await fetch(
            `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/line-auth`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code,
                redirect_uri: redirectUri,
              }),
            }
          );
        } catch (fetchError) {
          console.error('[LINE Callback] Network error:', fetchError);
          setError('Network request failed');
          setErrorDetails(`Could not reach authentication server: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`);
          setStatus('error');
          return;
        }

        // Try to parse response
        try {
          data = await response.json();
        } catch (parseError) {
          const text = await response.text().catch(() => 'Unable to read response');
          console.error('[LINE Callback] Non-JSON response:', text.slice(0, 200));
          setError('Invalid server response');
          setErrorDetails(`Server returned non-JSON response (HTTP ${response.status}): ${text.slice(0, 100)}`);
          setStatus('error');
          return;
        }

        console.log('[LINE Callback] Response status:', response.status, 'ok:', response.ok, 'keys:', Object.keys(data));

        if (!response.ok || data.error) {
          const errorMsg = data.error || `HTTP ${response.status}`;
          const details = data.details || JSON.stringify(data);
          console.error('[LINE Callback] Edge function error:', errorMsg, details);
          setError(errorMsg);
          setErrorDetails(details);
          setStatus('error');
          return;
        }

        console.log('[LINE Callback] Authentication successful:', data.user?.line_display_name, 'isNewUser:', data.isNewUser);

        // Get post-auth redirect early (before any potential async operations that might clear it)
        const postAuthNext = consumePostAuthNext('/');

        // Use tokenHash and email to verify and establish session
        if (data.tokenHash && data.email) {
          console.log('[LINE Callback] Verifying OTP with tokenHash...');
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink',
          });

          if (verifyError) {
            console.error('[LINE Callback] OTP verification failed:', verifyError);
            // Continue anyway - user is created, will redirect to login
          } else {
            console.log('[LINE Callback] OTP verification successful, session established');
            // If verifyOtp returns a session, check if new user needs consent
            if (verifyData?.session) {
              // Clear stored LINE auth data
              sessionStorage.removeItem('line_auth_state');
              sessionStorage.removeItem('line_redirect_uri');

              // Check if this is a new user - show consent dialog
              if (data.isNewUser) {
                console.log('[LINE Callback] New user detected, showing consent dialog. Email from LINE:', data.isEmailFromLine);

                // Send welcome email for new LINE users
                if (data.email) {
                  supabase.functions.invoke('send-welcome-email', {
                    body: { email: data.email, language: localStorage.getItem('language') || 'en' },
                  }).catch(e => console.error('Welcome email failed:', e));
                }

                setNewUserData({
                  email: data.email,
                  displayName: data.user?.line_display_name,
                  isEmailFromLine: data.isEmailFromLine,
                  postAuthNext: postAuthNext,
                });
                setStatus('consent');
                return;
              }
              
              // Existing user - redirect immediately
              setStatus('success');
              setTimeout(() => {
                navigate(postAuthNext);
              }, 1500);
              return;
            }
          }
        } else {
          console.log('[LINE Callback] No tokenHash/email received, will check session');
        }

        // Check if session was established
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Clear stored LINE auth data
        sessionStorage.removeItem('line_auth_state');
        sessionStorage.removeItem('line_redirect_uri');
        
        if (sessionData.session) {
          setStatus('success');
          setTimeout(() => {
            navigate(postAuthNext);
          }, 1500);
        } else {
          // Session might not be established yet, try refreshing
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session) {
            setStatus('success');
            setTimeout(() => {
              navigate(postAuthNext);
            }, 1500);
          } else {
            // User was created but session not established - redirect to home and open modal
            console.log('[LINE Callback] User created, redirecting to home with modal');
            setStatus('success');
            setTimeout(() => {
              navigate('/');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
              }, 100);
            }, 1500);
          }
        }
      } catch (err) {
        console.error('[LINE Callback] Error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setErrorDetails(err instanceof Error ? err.stack || err.message : String(err));
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  // Handler for when user accepts consent
  const handleConsentAccept = () => {
    console.log('[LINE Callback] User accepted consent, redirecting');
    setStatus('success');
    setTimeout(() => {
      navigate(newUserData?.postAuthNext || '/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      {/* Consent Dialog for new users */}
      {status === 'consent' && newUserData && (
        <LineConsentDialog
          open={true}
          email={newUserData.email}
          displayName={newUserData.displayName}
          isEmailFromLine={newUserData.isEmailFromLine}
          onAccept={handleConsentAccept}
        />
      )}

      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-background shadow-sm text-center space-y-4 p-8">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[#00B900] mx-auto" />
            <h1 className="text-xl font-semibold">{t('auth.lineProcessing')}</h1>
            <p className="text-muted-foreground">{t('auth.pleaseWait')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-[#00B900] mx-auto" />
            <h1 className="text-xl font-semibold">{t('auth.lineSuccess')}</h1>
            <p className="text-muted-foreground">{t('auth.redirecting')}</p>
          </>
        )}

        {status === 'consent' && (
          <>
            <CheckCircle className="h-12 w-12 text-[#00B900] mx-auto" />
            <h1 className="text-xl font-semibold">{t('auth.lineSuccess')}</h1>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">{t('auth.lineError')}</h1>
            <p className="text-muted-foreground">{error}</p>
            
            {errorDetails && (
              <div className="mt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                >
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
                {showDetails && (
                  <div className="mt-2 p-3 bg-muted rounded-md text-left text-xs text-muted-foreground overflow-auto max-h-32">
                    <pre className="whitespace-pre-wrap break-words">{errorDetails}</pre>
                  </div>
                )}
              </div>
            )}
            
            <Button 
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
                }, 100);
              }} 
              variant="outline"
              className="mt-4"
            >
              {t('auth.backToSignIn')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}