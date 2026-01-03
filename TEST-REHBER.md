# 🧪 Synax Platform - Test Rehberi

## 🚀 Hızlı Test

### 1. Development Server Başlat

```bash
cd C:\cryptogoldtrading
npm run dev
```

Tarayıcıda: http://localhost:3000

### 2. API Testleri

#### A) Tüm Kripto Fiyatları
```bash
GET http://localhost:3000/api/prices/crypto
```

**Beklenen:**
- 100+ kripto para fiyatı
- Binance'den gelen veriler
- Gerçek zamanlı fiyatlar

#### B) Altın Fiyatı
```bash
GET http://localhost:3000/api/prices/gold
```

**Beklenen:**
- Altın fiyatı (USD/oz)
- CoinGecko'dan gelen veri

#### C) Belirli Coin'ler
```bash
GET http://localhost:3000/api/prices/crypto?ids=bitcoin,ethereum,solana
```

**Beklenen:**
- Sadece istenen coin'ler
- Filtrelenmiş sonuç

### 3. Frontend Test

1. Ana sayfaya gidin: http://localhost:3000
2. Fiyat listesini kontrol edin
3. 100+ coin görünmeli
4. Altın görünmeli

## ✅ Test Kontrol Listesi

### API Testleri
- [ ] `/api/prices/crypto` - Tüm coin'ler geliyor mu?
- [ ] `/api/prices/crypto` - 100+ coin var mı?
- [ ] `/api/prices/gold` - Altın fiyatı geliyor mu?
- [ ] `/api/prices/crypto?ids=bitcoin` - Filtreleme çalışıyor mu?
- [ ] Response format doğru mu?
- [ ] Cache çalışıyor mu?

### Frontend Testleri
- [ ] Ana sayfa açılıyor mu?
- [ ] Fiyat listesi görünüyor mu?
- [ ] 100+ coin listeleniyor mu?
- [ ] Altın görünüyor mu?
- [ ] Fiyat güncellemeleri çalışıyor mu?

### Performans Testleri
- [ ] API response süresi < 2 saniye mi?
- [ ] Cache çalışıyor mu?
- [ ] Rate limiting çalışıyor mu?

## 🐛 Sorun Giderme

### API Çalışmıyor
1. Console'da hata var mı kontrol et
2. Network tab'da request'i kontrol et
3. Environment variables doğru mu?

### Fiyatlar Gelmiyor
1. Binance API çalışıyor mu? (https://api.binance.com/api/v3/ticker/24hr)
2. CoinGecko API çalışıyor mu?
3. Cache temizle ve tekrar dene

### Çok Az Coin Görünüyor
1. Binance API'den tüm pair'ler geliyor mu?
2. Filtreleme doğru çalışıyor mu?
3. Console'da hata var mı?

## 📊 Beklenen Sonuçlar

### API Response Örneği
```json
{
  "success": true,
  "data": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "current_price": 50000,
      "price_change_24h": 1000,
      "price_change_percentage_24h": 2.0,
      "volume_24h": 25000000000,
      "high_24h": 51000,
      "low_24h": 49000,
      "source": "binance"
    },
    // ... 100+ coin daha
    {
      "id": "gold",
      "symbol": "GOLD",
      "name": "Gold (per oz)",
      "current_price": 2000,
      "source": "coingecko"
    }
  ]
}
```

### Coin Sayısı
- **Minimum**: 50+ coin
- **Hedef**: 100+ coin
- **Altın**: 1 (GOLD)

## 🎯 Test Senaryoları

### Senaryo 1: Tüm Fiyatları Çek
1. `/api/prices/crypto` endpoint'ini çağır
2. 100+ coin gelmeli
3. Her coin'de fiyat, değişim, volume olmalı

### Senaryo 2: Altın Fiyatı
1. `/api/prices/gold` endpoint'ini çağır
2. Altın fiyatı gelmeli
3. 24 saat değişim olmalı

### Senaryo 3: Filtreleme
1. `/api/prices/crypto?ids=bitcoin,ethereum` çağır
2. Sadece BTC ve ETH gelmeli
3. Diğer coin'ler gelmemeli

### Senaryo 4: Cache
1. İlk istek yap (cache yok)
2. 5 saniye içinde ikinci istek yap
3. Cache'den gelmeli (daha hızlı)

---

**🎉 Test başlatıldı! Sonuçları kontrol edin!**

