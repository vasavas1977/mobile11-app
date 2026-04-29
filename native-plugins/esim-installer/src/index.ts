import { registerPlugin } from '@capacitor/core';
import type { EsimInstallerPlugin } from './definitions';

const EsimInstaller = registerPlugin<EsimInstallerPlugin>('EsimInstaller', {
  web: () => import('./web').then((m) => new m.EsimInstallerWeb()),
});

export * from './definitions';
export { EsimInstaller };
