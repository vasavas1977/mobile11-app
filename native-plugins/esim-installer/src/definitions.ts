export interface EsimInstallerPlugin {
  /**
   * Install an eSIM profile using the provided LPA activation code.
   *
   * @param args.activationCode - Full LPA string, e.g. `LPA:1$smdp.example.com$ABCDEF1234`
   * @param args.label - Optional human-readable label for the eSIM plan
   * @returns Promise resolving to `{ success: boolean }`
   */
  install(args: { activationCode: string; label?: string }): Promise<{ success: boolean }>;

  /**
   * Check whether the device supports eSIM installation.
   *
   * - iOS 12.1+: always `true` (uses universal link path)
   * - Android: `true` when `EuiccManager.isEnabled` returns `true`
   *
   * @returns Promise resolving to `{ supported: boolean }`
   */
  isSupported(): Promise<{ supported: boolean }>;
}
