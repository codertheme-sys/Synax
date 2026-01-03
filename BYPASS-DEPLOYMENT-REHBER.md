# 🚀 CryptoGold Trading - Bypass Deployment Rehberi

## ⚠️ ÖNEMLİ NOTLAR

- **Tamamen ayrı proje** - Diğer projelerle karıştırılmamalı
- **Gerçek para işlemleri** - Demo değil, gerçek ödemeler
- **Bypass-friendly** - Bypass deployment için hazır

## 📋 HAZIRLIK KONTROL LİSTESİ

### ✅ Ön Hazırlık
- [ ] Domain satın alınacak (örn: cryptogoldtrading.com)
- [ ] GitHub hesabı
- [ ] Vercel hesabı
- [ ] Supabase projesi (YENİ - ayrı proje)
- [ ] Stripe hesabı (gerçek para işlemleri için)

### ✅ Environment Variables (Vercel'de eklenecek)

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

⚠️ **Önemli:** Production'da `sk_live_` ve `pk_live_` kullanın (test değil!). App Password kullanın (normal şifre değil!)

## 🔥 ADIM 1: Supabase Projesi Oluşturma

### 1.1 Yeni Supabase Projesi
1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. **"New Project"** tıkla
3. Proje adı: `cryptogoldtrading` (veya istediğiniz isim)
4. Database password oluşturun
5. Region seçin
6. **"Create new project"** tıkla

### 1.2 Veritabanı Şemalarını Kurun
Supabase Dashboard > **SQL Editor**'de sırayla çalıştırın:

1. `database-schema.sql` (Ana şema)
2. `database-manual-prices.sql` (Manuel fiyat sistemi)
3. `database-earn-products-table.sql` (Earn products)
4. `database-earn-subscriptions-table.sql` (Earn subscriptions)
5. `database-earn-subscriptions-update.sql` (Earn subscriptions update)
6. `database-contact-messages-table.sql` (Contact messages)
7. `database-contact-attachments-storage.sql` (Contact attachments)
8. `database-alerts-table.sql` (Alerts)
9. `database-orders-table.sql` (Orders)
10. `database-new-trades-table.sql` (Trades)
11. Diğer gerekli SQL dosyaları

Her birini ayrı ayrı çalıştırın ve başarılı mesajını bekleyin.

### 1.3 Storage Bucket'ları Oluşturun
Supabase Dashboard > **Storage**:

- **`kyc-documents`** (Private) - KYC belgeleri için
- **`deposit-receipts`** (Private) - Deposit makbuzları için
- **`contact-attachments`** (Private) - Contact form dosyaları için

RLS policies: İlgili SQL dosyalarından ekleyin (`database-storage-policies.sql`, `database-contact-attachments-storage.sql`)

### 1.4 Email Verification Ayarları
Supabase Dashboard > **Authentication** > **Email**:

- ✅ **Enable email confirmations**: Açık
- ✅ **SMTP Settings**: Yapılandırıldı (Hotmail App Password ile)
- Detaylı bilgi: `SUPABASE-EMAIL-VERIFICATION-SETUP.md`

### 1.3 API Keys Alın
1. Settings > **API**
2. Şu bilgileri not edin:
   - Project URL
   - anon public key
   - service_role key

## 🔥 ADIM 2: Stripe Hesabı Kurulumu

### 2.1 Stripe Hesabı
1. [Stripe.com](https://stripe.com)'a gidin
2. Hesap oluşturun (veya giriş yapın)
3. **Activate account** (gerçek para için)

### 2.2 API Keys Alın
1. Developers > **API keys**
2. **Publishable key** (pk_live_...) kopyalayın
3. **Secret key** (sk_live_...) kopyalayın (güvenli tutun!)

### 2.3 Webhook Kurulumu
1. Developers > **Webhooks**
2. **Add endpoint** tıkla
3. Endpoint URL: `https://yourdomain.com/api/payments/webhook`
4. Events to send: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. **Signing secret** (whsec_...) kopyalayın

## 🔥 ADIM 3: GitHub Repository

### 3.1 Repository Oluştur
1. GitHub.com'a gidin
2. **"+"** → **"New repository"**
3. Name: `cryptogoldtrading`
4. Description: `CryptoGold Trading Platform - Real Money`
5. **Private** (önerilen)
6. **Create repository**

### 3.2 Kodu GitHub'a Yükle

```bash
cd C:\cryptogoldtrading
git init
git add .
git commit -m "Initial commit - CryptoGold Trading Platform"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/cryptogoldtrading.git
git push -u origin main
```

## 🔥 ADIM 4: Vercel Deployment

### 4.1 Vercel Hesabı
1. [vercel.com](https://vercel.com)
2. GitHub ile giriş yap
3. Hesabı bağla

### 4.2 Yeni Proje
1. **"Add New..."** → **"Project"**
2. GitHub repository'yi seç: `cryptogoldtrading`
3. **Import**

### 4.3 Project Ayarları
- Framework: Next.js ✅
- Root Directory: `./` ✅
- Build Command: `npm run build` ✅
- Output Directory: `.next` ✅

### 4.4 Environment Variables Ekle

**TÜM DEĞİŞKENLERİ EKLEYİN:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ All |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (sk_live_...) | ✅ All |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key (pk_live_...) | ✅ All |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | ✅ All |
| `SMTP_HOST` | smtp-mail.outlook.com | ✅ All |
| `SMTP_PORT` | 587 | ✅ All |
| `SMTP_USER` | customerservicesynax@hotmail.com | ✅ All |
| `SMTP_PASSWORD` | App Password (normal şifre değil!) | ✅ All |
| `SMTP_FROM` | customerservicesynax@hotmail.com | ✅ All |
| `WEBHOOK_SECRET` | synax-webhook-secret-2024 | ✅ All |

**Her birini eklerken:**
- **Environment:** Production, Preview, Development (hepsini seç!)
- **Save**

### 4.5 Deploy
1. **"Deploy"** butonuna tıkla
2. Build tamamlanmasını bekleyin
3. ✅ Başarılı!

## 🔥 ADIM 5: Domain Bağlama

### 5.1 Domain Satın Al
1. Namecheap, GoDaddy veya Cloudflare'den domain satın alın
2. Domain: `cryptogoldtrading.com` (veya istediğiniz)

### 5.2 Vercel'e Domain Ekle
1. Vercel > Project > **Settings** > **Domains**
2. Domain'i ekleyin
3. DNS ayarlarını gösterir

### 5.3 DNS Ayarları
1. Domain sağlayıcınıza gidin
2. DNS kayıtlarını düzenleyin:
   - Type: `A`
   - Name: `@`
   - Value: Vercel'in verdiği IP (veya CNAME kullanın)
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

3. 24-48 saat bekle (DNS propagation)

## 🔥 ADIM 6: Webhook URL Güncelleme

1. Stripe Dashboard > **Webhooks**
2. Endpoint'i düzenleyin
3. URL'yi güncelleyin: `https://yourdomain.com/api/payments/webhook`
4. **Save**

## 🔥 ADIM 7: Email SMTP Ayarları

### 7.1 Supabase SMTP (Email Verification)
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

### 7.2 Contact Reply SMTP
Vercel environment variables'da `SMTP_*` değişkenleri zaten eklendi (Adım 4.4)

## 🔥 ADIM 8: Cron Job Kurulumu (Earn Products Expiry)

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

Bu her saat başı çalışır.

### Seçenek 2: External Cron Service (Ücretsiz)
[Cron-job.org](https://cron-job.org) veya [EasyCron](https://www.easycron.com) kullanın:

- **URL**: `https://yourdomain.com/api/earn/check-expired`
- **Schedule**: Her saat (0 * * * *)
- **Method**: GET veya POST
- **Authentication**: API key header ekleyin (güvenlik için)

API endpoint'e authentication ekleyin (güvenlik için):
Vercel environment variables'a ekleyin: `CRON_API_KEY=your-secret-key`

## ✅ ADIM 9: Post-Deployment Kontrolleri

### 9.1 İlk Admin Kullanıcı Oluşturma
1. Production site'da kayıt olun
2. Supabase Dashboard > **Table Editor** > **profiles**
3. Kullanıcınızı bulun
4. `is_admin` sütununu `true` yapın
5. Kaydedin

### 9.2 Fonksiyonellik Testleri
- [ ] Ana sayfa yükleniyor mu?
- [ ] Kayıt olma çalışıyor mu?
- [ ] Email verification geliyor mu?
- [ ] Login çalışıyor mu?
- [ ] Dashboard yükleniyor mu?
- [ ] KYC belge yükleme çalışıyor mu?
- [ ] Deposit işlemi çalışıyor mu? (Stripe test kartları ile)
- [ ] Trading işlemleri çalışıyor mu?
- [ ] Earn products görünüyor mu?
- [ ] Contact form çalışıyor mu?
- [ ] Admin panel erişilebilir mi?
- [ ] Admin mesajlara cevap verebiliyor mu?

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
3. Gönderin
4. Vercel logs'da webhook'un geldiğini kontrol edin

### 9.5 Email Testi
1. Yeni bir kullanıcı kaydı yapın
2. Email verification maili geldi mi kontrol edin
3. Admin panel'den bir mesaja cevap verin
4. Kullanıcının email'ine cevap gitti mi kontrol edin

## ✅ DEPLOYMENT TAMAMLANDI!

Artık platformunuz canlıda! 

**Test Etmek İçin:**
1. Ana sayfaya gidin
2. Kayıt olun
3. KYC belgelerinizi yükleyin
4. Para yatırın (Stripe test kartları ile)
5. İşlem yapın!

## 🚨 ÖNEMLİ GÜVENLİK NOTLARI

1. **Stripe Keys**: Production'da `sk_live_` ve `pk_live_` kullanın (test değil!)
2. **Service Role Key**: Asla client-side'da kullanmayın!
3. **Webhook Secret**: Güvenli tutun, sadece server-side'da kullanın
4. **KYC**: Gerçek para işlemleri için KYC zorunlu
5. **SSL**: Vercel otomatik SSL sağlar

## 📝 SONRAKI ADIMLAR

- [ ] İlk admin kullanıcısı oluştur
- [ ] KYC onay sistemi test et
- [ ] Stripe test ödemeleri yap
- [ ] Gerçek ödeme akışını test et
- [ ] Email verification test et
- [ ] Contact form test et
- [ ] Admin panel test et
- [ ] Cron job test et (earn products expiry)
- [ ] Monitoring kur (Sentry, LogRocket vb.)
- [ ] Uptime monitoring (UptimeRobot vb.)
- [ ] Backup stratejisi uygula

## 📊 MONITORING VE BACKUP

### Monitoring
- **Vercel Analytics**: Dashboard > Analytics (otomatik)
- **Error Tracking**: Sentry veya LogRocket (önerilen)
- **Uptime Monitoring**: UptimeRobot (ücretsiz)

### Backup
- **Supabase**: Otomatik backup (Dashboard > Database > Backups)
- **Code**: GitHub'da zaten yedekleniyor
- **Environment Variables**: Password manager'da saklayın!

## 🐛 SORUN GİDERME

### Build Hatası
- Environment variables kontrol et
- Logs'a bak (Vercel > Deployments > Logs)

### Webhook Çalışmıyor
- Webhook URL doğru mu?
- Stripe Dashboard > Webhooks > Logs kontrol et
- Vercel logs kontrol et

### Ödeme Başarısız
- Stripe Dashboard > Payments kontrol et
- KYC durumunu kontrol et
- Bakiye yeterli mi kontrol et

### Email Gönderilmiyor
- Supabase SMTP ayarlarını kontrol et
- App Password kullanıldığından emin ol (normal şifre değil!)
- Vercel environment variables'da `SMTP_*` değişkenlerini kontrol et
- Vercel logs'da email hatalarını kontrol et
- Detaylı bilgi: `HOTMAIL-SMTP-AYARLARI.md`

### Database Bağlantı Hatası
- `NEXT_PUBLIC_SUPABASE_URL` doğru mu?
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
- Supabase projesi aktif mi?
- RLS policies doğru mu?

### Domain SSL Hatası
- DNS ayarları doğru mu? (24-48 saat bekle)
- Vercel Dashboard > **Settings** > **Domains** kontrol et
- CNAME kaydı doğru mu?

---

**🎉 Başarılar! Platformunuz hazır!**

