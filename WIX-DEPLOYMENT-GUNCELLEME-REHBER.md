# Wix Deployment & Güncelleme Rehberi

## GENEL BAKIŞ

Wix + Next.js backend hybrid yapısı için deployment ve güncelleme süreçleri.

---

## 1. DOMAIN VE HOSTING DURUMU

### Wix Frontend (Domain)

✅ **Wix kendi hosting'ini sağlar:**
- Domain aldıktan sonra Wix'te hosting otomatik
- **GitHub'a ihtiyaç YOK**
- **Vercel'e ihtiyaç YOK** (sadece frontend için)

### Next.js Backend (API'ler)

⚠️ **Backend için hosting gerekir:**
- Next.js API'leriniz için Vercel, Railway, veya başka bir hosting
- Supabase zaten cloud'da, ekstra hosting gerekmez

---

## 2. CANLIYA GEÇİŞ SONRASI GÜNCELLEME YÖNTEMLERİ

### A. WIX FRONTEND GÜNCELLEMELERİ

#### Yöntem 1: Wix Editor (Önerilen)

**Adımlar:**
1. **Wix Dashboard** > **"Edit Site"**
2. Değişiklikleri yapın (tasarım, içerik, kod)
3. **"Publish"** butonuna tıklayın
4. Değişiklikler **anında canlıya** geçer

**Avantajlar:**
- ✅ Anında yayınlama
- ✅ Önizleme özelliği
- ✅ Geri alma (version history)
- ✅ A/B testing

**Ne zaman kullanılır:**
- Tasarım değişiklikleri
- İçerik güncellemeleri
- Wix Velo kod değişiklikleri
- Yeni sayfalar ekleme

#### Yöntem 2: Wix Dev Mode (Gelişmiş)

**Adımlar:**
1. **Wix Editor** > **"Dev Mode"** açın
2. Kod dosyalarını düzenleyin
3. **"Save"** > **"Publish"**

**Ne zaman kullanılır:**
- Backend kod değişiklikleri
- API entegrasyonları
- Custom fonksiyonlar

---

### B. NEXT.JS BACKEND GÜNCELLEMELERİ

#### Yöntem 1: Vercel (Önerilen)

**Kurulum (İlk kez):**

1. **GitHub'a kod push edin:**
   ```bash
   cd C:\cryptogoldtrading
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/synax-backend.git
   git push -u origin main
   ```

2. **Vercel'e bağlayın:**
   - https://vercel.com > **"New Project"**
   - GitHub repo'yu seçin
   - **"Deploy"**

**Güncelleme Süreci:**

1. **Kod değişikliklerini yapın** (local'de)
2. **GitHub'a push edin:**
   ```bash
   git add .
   git commit -m "Update API endpoints"
   git push
   ```
3. **Vercel otomatik deploy eder** (2-3 dakika)
4. **Canlıya geçer**

**Avantajlar:**
- ✅ Otomatik deployment
- ✅ Preview deployments (test için)
- ✅ Rollback özelliği
- ✅ Ücretsiz plan yeterli

#### Yöntem 2: Railway / Render (Alternatif)

**Railway:**
1. Railway.app > **"New Project"**
2. GitHub repo'yu bağlayın
3. Otomatik deploy

**Render:**
1. Render.com > **"New Web Service"**
2. GitHub repo'yu bağlayın
3. Otomatik deploy

---

## 3. HATA DURUMUNDA MÜDAHALE

### A. WIX FRONTEND HATALARI

#### Hata Türleri:

1. **Tasarım Hatası:**
   - **Çözüm:** Wix Editor'dan düzelt, Publish et

2. **Kod Hatası (Velo):**
   - **Çözüm:** 
     - Wix Editor > Dev Mode
     - Console'da hata kontrolü (F12)
     - Kodu düzelt, Save > Publish

3. **Sayfa Yüklenmiyor:**
   - **Çözüm:**
     - Wix Dashboard > Pages > Sayfa ayarları
     - Permissions kontrolü
     - Cache temizleme

#### Debug Yöntemleri:

**Wix Editor'da:**
```javascript
// Console log ekleyin
console.log('Debug info:', data);

// Error handling
try {
  // kod
} catch (error) {
  console.error('Error:', error);
  $w('#errorText').text = error.message;
}
```

**Browser Console:**
- F12 > Console
- Hataları görüntüle
- Network tab'da API çağrılarını kontrol et

---

### B. NEXT.JS BACKEND HATALARI

#### Hata Türleri:

1. **API Hatası:**
   - **Çözüm:**
     - Vercel Dashboard > Functions > Logs
     - Hata loglarını kontrol et
     - Kodu düzelt, GitHub'a push et
     - Otomatik redeploy

2. **Database Hatası:**
   - **Çözüm:**
     - Supabase Dashboard > Logs
     - SQL sorgularını kontrol et
     - RLS policies kontrolü

3. **Environment Variable Hatası:**
   - **Çözüm:**
     - Vercel Dashboard > Settings > Environment Variables
     - Değişkenleri kontrol et/güncelle
     - Redeploy

#### Debug Yöntemleri:

**Vercel Logs:**
```bash
# Vercel CLI ile log görüntüleme
vercel logs
```

**Local Test:**
```bash
cd C:\cryptogoldtrading
npm run dev
# localhost:3000'de test et
```

**Supabase Logs:**
- Supabase Dashboard > Logs
- API requests kontrolü
- Database queries kontrolü

---

## 4. GÜNCELLEME WORKFLOW'U

### Senaryo 1: Sadece Frontend Değişikliği

```
1. Wix Editor'da değişiklik yap
2. Preview'da test et
3. Publish et
4. ✅ Canlıya geçti (anında)
```

### Senaryo 2: Sadece Backend Değişikliği

```
1. Local'de kod değiştir (C:\cryptogoldtrading)
2. Test et (npm run dev)
3. GitHub'a push et
4. Vercel otomatik deploy eder
5. ✅ Canlıya geçti (2-3 dakika)
```

### Senaryo 3: Hem Frontend Hem Backend

```
1. Backend'i güncelle (GitHub > Vercel)
2. Wix'te API endpoint'lerini kontrol et
3. Wix frontend'i güncelle (gerekirse)
4. Publish et
5. ✅ Her ikisi de canlıda
```

---

## 5. VERSİYON KONTROLÜ VE GERİ ALMA

### Wix Version History

1. **Wix Dashboard** > **"Site History"**
2. Önceki versiyonları görüntüle
3. **"Restore"** ile geri al

**Avantajlar:**
- ✅ Son 30 günün geçmişi
- ✅ Tek tıkla geri alma
- ✅ Önizleme özelliği

### Vercel Rollback

1. **Vercel Dashboard** > **"Deployments"**
2. Önceki deployment'ı seç
3. **"Promote to Production"**

**Avantajlar:**
- ✅ Tüm deployment geçmişi
- ✅ Anında rollback
- ✅ Preview deployments

---

## 6. ÖNEMLİ NOTLAR

### ⚠️ Dikkat Edilmesi Gerekenler

1. **Wix Frontend:**
   - Domain değişikliği yapmadan önce backup alın
   - Önemli değişikliklerde önce test sayfası oluşturun
   - Wix Velo kodlarını GitHub'a yedekleyin (manuel)

2. **Next.js Backend:**
   - Her zaman GitHub'da version control kullanın
   - Production'a push etmeden önce local'de test edin
   - Environment variables'ı güvenli tutun

3. **Entegrasyon:**
   - API endpoint'leri değiştiğinde Wix'teki çağrıları güncelleyin
   - CORS ayarlarını kontrol edin
   - Supabase RLS policies'i test edin

---

## 7. ÖNERİLEN YAPILANDIRMA

### Development (Geliştirme)

```
Local Development:
├── Wix Editor (Preview mode)
└── Next.js (localhost:3000)
```

### Staging (Test)

```
Test Environment:
├── Wix (Test subdomain: test.yoursite.com)
└── Vercel Preview Deployment
```

### Production (Canlı)

```
Live Site:
├── Wix (yourdomain.com)
└── Vercel Production (api.yourdomain.com)
```

---

## 8. SIK SORULAN SORULAR

### S: Wix'te domain aldıktan sonra GitHub gerekir mi?
**C:** Hayır, Wix frontend için GitHub gerekmez. Ama backend (Next.js) için önerilir.

### S: Vercel'e ihtiyacım var mı?
**C:** Backend API'leriniz için evet. Wix frontend için hayır.

### S: Güncelleme ne kadar sürer?
**C:** 
- Wix: Anında (Publish sonrası)
- Vercel: 2-3 dakika (otomatik deploy)

### S: Hata olursa nasıl geri alırım?
**C:**
- Wix: Site History'den restore
- Vercel: Deployments'tan rollback

### S: Kodları nasıl yedeklerim?
**C:**
- Wix Velo: Manuel olarak GitHub'a kopyala
- Next.js: Git ile otomatik yedekleme

---

## 9. HIZLI REFERANS

### Wix Güncelleme
```
Edit Site > Değişiklik Yap > Publish > ✅ Canlı
```

### Backend Güncelleme
```
Kod Değiştir > Git Push > Vercel Auto-Deploy > ✅ Canlı
```

### Hata Debug
```
Wix: F12 Console + Site History
Backend: Vercel Logs + Supabase Logs
```

---

## SONUÇ

✅ **Wix Frontend:** GitHub/Vercel gerekmez, Wix kendi hosting'ini sağlar
✅ **Next.js Backend:** Vercel (veya alternatif) + GitHub önerilir
✅ **Güncelleme:** Wix anında, Backend 2-3 dakika
✅ **Hata Müdahale:** Wix Editor + Vercel Dashboard

**Önerilen Workflow:**
1. Backend'i GitHub + Vercel'de tut
2. Wix frontend'i Wix'te tut
3. Her ikisini de ayrı ayrı güncelle
4. Version control için GitHub kullan (backend için)

