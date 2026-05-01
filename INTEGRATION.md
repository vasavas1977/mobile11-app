# EsimInstaller Plugin — Integration Guide

This document covers how the `@mobile11/capacitor-esim-installer` plugin is integrated into the Mobile11 Capacitor app, including build configuration, manifest entries, and app signing requirements.

## Plugin Location

The plugin lives at `native-plugins/esim-installer/` and is linked locally — it is not published to npm.

## Installation

No `npm install` is required for the local plugin. The integration is handled entirely through Gradle and CocoaPods configuration that is already committed to the repository.

### Android (already configured)

The plugin is wired into the Android build via `android/settings.gradle`:

```groovy
include ':esim-installer'
project(':esim-installer').projectDir = new File('../native-plugins/esim-installer/android')
```

The host app's `android/app/build.gradle` includes the plugin as a dependency through Capacitor's auto-linking, and `MainActivity.kt` manually registers the plugin:

```kotlin
import com.mobile11.esiminstaller.EsimInstallerPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(EsimInstallerPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

### iOS (already configured)

The plugin is linked via CocoaPods in `ios/App/Podfile`:

```ruby
pod 'EsimInstaller', :path => '../../native-plugins/esim-installer'
```

After any changes to the iOS plugin, run:

```bash
cd ios/App && pod install
```

### Syncing

After modifying plugin TypeScript or native code:

```bash
npx cap sync android
npx cap sync ios
```

## Android Manifest

### Phase 1 (current)

**No additional permissions are declared.** The `EuiccManager.downloadSubscription` API with the resolvable-error path does not require `WRITE_EMBEDDED_SUBSCRIPTIONS` for non-system apps. The system handles the confirmation UI natively.

The plugin's `AndroidManifest.xml` contains only the manifest root element with a comment explaining this decision.

### Phase 2 (future)

When BF76 carrier privilege silent install is implemented, the following will be added:

```xml
<uses-permission android:name="android.permission.WRITE_EMBEDDED_SUBSCRIPTIONS" />
```

This will only be added after SM-DP+ metadata coordination with 1-TO-ALL is complete and the app's signing cert hash is embedded in profile metadata.

## Gradle Configuration

No modifications to the host app's `build.gradle` are required. The plugin's own `android/build.gradle` specifies:

| Setting | Value |
|---------|-------|
| `minSdkVersion` | 24 (inherited from host app) |
| `compileSdkVersion` | 34 |
| `targetSdkVersion` | 34 |
| Java/Kotlin target | 17 |

The plugin gates `EuiccManager` usage behind `Build.VERSION.SDK_INT >= 28` at runtime, so the host app's `minSdk` of 24 is preserved.

## Capacitor Configuration

**No changes to `capacitor.config.ts` are required.** The plugin is auto-detected through the local linking in `settings.gradle` and manual registration in `MainActivity.kt`.

## App Signing and Keystore Ownership

### Critical: 1-TO-ALL controls all signing keys

The Mobile11 Android app signing cert is a long-lived asset tied to the Phase 2 SM-DP+ profile metadata roadmap. All signing is managed by 1-TO-ALL Co., Ltd.

### Google Play App Signing

The app uses Google Play App Signing. This means:

1. **Upload key** — held by 1-TO-ALL, used to sign AABs before upload to Play Console
2. **App Signing key** — managed by Google, used to sign the final APK distributed to users

The Google-managed App Signing key's SHA-256 hash is what will eventually be bound to BF76 metadata in SM-DP+ profiles for Phase 2 silent install.

### Certificate Hashes

| Key | SHA-256 Hash | Source |
|-----|-------------|--------|
| Upload key cert | `[TO BE PROVIDED BY 1-TO-ALL]` | From the upload keystore |
| Google Play App Signing cert | `[RETRIEVE FROM PLAY CONSOLE]` | Play Console → Release → Setup → App signing |

To retrieve the App Signing cert hash from Play Console:

1. Go to **Play Console → your app → Release → Setup → App signing**
2. Under "App signing key certificate", copy the **SHA-256 certificate fingerprint**
3. Update this table with the value

### Security Rules

- **Never commit** any keystore (`.jks`, `.p12`) or signing config containing real key material to this repository
- CI signing configuration goes through Codemagic environment variables / GitHub Actions secrets
- The Codemagic CI pipeline references the keystore via encrypted environment variables (`ANDROID_KEYSTORE`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`)

### Build Outputs

- **Debug builds**: Signed with the Android debug keystore (for local testing only)
- **Release builds (CI)**: Signed with the 1-TO-ALL upload keystore via Codemagic
- **Distribution**: Google re-signs with the App Signing key before delivery to users

## Troubleshooting

### Plugin not found at runtime

If `EsimInstaller` is not available at runtime:

1. Verify `MainActivity.kt` has `registerPlugin(EsimInstallerPlugin::class.java)` before `super.onCreate()`
2. Run `npx cap sync android`
3. Clean and rebuild: `cd android && ./gradlew clean assembleDebug`

### EuiccManager returns null

Some devices (especially Chinese-market variants) may have `EuiccManager` available at API level but return `null` from `getSystemService()`. The plugin handles this gracefully by rejecting with `EUICC_UNAVAILABLE`.

### Resolution activity not starting

On some OEM skins (Xiaomi MIUI, vivo FuntouchOS), the system resolution activity may fail to launch. The plugin catches this and rejects with `RESOLUTION_FAILED`. Users on these devices should fall back to the QR code installation method.
