import { WebPlugin } from '@capacitor/core';
import type { EsimInstallerPlugin } from './definitions';

export class EsimInstallerWeb extends WebPlugin implements EsimInstallerPlugin {
  async install(_args: { activationCode: string; label?: string }): Promise<{ success: boolean }> {
    // On web, eSIM install is not possible — show QR code instead.
    console.warn('EsimInstaller.install() called on web — not supported. Show QR code fallback.');
    return { success: false };
  }

  async isSupported(): Promise<{ supported: boolean }> {
    return { supported: false };
  }
}
