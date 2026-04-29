import { useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LanguageContext } from '@/contexts/LanguageContext';
import { useTrustedDevice } from '@/hooks/useTrustedDevice';
import { isGuestAutoCreated } from '@/utils/guestCheckout';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextType } from '@/contexts/AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  // Safe language context access with fallback for chunk loading edge cases
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const t = langContext?.t || ((key: string) => key);
  const { registerDevice } = useTrustedDevice();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep logging minimal (no sensitive info)
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[useAuth] PASSWORD_RECOVERY event detected');
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Register device on sign in
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setTimeout(() => {
          registerDevice(session.user.id);
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the 6-digit verification code."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const isUnverified = error.message.includes('Email not confirmed');
      const isInvalidCreds = error.message.includes('Invalid login credentials');
      
      let description = error.message;
      if (isUnverified) {
        description = "Please verify your email before signing in. Check your inbox for the verification link.";
      } else if (isInvalidCreds) {
        description = "Invalid email or password. Please check your credentials and try again.";
      }
      
      toast({
        title: "Sign In Error",
        description,
        variant: "destructive"
      });
    }

    return { error };
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Verification Code Sent",
        description: "Please check your inbox for the new 6-digit code."
      });
    }

    return { error };
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email Verified",
        description: "Your account has been successfully verified!"
      });

      // Send welcome email for direct signups (guest users handled by SetPasswordPrompt)
      if (!isGuestAutoCreated()) {
        try {
          const { data: { user: verifiedUser } } = await supabase.auth.getUser();
          if (verifiedUser?.email) {
            supabase.functions.invoke('send-welcome-email', {
              body: { email: verifiedUser.email, language },
            });
          }
        } catch (e) {
          console.error('Welcome email failed:', e);
        }
      }
    }

    return { error };
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    // Store current path (with query params) only if not already set
    // Never store deprecated /dashboard routes - redirect to home instead
    const currentPath = window.location.pathname + window.location.search;
    const safePath = currentPath.startsWith('/dashboard') ? '/' : currentPath;
    const existing = sessionStorage.getItem('post_auth_next');
    if (!existing && safePath !== '/') {
      sessionStorage.setItem('post_auth_next', safePath);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
        ...(provider === 'google'
          ? {
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            }
          : {}),
      },
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  // Helper function to get LINE auth URL without redirecting
  const getLineAuthUrl = async (uiLocale?: string): Promise<{ authUrl: string | null; error: any }> => {
    try {
      const redirectUri = `${window.location.origin}/auth/line/callback`;
      const state = crypto.randomUUID();
      
      // Store state for CSRF verification, redirect_uri for callback
      sessionStorage.setItem('line_auth_state', state);
      sessionStorage.setItem('line_redirect_uri', redirectUri);
      
      // Store current path (with query params) only if not already set
      const currentPath = window.location.pathname + window.location.search;
      const safePath = currentPath.startsWith('/dashboard') ? '/' : currentPath;
      const existing = sessionStorage.getItem('post_auth_next');
      if (!existing && safePath !== '/') {
        sessionStorage.setItem('post_auth_next', safePath);
      }
      
      console.log('[LINE Auth] Getting auth URL with redirect_uri:', redirectUri);
      
      // Import browser detection utilities
      const { isInAppBrowser, isPWA, isDesktop } = await import('@/utils/browserDetection');
      
      // Only disable auto-login in problematic environments
      const shouldDisableAutoLogin = isInAppBrowser() || isPWA() || isDesktop();
      const disableAutoLoginParam = shouldDisableAutoLogin ? '&disable_auto_login=true' : '';
      
      const locale = uiLocale || 'en';
      
      console.log('[LINE Auth] Environment check:', { 
        isInAppBrowser: isInAppBrowser(), 
        isPWA: isPWA(), 
        isDesktop: isDesktop(),
        disableAutoLogin: shouldDisableAutoLogin,
        uiLocale: locale
      });
      
      let response: Response;
      try {
        response = await fetch(
          `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/line-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}${disableAutoLoginParam}&ui_locales=${locale}`
        );
      } catch (fetchErr) {
        return { authUrl: null, error: fetchErr instanceof Error ? fetchErr : new Error('Network request failed') };
      }
      
      let data: any;
      try {
        data = await response.json();
      } catch {
        return { authUrl: null, error: new Error('Invalid server response') };
      }
      
      if (data.error) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        return { authUrl: null, error: new Error(errorMsg) };
      }
      
      return { authUrl: data.authUrl, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get LINE auth URL');
      return { authUrl: null, error };
    }
  };

  const signInWithLine = async (uiLocale?: string) => {
    const { authUrl, error } = await getLineAuthUrl(uiLocale);
    
    if (error) {
      toast({
        title: "LINE Sign In Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
    
    if (authUrl) {
      window.location.href = authUrl;
    }
    
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    // Include current language in redirect URL so email template can use it
    const redirectUrl = `${window.location.origin}/auth/reset-password?lang=${language}`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      toast({
        title: t('auth.resetPasswordErrorTitle') as string,
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: t('auth.resetPasswordSentTitle') as string,
        description: t('auth.resetPasswordSentDesc') as string
      });
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated."
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Try global sign-out (server + local)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn('Global sign-out failed, falling back to local sign-out:', (error as any)?.message || error);
        // Fallback: clear only local session to ensure UI updates
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (err) {
      console.error('Unexpected sign out error, forcing local sign-out:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {}
    } finally {
      // Always clear local state so UI reflects signed-out status
      setSession(null);
      setUser(null);
      // Gentle confirmation (no destructive toast)
      toast({
        title: "Signed out",
        description: "You have been signed out."
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resendVerification,
      verifyOTP,
      signInWithOAuth,
      signInWithLine,
      getLineAuthUrl,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { AuthContextType };