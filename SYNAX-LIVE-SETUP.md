# synax.live — Production setup checklist

Domain purchased on **Namecheap**. App hosted on **Vercel**. Follow in order.

---

## 1. Vercel — custom domains

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Synax** project (`codertheme-sys/Synax`)
2. **Settings → Domains → Add**
   - `synax.live`
   - `www.synax.live`
3. Note DNS values Vercel shows (usually):
   - **A** `@` → `76.76.21.21`
   - **CNAME** `www` → `cname.vercel-dns.com`
4. Set **Primary domain**: `synax.live` (redirect `www` → apex if offered)

---

## 2. Namecheap — DNS (Advanced DNS)

1. [Namecheap](https://www.namecheap.com) → **Domain List** → `synax.live` → **Advanced DNS**
2. **Delete** parking / redirect records:
   - CNAME `www` → `parkingpage.namecheap.com`
   - URL Redirect `@` → `http://www...`
3. **Add** Vercel records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `76.76.21.21` | Automatic |
| CNAME | `www` | `cname.vercel-dns.com` | Automatic |

4. Wait 15 min – 2 h; check [dnschecker.org](https://dnschecker.org/#A/synax.live)

---

## 3. Vercel — environment variables

**Settings → Environment Variables** (Production + Preview):

```env
NEXT_PUBLIC_SITE_URL=https://synax.live

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=support@synax.live
SMTP_PASSWORD=...
SMTP_FROM=support@synax.live

CRON_SECRET=...
```

Then **Deployments → Redeploy** latest production build.

---

## 4. Supabase — Auth URLs

Project → **Authentication → URL configuration**:

| Field | Value |
|-------|--------|
| Site URL | `https://synax.live` |
| Redirect URLs | `https://synax.live/**` |
| | `https://www.synax.live/**` |
| | `https://synax.live/login` |
| | `https://synax.live/reset-password` |
| | `https://www.synax.live/reset-password` |

### Forgot password returns “Error sending recovery email” (500)

Password reset is sent by **Supabase Auth**, not Vercel `SMTP_*` env vars.

1. Open **Custom SMTP** (not under Email Templates):
   - Sidebar: **Authentication** → **SMTP**  
   - Or direct URL: `https://supabase.com/dashboard/project/<PROJECT_REF>/auth/smtp`  
     (`<PROJECT_REF>` = project ID in your Supabase URL, e.g. `abcdefghijklmnop`)
2. Enable **Custom SMTP** and save credentials
2. Use Namecheap Private Email (same as Vercel):

   | Field | Value |
   |-------|--------|
   | Host | `mail.privateemail.com` |
   | Port | `587` (if it fails, try `465`) |
   | Username | `support@synax.live` |
   | Password | mailbox password |
   | Sender | `support@synax.live` |

3. There is often **no “Send test email” button** on this page. Verify SMTP by:
   - **Authentication → Users → Add user → Send invitation** to your Hotmail, or
   - Use **Forgot password** on the site after saving SMTP
   - Check **Logs → Auth** for mail errors
4. **URL configuration** must include both apex and `www` reset URLs (see table above)
5. `NEXT_PUBLIC_SITE_URL=https://synax.live` on Vercel + redeploy (app uses this for reset redirect)

**Authentication → SMTP** (required for reset): same `support@synax.live` credentials.

Update email templates in dashboard (logo/links) — see `SUPABASE-EMAIL-CHANGE-TEMPLATE.md`.

---

## 5. Supabase — CORS / allowed origins

If you use additional origin allowlists, add:

- `https://synax.live`
- `https://www.synax.live`

See `SUPABASE-CORS-SETUP.md`.

---

## 6. Business email (Namecheap Private Email)

1. [Private Email](https://www.namecheap.com/hosting/email.aspx) for domain `synax.live`
2. Create mailbox: `support@synax.live`
3. MX/SPF/DKIM on **Namecheap Advanced DNS** (same tab as Vercel A/CNAME):

| Type | Host | Value | Priority |
|------|------|-------|----------|
| MX | `@` | `mx1.privateemail.com` | 10 |
| MX | `@` | `mx2.privateemail.com` | 10 |
| TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` | — |

Details: `VERCEL-DOMAIN-BUSINESS-EMAIL.md`

---

## 7. External cron (crypto prices)

Update cron job URL to:

```text
https://www.synax.live/api/prices/crypto?secret=YOUR_CRON_SECRET
```

See `CRON-JOB-SETUP.md`.

---

## 8. Admin account

If admin was `admin@synax.vip`, create or update user to `admin@synax.live` in Supabase Auth, or run `database-admin-chat-fix.sql` (updated for synax.live).

---

## 9. Verify

- [ ] `https://synax.live` loads Synax homepage
- [ ] `https://www.synax.live` redirects or loads
- [ ] `https://synax.live/admin` — login works
- [ ] Register / forgot password emails link to `synax.live`
- [ ] Vercel Domains: **Valid Configuration**

---

## Code defaults (repo)

- `lib/site-config.js` — default domain `synax.live`, uses `NEXT_PUBLIC_SITE_URL` when set
- Email templates and marketing API use the same config

Old domain `synax.vip` is no longer the default in application code.
