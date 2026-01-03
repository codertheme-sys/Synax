# Wix ile Synax Frontend Tasarım Rehberi

## Adım 1: Wix Hesabı Oluşturma

1. **Wix.com'a gidin**: https://www.wix.com
2. **"Get Started" veya "Sign Up"** butonuna tıklayın
3. Email ve şifre ile hesap oluşturun
4. **"Create a Website"** seçeneğini seçin

## Adım 2: Template Seçimi

1. **"Business"** kategorisini seçin
2. **"Finance"** veya **"Trading"** alt kategorisine bakın
3. **dgcex.net'e benzer bir template** seçin (koyu tema, modern)
4. Veya **"Start from Scratch"** ile boş bir sayfa başlatın

## Adım 3: dgcex.net Tasarımını Taklit Etme

### Navigation Bar (Üst Menü)
1. **"Add" > "Menu"** ekleyin
2. Menü öğeleri:
   - Dashboard
   - Earn
   - Trade
   - Portfolio
   - Contact Us
3. **Sağ tarafa** "Log in" ve "Sign up" butonları ekleyin
4. **Stil ayarları**:
   - Arka plan: Koyu (#0b0c1a benzeri)
   - Metin rengi: Beyaz/Gri
   - Font: Modern, sans-serif

### Hero Section (Ana Bölüm)
1. **"Add" > "Image"** ile hero görselini ekleyin
2. **"Add" > "Text"** ile başlığı ekleyin:
   - "Seize every opportunity in gold and crypto."
   - Büyük font (66px benzeri)
   - Sol tarafa hizalayın
3. **Görseli sağ tarafa** yerleştirin
4. **Blur efekti** ekleyin (görsel ayarlarından)
5. **Gradient overlay** ekleyin (koyu renk)

### Diğer Bölümler
1. **Watchlist Section**: İki sütunlu layout (metin sol, görsel sağ)
2. **Analytics Section**: İki sütunlu layout (görsel sol, metin sağ)
3. **FAQ Section**: Accordion veya kartlar
4. **Footer**: Logo, linkler, copyright

## Adım 4: Wix Corvid/Editor X ile Backend Entegrasyonu

### Seçenek A: Wix Corvid (Ücretsiz)
1. **Wix Editor'da** sağ üstteki **"Dev Mode"** butonuna tıklayın
2. **"Enable Dev Mode"** seçin
3. Custom kod ekleyebilirsiniz:
   ```javascript
   // API çağrıları için
   import wixFetch from 'wix-fetch';
   
   $w.onReady(function () {
     // Crypto prices API çağrısı
     fetchCryptoPrices();
   });
   
   async function fetchCryptoPrices() {
     const response = await wixFetch.fetch('https://your-domain.com/api/prices/crypto');
     const data = await response.json();
     // Verileri göster
   }
   ```

### Seçenek B: Wix Velo (Önerilen)
1. **Wix Editor'da** sağ üstteki **"Dev Mode"** butonuna tıklayın
2. **"Enable Velo"** seçin
3. Backend kodları ekleyin:
   ```javascript
   // backend/crypto-prices.js
   import { fetch } from 'wix-fetch';
   
   export async function getCryptoPrices() {
     const response = await fetch('https://your-domain.com/api/prices/crypto');
     return await response.json();
   }
   ```

## Adım 5: Next.js Backend'e Bağlama

### API Endpoint'lerinizi Wix'ten Çağırma

1. **Wix Velo'da** backend fonksiyonu oluşturun:
   ```javascript
   // backend/api-proxy.js
   import { fetch } from 'wix-fetch';
   
   export async function getCryptoPrices() {
     try {
       const response = await fetch('https://your-synax-domain.com/api/prices/crypto', {
         method: 'GET',
         headers: {
           'Content-Type': 'application/json'
         }
       });
       return await response.json();
     } catch (error) {
       console.error('Error fetching crypto prices:', error);
       return { success: false, error: error.message };
     }
   }
   ```

2. **Frontend'de** kullanın:
   ```javascript
   // page.js
   import { getCryptoPrices } from 'backend/api-proxy';
   
   $w.onReady(function () {
     loadPrices();
   });
   
   async function loadPrices() {
     const prices = await getCryptoPrices();
     if (prices.success) {
       // Fiyatları göster
       $w('#cryptoPricesRepeater').data = prices.data;
     }
   }
   ```

## Adım 6: Domain Bağlama

1. **Wix Dashboard** > **"Domains"**
2. **"Connect a Domain"** veya **"Buy a Domain"**
3. Domain'inizi bağlayın
4. DNS ayarlarını yapın

## Adım 7: Next.js Backend'i Ayrı Tutma

**Önerilen Yapı:**
- **Frontend**: Wix (tasarım, UI)
- **Backend**: Next.js (API'ler, Supabase, iş mantığı)
- **Bağlantı**: Wix Velo'dan Next.js API'lerine fetch çağrıları

## Alternatif: Wix + Next.js Hybrid

1. **Wix'te** sadece landing page (ana sayfa)
2. **Next.js'te** dashboard, trading, portfolio sayfaları
3. **Wix'ten** Next.js sayfalarına link verin

## Önemli Notlar

⚠️ **Wix'in Limitleri:**
- Ücretsiz plan: Sınırlı özellikler
- Corvid/Velo: Ücretsiz ama öğrenme eğrisi var
- Custom kod: Wix'in kurallarına uymalı

✅ **Avantajları:**
- Kolay tasarım
- Drag & drop editor
- Responsive tasarım otomatik
- Hosting dahil

## Sonraki Adımlar

1. Wix hesabı oluşturun
2. Template seçin veya sıfırdan başlayın
3. dgcex.net tasarımını taklit edin
4. Backend entegrasyonu için bana danışın

## Yardım

Wix ile ilgili sorularınız için:
- Wix Help Center: https://support.wix.com
- Wix Velo Docs: https://www.wix.com/velo
- Wix Forum: https://www.wix.com/forum

