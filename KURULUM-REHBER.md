# 📚 CryptoGold Trading - Kurulum Rehberi

## 🎯 Proje Özeti

**Tamamen ayrı bir proje** - Gerçek para işlemleri ile kripto/altın ticaret platformu.

## 📋 Özellikler

- ✅ Gerçek zamanlı kripto/altın fiyat takibi
- ✅ Gerçek para ile alım/satım işlemleri
- ✅ Stripe ödeme entegrasyonu
- ✅ KYC doğrulama sistemi
- ✅ Portföy yönetimi
- ✅ İzleme listesi (Watchlist)
- ✅ Güvenli ödeme işlemleri
- ✅ Bypass deployment desteği

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
cd C:\cryptogoldtrading
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Development Server

```bash
npm run dev
```

Tarayıcıda: http://localhost:3000

## 🗄️ Veritabanı Kurulumu

### Supabase'de Şemayı Çalıştırın

1. Supabase Dashboard > **SQL Editor**
2. `database-schema.sql` dosyasını açın
3. İçeriği kopyalayın
4. SQL Editor'e yapıştırın
5. **RUN** tıklayın

### Oluşturulan Tablolar

- `profiles` - Kullanıcı profilleri ve bakiyeler
- `watchlist` - İzleme listesi
- `portfolio` - Portföy (gerçek para)
- `trading_history` - İşlem geçmişi
- `deposits` - Para yatırma işlemleri
- `withdrawals` - Para çekme işlemleri
- `price_history` - Fiyat cache
- `kyc_documents` - KYC belgeleri

## 💳 Stripe Kurulumu

### Test Modu

1. [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. **Test mode** açık olmalı
3. Test keys alın:
   - `pk_test_...` (Publishable key)
   - `sk_test_...` (Secret key)

### Production Modu

1. **Test mode** kapatın
2. Production keys alın:
   - `pk_live_...` (Publishable key)
   - `sk_live_...` (Secret key)

### Webhook

1. Developers > **Webhooks** > **Add endpoint**
2. URL: `https://yourdomain.com/api/payments/webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Signing secret** alın

## 🔒 Güvenlik

### KYC Zorunluluğu

- Gerçek para işlemleri için KYC zorunlu
- KYC belgeleri admin tarafından onaylanmalı
- KYC onaylanmadan işlem yapılamaz

### Row Level Security (RLS)

- Tüm tablolarda RLS aktif
- Kullanıcılar sadece kendi verilerine erişebilir
- Admin yetkisi ayrı kontrol edilir

## 📁 Proje Yapısı

```
cryptogoldtrading/
├── pages/
│   ├── api/
│   │   ├── payments/      # Ödeme API'leri
│   │   ├── prices/        # Fiyat API'leri
│   │   └── trading/       # Ticaret API'leri
│   ├── auth/              # Giriş/Kayıt
│   ├── dashboard/         # Dashboard
│   └── portfolio/         # Portföy
├── lib/
│   └── supabase.js        # Supabase client
├── styles/
│   └── globals.css        # Global stiller
├── database-schema.sql     # Veritabanı şeması
└── package.json
```

## 🧪 Test

### Test Kartları (Stripe)

- **Başarılı:** `4242 4242 4242 4242`
- **Başarısız:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

CVV: Herhangi bir 3 haneli sayı  
Expiry: Gelecek bir tarih

## 🚀 Production Deployment

Detaylı bilgi için: `BYPASS-DEPLOYMENT-REHBER.md`

### Özet

1. Supabase projesi oluştur
2. Veritabanı şemasını çalıştır
3. Stripe hesabı kur
4. GitHub'a push et
5. Vercel'e deploy et
6. Domain bağla
7. Webhook URL güncelle

## 📝 Önemli Notlar

1. **Ayrı Proje**: Bu proje tamamen ayrı, diğer projelerle karıştırılmamalı
2. **Gerçek Para**: Demo değil, gerçek ödemeler yapılır
3. **KYC Zorunlu**: Gerçek para işlemleri için KYC şart
4. **Güvenlik**: Tüm API'ler authentication gerektirir
5. **Bypass**: Bypass-friendly yapılandırma mevcut

## 🐛 Sorun Giderme

### Build Hatası
- Environment variables kontrol et
- `npm install` tekrar çalıştır

### API Hataları
- Supabase bağlantısını kontrol et
- API keys doğru mu kontrol et

### Ödeme Hatası
- Stripe keys doğru mu?
- Webhook URL doğru mu?
- KYC onaylı mı?

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Dokümantasyon dosyalarına bakın

---

**🎉 Başarılar!**

