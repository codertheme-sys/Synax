# Hotmail/Outlook SMTP Ayarları

## 📧 E-posta Gönderim Ayarları

**Gönderen E-posta:** `synaxcustomerservice@hotmail.com`  
**Admin E-posta:** `megabdesk@hotmail.com` (sadece admin girişi için)

**Not:** Tüm sistem e-postaları (e-posta onayı ve contact cevapları) `synaxcustomerservice@hotmail.com` adresinden gönderilecek.

---

## 1️⃣ Supabase SMTP Settings (E-posta Onayı İçin)

**Supabase Dashboard → Authentication → Email → SMTP Settings**

### Host (Hostname):
```
smtp-mail.outlook.com
```

**Alternatif (eğer yukarıdaki çalışmazsa):**
```
smtp.live.com
```

### Port:
```
465
```

**Not:** Eğer port 465 çalışmazsa, port `587` deneyin (TLS için).

### Username:
```
synaxcustomerservice@hotmail.com
```

### Password:
```
App Password (ZORUNLU - Normal şifre çalışmaz!)
```

**⚠️ ÖNEMLİ: Hotmail/Outlook Basic Authentication Devre Dışı**

Microsoft, güvenlik nedeniyle temel kimlik doğrulamayı (basic authentication) devre dışı bıraktı. Bu yüzden **normal şifre çalışmaz**, mutlaka **App Password** kullanmanız gerekiyor.

**App Password Oluşturma Adımları:**

1. **Microsoft Account Security Sayfasına Gidin:**
   - https://account.microsoft.com/security adresine gidin
   - `customerservicesynax@hotmail.com` hesabıyla giriş yapın

2. **App Passwords Bölümünü Bulun:**
   - Sayfada "Advanced security options" veya "Security" bölümüne gidin
   - "App passwords" veya "App passwords" linkini bulun
   - Eğer göremiyorsanız, "Two-step verification" açık olmalı (geçici olarak açıp App Password oluşturabilirsiniz)

3. **Yeni App Password Oluşturun:**
   - "Create a new app password" veya benzer bir butona tıklayın
   - App için bir isim verin: `Synax SMTP` veya `Email Service`
   - "Generate" veya "Create" butonuna tıklayın
   - **16 haneli şifreyi kopyalayın** (örnek: `abcd efgh ijkl mnop` - boşlukları kaldırarak kullanabilirsiniz)

4. **App Password'u Kullanın:**
   - Bu şifreyi Supabase SMTP Settings → Password alanına yazın
   - Bu şifreyi `.env.local` dosyasındaki `SMTP_PASSWORD` alanına yazın
   - **Normal hesap şifresini kullanmayın!**

### Sender Email:
```
synaxcustomerservice@hotmail.com
```

### Sender Name:
```
Synax Support
```

---

## 2️⃣ .env.local Dosyası (Contact Reply E-postaları İçin)

Projenizin kök dizinindeki `.env.local` dosyasına şunları ekleyin:

```env
# SMTP Configuration for Contact Reply Emails
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=customerservicesynax@hotmail.com
SMTP_PASSWORD=YENİ_APP_PASSWORD_BURAYA
SMTP_FROM=customerservicesynax@hotmail.com
```

**⚠️ ÖNEMLİ:** 
- `SMTP_PASSWORD`: **App Password** olmalı (normal şifre değil!)
- App Password'u yukarıdaki adımlarla oluşturun
- Boşlukları kaldırarak yazabilirsiniz (örnek: `abcdefghijklmnop`)

**Örnek (App Password ile):**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=customerservicesynax@hotmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM=customerservicesynax@hotmail.com
```

**Önemli:** 
- `SMTP_USER` ve `SMTP_PASSWORD`: `synaxcustomerservice@hotmail.com` hesabının bilgileri
- `SMTP_FROM`: Gönderen adres (`synaxcustomerservice@hotmail.com`)
- Admin e-postası (`megabdesk@hotmail.com`) sadece admin panel girişi için kullanılır, e-posta gönderimi için kullanılmaz

---

## Port 465 Çalışmazsa

Eğer port 465 ile bağlantı hatası alırsanız, port 587 kullanın:

**Supabase SMTP Settings'te:**
- Port: `587`

**.env.local dosyasında:**
```env
SMTP_PORT=587
```

---

## Test Etme

1. Supabase SMTP Settings'i kaydedin
2. `.env.local` dosyasını oluşturun/güncelleyin
3. Server'ı yeniden başlatın: `npm run dev`
4. Admin panel'de bir mesaja cevap verin
5. Kullanıcının e-posta adresini kontrol edin

---

## Troubleshooting

### "Authentication failed" veya "535 5.7.139 Authentication unsuccessful" hatası:
- **Normal şifre çalışmaz!** Mutlaka App Password kullanın
- App Password oluşturma adımlarını yukarıdan takip edin
- Username'in tam e-posta adresi olduğundan emin olun (`customerservicesynax@hotmail.com`)
- App Password'u hem Supabase hem `.env.local` dosyasına yazdığınızdan emin olun

### "Connection timeout" hatası:
- Port 465 yerine 587 deneyin
- Firewall ayarlarını kontrol edin
- `smtp-mail.outlook.com` yerine `smtp.live.com` deneyin

### "Invalid login" hatası:
- Username: Tam e-posta adresi olmalı (`synaxcustomerservice@hotmail.com`)
- Password: Doğru şifre veya App Password olmalı
- 2FA açıksa mutlaka App Password kullanın

