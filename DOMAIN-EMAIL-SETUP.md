# Domain ve Business Email Kurulum Rehberi

## 1. Vercel'de Custom Domain Ekleme (synax.vip)

### Adım 1: Vercel Dashboard'a Giriş
1. [Vercel Dashboard](https://vercel.com/dashboard) açın
2. Projenizi seçin (synax-trading-platform veya proje adınız)

### Adım 2: Domain Ekleme
1. Proje sayfasında **"Settings"** sekmesine tıklayın
2. Sol menüden **"Domains"** seçin
3. **"Add Domain"** butonuna tıklayın
4. Domain adınızı girin: `synax.vip`
5. **"Add"** butonuna tıklayın

### Adım 3: DNS Kayıtlarını Bulma ve Yapılandırma

**Vercel'de DNS Kayıtlarını Bulma:**
1. Domain ekledikten sonra, domain kartında **"Invalid Configuration"** yazısı görünecek
2. Domain kartına tıklayın veya **"Edit"** butonuna tıklayın
3. Sayfanın altına kaydırın - DNS kayıtları genellikle **"DNS Configuration"** bölümünde gösterilir
4. Veya domain'in yanındaki **"..."** (üç nokta) menüsüne tıklayın → **"View DNS Records"**
5. Vercel size şu bilgileri gösterecek:
   - **A Record** (root domain için) - IP adresi
   - **CNAME Record** (www için) - CNAME değeri
   - **VEYA** sadece CNAME kayıtları

**⚠️ ÖNEMLİ:** Vercel'in size gösterdiği **tam değerleri** not edin ve kullanın!

**Namecheap DNS Ayarları:**
1. Namecheap hesabınıza giriş yapın
2. Domain listesinden `synax.vip` seçin
3. **"Advanced DNS"** sekmesine gidin
4. **Mevcut kayıtları silin:**
   - ❌ `www` → `parkingpage.namecheap.com.` (CNAME) - SİL
   - ❌ `@` → `http://www.synax.vip/` (URL Redirect) - SİL
5. **Vercel'in verdiği kayıtları ekleyin:**

**A Record (Root Domain için - eğer Vercel verdi ise):**
- **"ADD NEW RECORD"** butonuna tıklayın
- Type: `A Record` seçin
- Host: `@` yazın
- Value: Vercel'in verdiği IP adresini yazın (örn: `76.76.21.21`)
- TTL: `Automatic` veya `30 min`
- Kaydet (✓ işaretine tıklayın)

**CNAME Record (www için):**
- **"ADD NEW RECORD"** butonuna tıklayın
- Type: `CNAME Record` seçin
- Host: `www` yazın
- Value: Vercel'in verdiği CNAME değerini yazın (örn: `cname.vercel-dns.com`)
- TTL: `Automatic` veya `30 min`
- Kaydet (✓ işaretine tıklayın)

**Detaylı rehber için:** `VERCEL-DNS-KAYITLARI-BULMA.md` dosyasına bakın.

### Adım 4: DNS Propagation Bekleme
- DNS değişiklikleri 24-48 saat içinde yayılır
- Genellikle 1-2 saat içinde aktif olur
- [DNS Checker](https://dnschecker.org/) ile kontrol edebilirsiniz

### Adım 5: SSL Sertifikası
- Vercel otomatik olarak SSL sertifikası sağlar
- Domain eklendikten sonra otomatik olarak HTTPS aktif olur

---

## 2. Business Email Kurulumu (Namecheap)

### Adım 1: Namecheap'te Email Hosting Aktifleştirme
1. Namecheap hesabınıza giriş yapın
2. Domain listesinden `synax.vip` seçin
3. **"Email"** veya **"Email Forwarding"** sekmesine gidin
4. Business email planınızı aktifleştirin

### Adım 2: Email Adresi Oluşturma
Örnek: `support@synax.vip` veya `noreply@synax.vip`

1. Namecheap Email Dashboard'da **"Create Email Account"** tıklayın
2. Email adresini girin (örn: `support@synax.vip`)
3. Şifre belirleyin
4. Email hesabını oluşturun

### Adım 3: SMTP Ayarlarını Alma
Namecheap size şu SMTP bilgilerini verecek:

**Genellikle Namecheap SMTP Ayarları:**
- **SMTP Host:** `mail.privateemail.com` veya `smtp.privateemail.com`
- **SMTP Port:** `587` (TLS) veya `465` (SSL)
- **SMTP User:** Tam email adresiniz (örn: `support@synax.vip`)
- **SMTP Password:** Email hesabınızın şifresi
- **SMTP From:** `support@synax.vip` (veya oluşturduğunuz email)

**Not:** Namecheap'in size verdiği tam SMTP bilgilerini kullanın.

---

## 3. Supabase SMTP Ayarlarını Güncelleme

### Adım 1: Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) açın
2. Projenizi seçin

### Adım 2: SMTP Settings
1. Sol menüden **"Authentication"** seçin
2. **"Email"** sekmesine tıklayın
3. **"SMTP Settings"** sekmesine gidin
4. **"Set up SMTP"** veya **"Enable Custom SMTP"** butonuna tıklayın

### Adım 3: SMTP Bilgilerini Girme
Namecheap'ten aldığınız bilgileri girin:

- **SMTP Host:** `mail.privateemail.com` (Namecheap'in verdiği host)
- **SMTP Port:** `587` (veya `465`)
- **SMTP User:** `support@synax.vip` (email adresiniz)
- **SMTP Password:** Email hesabınızın şifresi
- **Sender Email:** `support@synax.vip`
- **Sender Name:** `Synax Support`

### Adım 4: Test Email Gönderme
1. **"Send Test Email"** butonuna tıklayın
2. Test email'inizi kontrol edin
3. Email gelirse ayarlar doğru demektir

---

## 4. .env.local Dosyasını Güncelleme

Projenizin `.env.local` dosyasını güncelleyin:

```env
# SMTP Configuration (Namecheap Business Email)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=support@synax.vip
SMTP_PASSWORD=your_email_password_here
SMTP_FROM=support@synax.vip

# Domain Configuration
NEXT_PUBLIC_SITE_URL=https://synax.vip
```

### Adım 1: .env.local Dosyasını Düzenleme
1. Proje kök dizininde `.env.local` dosyasını açın
2. Yukarıdaki SMTP ayarlarını ekleyin/güncelleyin
3. `SMTP_PASSWORD` kısmına email hesabınızın şifresini yazın

### Adım 2: Vercel Environment Variables
1. Vercel Dashboard → Projeniz → **"Settings"** → **"Environment Variables"**
2. Her bir değişkeni ekleyin:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM`
   - `NEXT_PUBLIC_SITE_URL` = `https://synax.vip`
3. **"Save"** butonuna tıklayın
4. Projeyi yeniden deploy edin

---

## 5. Supabase Site URL ve Redirect URLs Güncelleme

### Adım 1: Site URL Güncelleme
1. Supabase Dashboard → **"Settings"** → **"API"**
2. **"Site URL"** kısmını güncelleyin: `https://synax.vip`
3. **"Save"** butonuna tıklayın

### Adım 2: Redirect URLs Güncelleme
1. Supabase Dashboard → **"Authentication"** → **"URL Configuration"**
2. **"Redirect URLs"** listesine şunları ekleyin:
   - `https://synax.vip/login`
   - `https://synax.vip/reset-password`
   - `https://synax.vip/**` (wildcard)
3. Eski localhost URL'lerini kaldırabilirsiniz (opsiyonel)
4. **"Save"** butonuna tıklayın

---

## 6. Email Template'lerini Güncelleme (Opsiyonel)

### Adım 1: Email Templates
1. Supabase Dashboard → **"Authentication"** → **"Email Templates"**
2. **"Confirm signup"** template'ini düzenleyin
3. Email içeriğinde `synax.vip` domain'ini kullanın

### Adım 2: Reset Password Template
1. **"Reset password"** template'ini düzenleyin
2. Redirect URL'lerin `synax.vip` olduğundan emin olun

---

## 7. API Endpoint'lerini Güncelleme

Kod tarafında email gönderen endpoint'ler otomatik olarak `.env.local` dosyasındaki `SMTP_FROM` değerini kullanacak. Kontrol edin:

- `pages/api/admin/send-contact-reply.js` - Admin panel'den gönderilen mailler
- Supabase Auth - Email confirmation ve reset password mailleri

---

## 8. Test Etme

### Test 1: Email Confirmation
1. Yeni bir kullanıcı kaydı oluşturun
2. Email'in `support@synax.vip` adresinden geldiğini kontrol edin
3. Email içindeki linklerin `synax.vip` domain'ini kullandığını kontrol edin

### Test 2: Password Reset
1. "Forgot Password" sayfasından reset linki isteyin
2. Email'in `support@synax.vip` adresinden geldiğini kontrol edin
3. Link'in `synax.vip` domain'ini kullandığını kontrol edin

### Test 3: Admin Panel Email Reply
1. Admin panel → Messages sekmesinden bir mesaja cevap verin
2. Email'in `support@synax.vip` adresinden gönderildiğini kontrol edin

---

## Sorun Giderme

### DNS Sorunları
- DNS propagation 24-48 saat sürebilir
- [DNS Checker](https://dnschecker.org/) ile kontrol edin
- Namecheap'te DNS kayıtlarının doğru olduğundan emin olun

### Email Gönderim Sorunları
- SMTP ayarlarını kontrol edin
- Email hesabının şifresinin doğru olduğundan emin olun
- Port 587 (TLS) veya 465 (SSL) deneyin
- Namecheap'in SMTP rate limit'ini kontrol edin

### SSL Sertifikası Sorunları
- Vercel otomatik SSL sağlar, 1-2 saat içinde aktif olur
- Domain eklendikten sonra bekleyin

---

## Özet Checklist

- [ ] Vercel'de `synax.vip` domain'i eklendi
- [ ] Namecheap'te DNS kayıtları yapılandırıldı
- [ ] Namecheap'te business email hesabı oluşturuldu
- [ ] Supabase SMTP ayarları güncellendi
- [ ] `.env.local` dosyası güncellendi
- [ ] Vercel Environment Variables eklendi
- [ ] Supabase Site URL güncellendi (`https://synax.vip`)
- [ ] Supabase Redirect URLs güncellendi
- [ ] Test email'leri gönderildi ve kontrol edildi
- [ ] Yeni domain'de site çalışıyor
- [ ] SSL sertifikası aktif

---

## Destek

Sorun yaşarsanız:
1. Vercel Logs'u kontrol edin
2. Supabase Logs'u kontrol edin
3. Namecheap Support'a başvurun (DNS/Email sorunları için)
4. Vercel Support'a başvurun (Domain/SSL sorunları için)

