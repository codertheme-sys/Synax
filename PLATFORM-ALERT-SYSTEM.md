# Platform İçi Alert Sistemi

## Genel Bakış

Platform içi alert sistemi, TradingView webhook olmadan çalışan, kendi alert yönetim sistemimizdir. Kullanıcılar fiyat alert'leri oluşturabilir ve bu alert'ler backend'de periyodik olarak kontrol edilir.

## Özellikler

- ✅ Alert oluşturma (fiyat koşulları)
- ✅ Alert listeleme
- ✅ Alert silme
- ✅ Otomatik alert kontrolü
- ✅ Alert tetiklendiğinde bildirim (TODO)

## API Endpoints

### 1. Create Alert
```
POST /api/alerts/create
Authorization: Bearer <token>
Body: {
  asset_symbol: "BTC",
  asset_type: "crypto",
  condition_type: "price",
  condition_value: 50000,
  condition_operator: ">="
}
```

### 2. List Alerts
```
GET /api/alerts/list?status=active
Authorization: Bearer <token>
```

### 3. Update Alert
```
PUT /api/alerts/update
Authorization: Bearer <token>
Body: {
  alertId: "uuid",
  status: "paused" | "active",
  condition_value: 51000,
  condition_operator: ">="
}
```

### 4. Delete Alert
```
DELETE /api/alerts/delete?alertId=uuid
Authorization: Bearer <token>
```

### 5. Check Alerts (Cron Job)
```
POST /api/alerts/check
X-API-Key: <ALERT_CHECK_API_KEY>
```

## Alert Kontrolü (Cron Job)

Alert'lerin periyodik olarak kontrol edilmesi için bir cron job kurulmalıdır.

### Vercel Cron Jobs (Önerilen)

`vercel.json` dosyasına ekleyin:

```json
{
  "crons": [
    {
      "path": "/api/alerts/check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Bu, her 5 dakikada bir alert'leri kontrol eder.

### Environment Variable

`.env.local` dosyasına ekleyin:

```
ALERT_CHECK_API_KEY=your-secret-api-key-here
```

### Manuel Test

Alert kontrolünü manuel olarak test etmek için:

```bash
curl -X POST http://localhost:3000/api/alerts/check \
  -H "X-API-Key: your-secret-api-key-here"
```

## Kullanım

### Trade Sayfasında

1. Trade sayfasına gidin
2. Sağ tarafta "Price Alerts" bölümünü görün
3. "+ Add" butonuna tıklayın
4. Alert koşulunu seçin (>=, >, <=, <, ==)
5. Fiyat değerini girin
6. "Create Alert" butonuna tıklayın

### Alert Koşulları

- **>= (Above or Equal)**: Fiyat belirtilen değere eşit veya üzerine çıktığında tetiklenir
- **> (Above)**: Fiyat belirtilen değerin üzerine çıktığında tetiklenir
- **<= (Below or Equal)**: Fiyat belirtilen değere eşit veya altına düştüğünde tetiklenir
- **< (Below)**: Fiyat belirtilen değerin altına düştüğünde tetiklenir
- **== (Equal)**: Fiyat belirtilen değere eşit olduğunda tetiklenir

## Alert Tetiklendiğinde

Alert tetiklendiğinde:
1. Alert durumu `triggered` olarak güncellenir
2. `triggered_at` timestamp'i kaydedilir
3. TODO: Kullanıcıya bildirim gönderilir (email, push, in-app)

## Bildirim Sistemi (TODO)

Alert tetiklendiğinde kullanıcıya bildirim göndermek için:

1. Email bildirimi ekleyin
2. Push notification ekleyin
3. In-app notification ekleyin
4. Dashboard'da alert listesi gösterin

## Veritabanı

Alert'ler `alerts` tablosunda saklanır. Tablo şeması için `database-alerts-table.sql` dosyasına bakın.

## Güvenlik

- Alert check API'si API key ile korunur
- Kullanıcılar sadece kendi alert'lerini görebilir (RLS)
- Alert oluşturma, güncelleme, silme işlemleri authentication gerektirir









## Genel Bakış

Platform içi alert sistemi, TradingView webhook olmadan çalışan, kendi alert yönetim sistemimizdir. Kullanıcılar fiyat alert'leri oluşturabilir ve bu alert'ler backend'de periyodik olarak kontrol edilir.

## Özellikler

- ✅ Alert oluşturma (fiyat koşulları)
- ✅ Alert listeleme
- ✅ Alert silme
- ✅ Otomatik alert kontrolü
- ✅ Alert tetiklendiğinde bildirim (TODO)

## API Endpoints

### 1. Create Alert
```
POST /api/alerts/create
Authorization: Bearer <token>
Body: {
  asset_symbol: "BTC",
  asset_type: "crypto",
  condition_type: "price",
  condition_value: 50000,
  condition_operator: ">="
}
```

### 2. List Alerts
```
GET /api/alerts/list?status=active
Authorization: Bearer <token>
```

### 3. Update Alert
```
PUT /api/alerts/update
Authorization: Bearer <token>
Body: {
  alertId: "uuid",
  status: "paused" | "active",
  condition_value: 51000,
  condition_operator: ">="
}
```

### 4. Delete Alert
```
DELETE /api/alerts/delete?alertId=uuid
Authorization: Bearer <token>
```

### 5. Check Alerts (Cron Job)
```
POST /api/alerts/check
X-API-Key: <ALERT_CHECK_API_KEY>
```

## Alert Kontrolü (Cron Job)

Alert'lerin periyodik olarak kontrol edilmesi için bir cron job kurulmalıdır.

### Vercel Cron Jobs (Önerilen)

`vercel.json` dosyasına ekleyin:

```json
{
  "crons": [
    {
      "path": "/api/alerts/check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Bu, her 5 dakikada bir alert'leri kontrol eder.

### Environment Variable

`.env.local` dosyasına ekleyin:

```
ALERT_CHECK_API_KEY=your-secret-api-key-here
```

### Manuel Test

Alert kontrolünü manuel olarak test etmek için:

```bash
curl -X POST http://localhost:3000/api/alerts/check \
  -H "X-API-Key: your-secret-api-key-here"
```

## Kullanım

### Trade Sayfasında

1. Trade sayfasına gidin
2. Sağ tarafta "Price Alerts" bölümünü görün
3. "+ Add" butonuna tıklayın
4. Alert koşulunu seçin (>=, >, <=, <, ==)
5. Fiyat değerini girin
6. "Create Alert" butonuna tıklayın

### Alert Koşulları

- **>= (Above or Equal)**: Fiyat belirtilen değere eşit veya üzerine çıktığında tetiklenir
- **> (Above)**: Fiyat belirtilen değerin üzerine çıktığında tetiklenir
- **<= (Below or Equal)**: Fiyat belirtilen değere eşit veya altına düştüğünde tetiklenir
- **< (Below)**: Fiyat belirtilen değerin altına düştüğünde tetiklenir
- **== (Equal)**: Fiyat belirtilen değere eşit olduğunda tetiklenir

## Alert Tetiklendiğinde

Alert tetiklendiğinde:
1. Alert durumu `triggered` olarak güncellenir
2. `triggered_at` timestamp'i kaydedilir
3. TODO: Kullanıcıya bildirim gönderilir (email, push, in-app)

## Bildirim Sistemi (TODO)

Alert tetiklendiğinde kullanıcıya bildirim göndermek için:

1. Email bildirimi ekleyin
2. Push notification ekleyin
3. In-app notification ekleyin
4. Dashboard'da alert listesi gösterin

## Veritabanı

Alert'ler `alerts` tablosunda saklanır. Tablo şeması için `database-alerts-table.sql` dosyasına bakın.

## Güvenlik

- Alert check API'si API key ile korunur
- Kullanıcılar sadece kendi alert'lerini görebilir (RLS)
- Alert oluşturma, güncelleme, silme işlemleri authentication gerektirir

















