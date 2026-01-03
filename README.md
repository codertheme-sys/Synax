# 🚀 Synax - Kripto & Altın Ticaret Platformu

Gerçek para işlemleri ile kripto para ve altın ticaret platformu

## ⚠️ ÖNEMLİ

- **Tamamen ayrı proje** - Diğer projelerle karıştırılmamalı
- **Gerçek para işlemleri** - Demo değil, gerçek ödemeler
- **Bypass deployment** - Bypass-friendly yapılandırma

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Production build
npm run build
npm start
```

## 📋 Özellikler

- ✅ Gerçek zamanlı kripto/altın fiyat takibi
- ✅ Gerçek para ile alım/satım
- ✅ Stripe ödeme entegrasyonu
- ✅ Banka transferi desteği
- ✅ KYC doğrulama sistemi
- ✅ Portföy yönetimi
- ✅ İzleme listesi (Watchlist)
- ✅ Güvenli ödeme işlemleri

## 🔒 Güvenlik

- Row Level Security (RLS)
- KYC doğrulama zorunlu
- Güvenli ödeme gateway'leri
- SSL/TLS şifreleme

## 💳 Ödeme Yöntemleri

- Stripe (Kredi Kartı)
- Banka Transferi
- Kripto Para (USDT, BTC, ETH)

## 📝 Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_SECRET=synax-webhook-secret-2024
```

## 🎛️ Manuel Fiyat Sistemi

Synax platformunda fiyatlar **otomatik** olarak güncellenir (webhook, Stripe vb.) ancak **admin manuel olarak da müdahale edebilir**.

Detaylı bilgi için: `MANUEL-FIYAT-SISTEMI.md`

