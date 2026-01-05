# Namecheap Private Email SMTP Ayarlarını Bulma Rehberi

## 1. Namecheap Private Email SMTP Ayarları

**⚠️ ÖNEMLİ:** Resimlerde görünen "localhost" ayarları email client (Outlook, Thunderbird) için. Web uygulaması için farklı ayarlar kullanılmalı!

### Web Uygulaması İçin SMTP Ayarları (Namecheap Private Email)

**SMTP Server (Outgoing Mail):**
- **SMTP Host:** `mail.privateemail.com` ⚠️ (localhost DEĞİL!)
- **SMTP Port:** `587` (TLS/STARTTLS) veya `465` (SSL)
- **SMTP Username:** Tam email adresiniz (örn: `support@synax.vip`)
- **SMTP Password:** Email hesabınızın şifresi
- **Encryption:** TLS (port 587) veya SSL (port 465)

**❌ YANLIŞ (Email Client için):**
- Server name: `localhost` ← Bu sadece email client için!
- Port: `25` ← Bu genellikle localhost için

**✅ DOĞRU (Web Uygulaması için):**
- SMTP Host: `mail.privateemail.com`
- SMTP Port: `587` veya `465`

**IMAP Server (Incoming Mail - Opsiyonel):**
- **IMAP Host:** `mail.privateemail.com`
- **IMAP Port:** `993` (SSL) veya `143` (TLS)

---

## 2. Namecheap Dashboard'da SMTP Ayarlarını Bulma

### Yöntem 1: Email Hesabı Ayarlarından

1. **Namecheap Dashboard'a giriş yapın**
2. **Domain List** → `synax.vip` seçin
3. Sol menüden **"Private Email"** seçin (zaten oradasınız - resim 3)
4. Mailbox listesinde **"support@synax.vip"** mailbox'ına tıklayın
5. Açılan sayfada **"Email Client Settings"** veya **"Configure Email Client"** sekmesine bakın
6. Orada SMTP ayarları gösterilir

### Yöntem 2: Webmail Üzerinden

1. **Namecheap Dashboard** → **Private Email** → `support@synax.vip`
2. **"Open Webmail"** butonuna tıklayın
3. Webmail'e giriş yapın
4. Webmail içinde **"Settings"** veya **"Preferences"** → **"Email Accounts"** veya **"Mail Settings"**
5. **"Outgoing Server (SMTP)"** bölümünde SMTP ayarları gösterilir

### Yöntem 3: Namecheap Help Center

1. Namecheap Help Center'da **"Private Email"** bölümüne gidin
2. **"Email Client Configuration"** veya **"SMTP Settings"** makalesini bulun
3. Orada genel SMTP ayarları gösterilir

---

## 3. Namecheap Private Email Genel SMTP Ayarları

Namecheap Private Email için **genellikle** şu ayarlar kullanılır:

### SMTP Ayarları (Outgoing Mail)

```
SMTP Server: mail.privateemail.com
SMTP Port: 587 (TLS) veya 465 (SSL)
SMTP Username: support@synax.vip (tam email adresiniz)
SMTP Password: [email hesabınızın şifresi]
Encryption: TLS (port 587 için) veya SSL (port 465 için)
Authentication: Required (Yes)
```

### Alternatif SMTP Ayarları

Bazı durumlarda Namecheap şu host'u da kullanabilir:
```
SMTP Server: smtp.privateemail.com
SMTP Port: 587 veya 465
```

---

## 4. .env.local ve Vercel Environment Variables

Namecheap'ten aldığınız SMTP bilgilerini şu şekilde yapılandırın:

### .env.local Dosyası

```env
# Namecheap Private Email SMTP Configuration
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=support@synax.vip
SMTP_PASSWORD=your_email_password_here
SMTP_FROM=support@synax.vip
```

**Not:** 
- Port `587` kullanıyorsanız TLS aktif olacak
- Port `465` kullanıyorsanız SSL aktif olacak
- İkisini de deneyebilirsiniz, hangisi çalışıyorsa onu kullanın

### Vercel Environment Variables

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. Her bir değişkeni ekleyin:
   - `SMTP_HOST` = `mail.privateemail.com`
   - `SMTP_PORT` = `587` (veya `465`)
   - `SMTP_USER` = `support@synax.vip`
   - `SMTP_PASSWORD` = [email hesabınızın şifresi]
   - `SMTP_FROM` = `support@synax.vip`
3. **Save** butonuna tıklayın
4. Projeyi yeniden deploy edin

---

## 5. Supabase SMTP Ayarları

### Adım 1: Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) açın
2. Projenizi seçin

### Adım 2: SMTP Settings
1. Sol menüden **"Authentication"** seçin
2. **"Email"** sekmesine tıklayın
3. **"SMTP Settings"** sekmesine gidin
4. **"Enable Custom SMTP"** veya **"Set up SMTP"** butonuna tıklayın

### Adım 3: SMTP Bilgilerini Girme
Namecheap Private Email bilgilerinizi girin:

- **SMTP Host:** `mail.privateemail.com`
- **SMTP Port:** `587` (TLS) veya `465` (SSL)
- **SMTP User:** `support@synax.vip`
- **SMTP Password:** Email hesabınızın şifresi
- **Sender Email:** `support@synax.vip`
- **Sender Name:** `Synax Support`

### Adım 4: Test Email Gönderme
1. **"Send Test Email"** butonuna tıklayın
2. Test email'inizi kontrol edin
3. Email gelirse ayarlar doğru demektir

---

## 6. SMTP Ayarlarını Test Etme

### Yöntem 1: Supabase Test Email
1. Supabase Dashboard → Authentication → Email → SMTP Settings
2. **"Send Test Email"** butonuna tıklayın
3. Email'inizi kontrol edin

### Yöntem 2: Admin Panel'den Test
1. Admin panel → Messages sekmesine gidin
2. Bir mesaja cevap verin
3. Email'in gönderilip gönderilmediğini kontrol edin
4. Console loglarını kontrol edin (hata varsa)

### Yöntem 3: Yeni Kullanıcı Kaydı
1. Yeni bir kullanıcı kaydı oluşturun
2. Email confirmation mailinin geldiğini kontrol edin
3. Email'in `support@synax.vip` adresinden geldiğini kontrol edin

---

## 7. Sorun Giderme

### Problem: SMTP ayarlarını Namecheap'te bulamıyorum
**Çözüm:**
1. Namecheap'in genel SMTP ayarlarını kullanın: `mail.privateemail.com`
2. Port `587` (TLS) veya `465` (SSL) deneyin
3. Username olarak tam email adresinizi kullanın: `support@synax.vip`
4. Password olarak email hesabınızın şifresini kullanın

### Problem: Email gönderilemiyor
**Çözüm:**
1. Port `587` çalışmıyorsa `465` deneyin (veya tam tersi)
2. SMTP password'un doğru olduğundan emin olun
3. Email hesabının aktif olduğundan emin olun (resim 3'te "ON" durumunda)
4. Firewall veya güvenlik ayarlarını kontrol edin

### Problem: "Authentication failed" hatası
**Çözüm:**
1. Username'in tam email adresi olduğundan emin olun: `support@synax.vip`
2. Password'un doğru olduğundan emin olun
3. Email hesabının şifresini sıfırlayıp tekrar deneyin

### Problem: "Connection timeout" hatası
**Çözüm:**
1. Port `587` yerine `465` deneyin (veya tam tersi)
2. SMTP host'un doğru olduğundan emin olun: `mail.privateemail.com`
3. Firewall ayarlarını kontrol edin

---

## 8. Namecheap Private Email SMTP Ayarları Özeti

**Kesin SMTP Ayarları (Namecheap Private Email):**

```
SMTP Host: mail.privateemail.com
SMTP Port: 587 (TLS) veya 465 (SSL)
SMTP Username: support@synax.vip
SMTP Password: [email hesabınızın şifresi]
Encryption: TLS (port 587) veya SSL (port 465)
Authentication: Required
```

**Not:** Bu ayarlar Namecheap Private Email için standarttır. Eğer Namecheap size farklı bir host vermişse, onu kullanın.

---

## 9. Hızlı Kurulum Checklist

- [ ] Namecheap'te email hesabı oluşturuldu (`support@synax.vip`)
- [ ] Email hesabı aktif (Status: ON)
- [ ] SMTP host not edildi: `mail.privateemail.com`
- [ ] SMTP port seçildi: `587` veya `465`
- [ ] `.env.local` dosyası güncellendi
- [ ] Vercel Environment Variables eklendi
- [ ] Supabase SMTP ayarları yapılandırıldı
- [ ] Test email gönderildi ve kontrol edildi
- [ ] Email gönderimi çalışıyor

---

## 10. Namecheap Support'a Başvurma

Eğer SMTP ayarlarını bulamıyorsanız veya yukarıdaki ayarlar çalışmıyorsa:

1. Namecheap Support'a başvurun
2. **"Private Email SMTP Settings"** için bilgi isteyin
3. Domain adınızı belirtin: `synax.vip`
4. Email adresinizi belirtin: `support@synax.vip`
5. Size özel SMTP ayarlarını isteyin

---

## Önemli Notlar

1. **Username her zaman tam email adresi olmalı:** `support@synax.vip` (sadece `support` değil)
2. **Port 587 ve 465'i deneyin:** Hangisi çalışıyorsa onu kullanın
3. **Email hesabının aktif olduğundan emin olun:** Resim 3'te "ON" durumunda görünüyor, bu iyi
4. **Password doğru olmalı:** Email hesabınızın şifresini kullanın
5. **Catch-All mailbox kullanıyorsanız:** `support@synax.vip` için özel bir mailbox oluşturmanız önerilir (SMTP için daha güvenilir)

