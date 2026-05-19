# Vercel üzerinden domain satın alma (Synax)

Cloudflare’de istediğiniz isim yoksa domain’i **doğrudan Vercel’den** alabilirsiniz. DNS ve SSL çoğu durumda **otomatik** ayarlanır; ayrıca Cloudflare şart değil.

**Önemli:** Kayıt sırasında **VPN kapalı** olsun (ödeme ve hesap API’leri 403 verebilir).

---

## Ön koşullar

1. [vercel.com](https://vercel.com) hesabı (GitHub ile giriş önerilir).
2. Synax projesi deploy edilmiş olsun: repo `codertheme-sys/Synax`.
3. Vercel’de **ödeme yöntemi** (kredi kartı) tanımlı olsun: **Account Settings → Billing**.

---

## Yöntem 1 — Domain arama sayfası (en kolay)

1. Tarayıcıda açın: **[vercel.com/domains](https://vercel.com/domains)**
2. Arama kutusuna istediğiniz adı yazın, örn. `synax`, `getsynax`, `synaxtrade`.
3. Vercel **.com**, **.vip**, **.io** vb. müsait uzantıları ve fiyatları listeler.
4. Uygun satırda **Buy** / **Add to cart** → ödemeyi tamamlayın.
5. ICANN bilgileri (ad, adres, e-posta) istenirse doldurun — domain WHOIS için gerekli.

> `synax.vip` başka birinde kayıtlıysa Vercel’de de **Unavailable** görünür. Alternatif: `synax.trade`, `synax.app`, `getsynax.com` vb.

---

## Yöntem 2 — Synax projesinden bağlama

1. [vercel.com/dashboard](https://vercel.com/dashboard) → **Synax** projesini seçin.
2. **Settings** → **Domains**.
3. Kutuya yazın: `ornek.com` veya `www.ornek.com`.
4. Domain hesabınızda yoksa Vercel **“Buy this domain”** / satın alma seçeneği sunar → ödeme adımlarını izleyin.
5. Zaten Vercel’de satın aldıysanız **Add** ile projeye bağlayın.

---

## Yöntem 3 — CLI (isteğe bağlı)

```bash
npm i -g vercel
vercel login
vercel buy domain synax.trade
```

Komut sizi ödeme ve onay adımlarına götürür. Satın alınan domain **team** hesabınıza eklenir.

---

## Satın aldıktan sonra (Synax)

### 1. Domain’i projeye atayın

- **Settings → Domains** içinde hem **apex** hem **www** ekleyin:
  - `ornek.com`
  - `www.ornek.com`
- Vercel genelde `www` → apex veya tersi **redirect** önerir; tek ana adres seçin (ör. `ornek.com`).

### 2. Ortam değişkeni

**Settings → Environment Variables** (Production):

| Değişken | Değer |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://ornek.com` |

Kaydedin → **Redeploy** (son deployment → ⋮ → Redeploy).

### 3. Supabase

Supabase → **Authentication → URL configuration**:

- **Site URL:** `https://ornek.com`
- **Redirect URLs:** `https://ornek.com/**`, `https://www.ornek.com/**`

### 4. E-posta (support@…)

Vercel **business email satmaz** — Namecheap Private Email veya Google Workspace ayrı alınır, MX kayıtları Vercel DNS’e eklenir.

**Detaylı rehber:** `VERCEL-DOMAIN-BUSINESS-EMAIL.md`

### 5. Kontrol

- Vercel **Domains** → **Valid Configuration** yeşil olmalı.
- Tarayıcı: `https://ornek.com`, `https://ornek.com/admin`

---

## Vercel domain vs Cloudflare

| | Vercel’den alınan domain | Cloudflare + harici domain |
|--|--------------------------|----------------------------|
| DNS | Otomatik (Vercel nameserver) | Manuel A/CNAME |
| SSL | Otomatik yenilenir | Cloudflare + Vercel ayarı |
| CDN | Vercel edge | İsteğe bağlı Cloudflare proxy |

Synax için **sadece Vercel domain** yeterlidir; Cloudflare zorunlu değil.

---

## Sık sorunlar

| Sorun | Çözüm |
|--------|--------|
| Ödeme / API 403 | VPN kapat, farklı ağ (mobil hotspot), tekrar dene |
| İsim müsait değil | Farklı TLD veya önek (`get-`, `my-`, `trade`) |
| Invalid Configuration | 24–48 saat bekle; Vercel Domains sayfasındaki DNS talimatına uy |
| Eski `synax.vip` | Süresi dolmuş olabilir; [whois](https://who.is) ile kontrol, sonra transfer veya yeni isim |

---

## İlgili dosyalar

- `CLOUDFLARE-VERCEL-SETUP.md` — Cloudflare kullanırsanız (opsiyonel)
- `CANLIYA-ALMA-REHBER.md` — genel production checklist
