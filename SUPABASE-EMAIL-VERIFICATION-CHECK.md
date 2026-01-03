# Supabase Email Verification Kontrol Rehberi

## Sorun
E-posta doğrulama e-postası kullanıcıya gelmiyor.

## ⚠️ ÖNEMLİ: SMTP Settings ≠ Email Confirmations

**SMTP Settings** (Authentication → Email → SMTP Settings):
- Bu sadece **e-posta gönderim servisini** yapılandırır
- Custom SMTP kullanmak için burayı doldurursunuz
- **"Enable email confirmations" toggle'ı burada YOK!**

**"Enable email confirmations" toggle'ı:**
- **Authentication → Settings** sekmesinde (Settings, Email Templates değil!)
- Bu toggle AÇIK olmalı ki e-postalar gönderilsin

## Kontrol Edilmesi Gerekenler

### 1. Authentication Settings (En Önemli!) ⚠️

**Supabase Dashboard → Authentication → Settings** (NOT "Email Templates", NOT "SMTP Settings", "Settings" sekmesi!)

1. **"Enable email confirmations"** toggle'ını kontrol edin:
   - ✅ **AÇIK (ON)** olmalı
   - ❌ Kapalıysa, e-postalar gönderilmez
   - 📍 Bu ayar **"Authentication → Settings"** bölümünde!
   
   **Nasıl Bulunur:**
   - Sol menüden **"Authentication"** seçin
   - Üstteki sekmelerden **"Settings"** sekmesine tıklayın
     - ❌ "Email Templates" değil
     - ❌ "SMTP Settings" değil  
     - ✅ **"Settings"** sekmesi!
   - "Settings" sekmesinde "Email" veya "User Management" bölümünde **"Enable email confirmations"** toggle'ını bulun
   
   **Eğer bulamıyorsanız:**
   - Settings sekmesinde aşağı kaydırın
   - "Email" başlığı altında arayın
   - Veya "User Management" bölümünde olabilir

2. **"Confirm email"** ayarı:
   - "Enable email confirmations" açık olmalı
   - Eğer kapalıysa, kullanıcılar e-posta doğrulamadan giriş yapabilir

### 2. Email Templates ✅ (Zaten Kontrol Edildi)

**Supabase Dashboard → Authentication → Email Templates**

1. **"Confirm signup"** template'ini kontrol edin:
   - ✅ Template aktif olmalı (sizin durumunuzda aktif görünüyor)
   - ✅ Subject: "Confirm Your Signup" (doğru)
   - ✅ Body içeriği doğru: `{{ .ConfirmationURL }}` kullanılıyor
   - ✅ Preview'ı kontrol edin: "Confirm your mail" linki görünüyor olmalı

2. **Template içeriği (Mevcut):**
   ```
   Subject: Confirm Your Signup
   Body: 
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
   ```
   ✅ Bu içerik doğru görünüyor!

### 3. Site URL ve Redirect URLs

**Supabase Dashboard → Settings → API**

1. **Site URL:**
   - Production: `https://yourdomain.com`
   - Development: `http://localhost:3000`
   - ✅ Doğru URL ayarlanmış olmalı

2. **Redirect URLs:**
   - **Authentication → URL Configuration** bölümüne gidin
   - Şu URL'leri ekleyin:
     - `http://localhost:3000/login` (development)
     - `https://yourdomain.com/login` (production)
     - `http://localhost:3000/**` (wildcard for development)
     - `https://yourdomain.com/**` (wildcard for production)

### 4. SMTP Settings ⚠️ (Önemli Uyarı!)

**Supabase Dashboard → Authentication → Email → SMTP Settings**

1. **⚠️ Şu Anda:**
   - Built-in email service kullanılıyor (SMTP Settings sekmesinde görüldüğü gibi)
   - ⚠️ **Rate limit var!** (ücretsiz plan: ~3 e-posta/saat)
   - ⚠️ Production için önerilmez

2. **Öneri:**
   - Production için **Custom SMTP** kurmalısınız
   - SMTP Settings sekmesinde **"Set up SMTP"** butonuna tıklayın
   - Gmail, SendGrid, Mailgun, AWS SES gibi bir servis kullanabilirsiniz

3. **Custom SMTP kullanıyorsanız:**
   - SMTP host, port, username, password doğru olmalı
   - SSL/TLS ayarları doğru olmalı
   - Test e-postası göndererek kontrol edin

4. **Şimdilik (Development için):**
   - Built-in service çalışabilir
   - Ama rate limit'e takılabilirsiniz
   - Spam klasörünü kontrol edin

### 5. Rate Limiting

**Supabase Dashboard → Settings → Auth**

1. **E-posta gönderim limitleri:**
   - Ücretsiz plan: ~3 e-posta/saat
   - Pro plan: Daha yüksek limitler
   - Çok fazla signup denemesi yapıyorsanız, limit aşılabilir

### 6. Spam Klasörü

1. **Kullanıcıların spam klasörünü kontrol etmesini söyleyin**
2. **E-posta adresini whitelist'e ekleyin:**
   - `noreply@mail.app.supabase.io` (Supabase'in varsayılan e-posta adresi)

### 7. Test Etme

1. **Yeni bir test hesabı oluşturun**
2. **Supabase Dashboard → Authentication → Users** bölümüne gidin
3. **Kullanıcının e-posta durumunu kontrol edin:**
   - `email_confirmed_at` NULL ise → E-posta doğrulanmamış
   - `email_confirmed_at` dolu ise → E-posta doğrulanmış

4. **Manuel olarak e-posta gönderme:**
   - Kullanıcıya sağ tıklayın → "Send confirmation email"

### 8. Log Kontrolü

**Supabase Dashboard → Logs → Auth Logs**

1. **E-posta gönderim loglarını kontrol edin:**
   - Başarılı gönderimler: ✅
   - Hatalar: ❌ (nedenini gösterir)

2. **Hata mesajlarını kontrol edin:**
   - SMTP hatası
   - Rate limit hatası
   - Template hatası

## Hızlı Kontrol Listesi

- [ ] **"Enable email confirmations" AÇIK mı?** ⚠️ **EN ÖNEMLİSİ!**
  - Authentication → Settings → "Enable email confirmations" toggle
- [ ] Site URL doğru mu?
- [ ] Redirect URLs eklenmiş mi?
- [x] Email template aktif mi? ✅ (Kontrol edildi - aktif)
- [ ] SMTP ayarları doğru mu? ⚠️ (Şu anda built-in kullanılıyor - rate limit var!)
- [ ] Rate limit aşılmış mı?
- [ ] Spam klasörü kontrol edildi mi?
- [ ] Auth Logs'da hata var mı?

## Çözüm Adımları

1. **Supabase Dashboard'a gidin**
2. **Authentication → Settings** bölümüne gidin ⚠️ (Templates değil, Settings!)
3. **"Enable email confirmations"** toggle'ını **AÇIK** yapın ⚠️ **EN ÖNEMLİSİ!**
4. **Settings → API** bölümüne gidin
5. **Site URL'i kontrol edin ve düzeltin** (`http://localhost:3000` veya production URL)
6. **Authentication → URL Configuration** bölümüne gidin
7. **Redirect URLs'e gerekli URL'leri ekleyin:**
   - `http://localhost:3000/login`
   - `https://yourdomain.com/login`
8. **SMTP Ayarları (İsteğe bağlı ama önerilir):**
   - Authentication → Email → SMTP Settings
   - "Set up SMTP" butonuna tıklayın
   - Custom SMTP bilgilerinizi girin (production için)
9. **Test edin:** Yeni bir hesap oluşturun ve e-postayı kontrol edin (spam klasörü dahil!)

## ⚠️ ÖNEMLİ NOTLAR

1. **"Enable email confirmations" ayarı "Settings" sekmesinde!**
   - Templates sekmesinde değil!
   - Sol menü: Authentication → Settings (Settings sekmesine tıklayın)

2. **SMTP Rate Limit:**
   - Built-in service: ~3 e-posta/saat (ücretsiz plan)
   - Eğer çok fazla test yapıyorsanız, rate limit'e takılabilirsiniz
   - Production için mutlaka custom SMTP kurun

3. **Teknik Sorun Uyarısı:**
   - Supabase'de "We are currently investigating a technical issue" uyarısı görüyorsanız
   - E-posta gönderiminde geçici sorunlar olabilir
   - Birkaç saat bekleyip tekrar deneyin

## Not

Eğer tüm ayarlar doğruysa ama hala e-posta gelmiyorsa:
- Supabase'in e-posta servisinde geçici bir sorun olabilir
- Rate limit aşılmış olabilir
- E-posta adresi geçersiz olabilir
- Spam filtresi e-postayı engelliyor olabilir

Bu durumda:
1. Birkaç dakika bekleyin
2. Farklı bir e-posta adresi ile test edin
3. Supabase support'a başvurun

