# Synax APK Oluşturma Rehberi

Bu rehber, Synax platformunu Android APK olarak dağıtmanın yollarını açıklar.

---

## Yöntem 1: PWA Builder (En Kolay) ✅ Önerilen

**Gereksinim:** Sadece canlı site URL'si (synax.vip)

### Adımlar

1. **https://www.pwabuilder.com/** adresine gidin
2. Site URL'sini girin: `https://synax.vip`
3. **"Start"** butonuna tıklayın
4. PWA Builder sitenizi analiz edecek
5. **"Package for stores"** veya **"Android"** seçeneğini seçin
6. **"Generate"** ile APK/AAB dosyasını indirin

### Avantajlar
- ✅ Kod değişikliği yok
- ✅ Birkaç dakikada APK
- ✅ PWA manifest ve service worker kullanır
- ✅ Ücretsiz

### Dezavantajlar
- ⚠️ Sadece canlı site ile çalışır (localhost değil)
- ⚠️ APK, sitenizi WebView'da açar (TWA)

---

## Yöntem 2: Capacitor (Daha Fazla Kontrol)

Capacitor, mevcut Next.js uygulamanızı native Android projesine sarar.

### Ön Gereksinimler

- Node.js
- Android Studio (APK build için)
- Java JDK 17+

### Kurulum

```bash
# 1. Capacitor paketlerini yükleyin
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Capacitor'ı başlatın
npx cap init "Synax" "com.synax.app"

# 3. Next.js build (önce production build)
npm run build

# 4. Build çıktısını Capacitor'a kopyalayın
# Next.js varsayılan olarak .next kullanır - Capacitor için static export gerekebilir
```

### Önemli: Next.js Static Export

Capacitor, statik HTML/JS dosyaları bekler. Next.js için `next.config.js`'e ekleyin:

```javascript
// next.config.js
const nextConfig = {
  output: 'export',  // Static HTML export
  // ... diğer ayarlar
};
```

**Dikkat:** `output: 'export'` bazı Next.js özelliklerini kısıtlar (API routes, SSR, dynamic routes). Synax API route'lar kullanıyorsa bu yöntem uygun olmayabilir.

### Alternatif: Capacitor + Canlı URL

Capacitor ile sadece WebView açıp `https://synax.vip` yükleyebilirsiniz. Bu durumda static export gerekmez:

```javascript
// capacitor.config.js
const config = {
  appId: 'com.synax.app',
  appName: 'Synax',
  webDir: 'out',  // veya build çıktısı
  server: {
    url: 'https://synax.vip',
    cleartext: true
  }
};
```

Bu yaklaşımda APK sadece bir "browser wrapper" olur - tüm içerik canlı siteden gelir.

### Android Projesi Oluşturma

```bash
# Android platformunu ekleyin
npx cap add android

# Web dosyalarını kopyalayın
npx cap sync

# Android Studio'da açın
npx cap open android
```

Android Studio'da:
1. **Build → Generate Signed Bundle / APK** seçin
2. Keystore oluşturun veya mevcut olanı kullanın
3. APK'yı build edin

---

## Yöntem 3: Bubblewrap (TWA - Trusted Web Activity)

Google'ın TWA aracı. PWA'nızı Play Store benzeri deneyimle APK'ya çevirir.

### Kurulum

```bash
# Node.js gerekli
npm install -g @bubblewrap/cli

# Başlat
bubblewrap init --manifest=https://synax.vip/manifest.json
```

Bubblewrap, manifest.json'dan bilgileri alır ve TWA projesi oluşturur.

---

## Karşılaştırma

| Yöntem | Zorluk | Süre | Kod Değişikliği | Sonuç |
|--------|--------|------|-----------------|-------|
| **PWA Builder** | Kolay | 5-10 dk | Yok | TWA APK |
| **Capacitor (URL)** | Orta | 1-2 saat | Minimal | Native wrapper |
| **Capacitor (Static)** | Zor | 1-2 gün | Çok | Tam offline |
| **Bubblewrap** | Orta | 2-4 saat | Yok | TWA APK |

---

## Öneri: PWA Builder ile Başlayın

1. **synax.vip** canlı ve erişilebilir olmalı
2. **manifest.json** doğru yapılandırılmış olmalı (zaten var)
3. **Service Worker** çalışıyor olmalı
4. https://www.pwabuilder.com/ → URL girin → APK indirin

APK'yı kendi sitenizden veya başka kanallardan dağıtabilirsiniz. Kullanıcılar "Bilinmeyen kaynaklardan yükleme" izni vermelidir.

---

## APK Dağıtımı

APK oluşturduktan sonra:

1. **Web sitesinde indirme linki:** `/download` veya `/app` sayfası
2. **Direct link:** `https://synax.vip/synax.apk` (public klasörde)
3. **QR kod:** İndirme sayfasına yönlendiren QR

### Güvenlik Notu

APK'yı dağıtırken:
- HTTPS üzerinden sunun
- Kullanıcılara sadece resmi synax.vip'ten indirmelerini söyleyin
- APK imzalı olmalı (PWA Builder ve Capacitor otomatik imzalar)
