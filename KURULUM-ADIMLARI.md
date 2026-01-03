# 📋 Synax Platform - Kurulum Adımları

## ✅ ADIM 1: Veritabanı Şeması

### 1.1 Ana Şema
Supabase SQL Editor'de çalıştırın:
- `database-schema.sql` ✅ (Zaten çalıştırıldı)

### 1.2 Manuel Fiyat Sistemi
Supabase SQL Editor'de çalıştırın:
- `database-manual-prices.sql` ⚠️ **ŞİMDİ ÇALIŞTIRIN!**

## ✅ ADIM 2: Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
WEBHOOK_SECRET=synax-webhook-secret-2024
```

## ✅ ADIM 3: Test

```bash
cd C:\cryptogoldtrading
npm install
npm run dev
```

## ✅ ADIM 4: İlk Admin Kullanıcı

1. Supabase Dashboard > **Table Editor** > **profiles**
2. İlk kullanıcınızı bulun
3. `is_admin` sütununu `true` yapın

## 🎛️ Manuel Fiyat Sistemi

### Nasıl Çalışır?

1. **Otomatik Fiyatlar**: CoinGecko, Webhook, Stripe'tan gelir
2. **Manuel Fiyatlar**: Admin tarafından ayarlanır
3. **Öncelik**: Manuel fiyat aktifse, otomatik fiyatlar kullanılmaz

### Admin API Kullanımı

**Manuel Fiyat Ayarla:**
```bash
POST /api/admin/price-override
Authorization: Bearer <admin_token>
```

**Manuel Fiyatları Listele:**
```bash
GET /api/admin/price-override?active_only=true
Authorization: Bearer <admin_token>
```

**Manuel Fiyatı Kaldır:**
```bash
DELETE /api/admin/price-override?asset_id=bitcoin&asset_type=crypto
Authorization: Bearer <admin_token>
```

Detaylı bilgi: `MANUEL-FIYAT-SISTEMI.md`

## 🔗 Webhook ile Fiyat Güncelleme

**Webhook Endpoint:**
```
POST /api/webhooks/price-update
x-webhook-secret: synax-webhook-secret-2024
```

**Örnek Body:**
```json
{
  "prices": [
    {
      "asset_type": "crypto",
      "asset_id": "bitcoin",
      "asset_symbol": "BTC",
      "asset_name": "Bitcoin",
      "price": 50000,
      "price_change_24h": 1000,
      "price_change_percent_24h": 2.0
    }
  ],
  "source": "stripe"
}
```

## 📚 Dokümantasyon

- `README.md` - Genel bilgiler
- `KURULUM-REHBER.md` - Detaylı kurulum
- `BYPASS-DEPLOYMENT-REHBER.md` - Deployment
- `MANUEL-FIYAT-SISTEMI.md` - Manuel fiyat sistemi
- `PROJE-OZET.md` - Proje özeti

---

**🎉 Kurulum tamamlandı!**

