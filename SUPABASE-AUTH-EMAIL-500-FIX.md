# Supabase auth email fails (500) — forgot password & sign up

Errors like **"Error sending recovery email"** or **"Error sending confirmation email"** with status **500** mean Supabase **could not send mail** via your SMTP. The Synax app code is fine; fix **Supabase SMTP** first.

---

## 1. Custom SMTP (required for production)

**Dashboard → Authentication → SMTP**  
Direct: `https://supabase.com/dashboard/project/hrvtjwvbmpwwhazrqkrj/auth/smtp`

| Field | Value |
|-------|--------|
| Enable Custom SMTP | **ON** |
| Host | `mail.privateemail.com` |
| Port | **587** (recommended for Supabase) or **465** |
| Username | `support@synax.live` |
| Password | Namecheap mailbox password (no extra spaces) |
| Sender email | `support@synax.live` |
| Sender name | `Synax` |

### Where is the SSL toggle?

**There is no separate SSL on/off switch** in current Supabase SMTP screens.

- **Port 587** → Supabase uses **STARTTLS** automatically (you do nothing extra).
- **Port 465** → Supabase uses **implicit SSL** automatically (because of the port).

If **465** gives `/recover | 500: Error sending recovery email` in Logs → Auth, **switch to 587** (most common fix with Namecheap Private Email + Supabase).

Optional field on the same page: **Minimum TLS version** → set **TLS 1.2** (or highest available). That is not “SSL on/off”; it only sets the minimum TLS version.

### Namecheap Private Email (reference)

| Port | Encryption | Use with Supabase |
|------|------------|-------------------|
| **587** | STARTTLS | **Try this first** |
| **465** | SSL/TLS | Only if 587 fails |

Host is always: `mail.privateemail.com`

---

## 2. URL configuration

**Authentication → URL configuration**

| Field | Value |
|-------|--------|
| Site URL | `https://synax.live` |
| Redirect URLs | `https://synax.live/**` |
| | `https://www.synax.live/**` |
| | `https://synax.live/login` |
| | `https://synax.live/reset-password` |

---

## 3. Email templates (Solution A — any browser)

### Reset password
Use: `supabase-email-template-reset-password.html`  
Link: `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

### Confirm sign up
Use: `supabase-email-template-confirm-signup.html`  
Link: `{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&type=signup`

Save both templates, then test with **new** emails (old links stay invalid).

---

## 4. Auth settings

- **Authentication → Providers → Email** → **Confirm email** enabled (if you require verification before login)
- **Authentication → Rate limits** — not blocking you (wait 1 hour if many tests)

---

## 5. Logs (exact SMTP error)

**Dashboard → Logs → Auth**  
Filter around the time you clicked “Send reset link” or signed up.  
Look for: `smtp`, `mail`, `535` (auth failed), `timeout`, `connection refused`.

---

## 6. Namecheap mailbox

- [privateemail.com](https://privateemail.com) — log in as `support@synax.live`
- Send a test to your Gmail — mailbox must work
- **Advanced DNS → Mail Settings:** **Private Email** (not Email Forwarding only)

---

## 7. Quick test order

1. Fix SMTP → Save  
2. Sign up with a **new** test email  
3. Forgot password on `https://synax.live` (not www if possible)  
4. Check Auth logs if still 500

---

## 8. Vercel env (app emails only)

These do **not** fix Supabase Auth 500, but keep them correct for contact/chat:

```
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_USER=support@synax.live
SMTP_PASSWORD=...
SMTP_FROM=support@synax.live
NEXT_PUBLIC_SITE_URL=https://synax.live
```

Supabase Auth emails use **Dashboard SMTP**, not Vercel env.
