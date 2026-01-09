# 🚀 Synax Platform - Canlıya Alma Rehberi

## 📋 MEVCUT DURUM

✅ Platform zaten yapılmış ve `C:\Synax` konumunda  
✅ Supabase altyapısı mevcut ve çalışıyor  
✅ Localhost'ta çalışıyor ve test edilmiş  
✅ Tüm özellikler hazır  

**Şimdi yapılacak:** Platformu canlıya (production) almak

---

## 🎯 CANLIYA ALMA ADIMLARI

**Not:** MegaPlayZone ve MegaBetZone'da olduğu gibi, mevcut Supabase projesini kullanacağız. Yeni bir proje oluşturmaya gerek yok.

---

## 🔥 ADIM 1: MEVCUT SUPABASE BİLGİLERİNİ NOT EDİN

Mevcut Supabase projenizi kullanacağız:

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. Mevcut projenizin **Settings** > **API** bölümünden:
   - ✅ **Project URL**: `https://xxxxx.supabase.co` (not edin)
   - ✅ **anon public key**: `eyJhbGci...` (not edin)
   - ✅ **service_role key**: `eyJhbGci...` (not edin, gizli tutun!)

✅ **Hazırsınız, Adım 2'ye geçin**

---

## 🔥 ADIM 2: GITHUB REPOSITORY

### 2.1 Repository Oluştur

1. [GitHub.com](https://github.com)'a gidin
2. **"+"** → **"New repository"**
3. Repository adı: `synax-platform` (veya istediğiniz isim)
4. Description: `Synax - Crypto & Gold Trading Platform`
5. **Private** (önerilen) veya **Public**
6. **Create repository**

### 2.2 Kodu GitHub'a Yükle

**PowerShell'de çalıştırın:**

```powershell
# Proje dizinine gidin
cd C:\Synax

# Git initialize (eğer yoksa)
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit - Synax Production Ready"

# Branch adını main yap
git branch -M main

# Remote repository ekle (KULLANICI_ADINIZ'i değiştirin)
git remote add origin https://github.com/KULLANICI_ADINIZ/synax-platform.git

# Kodu yükle
git push -u origin main
```

⚠️ **Önemli:** `.env.local` dosyasını asla commit etmeyin! Sadece Vercel'de environment variables olarak ekleyeceğiz.

---

## 🔥 ADIM 3: VERCEL DEPLOYMENT

### 3.1 Vercel Hesabı

1. [vercel.com](https://vercel.com)'a gidin
2. **"Sign Up"** → GitHub ile giriş yapın
3. GitHub hesabınızı bağlayın

### 3.2 Yeni Proje Oluştur

1. Vercel Dashboard > **"Add New..."** → **"Project"**
2. GitHub repository'nizi seçin: `synax-platform`
3. **"Import"** tıklayın

### 3.3 Project Ayarları

Vercel otomatik olarak Next.js'i algılar:
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build` (otomatik)
- ✅ Output Directory: `.next` (otomatik)
- ✅ Install Command: `npm install` (otomatik)

### 3.4 Environment Variables Ekle

**Vercel Dashboard > Settings > Environment Variables** bölümüne gidin ve şunları ekleyin:

#### Supabase (Adım 1'den aldığınız değerler)

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ✅ Production, ✅ Preview, ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ Production, ✅ Preview, ✅ Development |

#### Email SMTP

| Name | Value | Environment |
|------|-------|-------------|
| `SMTP_HOST` | `smtp-mail.outlook.com` | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_PORT` | `587` | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_USER` | `customerservicesynax@hotmail.com` | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_PASSWORD` | App Password (normal şifre değil!) | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_FROM` | `customerservicesynax@hotmail.com` | ✅ Production, ✅ Preview, ✅ Development |

#### Webhook Secret (Fiyat Güncelleme Webhook'ları için)

| Name | Value | Environment |
|------|-------|-------------|
| `WEBHOOK_SECRET` | `synax-webhook-secret-2024` | ✅ Production, ✅ Preview, ✅ Development |

⚠️ **Önemli:**
- App Password kullanın (normal şifre değil!) - Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`
- Her değişkeni eklerken **Environment** kısmında Production, Preview, Development'ı seçin!

### 3.5 İlk Deploy

1. **"Deploy"** butonuna tıklayın
2. Build sürecini izleyin (2-5 dakika)
3. ✅ Başarılı! URL: `https://synax-platform.vercel.app`

---

## 🔥 ADIM 4: DOMAIN VE SSL

### 4.1 Domain Satın Al

1. Namecheap, GoDaddy, Cloudflare veya başka bir domain sağlayıcısından domain satın alın
2. Domain: `synax.com`, `synaxtrading.com` veya istediğiniz isim

### 4.2 Vercel'e Domain Ekle

1. Vercel Dashboard > **Project** > **Settings** > **Domains**
2. Domain'inizi ekleyin (örn: `synax.com`)
3. Vercel size DNS ayarlarını gösterecek

### 4.3 DNS Ayarları

Domain sağlayıcınızda (Namecheap, GoDaddy vb.) DNS kayıtlarını düzenleyin:

#### CNAME Kullanımı (Önerilen)

```
Type: CNAME
Name: @ (veya boş)
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

#### Alternatif: A Record

Eğer CNAME desteklenmiyorsa, Vercel'in verdiği IP adresini kullanın.

### 4.4 SSL Sertifikası

✅ **Vercel otomatik olarak SSL sağlar!** Let's Encrypt sertifikası otomatik oluşturulur.

- Domain eklendikten sonra 24 saat içinde SSL aktif olur
- HTTPS zorunlu (HTTP otomatik olarak HTTPS'e yönlendirilir)

### 4.5 Domain Doğrulama

1. DNS ayarlarını yaptıktan sonra 24-48 saat bekleyin (DNS propagation)
2. Vercel Dashboard > **Settings** > **Domains**'de domain durumunu kontrol edin
3. ✅ "Valid Configuration" görünene kadar bekleyin

---

## 🔥 ADIM 5: CRON JOB (Opsiyonel - Earn Products Expiry)

Kilitli earn product'ların süresi dolduğunda otomatik tamamlanması için:

### Seçenek 1: Vercel Cron (Pro plan gerekli)

Proje kök dizininde `vercel.json` dosyası oluşturun:

```json
{
  "crons": [
    {
      "path": "/api/earn/check-expired",
      "schedule": "0 * * * *"
    }
  ]
}
```

Bu her saat başı çalışır. Dosyayı commit edip push edin.

### Seçenek 2: External Cron Service (Ücretsiz)

[Cron-job.org](https://cron-job.org) veya [EasyCron](https://www.easycron.com) kullanın:

- **URL**: `https://yourdomain.com/api/earn/check-expired`
- **Schedule**: Her saat (0 * * * *)
- **Method**: GET veya POST
- **Authentication**: API key header ekleyin (güvenlik için)

API endpoint'e authentication ekleyin ve Vercel environment variables'a `CRON_API_KEY` ekleyin.

---

## ✅ ADIM 6: POST-DEPLOYMENT KONTROLLERİ

### 6.1 İlk Admin Kullanıcı Oluşturma

1. Production site'da kayıt olun: `https://yourdomain.com/signup`
2. Supabase Dashboard > **Table Editor** > **profiles**
3. Kullanıcınızı bulun
4. `is_admin` sütununu `true` yapın
5. Kaydedin

### 6.2 Fonksiyonellik Testleri

- [ ] Ana sayfa yükleniyor mu? (`https://yourdomain.com`)
- [ ] Kayıt olma çalışıyor mu?
- [ ] Email verification geliyor mu?
- [ ] Login çalışıyor mu?
- [ ] Dashboard yükleniyor mu?
- [ ] KYC belge yükleme çalışıyor mu?
- [ ] Deposit işlemi çalışıyor mu? (Banka transferi/Kripto)
- [ ] Trading işlemleri çalışıyor mu?
- [ ] Earn products görünüyor mu?
- [ ] Contact form çalışıyor mu?
- [ ] Admin panel erişilebilir mi? (`https://yourdomain.com/admin`)
- [ ] Admin mesajlara cevap verebiliyor mu?

### 6.3 API Testleri

```bash
# Prices
curl https://yourdomain.com/api/prices/crypto?symbol=BTC

# Earn products
curl https://yourdomain.com/api/earn/products
```

### 6.4 Email Testi

1. Yeni bir kullanıcı kaydı yapın
2. Email verification maili geldi mi kontrol edin
3. Admin panel'den bir mesaja cevap verin
4. Kullanıcının email'ine cevap gitti mi kontrol edin

---

## 🐛 SORUN GİDERME

### Build Hatası

1. Vercel Dashboard > **Deployments** > **Logs** kontrol edin
2. Local'de `npm run build` çalıştırın, hataları görün
3. Environment variables eksik mi kontrol edin
4. TypeScript/ESLint hatalarını düzeltin

### Email Gönderilmiyor

1. Supabase SMTP ayarlarını kontrol edin
2. App Password kullanıldığından emin olun (normal şifre değil!)
3. Vercel environment variables'da `SMTP_*` değişkenlerini kontrol edin
4. Vercel logs'da email hatalarını kontrol edin
5. Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### Database Bağlantı Hatası

1. `NEXT_PUBLIC_SUPABASE_URL` doğru mu?
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
3. Supabase projesi aktif mi?
4. RLS policies doğru mu?

### Domain SSL Hatası

1. DNS ayarları doğru mu? (24-48 saat bekle)
2. Vercel Dashboard > **Settings** > **Domains** kontrol edin
3. CNAME kaydı doğru mu?

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Mevcut Supabase bilgileri not edildi (URL, keys)
- [ ] Email SMTP App Password hazır
- [ ] Local'de `npm run build` test edildi

### Deployment
- [ ] GitHub repository oluşturuldu
- [ ] Kod GitHub'a yüklendi
- [ ] Vercel projesi oluşturuldu
- [ ] Tüm environment variables eklendi
- [ ] İlk deploy başarılı
- [ ] Domain satın alındı
- [ ] Domain eklendi ve DNS ayarları yapıldı
- [ ] SSL aktif

### Post-Deployment
- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Tüm fonksiyonellik test edildi
- [ ] Email verification test edildi
- [ ] Contact form test edildi
- [ ] Admin panel test edildi
- [ ] Cron job kuruldu (opsiyonel)

---

## 🎉 BAŞARILAR!

Synax platformunuz artık canlıda!

**Sonraki Adımlar:**
- Kullanıcı geri bildirimlerini toplayın
- Performance optimizasyonları yapın
- Monitoring kurun (Sentry, LogRocket vb.)
- Uptime monitoring (UptimeRobot vb.)
- Backup stratejisi uygulayın

**Destek Dokümantasyonu:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

**🚀 Platformunuz hazır!**

## 📋 MEVCUT DURUM

✅ Platform zaten yapılmış ve `C:\Synax` konumunda  
✅ Supabase altyapısı mevcut ve çalışıyor  
✅ Localhost'ta çalışıyor ve test edilmiş  
✅ Tüm özellikler hazır  

**Şimdi yapılacak:** Platformu canlıya (production) almak

---

## 🎯 CANLIYA ALMA ADIMLARI

**Not:** MegaPlayZone ve MegaBetZone'da olduğu gibi, mevcut Supabase projesini kullanacağız. Yeni bir proje oluşturmaya gerek yok.

---

## 🔥 ADIM 1: MEVCUT SUPABASE BİLGİLERİNİ NOT EDİN

Mevcut Supabase projenizi kullanacağız:

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. Mevcut projenizin **Settings** > **API** bölümünden:
   - ✅ **Project URL**: `https://xxxxx.supabase.co` (not edin)
   - ✅ **anon public key**: `eyJhbGci...` (not edin)
   - ✅ **service_role key**: `eyJhbGci...` (not edin, gizli tutun!)

✅ **Hazırsınız, Adım 2'ye geçin**

---

## 🔥 ADIM 2: GITHUB REPOSITORY

### 2.1 Repository Oluştur

1. [GitHub.com](https://github.com)'a gidin
2. **"+"** → **"New repository"**
3. Repository adı: `synax-platform` (veya istediğiniz isim)
4. Description: `Synax - Crypto & Gold Trading Platform`
5. **Private** (önerilen) veya **Public**
6. **Create repository**

### 2.2 Kodu GitHub'a Yükle

**PowerShell'de çalıştırın:**

```powershell
# Proje dizinine gidin
cd C:\Synax

# Git initialize (eğer yoksa)
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit - Synax Production Ready"

# Branch adını main yap
git branch -M main

# Remote repository ekle (KULLANICI_ADINIZ'i değiştirin)
git remote add origin https://github.com/KULLANICI_ADINIZ/synax-platform.git

# Kodu yükle
git push -u origin main
```

⚠️ **Önemli:** `.env.local` dosyasını asla commit etmeyin! Sadece Vercel'de environment variables olarak ekleyeceğiz.

---

## 🔥 ADIM 3: VERCEL DEPLOYMENT

### 3.1 Vercel Hesabı

1. [vercel.com](https://vercel.com)'a gidin
2. **"Sign Up"** → GitHub ile giriş yapın
3. GitHub hesabınızı bağlayın

### 3.2 Yeni Proje Oluştur

1. Vercel Dashboard > **"Add New..."** → **"Project"**
2. GitHub repository'nizi seçin: `synax-platform`
3. **"Import"** tıklayın

### 3.3 Project Ayarları

Vercel otomatik olarak Next.js'i algılar:
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build` (otomatik)
- ✅ Output Directory: `.next` (otomatik)
- ✅ Install Command: `npm install` (otomatik)

### 3.4 Environment Variables Ekle

**Vercel Dashboard > Settings > Environment Variables** bölümüne gidin ve şunları ekleyin:

#### Supabase (Adım 1'den aldığınız değerler)

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ✅ Production, ✅ Preview, ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ Production, ✅ Preview, ✅ Development |

#### Email SMTP

| Name | Value | Environment |
|------|-------|-------------|
| `SMTP_HOST` | `smtp-mail.outlook.com` | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_PORT` | `587` | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_USER` | `customerservicesynax@hotmail.com` | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_PASSWORD` | App Password (normal şifre değil!) | ✅ Production, ✅ Preview, ✅ Development |
| `SMTP_FROM` | `customerservicesynax@hotmail.com` | ✅ Production, ✅ Preview, ✅ Development |

#### Webhook Secret (Fiyat Güncelleme Webhook'ları için)

| Name | Value | Environment |
|------|-------|-------------|
| `WEBHOOK_SECRET` | `synax-webhook-secret-2024` | ✅ Production, ✅ Preview, ✅ Development |

⚠️ **Önemli:**
- App Password kullanın (normal şifre değil!) - Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`
- Her değişkeni eklerken **Environment** kısmında Production, Preview, Development'ı seçin!

### 3.5 İlk Deploy

1. **"Deploy"** butonuna tıklayın
2. Build sürecini izleyin (2-5 dakika)
3. ✅ Başarılı! URL: `https://synax-platform.vercel.app`

---

## 🔥 ADIM 4: DOMAIN VE SSL

### 4.1 Domain Satın Al

1. Namecheap, GoDaddy, Cloudflare veya başka bir domain sağlayıcısından domain satın alın
2. Domain: `synax.com`, `synaxtrading.com` veya istediğiniz isim

### 4.2 Vercel'e Domain Ekle

1. Vercel Dashboard > **Project** > **Settings** > **Domains**
2. Domain'inizi ekleyin (örn: `synax.com`)
3. Vercel size DNS ayarlarını gösterecek

### 4.3 DNS Ayarları

Domain sağlayıcınızda (Namecheap, GoDaddy vb.) DNS kayıtlarını düzenleyin:

#### CNAME Kullanımı (Önerilen)

```
Type: CNAME
Name: @ (veya boş)
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

#### Alternatif: A Record

Eğer CNAME desteklenmiyorsa, Vercel'in verdiği IP adresini kullanın.

### 4.4 SSL Sertifikası

✅ **Vercel otomatik olarak SSL sağlar!** Let's Encrypt sertifikası otomatik oluşturulur.

- Domain eklendikten sonra 24 saat içinde SSL aktif olur
- HTTPS zorunlu (HTTP otomatik olarak HTTPS'e yönlendirilir)

### 4.5 Domain Doğrulama

1. DNS ayarlarını yaptıktan sonra 24-48 saat bekleyin (DNS propagation)
2. Vercel Dashboard > **Settings** > **Domains**'de domain durumunu kontrol edin
3. ✅ "Valid Configuration" görünene kadar bekleyin

---

## 🔥 ADIM 5: CRON JOB (Opsiyonel - Earn Products Expiry)

Kilitli earn product'ların süresi dolduğunda otomatik tamamlanması için:

### Seçenek 1: Vercel Cron (Pro plan gerekli)

Proje kök dizininde `vercel.json` dosyası oluşturun:

```json
{
  "crons": [
    {
      "path": "/api/earn/check-expired",
      "schedule": "0 * * * *"
    }
  ]
}
```

Bu her saat başı çalışır. Dosyayı commit edip push edin.

### Seçenek 2: External Cron Service (Ücretsiz)

[Cron-job.org](https://cron-job.org) veya [EasyCron](https://www.easycron.com) kullanın:

- **URL**: `https://yourdomain.com/api/earn/check-expired`
- **Schedule**: Her saat (0 * * * *)
- **Method**: GET veya POST
- **Authentication**: API key header ekleyin (güvenlik için)

API endpoint'e authentication ekleyin ve Vercel environment variables'a `CRON_API_KEY` ekleyin.

---

## ✅ ADIM 6: POST-DEPLOYMENT KONTROLLERİ

### 6.1 İlk Admin Kullanıcı Oluşturma

1. Production site'da kayıt olun: `https://yourdomain.com/signup`
2. Supabase Dashboard > **Table Editor** > **profiles**
3. Kullanıcınızı bulun
4. `is_admin` sütununu `true` yapın
5. Kaydedin

### 6.2 Fonksiyonellik Testleri

- [ ] Ana sayfa yükleniyor mu? (`https://yourdomain.com`)
- [ ] Kayıt olma çalışıyor mu?
- [ ] Email verification geliyor mu?
- [ ] Login çalışıyor mu?
- [ ] Dashboard yükleniyor mu?
- [ ] KYC belge yükleme çalışıyor mu?
- [ ] Deposit işlemi çalışıyor mu? (Banka transferi/Kripto)
- [ ] Trading işlemleri çalışıyor mu?
- [ ] Earn products görünüyor mu?
- [ ] Contact form çalışıyor mu?
- [ ] Admin panel erişilebilir mi? (`https://yourdomain.com/admin`)
- [ ] Admin mesajlara cevap verebiliyor mu?

### 6.3 API Testleri

```bash
# Prices
curl https://yourdomain.com/api/prices/crypto?symbol=BTC

# Earn products
curl https://yourdomain.com/api/earn/products
```

### 6.4 Email Testi

1. Yeni bir kullanıcı kaydı yapın
2. Email verification maili geldi mi kontrol edin
3. Admin panel'den bir mesaja cevap verin
4. Kullanıcının email'ine cevap gitti mi kontrol edin

---

## 🐛 SORUN GİDERME

### Build Hatası

1. Vercel Dashboard > **Deployments** > **Logs** kontrol edin
2. Local'de `npm run build` çalıştırın, hataları görün
3. Environment variables eksik mi kontrol edin
4. TypeScript/ESLint hatalarını düzeltin

### Email Gönderilmiyor

1. Supabase SMTP ayarlarını kontrol edin
2. App Password kullanıldığından emin olun (normal şifre değil!)
3. Vercel environment variables'da `SMTP_*` değişkenlerini kontrol edin
4. Vercel logs'da email hatalarını kontrol edin
5. Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### Database Bağlantı Hatası

1. `NEXT_PUBLIC_SUPABASE_URL` doğru mu?
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
3. Supabase projesi aktif mi?
4. RLS policies doğru mu?

### Domain SSL Hatası

1. DNS ayarları doğru mu? (24-48 saat bekle)
2. Vercel Dashboard > **Settings** > **Domains** kontrol edin
3. CNAME kaydı doğru mu?

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Mevcut Supabase bilgileri not edildi (URL, keys)
- [ ] Email SMTP App Password hazır
- [ ] Local'de `npm run build` test edildi

### Deployment
- [ ] GitHub repository oluşturuldu
- [ ] Kod GitHub'a yüklendi
- [ ] Vercel projesi oluşturuldu
- [ ] Tüm environment variables eklendi
- [ ] İlk deploy başarılı
- [ ] Domain satın alındı
- [ ] Domain eklendi ve DNS ayarları yapıldı
- [ ] SSL aktif

### Post-Deployment
- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Tüm fonksiyonellik test edildi
- [ ] Email verification test edildi
- [ ] Contact form test edildi
- [ ] Admin panel test edildi
- [ ] Cron job kuruldu (opsiyonel)

---

## 🎉 BAŞARILAR!

Synax platformunuz artık canlıda!

**Sonraki Adımlar:**
- Kullanıcı geri bildirimlerini toplayın
- Performance optimizasyonları yapın
- Monitoring kurun (Sentry, LogRocket vb.)
- Uptime monitoring (UptimeRobot vb.)
- Backup stratejisi uygulayın

**Destek Dokümantasyonu:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

**🚀 Platformunuz hazır!**
