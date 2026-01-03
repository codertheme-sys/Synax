# E-posta Gönderimi Kurulum Rehberi

## Sorun
Admin panel'de mesajlara cevap verildiğinde, cevap kullanıcının e-posta adresine gitmiyor.

## Çözüm
SMTP ayarlarını yapılandırmanız gerekiyor. İki seçenek var:

### Seçenek 1: Supabase Custom SMTP (Önerilen)

1. **Supabase Dashboard'a gidin**
2. **Authentication → Email → SMTP Settings** sekmesine gidin
3. **"Set up SMTP"** butonuna tıklayın
4. SMTP bilgilerinizi girin:
   - **Host:** SMTP sunucu adresi (örn: smtp.gmail.com)
   - **Port:** SMTP portu (örn: 587 veya 465)
   - **Username:** E-posta adresiniz
   - **Password:** E-posta şifreniz veya App Password
   - **Sender Email:** Gönderen e-posta adresi
   - **Sender Name:** Gönderen adı (örn: "Synax Support")

### Seçenek 2: Environment Variables ile SMTP (Daha Esnek)

`.env.local` dosyanıza şu değişkenleri ekleyin:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@synax.com
```

## Gmail Kullanımı

Eğer Gmail kullanıyorsanız:

1. **Google Account → Security** bölümüne gidin
2. **2-Step Verification** açık olmalı
3. **App Passwords** oluşturun:
   - https://myaccount.google.com/apppasswords
   - "Mail" ve "Other (Custom name)" seçin
   - "Synax" yazın
   - Oluşturulan şifreyi kopyalayın
4. Bu şifreyi `SMTP_PASSWORD` olarak kullanın

**Gmail SMTP Ayarları:**
- Host: `smtp.gmail.com`
- Port: `587` (TLS) veya `465` (SSL)
- Username: Gmail adresiniz
- Password: App Password (normal şifre değil!)

## Hotmail/Outlook SMTP Ayarları

Hotmail/Outlook için SMTP ayarları:

**Supabase SMTP Settings'te:**
- **Host:** `smtp-mail.outlook.com` (veya `smtp.live.com`)
- **Port:** `465` (SSL) veya `587` (TLS)
- **Username:** `synaxcustomerservice@hotmail.com` (tam e-posta adresi)
- **Password:** Hotmail şifreniz
- **Sender Email:** `synaxcustomerservice@hotmail.com`
- **Sender Name:** `synaxcustomerservice`

**Not:** Hotmail/Outlook için genelde port `587` (TLS) daha güvenilir çalışır. Eğer `465` çalışmazsa `587` deneyin.

**.env.local dosyası için:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=465
SMTP_USER=synaxcustomerservice@hotmail.com
SMTP_PASSWORD=your-hotmail-password
SMTP_FROM=synaxcustomerservice@hotmail.com
```

**Önemli:** 
- Hotmail/Outlook için 2FA (Two-Factor Authentication) açıksa, App Password kullanmanız gerekebilir
- Eğer normal şifre çalışmazsa: https://account.microsoft.com/security → App passwords → Create new app password

## Diğer E-posta Servisleri

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-ses-username
SMTP_PASSWORD=your-aws-ses-password
SMTP_FROM=noreply@yourdomain.com
```

## Nodemailer Paketi

Eğer `nodemailer` paketi yüklü değilse, yükleyin:

```bash
npm install nodemailer
```

## Test Etme

1. `.env.local` dosyasına SMTP bilgilerinizi ekleyin
2. Server'ı yeniden başlatın (`npm run dev`)
3. Admin panel'de bir mesaja cevap verin
4. Kullanıcının e-posta adresini kontrol edin (spam klasörü dahil)

## Not

- E-posta gönderimi başarısız olsa bile, admin'in cevabı database'e kaydedilir
- Kullanıcı admin panel'den mesajları görebilir (şimdilik)
- E-posta gönderimi için SMTP ayarları zorunludur

## Troubleshooting

1. **"SMTP not configured" hatası:**
   - `.env.local` dosyasını kontrol edin
   - Server'ı yeniden başlatın
   - Environment variable'ların doğru yazıldığından emin olun

2. **"Authentication failed" hatası:**
   - SMTP kullanıcı adı ve şifresini kontrol edin
   - Gmail kullanıyorsanız App Password kullandığınızdan emin olun

3. **"Connection timeout" hatası:**
   - SMTP host ve port'u kontrol edin
   - Firewall ayarlarını kontrol edin

4. **E-posta spam klasörüne düşüyor:**
   - SPF, DKIM, DMARC kayıtlarını kontrol edin
   - Gönderen e-posta adresini domain'inize bağlayın

