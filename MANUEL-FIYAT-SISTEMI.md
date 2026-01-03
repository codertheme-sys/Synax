# 🎛️ Synax - Manuel Fiyat Müdahalesi Sistemi

## 📋 Genel Bakış

Synax platformunda fiyatlar **otomatik** olarak güncellenir (webhook, Stripe vb.) ancak **admin manuel olarak da müdahale edebilir**.

## 🔄 Fiyat Kaynakları

### 1. Otomatik Fiyatlar (Auto)
- CoinGecko API'den gelen fiyatlar
- Webhook'tan gelen fiyatlar
- Stripe'tan gelen fiyatlar

### 2. Manuel Fiyatlar (Manual)
- Admin tarafından manuel olarak ayarlanan fiyatlar
- Manuel fiyatlar **öncelikli** olarak kullanılır
- Manuel fiyat aktifken, otomatik fiyatlar kullanılmaz

## 🎯 Çalışma Mantığı

```
Fiyat İsteği
    ↓
Manuel Override Var mı? (is_active = true)
    ↓
    ├─ EVET → Manuel fiyatı kullan
    └─ HAYIR → Otomatik fiyatı kullan (CoinGecko/Webhook)
```

## 📊 Veritabanı Yapısı

### price_overrides Tablosu
- `asset_id` - Varlık ID
- `asset_type` - 'crypto' veya 'gold'
- `manual_price` - Manuel fiyat
- `is_active` - Aktif mi? (true = manuel fiyat kullan, false = otomatik kullan)
- `source` - Kaynak (manual, webhook, stripe)
- `created_by` - Oluşturan admin

### price_override_history Tablosu
- Tüm fiyat değişikliklerinin geçmişi
- Kim, ne zaman, ne değiştirdi

## 🔧 API Endpoints

### 1. Manuel Fiyat Ayarlama (Admin)

**POST** `/api/admin/price-override`

```json
{
  "asset_type": "crypto",
  "asset_id": "bitcoin",
  "asset_symbol": "BTC",
  "asset_name": "Bitcoin",
  "manual_price": 50000,
  "manual_price_change_24h": 1000,
  "manual_price_change_percent_24h": 2.0,
  "is_active": true,
  "source": "manual",
  "notes": "Manuel fiyat ayarı"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Price override created",
  "data": { ... }
}
```

### 2. Tüm Manuel Fiyatları Listele (Admin)

**GET** `/api/admin/price-override?active_only=true`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "asset_id": "bitcoin",
      "asset_type": "crypto",
      "manual_price": 50000,
      "is_active": true,
      "source": "manual"
    }
  ]
}
```

### 3. Manuel Fiyatı Deaktive Et (Admin)

**DELETE** `/api/admin/price-override?asset_id=bitcoin&asset_type=crypto`

**Response:**
```json
{
  "success": true,
  "message": "Price override deactivated"
}
```

### 4. Fiyat Değişiklik Geçmişi (Admin)

**GET** `/api/admin/price-override-history?asset_id=bitcoin&limit=50`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "asset_id": "bitcoin",
      "old_price": 49000,
      "new_price": 50000,
      "source": "manual",
      "changed_by": "...",
      "created_at": "..."
    }
  ]
}
```

### 5. Webhook ile Fiyat Güncelleme

**POST** `/api/webhooks/price-update`

**Headers:**
```
x-webhook-secret: your-webhook-secret
```

**Body:**
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

**Not:** Webhook'tan gelen fiyatlar:
- Eğer **aktif manuel override yoksa** → Otomatik olarak kullanılır
- Eğer **aktif manuel override varsa** → Sadece kaydedilir, kullanılmaz (manuel fiyat öncelikli)

## 💡 Kullanım Senaryoları

### Senaryo 1: Normal Otomatik Fiyat
1. CoinGecko API'den fiyat gelir
2. Manuel override yok
3. Otomatik fiyat kullanılır

### Senaryo 2: Admin Manuel Fiyat Ayarlar
1. Admin `/api/admin/price-override` ile manuel fiyat ayarlar
2. `is_active: true` yapar
3. Artık manuel fiyat kullanılır
4. Webhook'tan gelen fiyatlar kaydedilir ama kullanılmaz

### Senaryo 3: Admin Manuel Fiyatı Kaldırır
1. Admin `/api/admin/price-override` DELETE ile deaktive eder
2. `is_active: false` olur
3. Artık otomatik fiyatlar tekrar kullanılır

### Senaryo 4: Webhook Fiyat Güncellemesi
1. Webhook'tan fiyat gelir
2. Manuel override kontrol edilir
3. Override yoksa → Fiyat otomatik kullanılır
4. Override varsa → Fiyat sadece kaydedilir, kullanılmaz

## 🔒 Güvenlik

- Sadece **admin** kullanıcılar manuel fiyat ayarlayabilir
- Webhook için `x-webhook-secret` header kontrolü
- Tüm değişiklikler `price_override_history` tablosunda loglanır

## 📝 Örnek Kullanım

### Admin Panel'den Manuel Fiyat Ayarlama

```javascript
// Bitcoin fiyatını manuel olarak 50000 USD yap
const response = await fetch('/api/admin/price-override', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    asset_type: 'crypto',
    asset_id: 'bitcoin',
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    manual_price: 50000,
    manual_price_change_24h: 1000,
    manual_price_change_percent_24h: 2.0,
    is_active: true,
    source: 'manual',
    notes: 'Özel fiyat ayarı'
  })
});
```

### Manuel Fiyatı Kaldırma (Otomatik Fiyata Dön)

```javascript
// Bitcoin için manuel fiyatı deaktive et
const response = await fetch('/api/admin/price-override?asset_id=bitcoin&asset_type=crypto', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

## ⚠️ Önemli Notlar

1. **Manuel fiyat aktifken** otomatik fiyatlar kullanılmaz
2. **Webhook fiyatları** her zaman kaydedilir (manuel override olsa bile)
3. **Fiyat geçmişi** tüm değişiklikleri tutar
4. **Admin yetkisi** zorunludur
5. **Webhook secret** güvenlik için kullanılır

---

**🎉 Sistem hazır! Admin panel'den manuel fiyat ayarlayabilirsiniz!**

