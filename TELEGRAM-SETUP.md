# 📱 Telegram Bildirim Sistemi Kurulumu

## Genel Bakış

Platform, Deposit, Withdraw ve Trade işlemlerinde otomatik Telegram bildirimleri gönderir.

## Özellikler

- ✅ Deposit onaylandığında bildirim
- ✅ Deposit reddedildiğinde bildirim
- ✅ Withdraw onaylandığında bildirim
- ✅ Withdraw reddedildiğinde bildirim
- ✅ Trade tamamlandığında bildirim (Win/Lost)

## Kurulum Adımları

### 1. Telegram Bot Oluşturma

1. Telegram'da [@BotFather](https://t.me/botfather) ile konuşun
2. `/newbot` komutunu gönderin
3. Bot'unuz için bir isim seçin (örn: "Synax Platform Bot")
4. Bot'unuz için bir username seçin (örn: "synax_platform_bot")
5. BotFather size bir **Bot Token** verecek, bunu kopyalayın
   - Örnek format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Chat ID Bulma

Bildirimlerin gönderileceği chat ID'yi bulmak için:

#### Yöntem 1: Bot ile Konuşma
1. Oluşturduğunuz botu Telegram'da bulun ve başlatın
2. Bot'a herhangi bir mesaj gönderin (örn: `/start`)
3. Tarayıcıda şu URL'yi açın:
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   `<BOT_TOKEN>` yerine BotFather'dan aldığınız token'ı yazın
4. JSON response'da `"chat":{"id":123456789}` şeklinde bir satır bulun
5. Bu sayı sizin **Chat ID**'nizdir

#### Yöntem 2: @userinfobot Kullanma
1. Telegram'da [@userinfobot](https://t.me/userinfobot) ile konuşun
2. Bot size Chat ID'nizi verecektir

#### Yöntem 3: Grup Chat ID (Opsiyonel)
Eğer bildirimleri bir gruba göndermek istiyorsanız:
1. Botu gruba ekleyin
2. Bot'a `/start` komutu gönderin
3. Yöntem 1'deki URL'yi kullanarak grup chat ID'sini bulun

### 3. Environment Variables Ekleme

Vercel Dashboard'da veya `.env.local` dosyasına şu değişkenleri ekleyin:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

**Önemli:**
- `TELEGRAM_BOT_TOKEN`: BotFather'dan aldığınız bot token
- `TELEGRAM_CHAT_ID`: Bildirimlerin gönderileceği chat ID (kişisel veya grup)

### 4. Vercel'de Environment Variables Ekleme

1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. **Settings** > **Environment Variables** bölümüne gidin
4. Şu değişkenleri ekleyin:
   - `TELEGRAM_BOT_TOKEN` = Bot token'ınız
   - `TELEGRAM_CHAT_ID` = Chat ID'niz
5. **Save** butonuna tıklayın
6. Projeyi yeniden deploy edin (Vercel otomatik deploy edebilir)

## Test Etme

Kurulumu test etmek için:

1. Platform'da bir deposit işlemi yapın ve onaylayın
2. Telegram'da bildirimi kontrol edin
3. Eğer bildirim gelmiyorsa:
   - Vercel loglarını kontrol edin
   - Environment variables'ların doğru eklendiğinden emin olun
   - Bot token ve chat ID'nin doğru olduğundan emin olun

## Bildirim Formatları

### Deposit Bildirimi
```
💰 Yeni Deposit İşlemi

👤 Kullanıcı: user@example.com
🪙 Coin: BTC
💵 Miktar: 0.5 BTC
💲 USDT Değeri: 25000.00 USDT
📊 Durum: ✅ Onaylandı
🕐 Tarih: 20.01.2026, 14:30:00
```

### Withdrawal Bildirimi
```
💸 Yeni Withdrawal İşlemi

👤 Kullanıcı: user@example.com
💵 Miktar: 1000 USDT
📍 Cüzdan: 0x1234567890abcdef...
🌐 Ağ: Ethereum (ERC20)
📊 Durum: ✅ Onaylandı
🕐 Tarih: 20.01.2026, 15:45:00
```

### Trade Bildirimi
```
🎉 Trade Sonuçlandı

👤 Kullanıcı: user@example.com
🪙 Asset: BTC
📊 Sonuç: ✅ KAZANDI
💰 Trade Miktarı: 100.00 USDT
💵 Profit/Loss: +10.00 USDT
📈 Başlangıç Fiyatı: 50000.00 USDT
📉 Bitiş Fiyatı: 50500.00 USDT
⏱️ Time Frame: 60s
🕐 Tarih: 20.01.2026, 16:00:00
```

## Sorun Giderme

### Bildirimler Gelmiyor

1. **Environment Variables Kontrolü:**
   - Vercel Dashboard'da environment variables'ların ekli olduğundan emin olun
   - Değişkenlerin doğru yazıldığından emin olun (büyük/küçük harf duyarlı)

2. **Bot Token Kontrolü:**
   - Bot token'ın doğru olduğundan emin olun
   - Bot'un aktif olduğundan emin olun

3. **Chat ID Kontrolü:**
   - Chat ID'nin doğru olduğundan emin olun
   - Bot ile konuştuğunuzdan emin olun (bot başlatılmış olmalı)

4. **Vercel Logları:**
   - Vercel Dashboard > Deployments > Son deployment > Functions
   - Loglarda `[Telegram]` ile başlayan mesajları kontrol edin
   - Hata mesajları varsa bunları inceleyin

### Bot Çalışmıyor

- BotFather'dan `/mybots` komutu ile botunuzu seçin
- Bot'un aktif olduğundan emin olun
- Gerekirse botu yeniden başlatın

### Chat ID Bulamıyorum

- [@userinfobot](https://t.me/userinfobot) ile konuşun
- Veya `getUpdates` API'sini kullanın (yukarıdaki Yöntem 1)

## Güvenlik Notları

- ⚠️ Bot token'ınızı asla public repository'lerde paylaşmayın
- ⚠️ Environment variables'ları sadece Vercel Dashboard'da saklayın
- ⚠️ Chat ID'nizi de güvenli tutun
- ✅ Bot token ve chat ID sadece backend'de kullanılır, frontend'e expose edilmez

## İsteğe Bağlı: Grup Bildirimleri

Eğer bildirimleri bir Telegram grubuna göndermek istiyorsanız:

1. Botu gruba ekleyin
2. Bot'a admin yetkisi verin (gerekirse)
3. Grup chat ID'sini bulun (Yöntem 1)
4. `TELEGRAM_CHAT_ID` değişkenini grup chat ID'si ile güncelleyin

## Destek

Sorun yaşarsanız:
1. Vercel loglarını kontrol edin
2. Bot token ve chat ID'yi doğrulayın
3. Environment variables'ların doğru eklendiğinden emin olun
