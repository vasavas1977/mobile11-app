import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { consumePostAuthNext } from "@/utils/postAuthNext";

export function PostAuthRedirector() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for navigateToCart events from CartContext
  useEffect(() => {
    const handleNavigateToCart = () => {
      if (location.pathname !== '/cart') {
        navigate('/cart');
      }
    };
    
    window.addEventListener('navigateToCart', handleNavigateToCart);
    return () => window.removeEventListener('navigateToCart', handleNavigateToCart);
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (loading || !user) return;

    // Only auto-redirect from public/auth entry points to avoid surprising navigation.
    const fromAllowedPath = ["/", "/auth", "/auth/callback"].includes(location.pathname);
    if (!fromAllowedPath) return;

    // Use centralized helper that filters deprecated routes like /dashboard
    const next = consumePostAuthNext('/');
    
    // No redirect needed if going to home (default)
    if (next === '/') return;

    navigate(next, { replace: true });
  }, [loading, user, location.pathname, navigate]);

  return null;
}
