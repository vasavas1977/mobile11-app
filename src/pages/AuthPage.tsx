import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { useNavigate, useLocation } from 'react-router-dom';

export function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for stored path first, then location state, fallback to home
  const storedNext = sessionStorage.getItem('post_auth_next');
  const from = storedNext || (location.state as any)?.from || '/';

  useEffect(() => {
    // Check if this is a password recovery redirect
    const hash = window.location.hash;
    const isRecovery = hash && hash.includes('type=recovery');
    
    if (isRecovery) {
      // Don't redirect - let RecoveryRedirector handle this
      return;
    }
    
    if (user && !loading) {
      // Clear stored path after use
      if (storedNext) {
        sessionStorage.removeItem('post_auth_next');
      }
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from, storedNext]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect in useEffect
  }

  return <AuthForm />;
}