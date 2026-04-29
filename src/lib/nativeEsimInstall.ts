/**
 * nativeEsimInstall.ts
 *
 * Thin wrapper around the custom EsimInstaller Capacitor plugin.
 * The web app calls these functions; on native they invoke the real
 * plugin, on web they fall back gracefully (show QR code).
 */

import { Capacitor } from '@capacitor/core';
import { EsimInstaller } from '../../native-plugins/esim-installer/src';

/**
 * Returns true when running on a native platform that supports
 * zero-QR eSIM installation.
 */
export async function isEsimInstallSupported(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { supported } = await EsimInstaller.isSupported();
    return supported;
  } catch {
    return false;
  }
}

/**
 * Trigger the native eSIM install flow.
 *
 * @param activationCode Full LPA string, e.g. `LPA:1$smdp.example.com$ABCDEF`
 * @param label          Optional human-readable plan label
 * @returns `true` if the install was initiated successfully
 */
export async function installEsim(
  activationCode: string,
  label?: string,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('[nativeEsimInstall] Not on native platform — use QR code fallback.');
    return false;
  }

  try {
    const { success } = await EsimInstaller.install({ activationCode, label });
    return success;
  } catch (err) {
    console.error('[nativeEsimInstall] Install failed:', err);
    return false;
  }
}
