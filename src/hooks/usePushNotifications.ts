import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = 'BOncjwLlzFaE8yMUzSTZiww8WybG491PghSkYfmjO7kht8ZTkVi-wQ-WqGHId0wI0i5lKaQjP6IToSMOhnGSmgA';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>('prompt');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Check current permission state
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    const currentPermission = Notification.permission as PushPermissionState;
    setPermission(currentPermission);
  }, [isSupported]);

  // Check if user is already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !user) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('[usePushNotifications] Error checking subscription:', err);
      }
    };

    checkSubscription();
  }, [isSupported, user]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      setError('Push notifications are not supported or user not logged in');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);

      if (result !== 'granted') {
        setError('Permission denied');
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await (registration as any).pushManager.getSubscription();

      // Create new subscription if none exists
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await (registration as any).pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer
        });
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth session');
      }

      // Send subscription to backend
      const response = await supabase.functions.invoke('save-push-subscription', {
        body: {
          subscription: subscription.toJSON()
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setIsSubscribed(true);
      console.log('[usePushNotifications] Subscription saved successfully');
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      console.error('[usePushNotifications] Subscribe error:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      console.log('[usePushNotifications] Unsubscribed successfully');
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      console.error('[usePushNotifications] Unsubscribe error:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe
  };
}
