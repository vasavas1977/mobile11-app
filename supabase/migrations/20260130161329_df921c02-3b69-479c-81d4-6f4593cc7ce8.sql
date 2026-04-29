-- Phase 1: Getting Started Category - Enhanced Installation Articles (EN)

-- Article 1: Install eSIM via QR Code on iOS (English)
INSERT INTO kb_articles (slug, category, language, title, content, description, table_of_contents, display_order, source, is_published, is_internal)
VALUES (
  'install-esim-ios-qr',
  'getting-started',
  'en',
  'How to Install an eSIM on iPhone (QR Code)',
  '## Before You Begin {#before-you-begin}

Before installing your Mobile11 eSIM, please ensure:

- **Your device supports eSIM**: iPhone XS and newer models support eSIM
- **Your device is carrier-unlocked**: Contact your carrier if unsure
- **You have a stable WiFi or data connection**: Required for eSIM activation
- **You have access to your Mobile11 account**: To view installation details

## Where to Find Your eSIM Installation Details {#find-details}

After purchasing an eSIM from Mobile11:

1. Open the **Mobile11 app** or visit **mobile11.com**
2. Go to **My eSIMs** in your account
3. Select the eSIM you want to install
4. Tap **View Installation Details**
5. You will see your **QR code** and manual installation details

### Why can''t I find installation instructions?

Installation details are only available after your purchase is complete. If you don''t see them:
- Check that payment was successful
- Look in your email for purchase confirmation
- Contact Mobile11 support if the issue persists

## Step-by-Step Installation {#installation-steps}

### Step 1: Open Settings
Go to **Settings** on your iPhone.

### Step 2: Navigate to eSIM Settings
- **iOS 17.4+**: Tap **Cellular** or **Mobile Data** → **Add eSIM**
- **iOS 16 and earlier**: Tap **Cellular** → **Add Cellular Plan**

### Step 3: Scan the QR Code
Select **Use QR Code** and point your camera at the QR code displayed in your Mobile11 account.

### Step 4: Wait for eSIM Detection
Your iPhone will detect and download the eSIM. This may take 1-2 minutes.

### Step 5: Label Your eSIM
Give your eSIM a recognizable label like "Mobile11 Travel" or the destination country name.

### Step 6: Configure Default Line Settings
When prompted, configure the following:

- **Default Line**: Keep your primary SIM for calls/texts
- **iMessage & FaceTime**: Keep your primary SIM
- **Cellular Data**: Select your **Mobile11 eSIM**

### Step 7: Disable Data Switching
When asked about cellular data switching, select **Turn Off** to avoid unexpected charges on your primary SIM.

### Step 8: Complete Setup
Tap **Done** to finish. Your eSIM is now installed!

## How to Connect to Mobile Data {#connect-data}

Your eSIM won''t connect automatically—you need to enable it when you arrive at your destination:

1. Go to **Settings** → **Cellular/Mobile Data**
2. Ensure **Cellular Data** is turned **ON**
3. Select your **Mobile11 eSIM** as the data line
4. Turn on **Data Roaming** for the eSIM line
5. Wait 30 seconds to 2 minutes for connection

### Troubleshooting Connection Issues

If you don''t connect immediately:
- Toggle Airplane Mode on and off
- Restart your device
- Ensure Data Roaming is enabled for the eSIM
- Check that you''re in a coverage area

## Prefer Another Installation Method? {#alternative-methods}

If QR code scanning isn''t working, you can:
- [Install manually using activation code](/support/getting-started/install-esim-ios-manual)
- [Install directly from the Mobile11 app](/support/getting-started/install-esim-app-ios)

## Frequently Asked Questions {#faq}

### Can I install the eSIM before my trip?
Yes! Most Mobile11 eSIMs can be installed anytime. The data package activates when you first connect to a network at your destination.

### What if my QR code won''t scan?
Try increasing screen brightness, ensuring good lighting, or use the manual installation method instead.

### Can I use my eSIM on multiple devices?
No, each eSIM can only be installed on one device. If you switch devices, you''ll need to purchase a new eSIM.',
  'Complete guide to installing a Mobile11 eSIM on iPhone using QR code scanning, with default line configuration and connection instructions.',
  '[{"id":"before-you-begin","title":"Before You Begin"},{"id":"find-details","title":"Find Your Installation Details"},{"id":"installation-steps","title":"Step-by-Step Installation"},{"id":"connect-data","title":"How to Connect to Mobile Data"},{"id":"alternative-methods","title":"Alternative Methods"},{"id":"faq","title":"FAQ"}]',
  1,
  'both',
  true,
  false
)
ON CONFLICT (slug, category, language)
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article 2: Install eSIM Manually on iOS (English)
INSERT INTO kb_articles (slug, category, language, title, content, description, table_of_contents, display_order, source, is_published, is_internal)
VALUES (
  'install-esim-ios-manual',
  'getting-started',
  'en',
  'How to Install an eSIM on iPhone (Manual / Activation Code)',
  '## When to Use Manual Installation {#when-to-use}

Manual installation is useful when:
- Your camera cannot scan the QR code
- You''re setting up on the same device displaying the code
- You prefer entering details directly

## Find Your Activation Details {#find-details}

1. Log in to your **Mobile11 account**
2. Go to **My eSIMs**
3. Select your purchased eSIM
4. Tap **Installation Details** → **Install Manually**
5. You''ll see:
   - **SM-DP+ Address** (server address)
   - **Activation Code** (unique identifier)

### What is an SM-DP+ Address?

The SM-DP+ (Subscription Manager Data Preparation) address is the server from which your device downloads the eSIM profile. It looks like: `smdp.io` or similar.

## Step-by-Step Manual Installation {#installation-steps}

### Step 1: Open Settings
Go to **Settings** on your iPhone.

### Step 2: Navigate to eSIM Settings
- **iOS 17.4+**: Tap **Cellular** → **Add eSIM** → **Use QR Code** → **Enter Details Manually**
- **iOS 16 and earlier**: Tap **Cellular** → **Add Cellular Plan** → **Enter Details Manually**

### Step 3: Enter SM-DP+ Address
Copy and paste the SM-DP+ address from your Mobile11 account into the first field.

### Step 4: Enter Activation Code
Copy and paste your activation code into the second field. This code is case-sensitive.

### Step 5: Download eSIM Profile
Tap **Next** or **Continue**. Your iPhone will download the eSIM profile.

### Step 6: Label Your eSIM
Choose a label like "Mobile11 Travel" for easy identification.

### Step 7: Configure Default Lines

**Default Voice Line**: Keep your primary SIM
**iMessage & FaceTime**: Keep your primary SIM  
**Cellular Data**: Select **Mobile11 eSIM**
**Allow Cellular Data Switching**: Turn **OFF**

### Step 8: Complete Setup
Tap **Done**. Your eSIM is installed and ready!

## Connect to Mobile Data {#connect-data}

When you arrive at your destination:

1. **Settings** → **Cellular/Mobile Data**
2. Turn **Cellular Data** ON
3. Select Mobile11 eSIM as your data line
4. Enable **Data Roaming** for the eSIM
5. Wait for network connection (up to 2 minutes)

## Common Issues {#troubleshooting}

### "Cannot Add Cellular Plan"
- Ensure you have WiFi or mobile data connection
- Check that codes are copied correctly without extra spaces
- Verify your device is carrier-unlocked

### "eSIM Already Installed"
Each eSIM can only be installed once. If you removed it, you may need to purchase a new one.

### Activation Code Not Working
- Ensure there are no extra spaces before/after the code
- Codes are case-sensitive
- Check if the eSIM has already been activated

## Frequently Asked Questions {#faq}

### Can I install the eSIM without internet?
No, your device needs WiFi or mobile data to download the eSIM profile.

### How long is my activation code valid?
Activation codes don''t expire, but each can only be used once.

### Can I copy-paste the codes?
Yes! We recommend copying to avoid typos. Long-press to paste on iPhone.',
  'Step-by-step guide for manually installing a Mobile11 eSIM on iPhone using SM-DP+ address and activation code.',
  '[{"id":"when-to-use","title":"When to Use Manual Installation"},{"id":"find-details","title":"Find Your Activation Details"},{"id":"installation-steps","title":"Step-by-Step Installation"},{"id":"connect-data","title":"Connect to Mobile Data"},{"id":"troubleshooting","title":"Troubleshooting"},{"id":"faq","title":"FAQ"}]',
  2,
  'both',
  true,
  false
)
ON CONFLICT (slug, category, language)
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article 3: Install eSIM on Samsung Galaxy (English)
INSERT INTO kb_articles (slug, category, language, title, content, description, table_of_contents, display_order, source, is_published, is_internal)
VALUES (
  'install-esim-samsung-manual',
  'getting-started',
  'en',
  'How to Install an eSIM on Samsung Galaxy',
  '## Before You Begin {#before-you-begin}

Ensure your Samsung Galaxy device:
- **Supports eSIM**: Galaxy S20 and newer, Z Flip/Fold series
- **Is carrier-unlocked**: Required for third-party eSIMs
- **Has stable internet**: WiFi or mobile data needed
- **Is updated**: Latest software recommended

### Which Samsung devices support eSIM?

- Galaxy S20, S21, S22, S23, S24 series
- Galaxy Z Flip and Z Fold series (all generations)
- Galaxy Note 20 series
- Some Galaxy A series (region-dependent)

## Find Your eSIM Details {#find-details}

1. Open the **Mobile11 app** or go to **mobile11.com**
2. Navigate to **My eSIMs**
3. Select your purchased eSIM
4. Tap **View Installation Details**
5. Copy the **Activation Code** (you''ll need this)

## Step-by-Step Installation {#installation-steps}

### Step 1: Open Settings
Tap the **Settings** app on your Samsung device.

### Step 2: Navigate to SIM Manager
Go to: **Settings** → **Connections** → **SIM Manager** (or **SIM Card Manager**)

### Step 3: Add eSIM
Tap **Add eSIM** or **Add Mobile Plan**.

### Step 4: Choose Installation Method

**Option A - QR Code:**
- Select **Scan QR code from service provider**
- Point camera at the QR code in your Mobile11 account

**Option B - Manual/Activation Code:**
- Select **Enter activation code instead**
- Paste the activation code from Mobile11

### Step 5: Download eSIM
Samsung will download and install the eSIM profile. This takes 1-2 minutes.

### Step 6: Name Your eSIM
Give it a recognizable name like "Mobile11" or the country name.

### Step 7: Configure Data Settings
When prompted:
- **Mobile data**: Select your Mobile11 eSIM
- **Calls**: Keep your primary SIM
- **SMS**: Keep your primary SIM

### Step 8: Complete Setup
Tap **Done**. Your eSIM is now installed!

## Connect to Mobile Data {#connect-data}

When you reach your destination:

1. Go to **Settings** → **Connections** → **SIM Manager**
2. Under **Mobile data**, select your **Mobile11 eSIM**
3. Go to **Settings** → **Connections** → **Mobile networks**
4. Turn on **Data roaming**
5. Toggle **Mobile data** OFF and ON to refresh connection
6. Wait 30 seconds to 2 minutes for connection

### Quick Toggle Method

1. Swipe down to open Quick Panel
2. Long-press on **Mobile Data** tile
3. Select your Mobile11 eSIM
4. Toggle Data Roaming on

## Troubleshooting {#troubleshooting}

### eSIM Not Connecting

1. Ensure you''re in a coverage area
2. Verify **Data Roaming** is ON for the eSIM
3. Try toggling **Airplane Mode** on/off
4. Restart your device
5. Manually select a network in **Settings** → **Connections** → **Mobile networks** → **Network operators**

### "Unable to Add eSIM"

- Check your internet connection
- Verify the activation code is correct
- Ensure your device is carrier-unlocked
- Contact Mobile11 support if issues persist

### Samsung One UI Differences

Menu paths may vary slightly between One UI versions:
- **One UI 5+**: Settings → Connections → SIM Manager
- **One UI 4**: Settings → Connections → SIM Card Manager
- **Older versions**: Settings → Connections → SIM Card Manager → Add Mobile Plan

## Frequently Asked Questions {#faq}

### Can I use dual SIM with eSIM on Samsung?
Yes! Samsung Galaxy devices support using a physical SIM and eSIM simultaneously.

### Do I need to remove my physical SIM?
No, you can use both at the same time. Just configure which SIM to use for data, calls, and texts.

### How do I switch between SIMs for data?
Go to **Settings** → **Connections** → **SIM Manager** → **Mobile data** and select the desired SIM.',
  'Complete installation guide for Mobile11 eSIM on Samsung Galaxy devices with QR code and manual activation methods.',
  '[{"id":"before-you-begin","title":"Before You Begin"},{"id":"find-details","title":"Find Your eSIM Details"},{"id":"installation-steps","title":"Step-by-Step Installation"},{"id":"connect-data","title":"Connect to Mobile Data"},{"id":"troubleshooting","title":"Troubleshooting"},{"id":"faq","title":"FAQ"}]',
  3,
  'both',
  true,
  false
)
ON CONFLICT (slug, category, language)
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();