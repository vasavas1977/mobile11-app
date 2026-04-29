# Manus prompt — Mobile11 native iOS + Android (Capacitor wrapper)

Paste everything below into Manus AI as a single prompt.

---

## Goal

Wrap the existing React + Vite web app at **https://mobile11.com** as a native **iOS** and **Android** app using **Capacitor 6**. The web app stays the single source of truth: every Lovable change ships to all three platforms. The native shell adds:

1. **Zero-QR eSIM install** on both iOS and Android.
2. **Native payment sheets** (Stripe — Apple Pay / Google Pay / cards).
3. **2C2P TrueMoney + PromptPay QR** via in-app browser with deep-link return.
4. **Push notifications** (APNs + FCM) registered against our Supabase backend.
5. **Biometric login** (Face ID / fingerprint).
6. **Universal links + custom scheme** so links open inside the app.

---

## App identity

| Field | Value |
|---|---|
| App ID (bundle/package) | `com.mobile11.app` |
| Display name | `Mobile11` |
| Brand color | `#F97316` (orange) |
| Splash background | `#F97316`, white "M11" logo, no spinner |
| Categories | iOS: Travel (primary), Utilities (secondary). Play: Travel & Local |
| Age rating | 4+ / Everyone |
| Custom scheme | `mobile11://` |
| Universal links | `https://mobile11.com/app/*` and Apple-app-site-association at `https://mobile11.com/.well-known/apple-app-site-association` |

The Capacitor config (`capacitor.config.ts`) is already in the repo — do NOT regenerate it; just use it.

---

## Capacitor plugins to install

```
@capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
@capacitor/app @capacitor/browser @capacitor/preferences
@capacitor/push-notifications @capacitor/haptics @capacitor/status-bar
@capacitor/splash-screen @capacitor/device @capacitor/network
@capacitor-community/stripe
@aparajita/capacitor-biometric-auth
@capacitor/live-updates
```

Pin to versions compatible with Capacitor 6.

---

## Production build & live updates

- Production app loads the bundled `dist/` from the Lovable web build (fast cold start).
- `@capacitor/live-updates` channel `production` points at the published `https://mobile11.com` build hash, so JS/UI changes ship without store review.
- Native plugin updates (eSIM installer, Stripe SDK bumps) require store resubmission — keep that to a few times per year.
- Dev: keep `server.url` block in `capacitor.config.ts` commented; uncomment to hot-reload off Lovable preview.

---

## Custom Capacitor plugin: `EsimInstaller`

Create a local plugin under `native-plugins/esim-installer/` and register it on both platforms.

### TypeScript definition

```ts
// native-plugins/esim-installer/src/definitions.ts
export interface EsimInstallerPlugin {
  install(args: { activationCode: string; label?: string }): Promise<{ success: boolean }>;
  isSupported(): Promise<{ supported: boolean }>;
}
```

`activationCode` is always the full LPA string, e.g. `LPA:1$smdp.example.com$ABCDEF1234`.

### iOS implementation (`EsimInstallerPlugin.swift`)

- Default path: open Apple universal link
  `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=<urlencoded LPA>` via `UIApplication.shared.open`.
- Future entitled path (commented, ready to enable when Apple grants `com.apple.CommCenter.fine-grained` carrier entitlement):
  ```swift
  // import CoreTelephony
  // let req = CTCellularPlanProvisioningRequest()
  // req.address = smdp
  // req.matchingID = matchingID
  // CTCellularPlanProvisioning().addPlan(with: req) { result in ... }
  ```
  Parse `LPA:1$<smdp>$<matchingID>` into the request fields.

### Android implementation (`EsimInstallerPlugin.kt`)

- Use `EuiccManager`:
  ```kotlin
  val euicc = context.getSystemService(Context.EUICC_SERVICE) as EuiccManager
  if (!euicc.isEnabled) { reject("eSIM not supported"); return }
  val sub = DownloadableSubscription.forActivationCode(activationCode)
  val intent = Intent(ACTION_DOWNLOAD_SUBSCRIPTION).setPackage(context.packageName)
  val pi = PendingIntent.getBroadcast(context, 0, intent, FLAG_MUTABLE or FLAG_UPDATE_CURRENT)
  euicc.downloadSubscription(sub, true, pi)
  ```
- Register a `BroadcastReceiver` for `ACTION_DOWNLOAD_SUBSCRIPTION`. On `EMBEDDED_SUBSCRIPTION_RESULT_RESOLVABLE_ERROR`, call `euicc.startResolutionActivity(...)` so the system shows the "Download eSIM" prompt.
- Permissions in `AndroidManifest.xml`: `WRITE_EMBEDDED_SUBSCRIPTIONS` (system-level — request anyway; on most OEMs the resolution intent works without it).

### `isSupported()`

Return `true` on iOS 12.1+ (universal link path) and on Android with `euicc.isEnabled == true`.

The web layer calls this plugin via `src/lib/nativeEsimInstall.ts` (already in the repo).

---

## Stripe Payment Sheet (cards / Apple Pay / Google Pay)

Use `@capacitor-community/stripe`.

- Apple Pay merchant ID: `merchant.com.mobile11.app` — generate in App Store Connect, attach to the app's capabilities.
- Google Pay: enable in `AndroidManifest.xml` with `<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="true" />`.
- 3D Secure handled inside the sheet.
- Publishable key (LIVE): `pk_live_LPRLYiv99pAtQpPX5a7zhPDo00ZR2Ey9GK`.
- Backend: existing `create-payment-intent` edge function returns `client_secret`. The native layer will call it via Supabase functions invoke and pass the secret to the sheet.

Wire it in `src/lib/nativePayment.ts` (Manus creates this file). On native checkout:
1. POST to `create-payment-intent` → get `clientSecret`, `customerId`, `ephemeralKey`.
2. `Stripe.createPaymentSheet({ paymentIntentClientSecret, customerId, customerEphemeralKeySecret, merchantDisplayName: 'Mobile11', applePay: { merchantId: 'merchant.com.mobile11.app', merchantCountryCode: 'TH' }, googlePay: { merchantCountryCode: 'TH', testEnv: false } })`.
3. `Stripe.presentPaymentSheet()` → on success, navigate to `/payment-success`.

---

## 2C2P TrueMoney + PromptPay (in-app browser)

We do NOT integrate the 2C2P SDK natively — too heavy and the web flow already works. Instead:

1. App calls existing `create-2c2p-truemoney` or `create-2c2p-promptpay` edge function with body `{ ..., platform: 'native-ios' | 'native-android' }`.
2. Edge function returns a payment URL whose `frontendReturnUrl` is `https://mobile11.com/payment-success?orderId=<id>&native=1`.
3. App opens the URL with `@capacitor/browser`:
   ```ts
   await Browser.open({ url, presentationStyle: 'popover', windowName: '_self' });
   ```
4. The `/payment-success` web page detects `native=1` in the URL and immediately redirects to `mobile11://payment-return?orderId=<id>`.
5. App listens on `App.addListener('appUrlOpen', ...)`. When it sees `mobile11://payment-return`, it:
   - Calls `Browser.close()`.
   - Routes via React Router to `/order/:orderId` and starts polling order status.
6. The 2C2P webhook (`payment-2c2p-webhook`) fulfills the eSIM server-side as today — no change needed.

PromptPay QR works the same way: 2C2P shows the QR inside the in-app browser (SFSafariViewController on iOS, Custom Tabs on Android). User screenshots it or switches to their bank app to scan, then returns to the app — polling picks up the paid status.

---

## Push notifications

1. Register on every login:
   ```ts
   import { PushNotifications } from '@capacitor/push-notifications';
   await PushNotifications.requestPermissions();
   await PushNotifications.register();
   PushNotifications.addListener('registration', async (token) => {
     await supabase.functions.invoke('register-push-device', {
       body: {
         platform: Capacitor.getPlatform(), // 'ios' | 'android'
         token: token.value,
         app_version: APP_VERSION,
         device_model: (await Device.getInfo()).model,
       },
     });
   });
   ```
2. `register-push-device` edge function (already in repo) upserts into `push_devices` table.
3. APNs key + FCM `google-services.json` configured in App Store Connect / Firebase. Use APNs `.p8` key (team-level), not certificate.
4. iOS `Info.plist`: add `UIBackgroundModes = ["remote-notification"]`.

---

## Deep links + universal links

Routes the app must intercept:

| Pattern | Action |
|---|---|
| `mobile11://esim/:id` | Navigate to `/my-esims/:id` |
| `mobile11://order/:id` | Navigate to `/order/:id` |
| `mobile11://topup/:id` | Navigate to `/my-esims/:id?action=topup` |
| `mobile11://payment-return` | Close in-app browser, navigate to `/order/:orderId`, start polling |
| `https://mobile11.com/app/...` | Universal link variants of the above |

iOS: add Associated Domains entitlement `applinks:mobile11.com`.
Android: add `<intent-filter>` with `android:autoVerify="true"` for `https://mobile11.com/app/*` plus a separate filter for the `mobile11` scheme.

Implementation in `src/lib/deepLinks.ts` (Manus creates this) — wire `App.addListener('appUrlOpen', ...)` in `main.tsx` once Capacitor is detected.

---

## Biometric login

Use `@aparajita/capacitor-biometric-auth`. Existing `useTrustedDevice` + `biometric-auth` utility in the web layer already handles WebAuthn. On native, swap the WebAuthn implementation behind a thin wrapper that calls the Capacitor plugin when `isNative()` is true. Store the auth token in `@capacitor/preferences` (Keychain on iOS, encrypted SharedPreferences on Android), gated by biometric prompt.

---

## App Store / Play Store metadata

### Apple — App Store Connect

- **Subtitle:** "Travel eSIM • Stay connected worldwide"
- **Keywords:** `esim,travel sim,roaming,data,thailand,asia,tourist sim,prepaid`
- **Description (short):** "Buy and install travel eSIMs in seconds for 200+ destinations. No physical SIM swap, no roaming bills."
- **Privacy policy:** `https://mobile11.com/privacy`
- **Support URL:** `https://mobile11.com/help`
- **IAP disclosure (review notes):**
  > Mobile11 sells eSIM connectivity, a real-world telecommunications service delivered to physical devices outside the app. Per App Store Review Guideline 3.1.3(e) — Goods and Services Outside the App — payment is processed via Stripe and is exempt from in-app purchase requirements. No digital goods are consumed inside the app.
- **Restore Purchases:** include a stub button on Settings → "Restore purchases" that re-syncs the user's eSIM list from the backend (Apple requires the button text even when no IAP).
- **Demo account:** create `apple-review@mobile11.com` with a pre-loaded test eSIM so reviewers can see the post-purchase flow without paying.

### Google Play

- **Short description:** "Travel eSIMs for 200+ countries — install in seconds, no QR code needed."
- **Full description:** same as Apple, plus highlight the Android one-tap install via system eSIM picker.
- **Data safety form:** declare collection of email, name, payment info (processed by Stripe, not stored), device identifiers (push token), location (only if user opts in for "nearest country" feature).

---

## Assets to generate

| Asset | Sizes |
|---|---|
| App icon | iOS: full set 20pt → 1024pt. Android: `mipmap-mdpi` → `xxxhdpi` plus adaptive icon (108×108dp foreground on `#F97316` background). |
| Splash | 2732×2732 universal, orange `#F97316` with centered white "M11" wordmark. |
| Notification icon (Android) | 24×24dp white silhouette, transparent bg. |

Use the existing brand wordmark from `https://mobile11.com` favicon as the source.

---

## Build & run instructions for the user

After Manus generates the repo, the user runs:

```bash
npm install
npx cap add ios
npx cap add android
npm run build
npx cap sync
# iOS (Mac + Xcode): npx cap open ios
# Android (Android Studio): npx cap open android
```

For TestFlight: archive in Xcode → distribute to App Store Connect → invite testers.
For Play Internal Testing: `./gradlew bundleRelease` → upload `.aab` to Play Console → internal track.

---

## Deliverables

1. Complete `ios/` and `android/` directories generated by `npx cap add`.
2. `native-plugins/esim-installer/` Capacitor plugin (TS + Swift + Kotlin).
3. `src/lib/deepLinks.ts`, `src/lib/nativePayment.ts`, `src/lib/nativePush.ts` glue files.
4. `App.tsx` initialization snippet that registers deep-link listener and push handler when `isNative()`.
5. `ios/App/App/Info.plist` with URL scheme, associated domains, Apple Pay merchant ID, push background mode.
6. `android/app/src/main/AndroidManifest.xml` with intent filters, FCM service, eSIM permission, Google Pay meta-data.
7. App icons, splash screens, and `google-services.json` placeholder.
8. README in repo root: build, sign, submit checklist for both stores.
