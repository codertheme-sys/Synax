# Mobil Test Rehberi

## Canlıya Almadan Önce Mobil Telefonda Test Etme Yöntemleri

### 1. **Chrome DevTools ile Mobil Simülasyon (En Kolay)**

1. Chrome'da `localhost:3000` adresini açın
2. **F12** tuşuna basın (veya sağ tık > Inspect)
3. **Toggle device toolbar** butonuna tıklayın (Ctrl+Shift+M veya sol üstteki cihaz ikonu)
4. Üst kısımda cihaz seçici görünecek
5. İstediğiniz cihazı seçin (iPhone, Samsung, vb.)
6. Sayfayı yenileyin ve test edin

**Avantajları:**
- Hızlı ve kolay
- Farklı cihaz boyutlarını test edebilirsiniz
- Network throttling ile yavaş internet simülasyonu yapabilirsiniz

### 2. **Aynı WiFi Ağı Üzerinden Mobil Cihazda Test**

1. **Bilgisayarınızın IP adresini öğrenin:**
   - Windows: `ipconfig` komutunu çalıştırın, "IPv4 Address" değerini bulun (örn: 192.168.1.100)
   - Mac/Linux: `ifconfig` veya `ip addr` komutunu çalıştırın

2. **Next.js'i network modunda başlatın:**
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   veya
   ```bash
   next dev -H 0.0.0.0
   ```

3. **Mobil cihazınızı aynı WiFi ağına bağlayın**

4. **Mobil cihazınızın tarayıcısında şu adresi açın:**
   ```
   http://192.168.1.100:3000
   ```
   (IP adresinizi kullanın)

**Not:** Windows Firewall veya antivirüs programı port 3000'i engelliyorsa, izin vermeniz gerekebilir.

### 3. **ngrok ile Public URL (En Pratik - Uzak Kişilere Göstermek İçin İdeal)**

1. **ngrok'u indirin ve kurun:**
   - https://ngrok.com/download
   - Windows için: ZIP dosyasını indirip çıkarın
   - veya `npm install -g ngrok` (Node.js yüklüyse)

2. **ngrok hesabı oluşturun (ücretsiz):**
   - https://dashboard.ngrok.com/signup
   - Email ile kayıt olun
   
3. **Onboarding formunu doldurun:**
   - "How would you describe yourself?" → "Software Engineer (Development)" (veya istediğiniz)
   - "What are you interested in using ngrok for?" → "Sharing local apps without deploying" seçin (veya "My use case isn't here" seçip açıklama yazın)
   - "Are you using ngrok for?" → "Development" seçin
   - "Continue" butonuna tıklayın

4. **Authtoken'ı alın:**
   - Dashboard'a yönlendirileceksiniz
   - Sol menüden "Getting Started" veya "Your Authtoken" bölümüne gidin
   - Authtoken'ınızı kopyalayın (örn: `2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5`)

5. **ngrok'u yapılandırın:**
   - Terminal/PowerShell'i açın
   - ngrok'un kurulu olduğu klasöre gidin (veya PATH'teyse direkt çalıştırın)
   - Şu komutu çalıştırın (YOUR_AUTH_TOKEN yerine kopyaladığınız token'ı yapıştırın):
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
   - Başarılı olursa "Authtoken saved to configuration file" mesajını göreceksiniz

4. **Next.js'i başlatın:**
   ```bash
   npm run dev
   ```

5. **Next.js'i başlatın (eğer çalışmıyorsa):**
   ```bash
   npm run dev
   ```

6. **ngrok'u başlatın:**
   
   **Yöntem 1 - Kolay Yol (Önerilen):**
   - Proje klasöründe `start-ngrok.bat` dosyasına çift tıklayın
   - Veya terminal'de: `start-ngrok.bat`
   - Bu script otomatik olarak Next.js'in çalışıp çalışmadığını kontrol eder
   
   **Yöntem 2 - Manuel:**
   - Yeni bir terminal açın
   - Şu komutu çalıştırın:
   ```bash
   ngrok http 3000
   ```

7. **ngrok size bir URL verecek (örn: `https://abc123.ngrok.io`)**
   - Terminal'de URL'yi göreceksiniz
   - Veya tarayıcıda `http://localhost:4040` adresini açarak ngrok web arayüzünden URL'yi görebilirsiniz

8. **Bu URL'yi paylaşın:**
   - Uzak kişiye bu URL'yi gönderin
   - URL'yi herhangi bir cihazdan açabilirler (mobil, tablet, desktop)
   - İnternet bağlantısı olan her yerden erişilebilir

## Bilgisayarı Kapattıktan Sonra

Bilgisayarı kapattıktan sonra ngrok durur ve URL değişir. Yeni URL almak için:

1. **Next.js'i başlatın:**
   ```bash
   npm run dev
   ```

2. **ngrok'u tekrar başlatın:**
   - `start-ngrok.bat` dosyasına çift tıklayın
   - Veya terminal'de: `ngrok http 3000`

3. **Yeni URL'yi alın:**
   - Terminal'de görünen yeni URL'yi kopyalayın
   - Veya `http://localhost:4040` adresinden ngrok web arayüzünden alın

**Not:** Ücretsiz ngrok hesabında URL her başlatmada değişir. Sabit URL için ücretli hesap gerekir.

**Avantajları:**
- ✅ İnternet üzerinden erişilebilir
- ✅ Gerçek mobil cihazda test edebilirsiniz
- ✅ Farklı cihazlardan test edebilirsiniz
- ✅ **Uzak kişilere platformu gösterebilirsiniz**
- ✅ Canlıya almadan önce test için mükemmel

**Notlar:**
- Ücretsiz ngrok hesabı ile URL her başlatmada değişir
- Ücretli hesapta sabit URL alabilirsiniz
- ngrok çalışırken Next.js dev server'ı da çalışmalı
- ngrok'u durdurmak için terminal'de `Ctrl+C` basın

### 4. **USB ile Android Cihaz Bağlama (Chrome Remote Debugging)**

1. **Android cihazınızda Developer Options'ı açın:**
   - Ayarlar > Telefon Hakkında > Yapı Numarası'na 7 kez tıklayın

2. **USB Debugging'i açın:**
   - Ayarlar > Geliştirici Seçenekleri > USB Hata Ayıklama

3. **USB ile bilgisayara bağlayın**

4. **Chrome'da `chrome://inspect` adresini açın**

5. **Cihazınızı görüp "inspect" butonuna tıklayın**

### 5. **iOS Safari Remote Debugging (Mac Gerekli)**

1. **Mac'te Safari > Preferences > Advanced > "Show Develop menu"**

2. **iPhone/iPad'de:**
   - Ayarlar > Safari > Gelişmiş > Web Inspector'ı açın

3. **USB ile Mac'e bağlayın**

4. **Mac Safari'de Develop menüsünden cihazınızı seçin**

## Önerilen Test Senaryoları

1. ✅ **Farklı ekran boyutları:** iPhone SE, iPhone 12, iPad, Samsung Galaxy
2. ✅ **Yatay/Dikey mod:** Cihazı çevirip test edin
3. ✅ **Touch gestures:** Scroll, swipe, tap işlemleri
4. ✅ **Form input'ları:** Klavye açılıp kapanması
5. ✅ **Navigation:** Menü açılıp kapanması
6. ✅ **Performance:** Sayfa yükleme hızı

## Hızlı Test Komutu

En hızlı yöntem için:
```bash
# Terminal 1 - Next.js'i başlatın
npm run dev

# Terminal 2 - ngrok'u başlatın
ngrok http 3000
# VEYA daha kolay: start-ngrok.bat dosyasına çift tıklayın
```

Sonra ngrok'un verdiği URL'yi telefonunuzda açın!

## URL'yi Bulma

ngrok başlatıldıktan sonra URL'yi görmek için:

1. **Terminal'de:** ngrok başlatıldığında terminal'de URL görünür
2. **Web Arayüzü:** Tarayıcıda `http://localhost:4040` adresini açın
   - Bu sayfada tüm tunnel bilgileri ve URL görünür
   - İstekleri (requests) de buradan izleyebilirsiniz

## Bilgisayarı Kapattıktan Sonra

Bilgisayarı kapattıktan sonra ngrok durur ve URL değişir. Yeni URL almak için:

1. **Next.js'i başlatın:**
   ```bash
   npm run dev
   ```

2. **ngrok'u tekrar başlatın:**
   - **Kolay Yol:** Proje klasöründeki `start-ngrok.bat` dosyasına çift tıklayın
   - **Manuel:** Terminal'de `ngrok http 3000` komutunu çalıştırın

3. **Yeni URL'yi alın:**
   - Terminal'de görünen yeni URL'yi kopyalayın
   - Veya tarayıcıda `http://localhost:4040` adresini açarak ngrok web arayüzünden URL'yi görebilirsiniz

**Not:** Ücretsiz ngrok hesabında URL her başlatmada değişir. Sabit URL için ücretli hesap gerekir.

