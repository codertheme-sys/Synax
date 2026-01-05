# Namecheap Private Email - Web Uygulaması İçin SMTP Ayarları

## ⚠️ ÖNEMLİ FARK

Resimlerde görünen ayarlar **email client** (Outlook, Thunderbird, Apple Mail) için. **Web uygulaması** için farklı ayarlar kullanılmalı!

---

## Web Uygulaması İçin Doğru SMTP Ayarları

### Namecheap Private Email SMTP Ayarları

```
SMTP Host: mail.privateemail.com
SMTP Port: 587 (TLS) veya 465 (SSL)
SMTP Username: support@synax.vip
SMTP Password: [email hesabınızın şifresi]
Encryption: TLS (port 587) veya SSL (port 465)
Authentication: Required
```

**❌ YANLIŞ (Email Client Ayarları - Resimlerde Görünen):**
- Server name: `localhost` ← Bu sadece email client için!
- Port: `25` ← Bu genellikle localhost için

**✅ DOĞRU (Web Uygulaması İçin):**
- SMTP Host: `mail.privateemail.com` ← İnternet üzerinden erişim için
- SMTP Port: `587` (TLS) veya `465` (SSL) ← Güvenli bağlantı için

---

## .env.local Dosyası Yapılandırması

Projenizin `.env.local` dosyasına şu ayarları ekleyin:

```env
# Namecheap Private Email SMTP Configuration
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=support@synax.vip
SMTP_PASSWORD=your_email_password_here
SMTP_FROM=support@synax.vip
```

**Not:** 
- Port `587` çalışmazsa `465` deneyin
- `SMTP_PASSWORD` kısmına email hesabınızın şifresini yazın

---

## Vercel Environment Variables

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. Şu değişkenleri ekleyin:

```
SMTP_HOST = mail.privateemail.com
SMTP_PORT = 587
SMTP_USER = support@synax.vip
SMTP_PASSWORD = [email hesabınızın şifresi]
SMTP_FROM = support@synax.vip
```

3. **Save** butonuna tıklayın
4. Projeyi yeniden deploy edin

---

## Supabase SMTP Ayarları

1. Supabase Dashboard → **Authentication** → **Email** → **SMTP Settings**
2. **"Enable Custom SMTP"** veya **"Set up SMTP"** butonuna tıklayın
3. Şu bilgileri girin:

```
SMTP Host: mail.privateemail.com
SMTP Port: 587 (veya 465)
SMTP User: support@synax.vip
SMTP Password: [email hesabınızın şifresi]
Sender Email: support@synax.vip
Sender Name: Synax Support
```

4. **"Send Test Email"** butonuna tıklayın
5. Test email'inizi kontrol edin

---

## Port Seçimi: 587 mi 465 mi?

### Port 587 (TLS/STARTTLS) - Önerilen
- **Encryption:** TLS/STARTTLS
- **Güvenlik:** Yüksek
- **Uyumluluk:** Geniş
- **Önerilen:** Evet

### Port 465 (SSL)
- **Encryption:** SSL
- **Güvenlik:** Yüksek
- **Uyumluluk:** İyi
- **Alternatif:** Port 587 çalışmazsa kullanın

**Önce 587'yi deneyin, çalışmazsa 465'i kullanın.**

---

## Test Etme

### Test 1: Supabase Test Email
1. Supabase → Authentication → Email → SMTP Settings
2. **"Send Test Email"** butonuna tıklayın
3. Email'inizi kontrol edin

### Test 2: Admin Panel Email Reply
1. Admin panel → Messages sekmesine gidin
2. Bir mesaja cevap verin
3. Email'in gönderilip gönderilmediğini kontrol edin
4. Console loglarını kontrol edin

### Test 3: Yeni Kullanıcı Kaydı
1. Yeni bir kullanıcı kaydı oluşturun
2. Email confirmation mailinin geldiğini kontrol edin
3. Email'in `support@synax.vip` adresinden geldiğini kontrol edin

---

## Sorun Giderme

### Problem: "Connection timeout" veya "Connection refused"
**Çözüm:**
1. SMTP Host'un `mail.privateemail.com` olduğundan emin olun (localhost değil!)
2. Port `587` çalışmazsa `465` deneyin
3. Firewall ayarlarını kontrol edin

### Problem: "Authentication failed"
**Çözüm:**
1. Username'in tam email adresi olduğundan emin olun: `support@synax.vip`
2. Password'un doğru olduğundan emin olun
3. Email hesabının aktif olduğundan emin olun (Status: ON)

### Problem: "535 Authentication unsuccessful"
**Çözüm:**
1. Email hesabının şifresini kontrol edin
2. Username'in tam email adresi olduğundan emin olun
3. Port `587` yerine `465` deneyin (veya tam tersi)

---

## Özet: Doğru vs Yanlış Ayarlar

### ❌ YANLIŞ (Email Client - Resimlerde Görünen)
```
Server name: localhost
Port: 25
Username: support@synax.vip
Password: [şifre]
```

### ✅ DOĞRU (Web Uygulaması)
```
SMTP Host: mail.privateemail.com
SMTP Port: 587 (veya 465)
SMTP Username: support@synax.vip
SMTP Password: [şifre]
```

---

## Hızlı Kurulum

1. `.env.local` dosyasını güncelleyin:
   ```env
   SMTP_HOST=mail.privateemail.com
   SMTP_PORT=587
   SMTP_USER=support@synax.vip
   SMTP_PASSWORD=[şifreniz]
   SMTP_FROM=support@synax.vip
   ```

2. Vercel Environment Variables ekleyin (yukarıdaki değerlerle)

3. Supabase SMTP ayarlarını yapılandırın (yukarıdaki değerlerle)

4. Test email gönderin

5. Çalışmazsa port `465`'i deneyin

---

## Önemli Notlar

1. **localhost kullanmayın!** - Bu sadece email client için
2. **mail.privateemail.com kullanın** - Web uygulaması için
3. **Port 587 veya 465 kullanın** - Port 25 genellikle çalışmaz
4. **Username tam email adresi olmalı:** `support@synax.vip`
5. **Password email hesabının şifresi olmalı**


