# ⚡ Synax Platform - Hızlı Test

## 🚀 Test Adımları

### 1. Development Server Başlat

```bash
cd C:\cryptogoldtrading
npm run dev
```

**Bekle:** Server başlayana kadar (30-60 saniye)

### 2. Tarayıcıda Aç

http://localhost:3000

### 3. API Test Endpoint

**Test sayfası:**
http://localhost:3000/api/test/prices

**Beklenen sonuç:**
```json
{
  "success": true,
  "results": {
    "binance": {
      "success": true,
      "coin_count": 100+,
      "sample_coins": ["BTCUSDT", "ETHUSDT", ...]
    },
    "multi_source": {
      "success": true,
      "total_coins": 100+,
      "has_gold": true,
      "gold_price": 2000
    }
  }
}
```

### 4. Ana Sayfa Test

1. Ana sayfaya gidin: http://localhost:3000
2. Fiyat listesini kontrol edin
3. **100+ coin** görünmeli
4. **Altın** görünmeli
5. "Yenile" butonuna tıklayın
6. Fiyatlar güncellenmeli

## ✅ Kontrol Listesi

- [ ] Server başladı mı? (http://localhost:3000 açılıyor mu?)
- [ ] API test endpoint çalışıyor mu? (http://localhost:3000/api/test/prices)
- [ ] Binance API'den 100+ coin geliyor mu?
- [ ] Altın fiyatı geliyor mu?
- [ ] Ana sayfada coin'ler görünüyor mu?
- [ ] Fiyat güncellemeleri çalışıyor mu?

## 🐛 Sorun Giderme

### Server Başlamıyor
```bash
# Port kullanımda mı kontrol et
netstat -ano | findstr :3000

# Node modules yüklü mü?
npm install
```

### API Çalışmıyor
1. Console'da hata var mı? (F12 > Console)
2. Network tab'da request başarılı mı?
3. Environment variables var mı? (.env.local)

### Fiyatlar Gelmiyor
1. Binance API çalışıyor mu?
   - Test: https://api.binance.com/api/v3/ticker/24hr
2. CoinGecko API çalışıyor mu?
   - Test: https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd

## 📊 Beklenen Sonuçlar

### Coin Sayısı
- **Minimum**: 50+ coin
- **Hedef**: 100+ coin
- **Altın**: 1 (GOLD)

### Response Süresi
- **İlk istek**: < 3 saniye
- **Cache'li istek**: < 100ms

---

**🎉 Test başlatıldı! Sonuçları kontrol edin!**

