# Mobile11 Native App — Architecture & Manus Prompt (v3)

## Strategy

A **Capacitor wrapper** around the existing Lovable web app. One codebase = web + iOS + Android. Every Lovable change ships to all three platforms instantly via the WebView; only native plugins (eSIM install, native pay, push, biometrics) need an app-store update.

```text
Lovable repo (single source of truth)
        │
        ├─► mobile11.com (web)
        └─► Capacitor shell ─► App Store (iOS) + Play Store (Android)
                  │
                  └─► Native bridges:
                        • esim-install   (zero-QR install, both OS)
                        • stripe-native  (Apple Pay / Google Pay sheet)
                        • 2c2p-browser   (TrueMoney + PromptPay QR)
                        • push           (APNs / FCM)
                        • biometrics     (Face ID / fingerprint)
                        • deep links     (mobile11://)
```

## What changes in Lovable (small, additive)

1. `src/lib/platform.ts` — exposes `isNative`, `isIOS`, `isAndroid` via `Capacitor.isNativePlatform()`.
2. **Native install button** — in `MyEsimDetail` and post-purchase, when `isNative`, call `EsimInstaller.install({ activationCode })` instead of QR. On web/PWA, keep current `esimsetup://` universal-link flow.
3. **Checkout payment selector** — same UI as web. On native:
   - **Card / Apple Pay / Google Pay** → native Stripe Payment Sheet (one-tap, biometric)
   - **TrueMoney** → existing `create-2c2p-truemoney` opens redirect URL in `@capacitor/browser`
   - **PromptPay QR** → existing `create-2c2p-promptpay` opens 2C2P web URL in `@capacitor/browser`; user screenshots the QR or switches to bank app to scan
   - After payment, 2C2P redirects to `mobile11://payment-return?orderId=…` → app closes browser, navigates to order screen, polls status.
4. **Push notifications** — register device token on login → new edge fn `register-push-device` saves to `push_devices` table.
5. **Deep links** — `mobile11://esim/:id`, `mobile11://order/:id`, `mobile11://payment-return`. Universal links also accepted at `https://mobile11.com/app/*`.
6. **App Store compliance** — already have Privacy + Terms; add small "Restore purchases" stub (Apple requires it even though we don't sell IAP).

No UI redesign needed. Existing 390×844 mobile web layout works as-is.

## Capacitor config

`capacitor.config.ts`:
- `appId: com.mobile11.app`, `appName: Mobile11`
- Production: bundled `dist/` for fast cold start
- Live updates: `@capacitor/live-updates` against Lovable build output → push UI/logic changes without store review
- Dev hot-reload: optional `server.url` to your Lovable preview

## eSIM install — no QR, both platforms

| Platform | Method | UX |
|---|---|---|
| iOS (today) | Universal link `https://esimsetup.apple.com/...?carddata=LPA:1$smdp$code` via `App.openUrl` | Tap → iOS Settings opens with eSIM pre-filled → Confirm |
| iOS (future) | `CTCellularPlanProvisioning` — requires Apple Carrier Entitlement | True one-tap, no Settings switch |
| Android | `EuiccManager.startResolutionActivity(LPA code)` via custom plugin | Tap → system prompt → Confirm |

Manus scaffolds both `EsimInstallerPlugin.kt` and `EsimInstallerPlugin.swift` (entitlement code path commented, ready when Apple approves).

## Payments inside the app — Stripe + 2C2P (TrueMoney & PromptPay only)

| Method | Channel | How it works in native |
|---|---|---|
| Card (Visa/MC/JCB/Amex/UnionPay) | Stripe | Native Payment Sheet via `@capacitor-community/stripe`. 3D Secure handled in-sheet. |
| Apple Pay | Stripe | One-tap, Face ID confirm. Merchant ID `merchant.com.mobile11.app`. |
| Google Pay | Stripe | One-tap, fingerprint confirm. |
| TrueMoney Wallet | 2C2P | Existing `create-2c2p-truemoney` → open redirect URL in `@capacitor/browser` → deep-link return |
| PromptPay QR | 2C2P | Existing `create-2c2p-promptpay` → 2C2P shows QR inside in-app browser; user screenshots / switches to bank app to scan. Polling on return verifies payment. |

eSIM is a **connectivity service** → exempt from Apple's 30% IAP rule (App Store guideline 3.1.3(e)). Real card processing is allowed.

### How 2C2P deep-link return works

1. User picks TrueMoney or PromptPay → app calls existing edge function → gets payment URL.
2. App opens URL with `Browser.open({ url, presentationStyle: 'popover' })`.
3. We modify the 2C2P `frontendReturnUrl` to `https://mobile11.com/payment-success?...&platform=native`.
4. That page detects native context → redirects to `mobile11://payment-return?orderId=…` → app intercepts, closes browser, navigates to order screen, polls status.
5. Webhook `payment-2c2p-webhook` fulfills the eSIM server-side as today (no change).

Only edge change: existing `create-2c2p-truemoney` and `create-2c2p-promptpay` accept a new `platform: 'native'` param to swap return URL.

## Project structure

```
/                            ← existing Lovable repo (unchanged)
├── src/
│   └── lib/platform.ts      ← NEW
├── capacitor.config.ts      ← already exists, will be updated
├── ios/                     ← generated by Manus
├── android/                 ← generated by Manus
├── native-plugins/
│   └── esim-installer/      ← custom Capacitor plugin (Kotlin + Swift)
└── MANUS_NATIVE_APP_PROMPT.md  ← NEW — what you paste into Manus
```

## Workflow after launch

1. Edit in Lovable → push.
2. Web: live instantly on mobile11.com.
3. Native: live updates fetch new bundle on next launch (no store review).
4. Native plugin / SDK changes: rebuild + submit. Rare.

## What I'll do in build mode

1. Add `src/lib/platform.ts`, native install hook, deep-link router; update `capacitor.config.ts`.
2. Tweak existing checkout to route native users into Stripe Payment Sheet (cards/Apple/Google Pay) and 2C2P in-app browser (TrueMoney + PromptPay).
3. Modify `create-2c2p-truemoney` and `create-2c2p-promptpay` edge functions to accept `platform: 'native'` and return the deep-link return URL. Add `/payment-success` page logic to bounce native users back into the app.
4. Create `register-push-device` edge function + `push_devices` table.
5. Write `MANUS_NATIVE_APP_PROMPT.md` — full prompt with appId, plugins list, custom-plugin scaffolds, store-submission text, asset specs.

---

## Manus prompt — preview

> Build a Capacitor 6 native iOS + Android wrapper for the existing React/Vite app. App ID `com.mobile11.app`, name "Mobile11". Brand orange `#F97316`. Production loads bundled `dist/`; enable `@capacitor/live-updates` against Lovable build output.
>
> **Plugins:** `@capacitor/app`, `@capacitor/browser`, `@capacitor/push-notifications`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor-community/stripe`, `@capacitor/biometric-auth`.
>
> **Custom plugins:**
> 1. **EsimInstaller.install({activationCode})** — iOS opens `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$<smdp>$<code>`; Android calls `EuiccManager.downloadSubscription` via `startResolutionActivity`. Scaffold `CTCellularPlanProvisioning` path commented for future entitlement.
> 2. **PushBridge.register()** — registers APNs/FCM token, POSTs to `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/register-push-device` with user JWT.
>
> **Deep links:** scheme `mobile11://`, universal links `https://mobile11.com/app/*`. Routes: `/esim/:id`, `/order/:id`, `/topup/:id`, `/payment-return`. The handler closes any open in-app browser then navigates the React Router.
>
> **Stripe Payment Sheet:** Apple Pay merchant `merchant.com.mobile11.app`, Google Pay enabled, 3DS supported.
>
> **2C2P (TrueMoney + PromptPay only):** opened via `@capacitor/browser` (SFSafariViewController on iOS, Custom Tabs on Android). Detect `mobile11://payment-return` → close browser, dispatch event to web layer.
>
> **Splash + icons:** orange `#F97316` background, white "M11". Generate all iOS/Android sizes.
>
> **App Store metadata:** Travel + Utilities, age 4+. IAP disclosure: "Mobile11 sells eSIM connectivity, a real-world telecommunications service, payment processed via Stripe per Apple guideline 3.1.3(e)."
>
> **Output:** complete repo with `ios/` and `android/`, signed-build instructions, store submission checklists.

Full prompt with all edge cases, asset specs, and store-listing copy ships as `MANUS_NATIVE_APP_PROMPT.md` after approval.

---

**Approve to proceed?** I'll then add the Capacitor scaffolding, the small Lovable changes for native pay routing (Stripe + 2C2P TrueMoney/PromptPay), the deep-link return handler, push device table/edge fn, and write the full Manus prompt file.
