import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * ChatRedirectPage - A dedicated route (/chat) that opens the chat widget
 * and redirects to the homepage.
 * 
 * Usage:
 * - mobile11.com/chat - Opens chat and shows homepage
 * - mobile11.com/chat?to=/esim/japan - Opens chat and redirects to Japan page
 */
export default function ChatRedirectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Dispatch event to open chat widget
    window.dispatchEvent(new CustomEvent('openChatWidget'));
    
    // Get optional redirect destination (default to homepage)
    const destination = searchParams.get('to') || '/';
    
    // Navigate to destination
    navigate(destination, { replace: true });
  }, [navigate, searchParams]);
  
  // Show nothing while redirecting (happens instantly)
  return null;
}
