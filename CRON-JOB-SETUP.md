# Cron Job Kurulum Rehberi - Ücretsiz Alternatifler

Vercel Pro plan gerektirmediği için external cron servisleri kullanacağız.

## Seçenek 1: Cron-job.org (Önerilen - Ücretsiz)

### Adım 1: Environment Variable Ekle
Vercel Dashboard > Settings > Environment Variables:
- **Name**: `CRON_SECRET`
- **Value**: Güvenli bir random string (örn: `openssl rand -hex 32` ile oluşturun)
- **Environment**: Production

### Adım 2: Cron-job.org'da Hesap Oluştur
1. [https://cron-job.org](https://cron-job.org) adresine gidin
2. Ücretsiz hesap oluşturun
3. Email doğrulaması yapın

### Adım 3: CRON_SECRET Değerini Oluştur
**ÖNEMLİ**: Önce gerçek secret değerini oluşturun!

Terminal'de (PowerShell veya CMD):
```powershell
# PowerShell ile random string oluştur
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Veya online tool kullanın:
- [Random.org](https://www.random.org/strings/) - 32 karakter random string oluşturun
- Veya manuel olarak: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` gibi bir değer

**Örnek secret değeri**: `Syn4xPr1c3Upd4t3Cr0nS3cr3t2024!`

### Adım 4: Vercel'de CRON_SECRET Ekle
1. Vercel Dashboard > Project > **Settings** > **Environment Variables**
2. **Add New** butonuna tıklayın
3. Ayarlar:
   - **Name**: `CRON_SECRET`
   - **Value**: Yukarıda oluşturduğunuz secret değerini yapıştırın (örn: `Syn4xPr1c3Upd4t3Cr0nS3cr3t2024!`)
   - **Environment**: Production ✅ (işaretli)
4. **Save** butonuna tıklayın
5. **Redeploy** yapın (değişikliklerin aktif olması için)

### Adım 5: Yeni Cron Job Oluştur
1. Dashboard'da **"Create cronjob"** butonuna tıklayın
2. Ayarlar:
   - **Title**: `Synax Price History Update`
   - **Address (URL)**: `https://www.synax.vip/api/prices/crypto?secret=Syn4xPr1c3Upd4t3Cr0nS3cr3t2024!`
     - ⚠️ **ÖNEMLİ**: `Syn4xPr1c3Upd4t3Cr0nS3cr3t2024!` yerine Vercel'de oluşturduğunuz **GERÇEK** `CRON_SECRET` değerini yazın!
     - ❌ YANLIŞ: `secret=openssl rand -hex 32` (bu bir komut, değer değil!)
     - ✅ DOĞRU: `secret=Syn4xPr1c3Upd4t3Cr0nS3cr3t2024!` (gerçek secret değeri)
   - **Schedule**: Her 2 dakika
     - **Minute**: `*/2` (her 2 dakikada bir)
     - **Hour**: `*` (her saat)
     - **Day**: `*` (her gün)
     - **Month**: `*` (her ay)
     - **Weekday**: `*` (her gün)
   - **Request method**: `GET`
   - **Request timeout**: `60` saniye
   - **Activate**: ✅ (işaretli)

3. **Save** butonuna tıklayın

### Adım 4: Test Et
1. Cron job'ı manuel olarak çalıştırın (Test butonu)
2. Vercel logs'da kontrol edin:
   - `Fetching prices from multiple sources...`
   - `Price saved to price_history: BTC = ...`
   - `Price saved to price_history: ETH = ...`

## Seçenek 2: EasyCron (Alternatif)

### Adım 1: EasyCron'da Hesap Oluştur
1. [https://www.easycron.com](https://www.easycron.com) adresine gidin
2. Ücretsiz hesap oluşturun

### Adım 2: Yeni Cron Job Oluştur
1. Dashboard'da **"Add Cron Job"** butonuna tıklayın
2. Ayarlar:
   - **Cron Job Title**: `Synax Price History Update`
   - **URL**: `https://www.synax.vip/api/prices/crypto?secret=YOUR_CRON_SECRET`
   - **Schedule**: `*/2 * * * *` (her 2 dakikada bir)
   - **HTTP Method**: `GET`
   - **Timeout**: `60` saniye

3. **Save** butonuna tıklayın

## Güvenlik Notları

⚠️ **ÖNEMLİ**: `CRON_SECRET` değerini asla public repository'de paylaşmayın!

- `CRON_SECRET` sadece Vercel environment variables'da olmalı
- Cron job URL'inde `?secret=...` parametresi kullanılıyor
- Alternatif olarak `Authorization: Bearer ...` header'ı da kullanılabilir

## Test Endpoint

Manuel test için:
```bash
curl "https://www.synax.vip/api/prices/crypto?secret=YOUR_CRON_SECRET"
```

Veya tarayıcıda:
```
https://www.synax.vip/api/prices/crypto?secret=YOUR_CRON_SECRET
```

## Sorun Giderme

### Cron job çalışmıyor
1. Vercel logs'da hata var mı kontrol edin
2. `CRON_SECRET` değerinin doğru olduğundan emin olun
3. URL'nin doğru olduğundan emin olun

### Fiyatlar güncellenmiyor
1. Vercel logs'da `Price saved to price_history` mesajlarını kontrol edin
2. Supabase'de `price_history` tablosunu kontrol edin
3. `asset_id` değerlerinin doğru olduğundan emin olun (BTC, ETH vs)

## Schedule Formatları

- Her 2 dakika: `*/2 * * * *`
- Her 5 dakika: `*/5 * * * *`
- Her 10 dakika: `*/10 * * * *`
- Her saat: `0 * * * *`
- Her gün saat 00:00: `0 0 * * *`
