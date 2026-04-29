import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config for Mobile11 native iOS + Android shell.
 *
 * - In dev, uncomment the `server.url` block to hot-reload from Lovable preview.
 * - In production, the bundled `dist/` is loaded for fast cold start; the JS
 *   bundle is then updated over-the-air via @capacitor/live-updates pointing
 *   at the production web build.
 */
const config: CapacitorConfig = {
  appId: 'com.mobile11.app',
  appName: 'Mobile11',
  webDir: 'dist',
  // Production: load bundled dist for fast launch.
  // Dev hot-reload (optional): uncomment to point at Lovable preview.
  // server: {
  //   url: 'https://6aee0b51-a190-4829-b163-559d3bc9709c.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#F97316',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
