# mobile11 - Supabase SMTP Configuration Guide

## 📋 Quick Reference - SMTP Credentials

Copy these exact values into your Supabase Auth SMTP Settings:

```
SMTP Host: smtp.resend.com
SMTP Port: 587 (TLS) or 465 (SSL)
Username: resend
Password: [Your RESEND_API_KEY]
Sender Email: noreply@mobile11.com (or your verified domain)
Sender Name: mobile11
```

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Verify Your Domain in Resend

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `mobile11.com`)
4. Add the following DNS records to your domain registrar:

   **SPF Record (TXT)**
   ```
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Record (TXT)**
   ```
   Name: resend._domainkey
   Value: [Provided by Resend - unique to your domain]
   ```

   **DMARC Record (TXT)**
   ```
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@mobile11.com
   ```

5. Wait 5-15 minutes for DNS propagation
6. Click "Verify" in Resend dashboard

### Step 2: Configure Supabase Auth SMTP

1. Go to: https://supabase.com/dashboard/project/jaqyvbjllsanrnpzlyjw/settings/auth

2. Scroll to "SMTP Settings" section

3. Toggle "Enable Custom SMTP" to **ON**

4. Fill in the form with these exact values:

   | Field | Value |
   |-------|-------|
   | **Sender email** | `noreply@mobile11.com` |
   | **Sender name** | `mobile11` |
   | **Host** | `smtp.resend.com` |
   | **Port number** | `587` |
   | **Username** | `resend` |
   | **Password** | Your `RESEND_API_KEY` (same key you're already using) |
   | **Admin email** | Your admin email (e.g., `admin@mobile11.com`) |

5. Click **"Save"**

6. Supabase will send a test email - check your inbox to verify it works

### Step 3: Upload Custom Email Templates

1. Go to: https://supabase.com/dashboard/project/jaqyvbjllsanrnpzlyjw/auth/templates

2. For each template, click "Edit" and paste the HTML from the corresponding file:

   **Confirm Signup Template:**
   - File: `supabase/email-templates/confirm-signup.html`
   - Copy entire contents and paste into Supabase

   **Magic Link Template:**
   - File: `supabase/email-templates/magic-link.html`
   - Copy entire contents and paste into Supabase

   **Reset Password Template:**
   - File: `supabase/email-templates/reset-password.html`
   - Copy entire contents and paste into Supabase

   **Change Email Template:**
   - File: `supabase/email-templates/change-email.html`
   - Copy entire contents and paste into Supabase

3. **IMPORTANT:** Do NOT modify these template variables - they're required by Supabase:
   - `{{ .ConfirmationURL }}` - The action link/button
   - `{{ .Email }}` - User's email address (used in change-email template)
   - `{{ .Token }}` - OTP token (if using OTP authentication)

4. Click **"Save"** for each template

---

## ✅ Testing Your Setup

After configuration, test these authentication flows:

1. **Sign Up Flow:**
   - Create a new account
   - Check email arrives from `noreply@mobile11.com`
   - Verify the email design matches mobile11 branding
   - Click confirmation link and ensure it works

2. **Password Reset Flow:**
   - Request password reset
   - Check email arrives with proper branding
   - Click reset link and ensure it redirects correctly

3. **Magic Link Flow (if enabled):**
   - Request magic link login
   - Check email arrives
   - Click link and ensure instant login works

4. **Email Change Flow:**
   - Try changing your email address
   - Confirm new email receives verification
   - Old email should be notified (optional feature)

---

## 🎨 Template Customization Tips

### Modifying Brand Colors

All templates use these colors - search and replace if needed:

- **Primary Blue:** `#0093FF` (HSL: 205, 100%, 50%)
- **Accent Purple:** `#9B5DFF` (HSL: 258, 90%, 66%)
- **Gradient:** `linear-gradient(135deg, #0093FF 0%, #9B5DFF 100%)`

### Adding Your Logo

Replace the text logo in the header:

```html
<!-- Current: -->
<h1 class="logo">mobile11</h1>

<!-- With image: -->
<img src="https://yourdomain.com/logo.png" alt="mobile11" style="height: 40px;">
```

### Customizing Footer

Update the footer section in each template:

```html
<div class="footer">
  <p style="margin: 0 0 10px 0;">
    <strong>mobile11</strong> - Unlimited Data Everywhere
  </p>
  <p style="margin: 0;">
    Questions? Reply to this email or visit our support center
  </p>
  <!-- Add your links: -->
  <p style="margin: 10px 0 0 0;">
    <a href="https://mobile11.com">Website</a> | 
    <a href="https://mobile11.com/support">Support</a> | 
    <a href="https://mobile11.com/terms">Terms</a>
  </p>
</div>
```

---

## 🔧 Troubleshooting

### Issue: Test Email Failed

**Solution:**
- Double-check SMTP credentials (especially password)
- Verify domain is verified in Resend
- Try port 465 instead of 587
- Check if RESEND_API_KEY is valid and active

### Issue: Emails Going to Spam

**Solution:**
- Ensure all DNS records (SPF, DKIM, DMARC) are properly configured
- Wait 24-48 hours for domain reputation to build
- Send test emails to different providers (Gmail, Outlook, Yahoo)
- Check Resend dashboard for bounce/spam reports

### Issue: Template Variables Not Working

**Problem:** Variables like `{{ .ConfirmationURL }}` appearing as plain text

**Solution:**
- Ensure you're using the exact variable syntax Supabase requires
- Don't modify the variable names or add extra spaces
- Test by sending an actual auth email, not just previewing

### Issue: Still Hitting Rate Limits

**Solution:**
- Verify "Enable Custom SMTP" toggle is ON
- Check that test email was successfully sent
- Wait a few minutes for settings to propagate
- Try logging out and back in to Supabase dashboard

### Issue: Links Not Working in Emails

**Solution:**
- Check `site_url` in `supabase/config.toml` matches your production URL
- Verify `additional_redirect_urls` includes all your domains
- Ensure email confirmation is enabled: `enable_confirmations = true`
- Test with different email clients (Gmail, Outlook)

---

## 📊 Expected Results After Setup

✅ **Unlimited authentication emails** - No rate limit warnings
✅ **Custom branded emails** - Professional design matching your site
✅ **Better deliverability** - Emails land in inbox, not spam
✅ **Your domain** - Emails from `noreply@mobile11.com` instead of Supabase
✅ **Full control** - Edit templates anytime in Supabase dashboard

---

## 🔗 Quick Links

- [Supabase Auth SMTP Settings](https://supabase.com/dashboard/project/jaqyvbjllsanrnpzlyjw/settings/auth)
- [Supabase Email Templates](https://supabase.com/dashboard/project/jaqyvbjllsanrnpzlyjw/auth/templates)
- [Resend Dashboard](https://resend.com/overview)
- [Resend Domains](https://resend.com/domains)
- [Resend API Keys](https://resend.com/api-keys)

---

## 💡 Pro Tips

1. **Test in Production:** Always test authentication flows in your production environment after setup
2. **Monitor Delivery:** Check Resend dashboard regularly for delivery rates and bounce reports
3. **Update Templates:** Keep email templates in sync with your website's design updates
4. **A/B Testing:** Try different subject lines and copy to improve open rates
5. **Localization:** Consider creating multi-language versions of templates for international users

---

Need help? The templates are already created and ready to use - just copy the HTML from the files and paste into Supabase!