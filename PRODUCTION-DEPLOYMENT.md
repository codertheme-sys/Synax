# 🚀 Synax Platform - Production Deployment Rehberi

## 📋 HAZIRLIK KONTROL LİSTESİ

### Gerekli Hesaplar
- [ ] Domain satın alındı
- [ ] GitHub hesabı
- [ ] Vercel hesabı (ücretsiz plan yeterli)
- [ ] Supabase Production projesi oluşturuldu
- [ ] Stripe Production hesabı aktif
- [ ] Email SMTP (Hotmail App Password hazır)

---

## 🗄️ ADIM 1: SUPABASE PRODUCTION KURULUMU

### 1.1 Yeni Supabase Projesi
1. [Supabase Dashboard](https://app.supabase.com) > **New Project**
2. Proje adı: `synax-production`
3. Database password oluştur (güvenli şifre!)
4. Region seç
5. **Create new project**

### 1.2 Veritabanı Şemaları
Supabase Dashboard > **SQL Editor**'de sırayla çalıştır:

1. `database-schema.sql`
2. `database-manual-prices.sql`
3. `database-earn-products-table.sql`
4. `database-earn-subscriptions-table.sql`
5. `database-earn-subscriptions-update.sql`
6. `database-contact-messages-table.sql`
7. `database-contact-attachments-storage.sql`
8. `database-alerts-table.sql`
9. Diğer gerekli SQL dosyaları

### 1.3 Storage Buckets
Supabase Dashboard > **Storage**:

- `kyc-documents` (Private)
- `deposit-receipts` (Private)
- `contact-attachments` (Private)

RLS policies: İlgili SQL dosyalarından ekle

### 1.4 API Keys
Supabase Dashboard > **Settings** > **API**:

- ✅ Project URL: `https://xxxxx.supabase.co`
- ✅ anon public key: `eyJhbGci...`
- ✅ service_role key: `eyJhbGci...` ⚠️ Gizli tutun!

### 1.5 Email Verification
Supabase Dashboard > **Authentication** > **Email**:

- ✅ Enable email confirmations: Açık
- ✅ SMTP Settings yapılandır (Hotmail App Password)
- Detay: `SUPABASE-EMAIL-VERIFICATION-SETUP.md`

---

## 🔐 ADIM 2: ENVIRONMENT VARIABLES

### Vercel'de Ekleyecek Değişkenler

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
SMTP_PASSWORD=YOUR_APP_PASSWORD
SMTP_FROM=customerservicesynax@hotmail.com

# Webhook
WEBHOOK_SECRET=synax-webhook-secret-2024
```

⚠️ **Önemli:** 
- Production'da `sk_live_` ve `pk_live_` kullanın (test değil!)
- App Password kullanın (normal şifre değil!)
- Tüm environment'lar için ekleyin (Production, Preview, Development)

---

## 📦 ADIM 3: GITHUB REPOSITORY

### 3.1 Repository Oluştur
1. GitHub.com > **New repository**
2. Name: `synax-platform`
3. Private (önerilen)
4. **Create repository**

### 3.2 Kodu Yükle

```bash
cd C:\Synax
git init
git add .
git commit -m "Initial commit - Production Ready"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/synax-platform.git
git push -u origin main
```

⚠️ `.env.local` dosyasını asla commit etmeyin!

---

## 🚀 ADIM 4: VERCEL DEPLOYMENT

### 4.1 Vercel Hesabı
1. [vercel.com](https://vercel.com) > GitHub ile giriş
2. GitHub hesabını bağla

### 4.2 Yeni Proje
1. **Add New...** > **Project**
2. GitHub repository'yi seç: `synax-platform`
3. **Import**

### 4.3 Ayarlar
Vercel otomatik Next.js algılar:
- Framework: Next.js ✅
- Build Command: `npm run build` ✅
- Output Directory: `.next` ✅

### 4.4 Environment Variables
1. **Settings** > **Environment Variables**
2. Yukarıdaki tüm değişkenleri ekle
3. Environment: Production, Preview, Development (hepsini seç!)
4. **Save**

### 4.5 Deploy
1. **Deploy** butonuna tıkla
2. Build tamamlanmasını bekle (2-5 dakika)
3. ✅ Başarılı! URL: `https://synax-platform.vercel.app`

---

## 🌐 ADIM 5: DOMAIN VE SSL

### 5.1 Domain DNS Ayarları
Domain sağlayıcınızda (Namecheap, GoDaddy vb.):

```
Type: CNAME
Name: @ (veya boş)
Value: cname.vercel-dns.com
TTL: 3600
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 5.2 Vercel'e Domain Ekle
1. Vercel > **Settings** > **Domains**
2. Domain'inizi ekle
3. DNS ayarlarını takip et
4. 24-48 saat bekle (DNS propagation)

### 5.3 SSL
✅ Vercel otomatik SSL sağlar (Let's Encrypt)
- Domain eklendikten 24 saat içinde aktif olur
- HTTPS otomatik, HTTP HTTPS'e yönlendirilir

---

## 🔗 ADIM 6: WEBHOOK AYARLARI

### 6.1 Stripe Webhook
1. Stripe Dashboard > **Developers** > **Webhooks**
2. **Add endpoint**
3. URL: `https://yourdomain.com/api/payments/webhook`
4. Events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
5. **Signing secret** (whsec_...) kopyala
6. Vercel environment variables'a ekle: `STRIPE_WEBHOOK_SECRET`

### 6.2 Fiyat Güncelleme Webhook (Opsiyonel)
URL: `https://yourdomain.com/api/webhooks/price-update`
Header: `x-webhook-secret: synax-webhook-secret-2024`

---

## 📧 ADIM 7: EMAIL SMTP

### 7.1 Supabase SMTP
Supabase Dashboard > **Authentication** > **Email** > **SMTP Settings**:

```
Host: smtp-mail.outlook.com
Port: 587
Username: customerservicesynax@hotmail.com
Password: YOUR_APP_PASSWORD
Sender Email: customerservicesynax@hotmail.com
Sender Name: Synax Support
```

Detay: `HOTMAIL-SMTP-AYARLARI.md`

### 7.2 Contact Reply SMTP
Vercel environment variables'da `SMTP_*` değişkenleri eklendi (Adım 2)

---

## ⏰ ADIM 8: CRON JOB (Earn Products Expiry)

### Seçenek 1: Vercel Cron (Pro plan gerekli)
`vercel.json` dosyası oluştur:

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

### Seçenek 2: External Cron (Ücretsiz)
[Cron-job.org](https://cron-job.org) veya [EasyCron](https://www.easycron.com):

- URL: `https://yourdomain.com/api/earn/check-expired`
- Schedule: Her saat (0 * * * *)
- Authentication: API key header ekle

API endpoint'e authentication ekle (güvenlik için)

---

## ✅ ADIM 9: POST-DEPLOYMENT KONTROLLERİ

### 9.1 İlk Admin Kullanıcı
1. Production site'da kayıt ol
2. Supabase Dashboard > **Table Editor** > **profiles**
3. Kullanıcıyı bul
4. `is_admin` = `true` yap
5. Kaydet

### 9.2 Fonksiyonellik Testleri
- [ ] Ana sayfa yükleniyor
- [ ] Kayıt olma çalışıyor
- [ ] Email verification geliyor
- [ ] Login çalışıyor
- [ ] Dashboard yükleniyor
- [ ] KYC belge yükleme çalışıyor
- [ ] Deposit işlemi çalışıyor (Stripe test)
- [ ] Trading işlemleri çalışıyor
- [ ] Earn products görünüyor
- [ ] Contact form çalışıyor
- [ ] Admin panel erişilebilir
- [ ] Admin mesajlara cevap verebiliyor

### 9.3 API Testleri
```bash
# Health check
curl https://yourdomain.com/api/health

# Prices
curl https://yourdomain.com/api/prices/crypto?symbol=BTC

# Earn products
curl https://yourdomain.com/api/earn/products
```

### 9.4 Stripe Webhook Testi
1. Stripe Dashboard > **Webhooks** > **Send test webhook**
2. Event: `payment_intent.succeeded`
3. Vercel logs'da kontrol et

### 9.5 Email Testi
1. Yeni kullanıcı kaydı yap
2. Email verification maili geldi mi?
3. Admin panel'den mesaja cevap ver
4. Kullanıcı email'ine cevap gitti mi?

---

## 📊 MONITORING

### Vercel Analytics
Vercel Dashboard > **Analytics**:
- Page views
- Performance metrics
- Error tracking
- Real-time monitoring

### Error Tracking (Önerilen)
- **Sentry**: [sentry.io](https://sentry.io)
- **LogRocket**: [logrocket.com](https://logrocket.com)

### Uptime Monitoring
- **UptimeRobot**: [uptimerobot.com](https://uptimerobot.com) (ücretsiz)
- Monitor URL'ler: Ana sayfa, API health, Admin panel

---

## 💾 BACKUP

### Supabase Backup
- ✅ Supabase otomatik backup sağlar
- Manuel backup: Dashboard > **Database** > **Backups** > **Create backup**

### Code Backup
- ✅ GitHub'da kod zaten yedekleniyor
- ✅ Her commit bir backup

### Environment Variables Backup
⚠️ Tüm environment variables'ı güvenli bir yerde (password manager) saklayın!

---

## 🐛 SORUN GİDERME

### Build Hatası
1. Vercel Dashboard > **Deployments** > **Logs** kontrol et
2. Local'de `npm run build` çalıştır
3. Environment variables eksik mi?
4. TypeScript/ESLint hatalarını düzelt

### Webhook Çalışmıyor
1. Stripe Dashboard > **Webhooks** > **Logs** kontrol et
2. Webhook URL doğru mu?
3. Vercel logs kontrol et
4. `STRIPE_WEBHOOK_SECRET` doğru mu?

### Email Gönderilmiyor
1. Supabase SMTP ayarlarını kontrol et
2. App Password kullanıldığından emin ol
3. Vercel environment variables kontrol et
4. Vercel logs kontrol et
5. Detay: `HOTMAIL-SMTP-AYARLARI.md`

### Database Bağlantı Hatası
1. `NEXT_PUBLIC_SUPABASE_URL` doğru mu?
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
3. Supabase projesi aktif mi?
4. RLS policies doğru mu?

### Domain SSL Hatası
1. DNS ayarları doğru mu? (24-48 saat bekle)
2. Vercel Dashboard > **Settings** > **Domains** kontrol et
3. CNAME kaydı doğru mu?

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Tüm SQL dosyaları Supabase'de çalıştırıldı
- [ ] Storage bucket'ları oluşturuldu
- [ ] Production build test edildi (`npm run build`)
- [ ] Environment variables listesi hazır
- [ ] GitHub repository oluşturuldu
- [ ] Domain satın alındı
- [ ] Stripe production keys hazır
- [ ] Email SMTP App Password hazır

### Deployment
- [ ] Vercel projesi oluşturuldu
- [ ] Environment variables eklendi
- [ ] İlk deploy başarılı
- [ ] Domain eklendi
- [ ] DNS ayarları yapıldı
- [ ] SSL aktif
- [ ] Stripe webhook URL güncellendi
- [ ] Supabase SMTP yapılandırıldı

### Post-Deployment
- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Tüm fonksiyonellik test edildi
- [ ] Email verification test edildi
- [ ] Stripe webhook test edildi
- [ ] Contact form test edildi
- [ ] Admin panel test edildi
- [ ] Monitoring kuruldu

---

## 🎉 BAŞARILAR!

Synax platformunuz artık canlıda!

**Destek Dokümantasyonu:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

**🚀 Platformunuz hazır!**


