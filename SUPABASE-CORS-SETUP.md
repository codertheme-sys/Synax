# 🔧 Supabase CORS Ayarları - Doğru Yer

## ⚠️ ÖNEMLİ: CORS Ayarları Artık Otomatik!

Supabase **2024'ten itibaren** CORS ayarlarını otomatik yönetiyor. Artık manuel CORS ayarı yapmanıza gerek yok!

## ✅ Çözüm: PKCE Flow Kullanıyoruz

Kodumuzda zaten **PKCE (Proof Key for Code Exchange)** flow kullanıyoruz:

```javascript
// lib/supabase.js
auth: {
  flowType: 'pkce', // CORS sorunlarını önler
}
```

Bu sayede CORS sorunları otomatik çözülüyor.

## 🔍 Eğer Hala CORS Hatası Alıyorsanız:

### 1. Supabase Dashboard Kontrolü

**Supabase Dashboard** > **Settings** > **API** bölümünde:

1. **Project URL** kontrol edin: `https://xxxxx.supabase.co`
2. **anon public key** kontrol edin
3. **service_role key** kontrol edin

### 2. Environment Variables Kontrolü

Vercel'de şu değişkenlerin olduğundan emin olun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Domain Kontrolü

Eğer custom domain kullanıyorsanız:

1. **Supabase Dashboard** > **Settings** > **API**
2. **Additional Allowed Origins** bölümüne domain'inizi ekleyin:
   - `https://www.synax.live`
   - `https://synax.live`
   - Vercel preview URL'leri (otomatik eklenir)

### 4. Browser Console Kontrolü

CORS hatası görüyorsanız, console'da şunu kontrol edin:

```
Access-Control-Allow-Origin header is missing
```

Bu hata görünüyorsa:
- PKCE flow zaten aktif (kodda var)
- Environment variables doğru mu kontrol edin
- Supabase projeniz aktif mi kontrol edin

## 🚨 Disk IO Sorunu İçin:

CORS ayarları disk IO sorununu çözmez. Disk IO sorunu için:

1. ✅ Alert check interval'i 60 saniyeye çıkarıldı
2. ✅ Cron job 10 dakikaya çıkarıldı
3. ✅ Sadece değişen fiyatlar yazılıyor

**Eğer hala sorun varsa:**
- Supabase Dashboard'da **Settings** > **Usage** bölümünden disk IO kullanımını kontrol edin
- Tüm sayfaları kapatıp birkaç dakika bekleyin
- Supabase projenizi **restart** edin (Settings > General > Restart Project)

## 📞 Destek

Hala sorun varsa:
- Supabase Support: support@supabase.com
- Supabase Discord: https://discord.supabase.com
