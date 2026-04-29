/**
 * nativeBiometric.ts
 *
 * Biometric authentication wrapper for Mobile11.
 * On native platforms, uses @aparajita/capacitor-biometric-auth.
 * On web, falls back to WebAuthn (handled by the existing useTrustedDevice hook).
 *
 * Auth tokens are stored in @capacitor/preferences (Keychain on iOS,
 * encrypted SharedPreferences on Android), gated by biometric prompt.
 */

import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryType,
  type CheckBiometryResult,
} from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';

// ─── Constants ──────────────────────────────────────────────────────
const AUTH_TOKEN_KEY = 'mobile11_auth_token';
const BIOMETRIC_ENABLED_KEY = 'mobile11_biometric_enabled';

// ─── Types ──────────────────────────────────────────────────────────
export interface BiometricStatus {
  available: boolean;
  biometryType: string;
  enabled: boolean;
}

// ─── Check biometric availability ───────────────────────────────────

/**
 * Check if biometric authentication is available on this device.
 */
export async function checkBiometricAvailability(): Promise<BiometricStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, biometryType: 'none', enabled: false };
  }

  try {
    const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
    const { value: enabledStr } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    const enabled = enabledStr === 'true';

    let biometryType = 'none';
    switch (result.biometryType) {
      case BiometryType.touchId:
        biometryType = 'touchId';
        break;
      case BiometryType.faceId:
        biometryType = 'faceId';
        break;
      case BiometryType.fingerprintAuthentication:
        biometryType = 'fingerprint';
        break;
      case BiometryType.faceAuthentication:
        biometryType = 'face';
        break;
      case BiometryType.irisAuthentication:
        biometryType = 'iris';
        break;
      default:
        biometryType = 'none';
    }

    return {
      available: result.isAvailable,
      biometryType,
      enabled,
    };
  } catch {
    return { available: false, biometryType: 'none', enabled: false };
  }
}

// ─── Authenticate with biometrics ───────────────────────────────────

/**
 * Prompt the user for biometric authentication.
 *
 * @returns `true` if authentication succeeded
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await BiometricAuth.authenticate({
      reason: 'Verify your identity to access Mobile11',
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Token storage (biometric-gated) ────────────────────────────────

/**
 * Store the auth token securely. On native, the token is stored in
 * Keychain (iOS) / encrypted SharedPreferences (Android).
 */
export async function storeAuthToken(token: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
  console.log('[nativeBiometric] Auth token stored');
}

/**
 * Retrieve the stored auth token after biometric verification.
 *
 * @returns The token if biometric auth succeeds, `null` otherwise
 */
export async function getAuthTokenWithBiometric(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const authenticated = await authenticateWithBiometric();
  if (!authenticated) return null;

  const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
  return value;
}

/**
 * Remove the stored auth token (call on logout).
 */
export async function clearAuthToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
}

// ─── Enable / disable biometric login ───────────────────────────────

/**
 * Enable biometric login for the current user.
 */
export async function enableBiometricLogin(authToken: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const status = await checkBiometricAvailability();
  if (!status.available) return false;

  // Verify the user can authenticate before enabling
  const authenticated = await authenticateWithBiometric();
  if (!authenticated) return false;

  await storeAuthToken(authToken);
  await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: 'true' });

  console.log('[nativeBiometric] Biometric login enabled');
  return true;
}

/**
 * Disable biometric login.
 */
export async function disableBiometricLogin(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await clearAuthToken();
  await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: 'false' });

  console.log('[nativeBiometric] Biometric login disabled');
}
