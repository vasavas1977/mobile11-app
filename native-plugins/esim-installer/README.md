# @mobile11/capacitor-esim-installer

Capacitor plugin for one-tap eSIM installation on Android via `EuiccManager`. This is **Phase 1** — the system resolution UI flow where the user confirms each install in the Android system sheet.

## Scope

### Phase 1 (this build)

The plugin invokes `EuiccManager.downloadSubscription(...)` which triggers the Android system "Download eSIM" confirmation sheet. The user taps "Download" in the system UI, and the plugin resolves its JS promise once the intent handoff succeeds. Activation confirmation happens server-side via the SM-DP+ webhook — the plugin does not poll for install completion.

### Phase 2 (future ticket, not implemented here)

Silent install via Android carrier privilege rules. As an MNO, 1-TO-ALL will embed the app's signing cert hash into each Mobile11 profile via the BF76 metadata tag. When BF76 matches the calling app's signature, `EuiccManager` authorizes the download without the user-visible resolution UI. This will not change the JS interface — only the native implementation path.

## Android Requirements

| Requirement | Value |
|-------------|-------|
| Min API for eSIM | 28 (Android 9) |
| Host app minSdk | 24 (unchanged) |
| EuiccManager check | `isEnabled()` must return `true` |
| Permissions added | None (Phase 1 does not require `WRITE_EMBEDDED_SUBSCRIPTIONS`) |

The plugin gates all `EuiccManager` calls behind `Build.VERSION.SDK_INT >= 28`. On devices below API 28, or where `EuiccManager.isEnabled()` returns `false`, the plugin rejects with `EUICC_UNAVAILABLE` and the JS layer falls back to QR code display.

## iOS Behavior

On iOS, the JS wrapper (`src/lib/nativeEsimInstall.ts`) routes eSIM installation through the Apple universal link (`esimsetup.apple.com`) and **does not invoke this plugin**. The iOS implementation in this package uses the same universal link path as a fallback, but it is not the primary iOS install mechanism. A future ticket will implement `CTCellularPlanProvisioning` once Apple grants the carrier entitlement to 1-TO-ALL.

## Error Codes

| Code | Meaning |
|------|---------|
| `INVALID_ACTIVATION_CODE` | String does not match `LPA:1$<smdp>$<matchingId>` format |
| `EUICC_UNAVAILABLE` | Device has no eUICC, runs API < 28, or `EuiccManager.isEnabled()` returns `false` |
| `RESOLUTION_FAILED` | Android refused to start the resolution intent |
| `USER_CANCELED` | User dismissed the system prompt (when observable) |
| `UNKNOWN` | Any other failure |

Error codes are returned in the rejection payload as `error.code` (string) and `error.data.code` (string).

## Security

The activation code (`LPA:1$...`) is treated as a sensitive credential:

- Never logged in full — only the first 8 characters appear in any log output
- Never written to disk, analytics, or crash reporting
- Never duplicated into any intent, broadcast, or service binding beyond what `EuiccManager` requires internally
- These rules apply in both `BuildConfig.DEBUG` and release builds

## Testing on Real Devices

### Prerequisites

1. A physical device with eUICC hardware (emulators do not have `EuiccManager`)
2. Disposable test LPA activation codes from 1-TO-ALL ops (coordinated separately)
3. The app installed via `adb install` or Play Internal Testing track

### Test Matrix

| Device | Expected Behavior | Notes |
|--------|-------------------|-------|
| Pixel 6+ (Android 14) | System "Download eSIM" sheet appears, install completes | Reference implementation |
| Samsung S22+ (One UI 6) | Same as Pixel | Samsung's eUICC path is stock-compatible |
| OPPO Reno/Find series | Should pass | Top-3 Thai handset brand, stock `EuiccManager` compatible |
| Xiaomi (eSIM-capable) | May be flaky | Some Xiaomi models override `EuiccManager` with custom UI. Document failures but do not block launch |
| vivo (eSIM-capable) | Requires manual eSIM enable | Users must enable eSIM in Settings before the install link works. Document this prerequisite in user-facing help |
| Android 9 device without eUICC | Rejects with `EUICC_UNAVAILABLE` | Tests the `isEnabled()` path |
| API < 28 device | Rejects with `EUICC_UNAVAILABLE` | Tests the SDK version gate |

### Testing Steps

```bash
# 1. Build and install the app
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# 2. Open the app, navigate to an eSIM plan, tap "Install eSIM"

# 3. Observe the system "Download eSIM" sheet

# 4. Confirm download — the plugin resolves with { success: true }

# 5. Verify the eSIM appears in Settings → Mobile network → eSIM list
```

### Cleaning Up Test Profiles

Test cycles will leave accumulated eSIM profiles on devices. To remove them:

1. Go to **Settings → Mobile network** (or **Connections → SIM manager** on Samsung)
2. Tap the eSIM profile you want to remove
3. Tap **Delete** or **Remove eSIM**
4. Confirm deletion

On some OEMs (Xiaomi, vivo), the path may be **Settings → SIM cards & mobile networks → eSIM management**.

## JS Usage

```typescript
// Already in production at src/lib/nativeEsimInstall.ts
import { EsimInstaller } from '../../native-plugins/esim-installer/src';

const result = await EsimInstaller.install({
  activationCode: 'LPA:1$smdp.example.com$ABC123',
  label: 'Mobile11 Japan 5GB'  // optional
});
// result.success === true means intent handoff succeeded
```

## Build

```bash
cd native-plugins/esim-installer
npm install
npm run build
```

The plugin is linked into the host app via `android/settings.gradle` — no separate `npm install` in the host app is needed for the local plugin.
