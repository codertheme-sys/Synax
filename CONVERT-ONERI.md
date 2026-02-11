# Convert İşlemi Genişletme Önerileri

## Mevcut Durum

- **Convert:** Sadece Holdings (BTC, ETH, XRP) → USDT
- **USDT:** Cash balance'da tutuluyor, Holdings'te görünmüyor
- **Sonuç:** USDT'den diğer coinlere convert yapılamıyor, sadece crypto → USDT tek yönlü

## Önerilen Mimari

### Seçenek A: Kaynak + Hedef Seçimi (Önerilen)

**UI:**
- "From" (Kaynak): Holdings listesi + **USDT (Available Balance)** seçeneği
- "To" (Hedef): BTC, ETH, USDT, XRP

**Davranış:**
| Kaynak | Hedef | İşlem |
|--------|-------|-------|
| Holdings (BTC/ETH/XRP) | USDT | Mevcut: Portfolio'dan düş, balance'a ekle |
| Holdings (BTC/ETH/XRP) | BTC/ETH/XRP | Portfolio'dan düş, hedef coin portfolio'ya ekle |
| USDT (Balance) | BTC/ETH/XRP | Balance'dan düş, hedef coin portfolio'ya ekle |
| USDT (Balance) | USDT | Anlamsız (engelle) |

**Avantajlar:**
- USDT balance’dan convert mümkün
- Tüm coinler arası iki yönlü çevrim
- Mevcut yapıyı minimal değiştirir

### Seçenek B: USDT'yi Portföye Taşımak

USDT deposit’leri hem balance hem portfolio’ya yazılır. Convert her zaman portfolio ↔ portfolio.

**Dezavantaj:** Balance vs portfolio senkronizasyonu, trade/binary işlemler balance kullandığı için karmaşıklaşır.

### Öneri: Seçenek A

## Teknik Implementasyon Planı

### 1. API: `/api/assets/convert` Güncellemesi

**Yeni parametreler:**
```
source_type: 'portfolio' | 'balance'   // portfolio_id veya 'balance'
source_coin: 'BTC' | 'ETH' | 'USDT' | 'XRP'
target_coin: 'BTC' | 'ETH' | 'USDT' | 'XRP'
quantity: number
```

**Logic:**
- `source_type === 'portfolio'`: Mevcut portfolio mantığı (portfolio_id ile)
- `source_type === 'balance'`: Sadece source_coin === 'USDT' (balance’dan düş)
- Hedef USDT: balance'a ekle (mevcut)
- Hedef BTC/ETH/XRP: portfolio’ya ekle (deposit-approve benzeri)

### 2. Fiyat Hesaplama

- Tüm çevrimler: Kaynak → USDT → Hedef (ara değer USDT)
- Örn: 100 USDT → ETH: 100 USDT / ETH_fiyatı = ETH miktarı

### 3. UI: Assets Sayfası

- Convert modal: "From" + "To" dropdown
- From: [Holdings listesi] + "USDT (Available Balance)"
- To: [BTC, ETH, USDT, XRP]
- Aynı coin seçimi engellenecek

### 4. Convert History

- `from_coin`, `to_coin`, `from_quantity`, `to_quantity` alanları eklenebilir
- Mevcut şema `asset_symbol` → `from_asset_symbol` olarak genişletilebilir

## Adım Adım Uygulama

1. **DB:** `convert_history` tablosuna `to_asset_symbol`, `to_quantity` (opsiyonel) ekle
2. **API:** `convert.js`’i source/target parametrelerine göre güncelle
3. **Frontend:** Assets convert modal’ı From/To seçimli hale getir
4. **Test:** USDT→ETH, ETH→BTC, BTC→USDT senaryoları

Detaylı implementasyona geçmek için onayınızı bekliyorum.
