import { WebPlugin } from '@capacitor/core';
import type { EsimInstallerPlugin } from './definitions';

export class EsimInstallerWeb extends WebPlugin implements EsimInstallerPlugin {
  async install(_args: { activationCode: string; label?: string }): Promise<{ success: boolean }> {
    throw this.unavailable('EsimInstaller is not available on web. Use QR code fallback.');
  }

  async isSupported(): Promise<{ supported: boolean }> {
    return { supported: false };
  }
}
