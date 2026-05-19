# Vercel domain + Business Email (Namecheap veya diğer)

**Vercel domain satar, e-posta kutusu satmaz.** Namecheap’te gördüğünüz “Business Email / Private Email” Vercel panelinde yoktur; e-postayı **ayrı bir sağlayıcıdan** alıp **DNS (MX) kayıtlarını Vercel’de** tanımlarsınız.

---

## Seçenekler (özet)

| Seçenek | Ne alırsınız | Fiyat (yaklaşık) | Synax SMTP |
|---------|----------------|------------------|------------|
| **Namecheap Private Email** | Tam kutu (`support@domain.com`), webmail | ~$1–2/ay/kutu | `mail.privateemail.com` |
| **Google Workspace** | Gmail + Drive | ~$6+/ay/kullanıcı | Google SMTP veya API |
| **Microsoft 365** | Outlook | ~$6+/ay/kullanıcı | Office SMTP |
| **Zoho Mail** | Kurumsal posta | Ücretsiz plan var (sınırlı) | Zoho SMTP |
| **ImprovMX / Forward Email** | Sadece **yönlendirme** (Gmail’e iletir) | Ücretsiz / düşük | Tam kutu değil; uygulama için ayrı SMTP gerekir |

Namecheap’te alıştığınız deneyime en yakın: **Namecheap Private Email** (domain Vercel’de kalsa da olur).

---

## A) Namecheap Private Email (önerilen — eski kuruluma benzer)

Domain **Vercel’de** kayıtlı olsa bile e-posta **Namecheap’ten** satın alınır.

### 1. E-posta planını satın al

1. [namecheap.com → Private Email](https://www.namecheap.com/hosting/email.aspx)
2. Plan seçin (ör. 1 mailbox).
3. **Domain** olarak Vercel’den aldığınız adı yazın (`ornek.com`).
4. Ödemeyi tamamlayın.
5. Namecheap → **Private Email** → **Create mailbox** → örn. `support@ornek.com` + şifre.

### 2. DNS kayıtlarını Vercel’e ekle

1. [Vercel Dashboard](https://vercel.com/dashboard) → sol menü **Domains**
2. Domain’inize tıklayın → **DNS Records** (veya **Manage DNS**)
3. Varsa eski **MX** kayıtlarını silin (çakışma olmasın).
4. Namecheap’in istediği kayıtları ekleyin (Private Email için tipik):

**MX (gelen posta)**

| Type | Name | Value | Priority |
|------|------|-------|----------|
| MX | `@` (boş) | `mx1.privateemail.com` | 10 |
| MX | `@` | `mx2.privateemail.com` | 10 |

**SPF (giden posta — TXT)**

| Type | Name | Value |
|------|------|-------|
| TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` |

**DKIM**

- Namecheap Private Email panelinde **DKIM** oluşturun; size bir **CNAME** veya **TXT** verilir → aynısını Vercel DNS’e ekleyin.

**Autodiscover (isteğe bağlı, Outlook için)**

| Type | Name | Value |
|------|------|-------|
| CNAME | `autodiscover` | `autodiscover.privateemail.com` |

**DMARC (önerilir)**

| Type | Name | Value |
|------|------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:postmaster@ornek.com` |

> Vercel’de bazen **DNS preset** vardır: domain → DNS → preset listesinde sağlayıcı yoksa kayıtları elle girin.  
> Namecheap detay: [Private Email DNS](https://www.namecheap.com/support/knowledgebase/subcategory/2176/private-email-dns-settings/)

### 3. Propagasyon ve test

- 15 dakika – 48 saat (çoğu zaman 1–2 saat).
- Namecheap **Webmail** ile giriş: `https://privateemail.com`
- Dışarıdan `support@ornek.com` adresine test maili gönderin.

### 4. Synax / Supabase SMTP (uygulama mailleri)

Vercel **Environment Variables** (Production):

```
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=support@ornek.com
SMTP_PASS=<mailbox şifresi>
SMTP_FROM=support@ornek.com
```

Supabase → **Project Settings → Auth → SMTP Settings** — aynı değerler (şifre sıfırlama, doğrulama mailleri).

Detay: repo içi `DOMAIN-EMAIL-SETUP.md`, `NAMECHEAP-SMTP-AYARLARI-BULMA.md`

---

## B) Google Workspace / Microsoft 365

Tam kurumsal posta istiyorsanız:

1. [Google Workspace](https://workspace.google.com/) veya [Microsoft 365](https://www.microsoft.com/microsoft-365/business) kayıt — domain doğrulaması istenir.
2. Vercel → **Domains** → domain → **DNS** → sağlayıcının verdiği **MX** ve **TXT** kayıtlarını ekleyin.
3. Vercel DNS UI’da **Google Workspace** gibi preset varsa kullanabilirsiniz.

---

## C) Sadece yönlendirme (ucuz; tam business email değil)

`support@ornek.com` → kişisel Gmail’e iletmek için:

- [ImprovMX](https://improvmx.com/) veya [Forward Email](https://forwardemail.net/en/guides/vercel)
- Vercel DNS’e sadece MX (ve gerekli TXT) eklenir.
- **Göndermek** için yine SMTP gerekir (Gmail “Send mail as” veya Namecheap/Google SMTP).

Synax’ın kullanıcıya mail atması için genelde **gerçek SMTP** (A seçeneği) daha sorunsuzdur.

---

## Sık sorular

**Vercel’de neden Email menüsü yok?**  
Vercel deployment platformu; mail host değil ([Vercel KB](https://vercel.com/kb/guide/using-email-with-your-vercel-domain)).

**Eski Namecheap domain + email ne olur?**  
Domain’i Vercel’e taşıdıysanız: Namecheap’te sadece **email aboneliği** kalabilir; MX’leri Vercel DNS’e taşımanız gerekir. Domain süresi Namecheap’te bitmişse önce domain’i Vercel’de yenileyin, email’i yukarıdaki gibi yeni domain adına kurun.

**Site çalışır mı?**  
Evet. MX kayıtları sadece **e-postayı** yönlendirir; Vercel’deki A/CNAME siteyi etkilemez.

**Cloudflare gerekli mi?**  
Hayır. DNS zaten Vercel’de.

---

## Kontrol listesi

- [ ] Namecheap Private Email (veya başka sağlayıcı) satın alındı
- [ ] Mailbox oluşturuldu (`support@...`)
- [ ] Vercel Domains → DNS: MX + SPF + DKIM (+ isteğe bağlı DMARC)
- [ ] Webmail ile al/gönder testi
- [ ] Vercel + Supabase `SMTP_*` güncellendi
- [ ] `NEXT_PUBLIC_SITE_URL` yeni domain ile uyumlu
