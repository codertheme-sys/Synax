# 📊 Synax Platform - Fiyat Kaynakları

## 🎯 Çoklu Kaynak Sistemi

Synax platformu **çoklu kaynak** kullanarak daha fazla kripto para ve altın verisi sağlar:

### 1. Binance API (Ana Kaynak) ✅

**Özellikler:**
- ✅ **ÜCRETSİZ** - API key gerekmez (public endpoints)
- ✅ **100+ Kripto Para** - Tüm USDT trading pair'leri
- ✅ **Gerçek Zamanlı** - Çok hızlı güncelleme
- ✅ **Yüksek Rate Limit** - 1200 requests/minute
- ✅ **Detaylı Veri** - Fiyat, volume, high, low, değişim

**Kullanım:**
```javascript
import { getAllBinancePrices } from './lib/binance-api';

const prices = await getAllBinancePrices();
// { BTCUSDT: { price: 50000, priceChange24h: 1000, ... }, ... }
```

**Desteklenen Coin'ler:**
- Top 100+ popüler coin (Binance'de işlem gören tüm USDT pair'leri)
- BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, AVAX, LTC, TRX, LINK, SHIB, MATIC, UNI, ATOM, ETC, XLM, ALGO, VET, ICP, FIL, APT, ARB, OP, SUI, PEPE, FLOKI, WLD, SEI, TIA, INJ, RENDER, FET, AGIX, OCEAN, GALA, SAND, MANA, AXS, ENJ, CHZ, THETA, EOS, AAVE, MKR, COMP, SNX, CRV, YFI, SUSHI, 1INCH, BAL, ZRX ve daha fazlası...

### 2. CoinGecko API (Yardımcı Kaynak) ✅

**Özellikler:**
- ✅ **ÜCRETSİZ** - API key gerekmez (free tier)
- ✅ **Altın Fiyatı** - Altın verisi sağlar
- ✅ **Fallback** - Binance'de olmayan coin'ler için
- ✅ **Rate Limit** - 10-50 calls/minute (yeterli)

**Kullanım:**
- Altın fiyatı için
- Binance'de olmayan coin'ler için fallback

### 3. Kombinasyon Sistemi 🔄

**Çalışma Mantığı:**
```
Fiyat İsteği
    ↓
Binance API (Ana Kaynak)
    ├─ 100+ Kripto Para ✅
    └─ Gerçek Zamanlı ✅
    ↓
CoinGecko API (Yardımcı)
    ├─ Altın Fiyatı ✅
    └─ Fallback Coin'ler ✅
    ↓
Birleştir ve Cache'le
    ↓
Manuel Override Kontrolü
    ↓
Fiyat Gösterimi
```

## 📊 Desteklenen Varlıklar

### Kripto Paralar (100+)
- **Top 20**: BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, AVAX, LTC, TRX, LINK, SHIB, MATIC, UNI, ATOM, ETC, XLM, ALGO, VET
- **21-50**: ICP, FIL, APT, ARB, OP, SUI, PEPE, FLOKI, WLD, SEI, TIA, INJ, RENDER, FET, AGIX, OCEAN, GALA, SAND, MANA, AXS, ENJ, CHZ, THETA, EOS, AAVE, MKR, COMP, SNX, CRV, YFI
- **51-100+**: SUSHI, 1INCH, BAL, ZRX, BAT, ZEC, DASH, XMR, QTUM, ONT, ZIL, IOST, CELR, ONE, HARMONY, IOTX, AUDIO, CTXC, STPT, WAVES, OMG, ZEN, SKL, GRT, LRC, STORJ, KNC, BAND, ANT, ROSE, REEF, DENT, CELO, RIF, TRU, FIS, DOCK, PUNDIX, PROM, VTHO, ARKM, HBAR ve daha fazlası...

### Altın
- **GOLD** - Altın fiyatı (USD/oz)

## 💰 Maliyet

### Binance API
- ✅ **ÜCRETSİZ** - Public endpoints
- ✅ **Sınırsız** - Rate limit yeterli (1200/min)
- ✅ **API Key Gerekmez**

### CoinGecko API
- ✅ **ÜCRETSİZ** - Free tier
- ✅ **Yeterli** - 10-50 calls/minute
- ✅ **API Key Gerekmez**

### Toplam Maliyet
- 💰 **$0/ay** - Tamamen ücretsiz!

## ⚡ Performans

### Güncelleme Sıklığı
- **Binance**: 5 saniye cache (çok hızlı)
- **CoinGecko**: 10 saniye cache
- **Kombinasyon**: 5 saniye cache

### Rate Limiting
- **Binance**: 1200 requests/minute (yeterli)
- **CoinGecko**: 10-50 calls/minute (yeterli)
- **Kombinasyon**: Akıllı rate limiting

## 🔧 Kullanım

### API Endpoint
```
GET /api/prices/crypto
GET /api/prices/crypto?ids=bitcoin,ethereum,solana
```

### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "bitcoin",
      "symbol": "btc",
      "name": "Bitcoin",
      "current_price": 50000,
      "price_change_24h": 1000,
      "price_change_percentage_24h": 2.0,
      "volume_24h": 25000000000,
      "high_24h": 51000,
      "low_24h": 49000,
      "source": "binance"
    }
  ]
}
```

## 🎯 Avantajlar

1. ✅ **100+ Coin** - Binance'den tüm popüler coin'ler
2. ✅ **Altın Desteği** - CoinGecko'dan altın fiyatı
3. ✅ **Ücretsiz** - Hiçbir maliyet yok
4. ✅ **Hızlı** - Gerçek zamanlı güncelleme
5. ✅ **Güvenilir** - Çoklu kaynak, fallback sistemi
6. ✅ **Esnek** - Manuel override desteği

## 📝 Notlar

- Binance API public endpoints kullanır (API key gerekmez)
- CoinGecko free tier yeterli (altın için)
- Cache sistemi rate limit'i optimize eder
- Manuel override sistemi admin kontrolü sağlar

---

**🎉 100+ coin + altın desteği, tamamen ücretsiz!**

