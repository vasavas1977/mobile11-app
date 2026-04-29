import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "facebook-oauth-result";

export function FacebookOAuthCallback() {
  const [searchParams] = useSearchParams();
  const [showManualClose, setShowManualClose] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error') || searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description') || searchParams.get('error_message');
    const errorCode = searchParams.get('error_code');
    const errorReason = searchParams.get('error_reason');

    const payload = error
      ? {
          type: 'facebook-oauth-callback',
          error: errorDescription || error,
          error_code: errorCode,
          error_reason: errorReason,
          rawQuery: window.location.search,
        }
      : code
        ? { type: 'facebook-oauth-callback', code }
        : null;

    if (!payload) return;

    // Try postMessage first
    if (window.opener) {
      window.opener.postMessage(payload, '*');
      window.close();
      return;
    }

    // Fallback: write to localStorage so the parent can pick it up via storage event
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to write OAuth result to localStorage', e);
    }

    // Try closing; if blocked, show manual close button after 2s
    window.close();
    setTimeout(() => setShowManualClose(true), 2000);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {showManualClose ? (
          <>
            <p className="text-foreground font-medium mb-2">Authorization complete!</p>
            <p className="text-sm text-muted-foreground mb-4">
              You can close this window and return to the Contact Center.
            </p>
            <Button onClick={() => window.close()}>Close Window</Button>
          </>
        ) : (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Processing Facebook login...</p>
            <p className="text-sm text-muted-foreground mt-2">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  );
}
