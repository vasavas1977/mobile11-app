import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Detects Supabase password recovery hash in the URL and redirects to the reset password page.
 * This is a safety net in case Supabase redirects to the wrong path (e.g., "/" instead of "/auth/reset-password").
 */
export function RecoveryRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    
    // Check if this is a password recovery redirect
    // Supabase recovery URLs contain: #access_token=...&type=recovery
    if (hash && hash.includes('type=recovery')) {
      console.log('[RecoveryRedirector] Detected recovery hash');
      
      // Only redirect if we're NOT already on the reset password page
      if (!location.pathname.includes('/auth/reset-password')) {
        console.log('[RecoveryRedirector] Redirecting to /auth/reset-password');
        
        // Extract lang parameter from hash if present, or from URL search params
        const searchParams = new URLSearchParams(location.search);
        const lang = searchParams.get('lang') || 'en';
        
        // Navigate to reset password page, preserving the hash for Supabase to process
        navigate(`/auth/reset-password?lang=${lang}${hash}`, { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
}
