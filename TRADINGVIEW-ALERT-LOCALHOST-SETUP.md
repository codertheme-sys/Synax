# TradingView Alert - Localhost/Development Setup (Domain Olmadan)

## Sorun
TradingView alert webhook'ları için public bir URL gerekiyor. Domain alınmadan önce development/test için çözümler:

## Çözüm 1: ngrok Kullanımı (Önerilen - Geçici)

ngrok, localhost'unuzu public URL'ye çeviren ücretsiz bir servistir.

### Adımlar:

1. **ngrok'u İndirin ve Kurun:**
   ```bash
   # Windows için:
   # https://ngrok.com/download adresinden indirin
   # Veya Chocolatey ile:
   choco install ngrok
   ```

2. **ngrok Hesabı Oluşturun:**
   - https://ngrok.com adresine gidin
   - Ücretsiz hesap oluşturun
   - Auth token'ınızı alın

3. **ngrok'u Yapılandırın:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **ngrok Tunnel Başlatın:**
   ```bash
   # Next.js default port 3000
   ngrok http 3000
   ```

5. **ngrok URL'ini Kullanın:**
   - ngrok size bir URL verecek: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`
   - TradingView alert webhook URL'i: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/tradingview-alert`

### Notlar:
- **Ücretsiz ngrok:** URL her başlatmada değişir (geçici)
- **Ücretli ngrok:** Sabit URL alabilirsiniz
- **Güvenlik:** ngrok URL'sini sadece test için kullanın

## Çözüm 2: Cloudflare Tunnel (Alternatif)

Cloudflare Tunnel, ngrok'a alternatif ücretsiz bir servistir.

### Adımlar:

1. **Cloudflare Tunnel Kurulumu:**
   ```bash
   # Windows için:
   # https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/ adresinden indirin
   ```

2. **Tunnel Oluşturun:**
   ```bash
   cloudflared tunnel create synax-dev
   ```

3. **Tunnel Başlatın:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

## Çözüm 3: Platform İçi Alert Sistemi (Domain Olmadan)

Domain alınana kadar, TradingView webhook yerine platform içi alert sistemi kullanabilirsiniz:

### Özellikler:
- Kullanıcılar alert oluşturabilir (fiyat, RSI, MACD koşulları)
- Alert'ler veritabanında saklanır
- Backend'de periyodik kontrol yapılır
- Alert tetiklendiğinde kullanıcıya bildirim gönderilir

### Avantajlar:
- Domain gerektirmez
- Tam kontrol
- Özelleştirilebilir

### Dezavantajlar:
- TradingView'in gelişmiş alert özelliklerini kullanamaz
- Backend'de periyodik kontrol gerektirir (daha fazla kaynak)

## Çözüm 4: TradingView Charting Library (Ücretli - Production İçin)

TradingView'in ücretli Charting Library'sini kullanarak alert özelliğini tam entegre edebilirsiniz.

### Özellikler:
- Widget içinde alert butonu görünür
- Alert'ler TradingView üzerinden yönetilir
- Webhook entegrasyonu

### Notlar:
- Ücretli bir çözümdür
- Production için önerilir

## Önerilen Yaklaşım

1. **Development/Test:** ngrok kullanın (Çözüm 1)
2. **Production:** Domain alındıktan sonra webhook URL'ini güncelleyin

## Domain Alındıktan Sonra

1. Webhook URL'ini güncelleyin:
   ```
   https://yourdomain.com/api/webhooks/tradingview-alert
   ```

2. TradingView alert'lerinde webhook URL'ini güncelleyin

3. ngrok'u kaldırın

## Test

1. ngrok'u başlatın: `ngrok http 3000`
2. ngrok URL'ini alın: `https://xxxx.ngrok-free.app`
3. TradingView'de alert oluştururken webhook URL'ini ekleyin:
   ```
   https://xxxx.ngrok-free.app/api/webhooks/tradingview-alert
   ```
4. Alert'i test edin

## Güvenlik Notları

- ngrok URL'lerini public olarak paylaşmayın
- Production'da mutlaka domain kullanın
- Webhook endpoint'ine authentication ekleyin (isteğe bağlı)









## Sorun
TradingView alert webhook'ları için public bir URL gerekiyor. Domain alınmadan önce development/test için çözümler:

## Çözüm 1: ngrok Kullanımı (Önerilen - Geçici)

ngrok, localhost'unuzu public URL'ye çeviren ücretsiz bir servistir.

### Adımlar:

1. **ngrok'u İndirin ve Kurun:**
   ```bash
   # Windows için:
   # https://ngrok.com/download adresinden indirin
   # Veya Chocolatey ile:
   choco install ngrok
   ```

2. **ngrok Hesabı Oluşturun:**
   - https://ngrok.com adresine gidin
   - Ücretsiz hesap oluşturun
   - Auth token'ınızı alın

3. **ngrok'u Yapılandırın:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **ngrok Tunnel Başlatın:**
   ```bash
   # Next.js default port 3000
   ngrok http 3000
   ```

5. **ngrok URL'ini Kullanın:**
   - ngrok size bir URL verecek: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`
   - TradingView alert webhook URL'i: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/tradingview-alert`

### Notlar:
- **Ücretsiz ngrok:** URL her başlatmada değişir (geçici)
- **Ücretli ngrok:** Sabit URL alabilirsiniz
- **Güvenlik:** ngrok URL'sini sadece test için kullanın

## Çözüm 2: Cloudflare Tunnel (Alternatif)

Cloudflare Tunnel, ngrok'a alternatif ücretsiz bir servistir.

### Adımlar:

1. **Cloudflare Tunnel Kurulumu:**
   ```bash
   # Windows için:
   # https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/ adresinden indirin
   ```

2. **Tunnel Oluşturun:**
   ```bash
   cloudflared tunnel create synax-dev
   ```

3. **Tunnel Başlatın:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

## Çözüm 3: Platform İçi Alert Sistemi (Domain Olmadan)

Domain alınana kadar, TradingView webhook yerine platform içi alert sistemi kullanabilirsiniz:

### Özellikler:
- Kullanıcılar alert oluşturabilir (fiyat, RSI, MACD koşulları)
- Alert'ler veritabanında saklanır
- Backend'de periyodik kontrol yapılır
- Alert tetiklendiğinde kullanıcıya bildirim gönderilir

### Avantajlar:
- Domain gerektirmez
- Tam kontrol
- Özelleştirilebilir

### Dezavantajlar:
- TradingView'in gelişmiş alert özelliklerini kullanamaz
- Backend'de periyodik kontrol gerektirir (daha fazla kaynak)

## Çözüm 4: TradingView Charting Library (Ücretli - Production İçin)

TradingView'in ücretli Charting Library'sini kullanarak alert özelliğini tam entegre edebilirsiniz.

### Özellikler:
- Widget içinde alert butonu görünür
- Alert'ler TradingView üzerinden yönetilir
- Webhook entegrasyonu

### Notlar:
- Ücretli bir çözümdür
- Production için önerilir

## Önerilen Yaklaşım

1. **Development/Test:** ngrok kullanın (Çözüm 1)
2. **Production:** Domain alındıktan sonra webhook URL'ini güncelleyin

## Domain Alındıktan Sonra

1. Webhook URL'ini güncelleyin:
   ```
   https://yourdomain.com/api/webhooks/tradingview-alert
   ```

2. TradingView alert'lerinde webhook URL'ini güncelleyin

3. ngrok'u kaldırın

## Test

1. ngrok'u başlatın: `ngrok http 3000`
2. ngrok URL'ini alın: `https://xxxx.ngrok-free.app`
3. TradingView'de alert oluştururken webhook URL'ini ekleyin:
   ```
   https://xxxx.ngrok-free.app/api/webhooks/tradingview-alert
   ```
4. Alert'i test edin

## Güvenlik Notları

- ngrok URL'lerini public olarak paylaşmayın
- Production'da mutlaka domain kullanın
- Webhook endpoint'ine authentication ekleyin (isteğe bağlı)













