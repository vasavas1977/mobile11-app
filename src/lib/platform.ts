/**
 * platform.ts
 *
 * Platform detection utilities for Mobile11.
 */

import { Capacitor } from '@capacitor/core';

/** Returns true when running inside the native Capacitor shell */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Returns 'ios' | 'android' | 'web' */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/** Returns true when running on iOS (native) */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/** Returns true when running on Android (native) */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}
