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

### Adım 3: Yeni Cron Job Oluştur
1. Dashboard'da **"Create cronjob"** butonuna tıklayın
2. Ayarlar:
   - **Title**: `Synax Price History Update`
   - **Address (URL)**: `https://www.synax.vip/api/prices/crypto?secret=YOUR_CRON_SECRET`
     - `YOUR_CRON_SECRET` yerine Vercel'de oluşturduğunuz `CRON_SECRET` değerini yazın
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
