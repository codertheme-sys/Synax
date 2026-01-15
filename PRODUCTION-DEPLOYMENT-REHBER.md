# 🚀 Synax Platform - Production Deployment Rehberi

## 📋 İÇİNDEKİLER

1. [Ön Hazırlık](#ön-hazırlık)
2. [Veritabanı Kurulumu](#veritabanı-kurulumu)
3. [Environment Variables](#environment-variables)
4. [Production Build Testi](#production-build-testi)
5. [GitHub Repository](#github-repository)
6. [Vercel Deployment](#vercel-deployment)
7. [Domain ve SSL](#domain-ve-ssl)
8. [Webhook Ayarları](#webhook-ayarları)
9. [Email SMTP Ayarları](#email-smtp-ayarları)
10. [Cron Job Kurulumu](#cron-job-kurulumu)
11. [Post-Deployment Kontrolleri](#post-deployment-kontrolleri)
12. [Monitoring ve Logging](#monitoring-ve-logging)
13. [Backup Stratejisi](#backup-stratejisi)
14. [Sorun Giderme](#sorun-giderme)

---

## 🎯 ÖN HAZIRLIK

### Gerekli Hesaplar ve Servisler

- [ ] **Domain** satın alındı (örn: synax.com, synaxtrading.com)
- [ ] **GitHub** hesabı hazır
- [ ] **Vercel** hesabı hazır (ücretsiz plan yeterli)
- [ ] **Supabase** projesi oluşturuldu (Production için ayrı proje önerilir)
- [ ] **Stripe** hesabı aktif ve doğrulandı (Production mode)
- [ ] **Email SMTP** hesabı hazır (Hotmail/Outlook App Password oluşturuldu)

### Önemli Notlar

⚠️ **Production için ayrı Supabase projesi kullanın!** Development ve production veritabanlarını ayırın.

⚠️ **Stripe Production keys kullanın!** Test keys (`sk_test_`, `pk_test_`) değil, live keys (`sk_live_`, `pk_live_`) kullanın.

---

## 🗄️ VERİTABANI KURULUMU

### 1. Supabase Production Projesi

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. **"New Project"** tıklayın
3. Proje adı: `synax-production` (veya istediğiniz isim)
4. Database password oluşturun (güvenli bir şifre!)
5. Region seçin (kullanıcılarınıza en yakın bölge)
6. **"Create new project"** tıklayın
7. Projenin hazır olmasını bekleyin (2-3 dakika)

### 2. Veritabanı Şemalarını Çalıştırın

Supabase Dashboard > **SQL Editor**'de sırayla çalıştırın:

#### 2.1 Ana Şema
```sql
-- database-schema.sql dosyasının içeriğini çalıştırın
```

#### 2.2 Manuel Fiyat Sistemi
```sql
-- database-manual-prices.sql dosyasının içeriğini çalıştırın
```

#### 2.3 Earn Products
```sql
-- database-earn-products-table.sql dosyasının içeriğini çalıştırın
```

#### 2.4 Earn Subscriptions
```sql
-- database-earn-subscriptions-table.sql dosyasının içeriğini çalıştırın
```

#### 2.5 Earn Subscriptions Update
```sql
-- database-earn-subscriptions-update.sql dosyasının içeriğini çalıştırın
```

#### 2.6 Contact Messages
```sql
-- database-contact-messages-table.sql dosyasının içeriğini çalıştırın
```

#### 2.7 Contact Attachments Storage
```sql
-- database-contact-attachments-storage.sql dosyasının içeriğini çalıştırın
```

#### 2.8 Diğer Tablolar
- `database-alerts-table.sql`
- `database-orders-table.sql`
- `database-new-trades-table.sql`
- Diğer gerekli SQL dosyaları

### 3. Storage Bucket'ları Oluşturun

Supabase Dashboard > **Storage**:

1. **`kyc-documents`** bucket'ı oluşturun
   - Public: ❌ (Private)
   - RLS policies: `database-storage-policies.sql` dosyasından

2. **`deposit-receipts`** bucket'ı oluşturun
   - Public: ❌ (Private)
   - RLS policies: `database-storage-policies.sql` dosyasından

3. **`contact-attachments`** bucket'ı oluşturun
   - Public: ❌ (Private)
   - RLS policies: `database-contact-attachments-storage.sql` dosyasından

### 4. API Keys Alın

Supabase Dashboard > **Settings** > **API**:

- ✅ **Project URL**: `https://xxxxx.supabase.co`
- ✅ **anon public key**: `eyJhbGci...` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- ✅ **service_role key**: `eyJhbGci...` (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Gizli tutun!

### 5. Email Verification Ayarları

Supabase Dashboard > **Authentication** > **Email**:

- ✅ **Enable email confirmations**: Açık
- ✅ **SMTP Settings**: Yapılandırıldı (Hotmail/Outlook App Password ile)
- ✅ **Email templates**: Özelleştirildi (opsiyonel)

Detaylı bilgi: `SUPABASE-EMAIL-VERIFICATION-SETUP.md`

---

## 🔐 ENVIRONMENT VARIABLES

### Production Environment Variables Listesi

Aşağıdaki tüm environment variables'ı **Vercel**'de ekleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe (Production Keys!)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email SMTP
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=customerservicesynax@hotmail.com
SMTP_PASSWORD=YOUR_APP_PASSWORD_HERE
SMTP_FROM=customerservicesynax@hotmail.com

# Webhook Secret
WEBHOOK_SECRET=synax-webhook-secret-2024
```

### Vercel'de Environment Variables Ekleme

1. Vercel Dashboard > **Project** > **Settings** > **Environment Variables**
2. Her bir değişkeni ekleyin:
   - **Name**: Değişken adı (örn: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Değer
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development (hepsini seçin!)
3. **Save** tıklayın
4. Tüm değişkenleri ekledikten sonra **Redeploy** yapın

⚠️ **Önemli:**
- `NEXT_PUBLIC_*` ile başlayan değişkenler client-side'da kullanılabilir
- `SUPABASE_SERVICE_ROLE_KEY` ve `STRIPE_SECRET_KEY` gibi gizli anahtarları asla client-side'da kullanmayın!
- App Password'u normal şifre yerine kullanın (Hotmail/Outlook için)

---

## 🧪 PRODUCTION BUILD TESTI

Deployment öncesi local'de production build test edin:

```bash
# Proje dizinine gidin
cd C:\Synax

# Dependencies kontrol
npm install

# Production build
npm run build

# Build başarılı mı kontrol
# Hata varsa düzeltin, sonra tekrar build edin
```

### Build Hatalarını Kontrol

- ✅ TypeScript hataları yok mu?
- ✅ Import hataları yok mu?
- ✅ Environment variables eksik mi?
- ✅ API route'ları doğru mu?

---

## 📦 GITHUB REPOSITORY

### 1. Repository Oluşturma

1. [GitHub.com](https://github.com)'a gidin
2. **"+"** → **"New repository"**
3. Repository adı: `synax-platform` (veya istediğiniz isim)
4. Description: `Synax - Crypto & Gold Trading Platform`
5. **Private** (önerilen) veya **Public**
6. **Initialize with README**: ❌ (zaten README var)
7. **Create repository**

### 2. .gitignore Kontrolü

`.gitignore` dosyasında şunlar olmalı:

```
# Environment variables
.env.local
.env*.local

# Dependencies
node_modules/

# Build
.next/
out/
dist/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

### 3. Kodu GitHub'a Yükleme

```bash
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

# Remote repository ekle
git remote add origin https://github.com/KULLANICI_ADINIZ/synax-platform.git

# Kodu yükle
git push -u origin main
```

⚠️ **Önemli:** `.env.local` dosyasını asla commit etmeyin! Sadece Vercel'de environment variables olarak ekleyin.

---

## 🚀 VERCEL DEPLOYMENT

### 1. Vercel Hesabı

1. [vercel.com](https://vercel.com)'a gidin
2. **"Sign Up"** → GitHub ile giriş yapın
3. GitHub hesabınızı bağlayın

### 2. Yeni Proje Oluşturma

1. Vercel Dashboard > **"Add New..."** → **"Project"**
2. GitHub repository'nizi seçin: `synax-platform`
3. **"Import"** tıklayın

### 3. Project Ayarları

Vercel otomatik olarak Next.js'i algılar, ancak kontrol edin:

- ✅ **Framework Preset**: Next.js
- ✅ **Root Directory**: `./`
- ✅ **Build Command**: `npm run build` (otomatik)
- ✅ **Output Directory**: `.next` (otomatik)
- ✅ **Install Command**: `npm install` (otomatik)

### 4. Environment Variables Ekleme

**TÜM DEĞİŞKENLERİ EKLEYİN** (yukarıdaki [Environment Variables](#environment-variables) bölümünden):

1. **Settings** > **Environment Variables**
2. Her bir değişkeni ekleyin
3. **Environment**: Production, Preview, Development (hepsini seçin!)
4. **Save**

### 5. Deploy

1. **"Deploy"** butonuna tıklayın
2. Build sürecini izleyin (2-5 dakika)
3. ✅ Başarılı! URL: `https://synax-platform.vercel.app`

### 6. Custom Domain Ekleme

1. **Settings** > **Domains**
2. Domain'inizi ekleyin (örn: `synax.com`)
3. DNS ayarlarını takip edin

---

## 🌐 DOMAIN VE SSL

### 1. Domain DNS Ayarları

Domain sağlayıcınızda (Namecheap, GoDaddy, Cloudflare vb.) DNS kayıtlarını düzenleyin:

#### Vercel CNAME Kullanımı (Önerilen)

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

#### Alternatif: A Record (Eğer CNAME desteklenmiyorsa)

Vercel Dashboard > **Settings** > **Domains**'den IP adresini alın ve A record ekleyin.

### 2. SSL Sertifikası

✅ **Vercel otomatik olarak SSL sağlar!** Let's Encrypt sertifikası otomatik olarak oluşturulur ve yenilenir.

- Domain eklendikten sonra 24 saat içinde SSL aktif olur
- HTTPS zorunlu (HTTP otomatik olarak HTTPS'e yönlendirilir)

### 3. Domain Doğrulama

1. DNS ayarlarını yaptıktan sonra 24-48 saat bekleyin (DNS propagation)
2. Vercel Dashboard > **Settings** > **Domains**'de domain durumunu kontrol edin
3. ✅ "Valid Configuration" görünene kadar bekleyin

---

## 🔗 WEBHOOK AYARLARI

### 1. Stripe Webhook

1. [Stripe Dashboard](https://dashboard.stripe.com) > **Developers** > **Webhooks**
2. **"Add endpoint"** tıklayın
3. **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
4. **Events to send**:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
5. **"Add endpoint"** tıklayın
6. **Signing secret** (whsec_...) kopyalayın
7. Bu secret'ı Vercel environment variables'a ekleyin: `STRIPE_WEBHOOK_SECRET`

### 2. Fiyat Güncelleme Webhook (Opsiyonel)

Eğer harici bir servisten fiyat güncellemeleri alıyorsanız:

**Endpoint**: `https://yourdomain.com/api/webhooks/price-update`

**Header**: `x-webhook-secret: synax-webhook-secret-2024`

**Body**:
```json
{
  "prices": [
    {
      "asset_id": "bitcoin",
      "asset_type": "crypto",
      "price": 50000,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 📧 EMAIL SMTP AYARLARI

### 1. Supabase SMTP (Email Verification İçin)

Supabase Dashboard > **Authentication** > **Email** > **SMTP Settings**:

```
Host: smtp-mail.outlook.com
Port: 587
Username: customerservicesynax@hotmail.com
Password: YOUR_APP_PASSWORD (normal şifre değil!)
Sender Email: customerservicesynax@hotmail.com
Sender Name: Synax Support
```

⚠️ **Önemli:** App Password kullanın! Normal şifre çalışmaz.

Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### 2. Contact Reply SMTP (.env.local)

Vercel environment variables'da:

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=customerservicesynax@hotmail.com
SMTP_PASSWORD=YOUR_APP_PASSWORD
SMTP_FROM=customerservicesynax@hotmail.com
```

---

## ⏰ CRON JOB KURULUMU

### 1. Earn Products Expiry Check

Kilitli (locked) earn product'ların süresi dolduğunda otomatik tamamlanması için:

**Vercel Cron Jobs** (Vercel Pro plan gerekli) veya **External Cron Service** kullanın:

#### Vercel Cron (Önerilen - Pro plan gerekli)

`vercel.json` dosyası oluşturun:

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

Bu her saat başı çalışır.

#### External Cron Service (Ücretsiz Alternatif)

[Cron-job.org](https://cron-job.org) veya [EasyCron](https://www.easycron.com) kullanın:

- **URL**: `https://yourdomain.com/api/earn/check-expired`
- **Schedule**: Her saat (0 * * * *)
- **Method**: GET veya POST
- **Authentication**: API key veya secret header ekleyin (güvenlik için)

### 2. API Endpoint Güvenliği

`/api/earn/check-expired` endpoint'ine authentication ekleyin:

```javascript
// API key kontrolü
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.CRON_API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

Vercel environment variables'a ekleyin: `CRON_API_KEY=your-secret-key`

---

## ✅ POST-DEPLOYMENT KONTROLLERİ

### 1. İlk Admin Kullanıcı Oluşturma

1. Production site'da kayıt olun
2. Supabase Dashboard > **Table Editor** > **profiles**
3. Kullanıcınızı bulun
4. `is_admin` sütununu `true` yapın
5. Kaydedin

### 2. Fonksiyonellik Testleri

- [ ] ✅ Ana sayfa yükleniyor mu?
- [ ] ✅ Kayıt olma çalışıyor mu?
- [ ] ✅ Email verification geliyor mu?
- [ ] ✅ Login çalışıyor mu?
- [ ] ✅ Dashboard yükleniyor mu?
- [ ] ✅ KYC belge yükleme çalışıyor mu?
- [ ] ✅ Deposit işlemi çalışıyor mu? (Stripe test kartları ile)
- [ ] ✅ Trading işlemleri çalışıyor mu?
- [ ] ✅ Earn products görünüyor mu?
- [ ] ✅ Contact form çalışıyor mu?
- [ ] ✅ Admin panel erişilebilir mi?
- [ ] ✅ Admin mesajlara cevap verebiliyor mu?

### 3. API Endpoint Testleri

```bash
# Health check
curl https://yourdomain.com/api/health

# Prices
curl https://yourdomain.com/api/prices/crypto?symbol=BTC

# Earn products
curl https://yourdomain.com/api/earn/products
```

### 4. Stripe Webhook Testi

1. Stripe Dashboard > **Webhooks** > **Send test webhook**
2. Event: `payment_intent.succeeded`
3. Gönderin
4. Vercel logs'da webhook'un geldiğini kontrol edin

### 5. Email Testi

1. Yeni bir kullanıcı kaydı yapın
2. Email verification maili geldi mi kontrol edin
3. Admin panel'den bir mesaja cevap verin
4. Kullanıcının email'ine cevap gitti mi kontrol edin

---

## 📊 MONITORING VE LOGGING

### 1. Vercel Analytics

Vercel Dashboard > **Analytics**:

- ✅ Page views
- ✅ Performance metrics
- ✅ Error tracking
- ✅ Real-time monitoring

### 2. Error Tracking (Önerilen)

#### Sentry (Önerilen)

1. [Sentry.io](https://sentry.io)'ya kaydolun
2. Next.js projesi oluşturun
3. `@sentry/nextjs` paketini yükleyin
4. Vercel environment variables'a `SENTRY_DSN` ekleyin

#### LogRocket (Alternatif)

1. [LogRocket.com](https://logrocket.com)'a kaydolun
2. Next.js entegrasyonu yapın
3. Session replay ve error tracking aktif

### 3. Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com) (ücretsiz)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

**Monitor edilecek URL'ler:**
- Ana sayfa: `https://yourdomain.com`
- API health: `https://yourdomain.com/api/health`
- Admin panel: `https://yourdomain.com/admin`

---

## 💾 BACKUP STRATEJİSİ

### 1. Supabase Backup

Supabase otomatik backup sağlar, ancak manuel backup da alabilirsiniz:

1. Supabase Dashboard > **Database** > **Backups**
2. **Create backup** (manuel backup)
3. Veya otomatik backup ayarlarını kontrol edin

### 2. Database Export

Supabase Dashboard > **SQL Editor**:

```sql
-- Tüm tabloları export etmek için pg_dump kullanın
-- Veya Supabase Dashboard > Database > Backups > Download
```

### 3. Code Backup

- ✅ GitHub'da kod zaten yedekleniyor
- ✅ Her commit bir backup'tır
- ✅ Production branch'i koruyun

### 4. Environment Variables Backup

⚠️ **Önemli:** Tüm environment variables'ı güvenli bir yerde (password manager) saklayın!

---

## 🐛 SORUN GİDERME

### Build Hatası

**Sorun:** Vercel build başarısız oluyor

**Çözüm:**
1. Vercel Dashboard > **Deployments** > **Logs**'u kontrol edin
2. Local'de `npm run build` çalıştırın, hataları görün
3. Environment variables eksik mi kontrol edin
4. TypeScript/ESLint hatalarını düzeltin

### Webhook Çalışmıyor

**Sorun:** Stripe webhook'ları gelmiyor

**Çözüm:**
1. Stripe Dashboard > **Webhooks** > **Logs** kontrol edin
2. Webhook URL doğru mu? (`https://yourdomain.com/api/payments/webhook`)
3. Vercel logs'da webhook request'lerini kontrol edin
4. `STRIPE_WEBHOOK_SECRET` doğru mu?

### Email Gönderilmiyor

**Sorun:** Email verification veya contact reply gönderilmiyor

**Çözüm:**
1. Supabase SMTP ayarlarını kontrol edin
2. App Password kullanıldığından emin olun (normal şifre değil!)
3. Vercel environment variables'da `SMTP_*` değişkenlerini kontrol edin
4. Vercel logs'da email hatalarını kontrol edin
5. Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### Database Bağlantı Hatası

**Sorun:** Supabase bağlantı hatası

**Çözüm:**
1. `NEXT_PUBLIC_SUPABASE_URL` doğru mu?
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
3. Supabase projesi aktif mi?
4. RLS policies doğru mu?

### Domain SSL Hatası

**Sorun:** SSL sertifikası oluşturulamıyor

**Çözüm:**
1. DNS ayarları doğru mu? (24-48 saat bekle)
2. Vercel Dashboard > **Settings** > **Domains**'de domain durumunu kontrol edin
3. CNAME kaydı doğru mu?

### Performance Sorunları

**Sorun:** Site yavaş yükleniyor

**Çözüm:**
1. Vercel Analytics > **Performance** kontrol edin
2. Image optimization kullanın (Next.js Image component)
3. API response time'ları kontrol edin
4. Database query'leri optimize edin

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Tüm SQL dosyaları Supabase'de çalıştırıldı
- [ ] Storage bucket'ları oluşturuldu
- [ ] Production build local'de test edildi (`npm run build`)
- [ ] Environment variables listesi hazır
- [ ] GitHub repository oluşturuldu ve kod yüklendi
- [ ] Domain satın alındı
- [ ] Stripe production keys hazır
- [ ] Email SMTP App Password oluşturuldu

### Deployment

- [ ] Vercel projesi oluşturuldu
- [ ] Tüm environment variables eklendi
- [ ] İlk deploy başarılı
- [ ] Domain eklendi ve DNS ayarları yapıldı
- [ ] SSL sertifikası aktif
- [ ] Stripe webhook URL güncellendi
- [ ] Supabase SMTP ayarları yapılandırıldı

### Post-Deployment

- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Tüm fonksiyonellik test edildi
- [ ] Email verification test edildi
- [ ] Stripe webhook test edildi
- [ ] Contact form test edildi
- [ ] Admin panel test edildi
- [ ] Monitoring kuruldu
- [ ] Backup stratejisi uygulandı

---

## 🎉 BAŞARILAR!

Synax platformunuz artık canlıda! 

**Sonraki Adımlar:**
- Kullanıcı geri bildirimlerini toplayın
- Performance optimizasyonları yapın
- Yeni özellikler ekleyin
- Marketing ve SEO çalışmalarına başlayın

**Destek:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**🚀 Platformunuz hazır, başarılar!**





## 📋 İÇİNDEKİLER

1. [Ön Hazırlık](#ön-hazırlık)
2. [Veritabanı Kurulumu](#veritabanı-kurulumu)
3. [Environment Variables](#environment-variables)
4. [Production Build Testi](#production-build-testi)
5. [GitHub Repository](#github-repository)
6. [Vercel Deployment](#vercel-deployment)
7. [Domain ve SSL](#domain-ve-ssl)
8. [Webhook Ayarları](#webhook-ayarları)
9. [Email SMTP Ayarları](#email-smtp-ayarları)
10. [Cron Job Kurulumu](#cron-job-kurulumu)
11. [Post-Deployment Kontrolleri](#post-deployment-kontrolleri)
12. [Monitoring ve Logging](#monitoring-ve-logging)
13. [Backup Stratejisi](#backup-stratejisi)
14. [Sorun Giderme](#sorun-giderme)

---

## 🎯 ÖN HAZIRLIK

### Gerekli Hesaplar ve Servisler

- [ ] **Domain** satın alındı (örn: synax.com, synaxtrading.com)
- [ ] **GitHub** hesabı hazır
- [ ] **Vercel** hesabı hazır (ücretsiz plan yeterli)
- [ ] **Supabase** projesi oluşturuldu (Production için ayrı proje önerilir)
- [ ] **Stripe** hesabı aktif ve doğrulandı (Production mode)
- [ ] **Email SMTP** hesabı hazır (Hotmail/Outlook App Password oluşturuldu)

### Önemli Notlar

⚠️ **Production için ayrı Supabase projesi kullanın!** Development ve production veritabanlarını ayırın.

⚠️ **Stripe Production keys kullanın!** Test keys (`sk_test_`, `pk_test_`) değil, live keys (`sk_live_`, `pk_live_`) kullanın.

---

## 🗄️ VERİTABANI KURULUMU

### 1. Supabase Production Projesi

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. **"New Project"** tıklayın
3. Proje adı: `synax-production` (veya istediğiniz isim)
4. Database password oluşturun (güvenli bir şifre!)
5. Region seçin (kullanıcılarınıza en yakın bölge)
6. **"Create new project"** tıklayın
7. Projenin hazır olmasını bekleyin (2-3 dakika)

### 2. Veritabanı Şemalarını Çalıştırın

Supabase Dashboard > **SQL Editor**'de sırayla çalıştırın:

#### 2.1 Ana Şema
```sql
-- database-schema.sql dosyasının içeriğini çalıştırın
```

#### 2.2 Manuel Fiyat Sistemi
```sql
-- database-manual-prices.sql dosyasının içeriğini çalıştırın
```

#### 2.3 Earn Products
```sql
-- database-earn-products-table.sql dosyasının içeriğini çalıştırın
```

#### 2.4 Earn Subscriptions
```sql
-- database-earn-subscriptions-table.sql dosyasının içeriğini çalıştırın
```

#### 2.5 Earn Subscriptions Update
```sql
-- database-earn-subscriptions-update.sql dosyasının içeriğini çalıştırın
```

#### 2.6 Contact Messages
```sql
-- database-contact-messages-table.sql dosyasının içeriğini çalıştırın
```

#### 2.7 Contact Attachments Storage
```sql
-- database-contact-attachments-storage.sql dosyasının içeriğini çalıştırın
```

#### 2.8 Diğer Tablolar
- `database-alerts-table.sql`
- `database-orders-table.sql`
- `database-new-trades-table.sql`
- Diğer gerekli SQL dosyaları

### 3. Storage Bucket'ları Oluşturun

Supabase Dashboard > **Storage**:

1. **`kyc-documents`** bucket'ı oluşturun
   - Public: ❌ (Private)
   - RLS policies: `database-storage-policies.sql` dosyasından

2. **`deposit-receipts`** bucket'ı oluşturun
   - Public: ❌ (Private)
   - RLS policies: `database-storage-policies.sql` dosyasından

3. **`contact-attachments`** bucket'ı oluşturun
   - Public: ❌ (Private)
   - RLS policies: `database-contact-attachments-storage.sql` dosyasından

### 4. API Keys Alın

Supabase Dashboard > **Settings** > **API**:

- ✅ **Project URL**: `https://xxxxx.supabase.co`
- ✅ **anon public key**: `eyJhbGci...` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- ✅ **service_role key**: `eyJhbGci...` (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Gizli tutun!

### 5. Email Verification Ayarları

Supabase Dashboard > **Authentication** > **Email**:

- ✅ **Enable email confirmations**: Açık
- ✅ **SMTP Settings**: Yapılandırıldı (Hotmail/Outlook App Password ile)
- ✅ **Email templates**: Özelleştirildi (opsiyonel)

Detaylı bilgi: `SUPABASE-EMAIL-VERIFICATION-SETUP.md`

---

## 🔐 ENVIRONMENT VARIABLES

### Production Environment Variables Listesi

Aşağıdaki tüm environment variables'ı **Vercel**'de ekleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe (Production Keys!)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email SMTP
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=customerservicesynax@hotmail.com
SMTP_PASSWORD=YOUR_APP_PASSWORD_HERE
SMTP_FROM=customerservicesynax@hotmail.com

# Webhook Secret
WEBHOOK_SECRET=synax-webhook-secret-2024
```

### Vercel'de Environment Variables Ekleme

1. Vercel Dashboard > **Project** > **Settings** > **Environment Variables**
2. Her bir değişkeni ekleyin:
   - **Name**: Değişken adı (örn: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Değer
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development (hepsini seçin!)
3. **Save** tıklayın
4. Tüm değişkenleri ekledikten sonra **Redeploy** yapın

⚠️ **Önemli:**
- `NEXT_PUBLIC_*` ile başlayan değişkenler client-side'da kullanılabilir
- `SUPABASE_SERVICE_ROLE_KEY` ve `STRIPE_SECRET_KEY` gibi gizli anahtarları asla client-side'da kullanmayın!
- App Password'u normal şifre yerine kullanın (Hotmail/Outlook için)

---

## 🧪 PRODUCTION BUILD TESTI

Deployment öncesi local'de production build test edin:

```bash
# Proje dizinine gidin
cd C:\Synax

# Dependencies kontrol
npm install

# Production build
npm run build

# Build başarılı mı kontrol
# Hata varsa düzeltin, sonra tekrar build edin
```

### Build Hatalarını Kontrol

- ✅ TypeScript hataları yok mu?
- ✅ Import hataları yok mu?
- ✅ Environment variables eksik mi?
- ✅ API route'ları doğru mu?

---

## 📦 GITHUB REPOSITORY

### 1. Repository Oluşturma

1. [GitHub.com](https://github.com)'a gidin
2. **"+"** → **"New repository"**
3. Repository adı: `synax-platform` (veya istediğiniz isim)
4. Description: `Synax - Crypto & Gold Trading Platform`
5. **Private** (önerilen) veya **Public**
6. **Initialize with README**: ❌ (zaten README var)
7. **Create repository**

### 2. .gitignore Kontrolü

`.gitignore` dosyasında şunlar olmalı:

```
# Environment variables
.env.local
.env*.local

# Dependencies
node_modules/

# Build
.next/
out/
dist/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

### 3. Kodu GitHub'a Yükleme

```bash
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

# Remote repository ekle
git remote add origin https://github.com/KULLANICI_ADINIZ/synax-platform.git

# Kodu yükle
git push -u origin main
```

⚠️ **Önemli:** `.env.local` dosyasını asla commit etmeyin! Sadece Vercel'de environment variables olarak ekleyin.

---

## 🚀 VERCEL DEPLOYMENT

### 1. Vercel Hesabı

1. [vercel.com](https://vercel.com)'a gidin
2. **"Sign Up"** → GitHub ile giriş yapın
3. GitHub hesabınızı bağlayın

### 2. Yeni Proje Oluşturma

1. Vercel Dashboard > **"Add New..."** → **"Project"**
2. GitHub repository'nizi seçin: `synax-platform`
3. **"Import"** tıklayın

### 3. Project Ayarları

Vercel otomatik olarak Next.js'i algılar, ancak kontrol edin:

- ✅ **Framework Preset**: Next.js
- ✅ **Root Directory**: `./`
- ✅ **Build Command**: `npm run build` (otomatik)
- ✅ **Output Directory**: `.next` (otomatik)
- ✅ **Install Command**: `npm install` (otomatik)

### 4. Environment Variables Ekleme

**TÜM DEĞİŞKENLERİ EKLEYİN** (yukarıdaki [Environment Variables](#environment-variables) bölümünden):

1. **Settings** > **Environment Variables**
2. Her bir değişkeni ekleyin
3. **Environment**: Production, Preview, Development (hepsini seçin!)
4. **Save**

### 5. Deploy

1. **"Deploy"** butonuna tıklayın
2. Build sürecini izleyin (2-5 dakika)
3. ✅ Başarılı! URL: `https://synax-platform.vercel.app`

### 6. Custom Domain Ekleme

1. **Settings** > **Domains**
2. Domain'inizi ekleyin (örn: `synax.com`)
3. DNS ayarlarını takip edin

---

## 🌐 DOMAIN VE SSL

### 1. Domain DNS Ayarları

Domain sağlayıcınızda (Namecheap, GoDaddy, Cloudflare vb.) DNS kayıtlarını düzenleyin:

#### Vercel CNAME Kullanımı (Önerilen)

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

#### Alternatif: A Record (Eğer CNAME desteklenmiyorsa)

Vercel Dashboard > **Settings** > **Domains**'den IP adresini alın ve A record ekleyin.

### 2. SSL Sertifikası

✅ **Vercel otomatik olarak SSL sağlar!** Let's Encrypt sertifikası otomatik olarak oluşturulur ve yenilenir.

- Domain eklendikten sonra 24 saat içinde SSL aktif olur
- HTTPS zorunlu (HTTP otomatik olarak HTTPS'e yönlendirilir)

### 3. Domain Doğrulama

1. DNS ayarlarını yaptıktan sonra 24-48 saat bekleyin (DNS propagation)
2. Vercel Dashboard > **Settings** > **Domains**'de domain durumunu kontrol edin
3. ✅ "Valid Configuration" görünene kadar bekleyin

---

## 🔗 WEBHOOK AYARLARI

### 1. Stripe Webhook

1. [Stripe Dashboard](https://dashboard.stripe.com) > **Developers** > **Webhooks**
2. **"Add endpoint"** tıklayın
3. **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
4. **Events to send**:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
5. **"Add endpoint"** tıklayın
6. **Signing secret** (whsec_...) kopyalayın
7. Bu secret'ı Vercel environment variables'a ekleyin: `STRIPE_WEBHOOK_SECRET`

### 2. Fiyat Güncelleme Webhook (Opsiyonel)

Eğer harici bir servisten fiyat güncellemeleri alıyorsanız:

**Endpoint**: `https://yourdomain.com/api/webhooks/price-update`

**Header**: `x-webhook-secret: synax-webhook-secret-2024`

**Body**:
```json
{
  "prices": [
    {
      "asset_id": "bitcoin",
      "asset_type": "crypto",
      "price": 50000,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 📧 EMAIL SMTP AYARLARI

### 1. Supabase SMTP (Email Verification İçin)

Supabase Dashboard > **Authentication** > **Email** > **SMTP Settings**:

```
Host: smtp-mail.outlook.com
Port: 587
Username: customerservicesynax@hotmail.com
Password: YOUR_APP_PASSWORD (normal şifre değil!)
Sender Email: customerservicesynax@hotmail.com
Sender Name: Synax Support
```

⚠️ **Önemli:** App Password kullanın! Normal şifre çalışmaz.

Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### 2. Contact Reply SMTP (.env.local)

Vercel environment variables'da:

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=customerservicesynax@hotmail.com
SMTP_PASSWORD=YOUR_APP_PASSWORD
SMTP_FROM=customerservicesynax@hotmail.com
```

---

## ⏰ CRON JOB KURULUMU

### 1. Earn Products Expiry Check

Kilitli (locked) earn product'ların süresi dolduğunda otomatik tamamlanması için:

**Vercel Cron Jobs** (Vercel Pro plan gerekli) veya **External Cron Service** kullanın:

#### Vercel Cron (Önerilen - Pro plan gerekli)

`vercel.json` dosyası oluşturun:

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

Bu her saat başı çalışır.

#### External Cron Service (Ücretsiz Alternatif)

[Cron-job.org](https://cron-job.org) veya [EasyCron](https://www.easycron.com) kullanın:

- **URL**: `https://yourdomain.com/api/earn/check-expired`
- **Schedule**: Her saat (0 * * * *)
- **Method**: GET veya POST
- **Authentication**: API key veya secret header ekleyin (güvenlik için)

### 2. API Endpoint Güvenliği

`/api/earn/check-expired` endpoint'ine authentication ekleyin:

```javascript
// API key kontrolü
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.CRON_API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

Vercel environment variables'a ekleyin: `CRON_API_KEY=your-secret-key`

---

## ✅ POST-DEPLOYMENT KONTROLLERİ

### 1. İlk Admin Kullanıcı Oluşturma

1. Production site'da kayıt olun
2. Supabase Dashboard > **Table Editor** > **profiles**
3. Kullanıcınızı bulun
4. `is_admin` sütununu `true` yapın
5. Kaydedin

### 2. Fonksiyonellik Testleri

- [ ] ✅ Ana sayfa yükleniyor mu?
- [ ] ✅ Kayıt olma çalışıyor mu?
- [ ] ✅ Email verification geliyor mu?
- [ ] ✅ Login çalışıyor mu?
- [ ] ✅ Dashboard yükleniyor mu?
- [ ] ✅ KYC belge yükleme çalışıyor mu?
- [ ] ✅ Deposit işlemi çalışıyor mu? (Stripe test kartları ile)
- [ ] ✅ Trading işlemleri çalışıyor mu?
- [ ] ✅ Earn products görünüyor mu?
- [ ] ✅ Contact form çalışıyor mu?
- [ ] ✅ Admin panel erişilebilir mi?
- [ ] ✅ Admin mesajlara cevap verebiliyor mu?

### 3. API Endpoint Testleri

```bash
# Health check
curl https://yourdomain.com/api/health

# Prices
curl https://yourdomain.com/api/prices/crypto?symbol=BTC

# Earn products
curl https://yourdomain.com/api/earn/products
```

### 4. Stripe Webhook Testi

1. Stripe Dashboard > **Webhooks** > **Send test webhook**
2. Event: `payment_intent.succeeded`
3. Gönderin
4. Vercel logs'da webhook'un geldiğini kontrol edin

### 5. Email Testi

1. Yeni bir kullanıcı kaydı yapın
2. Email verification maili geldi mi kontrol edin
3. Admin panel'den bir mesaja cevap verin
4. Kullanıcının email'ine cevap gitti mi kontrol edin

---

## 📊 MONITORING VE LOGGING

### 1. Vercel Analytics

Vercel Dashboard > **Analytics**:

- ✅ Page views
- ✅ Performance metrics
- ✅ Error tracking
- ✅ Real-time monitoring

### 2. Error Tracking (Önerilen)

#### Sentry (Önerilen)

1. [Sentry.io](https://sentry.io)'ya kaydolun
2. Next.js projesi oluşturun
3. `@sentry/nextjs` paketini yükleyin
4. Vercel environment variables'a `SENTRY_DSN` ekleyin

#### LogRocket (Alternatif)

1. [LogRocket.com](https://logrocket.com)'a kaydolun
2. Next.js entegrasyonu yapın
3. Session replay ve error tracking aktif

### 3. Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com) (ücretsiz)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

**Monitor edilecek URL'ler:**
- Ana sayfa: `https://yourdomain.com`
- API health: `https://yourdomain.com/api/health`
- Admin panel: `https://yourdomain.com/admin`

---

## 💾 BACKUP STRATEJİSİ

### 1. Supabase Backup

Supabase otomatik backup sağlar, ancak manuel backup da alabilirsiniz:

1. Supabase Dashboard > **Database** > **Backups**
2. **Create backup** (manuel backup)
3. Veya otomatik backup ayarlarını kontrol edin

### 2. Database Export

Supabase Dashboard > **SQL Editor**:

```sql
-- Tüm tabloları export etmek için pg_dump kullanın
-- Veya Supabase Dashboard > Database > Backups > Download
```

### 3. Code Backup

- ✅ GitHub'da kod zaten yedekleniyor
- ✅ Her commit bir backup'tır
- ✅ Production branch'i koruyun

### 4. Environment Variables Backup

⚠️ **Önemli:** Tüm environment variables'ı güvenli bir yerde (password manager) saklayın!

---

## 🐛 SORUN GİDERME

### Build Hatası

**Sorun:** Vercel build başarısız oluyor

**Çözüm:**
1. Vercel Dashboard > **Deployments** > **Logs**'u kontrol edin
2. Local'de `npm run build` çalıştırın, hataları görün
3. Environment variables eksik mi kontrol edin
4. TypeScript/ESLint hatalarını düzeltin

### Webhook Çalışmıyor

**Sorun:** Stripe webhook'ları gelmiyor

**Çözüm:**
1. Stripe Dashboard > **Webhooks** > **Logs** kontrol edin
2. Webhook URL doğru mu? (`https://yourdomain.com/api/payments/webhook`)
3. Vercel logs'da webhook request'lerini kontrol edin
4. `STRIPE_WEBHOOK_SECRET` doğru mu?

### Email Gönderilmiyor

**Sorun:** Email verification veya contact reply gönderilmiyor

**Çözüm:**
1. Supabase SMTP ayarlarını kontrol edin
2. App Password kullanıldığından emin olun (normal şifre değil!)
3. Vercel environment variables'da `SMTP_*` değişkenlerini kontrol edin
4. Vercel logs'da email hatalarını kontrol edin
5. Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### Database Bağlantı Hatası

**Sorun:** Supabase bağlantı hatası

**Çözüm:**
1. `NEXT_PUBLIC_SUPABASE_URL` doğru mu?
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
3. Supabase projesi aktif mi?
4. RLS policies doğru mu?

### Domain SSL Hatası

**Sorun:** SSL sertifikası oluşturulamıyor

**Çözüm:**
1. DNS ayarları doğru mu? (24-48 saat bekle)
2. Vercel Dashboard > **Settings** > **Domains**'de domain durumunu kontrol edin
3. CNAME kaydı doğru mu?

### Performance Sorunları

**Sorun:** Site yavaş yükleniyor

**Çözüm:**
1. Vercel Analytics > **Performance** kontrol edin
2. Image optimization kullanın (Next.js Image component)
3. API response time'ları kontrol edin
4. Database query'leri optimize edin

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Tüm SQL dosyaları Supabase'de çalıştırıldı
- [ ] Storage bucket'ları oluşturuldu
- [ ] Production build local'de test edildi (`npm run build`)
- [ ] Environment variables listesi hazır
- [ ] GitHub repository oluşturuldu ve kod yüklendi
- [ ] Domain satın alındı
- [ ] Stripe production keys hazır
- [ ] Email SMTP App Password oluşturuldu

### Deployment

- [ ] Vercel projesi oluşturuldu
- [ ] Tüm environment variables eklendi
- [ ] İlk deploy başarılı
- [ ] Domain eklendi ve DNS ayarları yapıldı
- [ ] SSL sertifikası aktif
- [ ] Stripe webhook URL güncellendi
- [ ] Supabase SMTP ayarları yapılandırıldı

### Post-Deployment

- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Tüm fonksiyonellik test edildi
- [ ] Email verification test edildi
- [ ] Stripe webhook test edildi
- [ ] Contact form test edildi
- [ ] Admin panel test edildi
- [ ] Monitoring kuruldu
- [ ] Backup stratejisi uygulandı

---

## 🎉 BAŞARILAR!

Synax platformunuz artık canlıda! 

**Sonraki Adımlar:**
- Kullanıcı geri bildirimlerini toplayın
- Performance optimizasyonları yapın
- Yeni özellikler ekleyin
- Marketing ve SEO çalışmalarına başlayın

**Destek:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**🚀 Platformunuz hazır, başarılar!**
















