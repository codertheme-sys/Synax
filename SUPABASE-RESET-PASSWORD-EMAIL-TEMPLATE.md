# Supabase — Reset password email (fix PKCE / any browser)

Default Supabase emails use `{{ .ConfirmationURL }}` → PKCE verify → needs **same browser** unless you change the template.

## Recommended: direct link with `token_hash` (any browser)

1. Supabase Dashboard → **Authentication** → **Email Templates** → **Reset password**
2. Replace the button/link section with:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p>
  <a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">
    Reset Password
  </a>
</p>
<p>Or copy this URL:</p>
<p>{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery</p>
```

3. **Authentication → URL configuration**
   - Site URL: `https://synax.live`
   - Redirect URLs: `https://synax.live/**`

4. Save template → request a **new** forgot-password email.

This skips `supabase.co/auth/v1/verify?token=pkce_...` and works from Hotmail / any browser.

---

## Fallback: default PKCE email (same browser)

If you keep `{{ .ConfirmationURL }}`:

1. User opens **Forgot password** on `https://synax.live`
2. Submits email → gets mail
3. Opens reset link in **the same browser** (same Chrome/Edge profile, not only “same device”)

The app stores PKCE `code_verifier` in a cookie for 1 hour (`synax_pkce_verifier`).

---

## After template change

Request a **new** reset email. Old emails still use the old link format.
