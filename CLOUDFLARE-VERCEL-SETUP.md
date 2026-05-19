# Synax — Cloudflare + Vercel setup

Use this guide to host **synax.vip** on **Cloudflare** (DNS/registrar) and **Vercel** (app hosting).

---

## Overview

| Layer | Service |
|--------|---------|
| Domain & DNS | **Cloudflare** |
| Next.js app | **Vercel** (GitHub: `codertheme-sys/Synax`) |
| Database / Auth | **Supabase** |

---

## Step 1 — Put the app on Vercel (do this first)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import **GitHub** repo: `codertheme-sys/Synax`.
3. **Settings → Environment Variables** — add all production values (same as `.env.local`, never commit secrets):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_*` (if you use email)
   - `NEXT_PUBLIC_SITE_URL` = `https://synax.vip`
   - Cron secret, Stripe keys, etc.
4. **Deploy** and wait until the build succeeds.
5. Note the default URL, e.g. `https://synax-xxxxx.vercel.app` — open it in the browser. If it works, the code is fine; only DNS/domain is left.

---

## Step 2 — Add domains in Vercel

1. Project → **Settings** → **Domains**.
2. Add:
   - `synax.vip`
   - `www.synax.vip`
3. Vercel shows required DNS records. **Use the exact values Vercel shows** (usually below).

Typical Vercel values:

| Purpose | Type | Name | Content / Target |
|---------|------|------|------------------|
| Root | `A` | `@` | `76.76.21.21` |
| www | `CNAME` | `www` | `cname.vercel-dns.com` |

4. Set one primary domain (recommended: `synax.vip`) and redirect `www` → apex in Vercel if offered.

---

## Step 3 — Cloudflare: register or move the domain

### Option A — Transfer domain to Cloudflare Registrar (recommended)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Domain Registration** → **Transfer** or **Register**.
2. Search **synax.vip** → complete purchase/transfer (EPP/auth code from Namecheap if transferring).
3. Domain appears under **Websites** automatically.

**Note:** Domains cannot be transferred within **60 days** of initial registration (ICANN rule).

### Option B — Keep registrar elsewhere, DNS only on Cloudflare

1. Cloudflare → **Add a site** → enter `synax.vip` → Free plan.
2. Cloudflare gives two nameservers, e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`.
3. At your current registrar (Namecheap, etc.) set **Custom DNS** / nameservers to Cloudflare’s pair (not “URL redirect”).

---

## Step 4 — DNS records in Cloudflare

1. **Websites** → `synax.vip` → **DNS** → **Records**.
2. **Delete** parking / redirect records (wrong examples):
   - CNAME `www` → `parkingpage.namecheap.com`
   - URL redirect `@` → `http://www.synax.vip/`
3. **Add** Vercel records (match Vercel Domains page):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| `A` | `@` | `76.76.21.21` | Proxied (orange cloud) |
| `CNAME` | `www` | `cname.vercel-dns.com` | Proxied (orange cloud) |

4. **Proxy status:** Orange cloud (Proxied) is OK with Vercel. Gives CDN + DDoS protection.

### SSL/TLS (important with proxy)

1. **SSL/TLS** → overview → set mode to **Full** (not “Flexible”).
2. **Edge Certificates** → enable **Always Use HTTPS**.
3. Optional: **SSL/TLS** → **Edge Certificates** → **Minimum TLS Version** 1.2+.

---

## Step 5 — Email (support@synax.vip)

Cloudflare does **not** replace Namecheap Private Email by itself.

**If you keep Namecheap email hosting:**

- Do **not** remove existing **MX** records without copying them.
- In Cloudflare DNS, add the **MX** (and SPF/DKIM) records Namecheap provides under **Private Email** → **DNS settings**.

**If you only need forwarding:**

- Cloudflare → **Email** → **Email Routing** → enable and add routes (e.g. `support@synax.vip` → your Gmail).
- For **SMTP send** from the app, keep `SMTP_HOST` / `SMTP_USER` in Vercel env (Namecheap or another SMTP provider).

---

## Step 6 — Supabase auth URLs

1. [Supabase Dashboard](https://app.supabase.com) → your project → **Authentication** → **URL configuration**.
2. **Site URL:** `https://synax.vip`
3. **Redirect URLs** (add all):
   - `https://synax.vip/**`
   - `https://www.synax.vip/**`
   - `https://synax.vip/login`
   - `https://synax.vip/reset-password`
   - Your Vercel preview URL if needed for testing

---

## Step 7 — Verify

1. [dnschecker.org](https://dnschecker.org) → `synax.vip` → type **A** → should show `76.76.21.21` (may show Cloudflare IPs if proxied — that is normal).
2. Browser:
   - `https://synax.vip`
   - `https://www.synax.vip`
   - `https://synax.vip/admin`
3. Vercel → **Domains** → both domains should show **Valid Configuration**.

Propagation: often 15–60 minutes; up to 48 hours in rare cases.

---

## Troubleshooting

### Sign-up fails: `user/create` **403** (`Onboarding: New_v2`)

This is **not** an app bug. Cloudflare’s signup API rejected the request (fraud / IP / browser / network).

**Try in order:**

1. Turn **off VPN, proxy, Cloudflare WARP**, and “secure DNS” browser extensions.
2. Use a **clean network**: phone **4G/5G hotspot** (different public IP than home Wi‑Fi).
3. **Private/incognito** window; disable ad blockers and privacy extensions for `dash.cloudflare.com`.
4. Another browser (Chrome → Edge or Firefox) or **mobile browser**.
5. Use a normal email (Gmail/Outlook), not disposable addresses.
6. Wait **24 hours** if you tried many signups or checkouts in a short time (temporary block).
7. Sign up with **Continue with Google** on [dash.cloudflare.com/login](https://dash.cloudflare.com/login) (sometimes works when email signup fails).
8. If it still fails: [Cloudflare Community](https://community.cloudflare.com/) or support — include the exact error and that **Namecheap checkout also failed** (same IP/network).

**Synax can run without Cloudflare:** deploy on Vercel and point DNS at **Namecheap** (or any registrar) using the A + CNAME records in Step 4. Cloudflare is optional (CDN/proxy).

---

| Symptom | What to check |
|---------|----------------|
| “Site can’t be reached” / `ERR_FAILED` | Domain expired? Nameservers point to Cloudflare? A/CNAME exist? |
| Vercel “Invalid Configuration” | DNS names/values must match Vercel exactly |
| Redirect loop | Cloudflare SSL = **Full**, not Flexible |
| Admin login fails | Supabase redirect URLs + `NEXT_PUBLIC_SITE_URL` |
| Email not sending | Vercel `SMTP_*` env vars; MX not broken in DNS |

---

## Checklist

- [ ] Vercel production deploy green
- [ ] All env vars set on Vercel
- [ ] `synax.vip` + `www.synax.vip` added in Vercel Domains
- [ ] Domain on Cloudflare (transfer or nameservers)
- [ ] DNS: `A` @ + `CNAME` www → Vercel
- [ ] SSL/TLS: Full + Always HTTPS
- [ ] MX/email records preserved or reconfigured
- [ ] Supabase Site URL + redirect URLs updated
- [ ] Live site and `/admin` tested

---

## Related docs in this repo

- `CANLIYA-ALMA-REHBER.md` — full production checklist  
- `VERCEL-DNS-KAYITLARI-BULMA.md` — finding DNS values in Vercel (Namecheap examples; use Cloudflare DNS UI instead)  
- `DOMAIN-EMAIL-SETUP.md` — email/SMTP (adjust for Cloudflare DNS)  
- `SUPABASE-CORS-SETUP.md` — allowed origins  
