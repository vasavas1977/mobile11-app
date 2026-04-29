/**
 * nativePush.ts
 *
 * Push notification registration and handling for Mobile11.
 * Uses @capacitor/push-notifications (APNs on iOS, FCM on Android).
 * Registers device tokens against the Supabase `register-push-device` edge function.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';

// App version — update on each release
const APP_VERSION = '1.0.0';

// ─── Types ──────────────────────────────────────────────────────────
type SupabaseInvokeFn = (
  functionName: string,
  options: { body: Record<string, unknown> },
) => Promise<{ data: unknown; error: unknown }>;

type NavigateFn = (path: string) => void;

// ─── State ──────────────────────────────────────────────────────────
let pushInitialized = false;

/**
 * Initialize push notifications. Call once after login when
 * `Capacitor.isNativePlatform()` is true.
 *
 * @param supabaseInvoke - `supabase.functions.invoke` bound function
 * @param navigate       - React Router navigate function for deep-link handling
 */
export async function initPushNotifications(
  supabaseInvoke: SupabaseInvokeFn,
  navigate: NavigateFn,
): Promise<void> {
  if (pushInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  // 1. Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.warn('[nativePush] Push permission denied');
    return;
  }

  // 2. Register with APNs / FCM
  await PushNotifications.register();

  // 3. Listen for registration token
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('[nativePush] Token received:', token.value);

    const deviceInfo = await Device.getInfo();

    try {
      await supabaseInvoke('register-push-device', {
        body: {
          platform: Capacitor.getPlatform(), // 'ios' | 'android'
          token: token.value,
          app_version: APP_VERSION,
          device_model: deviceInfo.model,
        },
      });
      console.log('[nativePush] Device registered successfully');
    } catch (err) {
      console.error('[nativePush] Failed to register device:', err);
    }
  });

  // 4. Handle registration errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('[nativePush] Registration error:', error);
  });

  // 5. Handle foreground notifications
  PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.log('[nativePush] Foreground notification:', notification);
      // You can show an in-app toast/banner here
    },
  );

  // 6. Handle notification tap (background / killed)
  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      console.log('[nativePush] Notification tapped:', action);

      const data = action.notification.data;

      // Route based on notification payload
      if (data?.route) {
        navigate(data.route as string);
      } else if (data?.orderId) {
        navigate(`/order/${data.orderId}`);
      } else if (data?.esimId) {
        navigate(`/my-esims/${data.esimId}`);
      }
    },
  );

  pushInitialized = true;
  console.log('[nativePush] Push notifications initialized');
}

/**
 * Remove all push notification listeners (call on logout).
 */
export async function teardownPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
  pushInitialized = false;
}
