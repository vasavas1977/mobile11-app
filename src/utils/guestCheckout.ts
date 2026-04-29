import { supabase } from '@/integrations/supabase/client';

const GUEST_FLAG_KEY = 'guest_auto_created';

/**
 * Silently create a Supabase account for a guest user via edge function.
 * The edge function uses the admin API to auto-confirm the email.
 * Returns { success, error, needsSignIn }
 *   - needsSignIn=true means the email already has an account
 */
export async function silentSignUp(email: string): Promise<{
  success: boolean;
  error?: string;
  needsSignIn?: boolean;
  rateLimitSeconds?: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('guest-signup', {
      body: { email },
    });

    if (error) {
      console.error('Guest signup function error:', error);
      return { success: false, error: error.message || 'Something went wrong' };
    }

    if (!data) {
      return { success: false, error: 'No response from server' };
    }

    // User already exists — they need to sign in
    if (data.needsSignIn) {
      return { success: false, needsSignIn: true };
    }

    // Rate limited
    if (data.rateLimitSeconds) {
      return { success: false, error: data.error, rateLimitSeconds: data.rateLimitSeconds };
    }

    // General error from edge function
    if (data.success === false) {
      return { success: false, error: data.error || 'Could not create account' };
    }

    // Success — sign in with the password returned by the edge function
    if (data.password) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });
      if (signInError) {
        console.error('Guest sign-in error:', signInError);
        return { success: false, error: 'Account created but could not sign in. Please try signing in manually.' };
      }
    }

    // Mark as guest-created so PaymentSuccessPage can prompt for password
    try {
      sessionStorage.setItem(GUEST_FLAG_KEY, 'true');
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('silentSignUp error:', err);
    return { success: false, error: err.message || 'Something went wrong' };
  }
}

/** Check if the current user was auto-created as a guest */
export function isGuestAutoCreated(): boolean {
  try {
    return sessionStorage.getItem(GUEST_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Clear the guest flag (after they set a password) */
export function clearGuestFlag(): void {
  try {
    sessionStorage.removeItem(GUEST_FLAG_KEY);
  } catch {}
}
