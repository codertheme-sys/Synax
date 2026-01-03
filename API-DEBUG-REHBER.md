# 🔍 API Debug Rehberi

## Sorun
API `success: true` döndürüyor ama `data: Array(0)` - boş data.

## Olası Nedenler
1. **Binance API timeout** - 8 saniye içinde yanıt vermiyor
2. **Binance API boş obje döndürüyor** - Timeout sonrası
3. **Network sorunu** - Binance API'ye erişilemiyor

## Debug Adımları

### 1. Server-side logları kontrol et
Terminal'de Next.js server loglarını kontrol et:
- "Fetching prices from multiple sources..."
- "Multi-source API result: ..."
- "Binance API: Fetched X coins"

### 2. API'yi direkt test et
Tarayıcıda aç:
- http://localhost:3001/api/test/prices?source=binance
- http://localhost:3001/api/prices/crypto

### 3. Binance API'yi direkt test et
Terminal'de:
```powershell
Invoke-WebRequest -Uri "https://api.binance.com/api/v3/ticker/24hr" -Method GET | Select-Object -First 1
```

## Çözüm
Eğer Binance API timeout oluyorsa:
1. Timeout süresini artır (10-15 saniye)
2. Sadece popüler coin'leri çek (ilk 50-100)
3. CoinGecko'yu fallback olarak kullan

---

**Not**: Server-side logları kontrol etmek için terminal'deki Next.js output'una bakın.

