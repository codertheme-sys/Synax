# {B1586CD4-CED0-4549-B8BD-597ABA0E5DCF}.png

## Genel Bakış

TradingView Alert API entegrasyonu, kullanıcıların TradingView grafiklerinde oluşturdukları alert'leri platformumuzda yönetmelerini ve bu alert'ler tetiklendiğinde bildirim almalarını sağlar.

## Gereksinimler

1. **TradingView Webhook URL**: TradingView alert'lerinin gönderileceği endpoint
2. **Alert Veritabanı Tablosu**: Alert'leri saklamak için
3. **Webhook Handler API**: TradingView'den gelen alert'leri işlemek için
4. **Frontend Alert Yönetimi**: Kullanıcıların alert oluşturması ve yönetmesi için

## Adım 1: Veritabanı Tablosu Oluşturma

```sql
-- Alerts Tablosu
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL, -- 'crypto' or 'gold'
  condition_type VARCHAR(50) NOT NULL, -- 'price_cross', 'price_above', 'price_below', 'rsi', 'macd', etc.
  condition_value DECIMAL(20, 8) NOT NULL,
  condition_operator VARCHAR(10) NOT NULL, -- '>', '<', '>=', '<=', '==', 'cross'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'triggered', 'cancelled'
  triggered_at TIMESTAMP WITH TIME ZONE,
  tradingview_alert_id VARCHAR(100), -- TradingView'den gelen alert ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(asset_symbol, asset_type);

-- RLS Policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" ON alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON alerts
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Adım 2: Webhook Handler API Oluşturma

`pages/api/webhooks/tradingview-alert.js` dosyası oluşturun:

```javascript
// pages/api/webhooks/tradingview-alert.js
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TradingView'den gelen alert verisi
    const {
      symbol,
      price,
      condition,
      alert_id,
      timestamp,
      // TradingView alert formatına göre ek alanlar
    } = req.body;

    // Alert'i veritabanında bul
    const supabaseAdmin = createServerClient();
    const { data: alert, error: alertError } = await supabaseAdmin
      .from('alerts')
      .select('*, user_id')
      .eq('tradingview_alert_id', alert_id)
      .eq('status', 'active')
      .single();

    if (alertError || !alert) {
      console.error('Alert not found:', alertError);
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Alert'i triggered olarak işaretle
    await supabaseAdmin
      .from('alerts')
      .update({
        status: 'triggered',
        triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alert.id);

    // Kullanıcıya bildirim gönder (email, push notification, etc.)
    // Bu kısım implementasyonunuza göre değişir

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('TradingView alert webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Adım 3: TradingView Alert Oluşturma

TradingView'de alert oluşturmak için:

1. **TradingView Chart'ta Alert Oluşturma:**
   - TradingView widget'ında alert butonuna tıklayın
   - Alert koşulunu belirleyin (fiyat, RSI, MACD, vb.)
   - Webhook URL'ini ekleyin: `https://yourdomain.com/api/webhooks/tradingview-alert`
   - Alert'i kaydedin

2. **Platform Üzerinden Alert Oluşturma (Alternatif):**
   - Dashboard'daki "Alerts" bölümünden "+ Add" butonuna tıklayın
   - Alert formunu doldurun
   - Backend'de TradingView API kullanarak alert oluşturun (TradingView API gerektirir)

## Adım 4: Frontend Alert Yönetimi

Dashboard'daki Alerts bölümünü güncelleyin:

```javascript
// Alert oluşturma modal'ı
const [showAlertModal, setShowAlertModal] = useState(false);
const [alertSymbol, setAlertSymbol] = useState('');
const [alertCondition, setAlertCondition] = useState('');
const [alertValue, setAlertValue] = useState('');

const handleCreateAlert = async () => {
  // Alert'i veritabanına kaydet
  // TradingView'e webhook ile gönder (veya TradingView API kullan)
};
```

## Adım 5: TradingView Widget Konfigürasyonu

Trade sayfasındaki TradingView widget'ına alert özelliğini ekleyin:

```javascript
// pages/trade.js içinde
const widgetConfig = {
  // ... mevcut config
  hide_side_toolbar: false, // Alert butonunu göster
  alerts: [
    {
      symbol: selectedAsset,
      condition: 'price_cross',
      value: alertValue,
    }
  ],
};
```

## Notlar

1. **TradingView Webhook Formatı:**
   TradingView alert'leri JSON formatında POST isteği olarak gönderir. Format şu şekilde olabilir:
   ```json
   {
     "symbol": "BTCUSDT",
     "price": 51200,
     "condition": "price_cross",
     "alert_id": "unique_alert_id",
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```

2. **Güvenlik:**
   - Webhook endpoint'ini korumak için API key veya signature doğrulaması ekleyin
   - Rate limiting uygulayın
   - IP whitelist kullanın (TradingView IP'leri)

3. **Alternatif Yaklaşım:**
   TradingView API kullanmak yerine, kendi alert sisteminizi oluşturabilirsiniz:
   - Backend'de periyodik olarak fiyatları kontrol edin
   - Koşulları kontrol edin
   - Alert tetiklendiğinde kullanıcıya bildirim gönderin

## Test

1. TradingView'de test alert'i oluşturun
2. Webhook URL'ini test edin (webhook.site gibi servisler kullanabilirsiniz)
3. Alert tetiklendiğinde veritabanını kontrol edin
4. Kullanıcıya bildirim gönderildiğini doğrulayın









## Genel Bakış

TradingView Alert API entegrasyonu, kullanıcıların TradingView grafiklerinde oluşturdukları alert'leri platformumuzda yönetmelerini ve bu alert'ler tetiklendiğinde bildirim almalarını sağlar.

## Gereksinimler

1. **TradingView Webhook URL**: TradingView alert'lerinin gönderileceği endpoint
2. **Alert Veritabanı Tablosu**: Alert'leri saklamak için
3. **Webhook Handler API**: TradingView'den gelen alert'leri işlemek için
4. **Frontend Alert Yönetimi**: Kullanıcıların alert oluşturması ve yönetmesi için

## Adım 1: Veritabanı Tablosu Oluşturma

```sql
-- Alerts Tablosu
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL, -- 'crypto' or 'gold'
  condition_type VARCHAR(50) NOT NULL, -- 'price_cross', 'price_above', 'price_below', 'rsi', 'macd', etc.
  condition_value DECIMAL(20, 8) NOT NULL,
  condition_operator VARCHAR(10) NOT NULL, -- '>', '<', '>=', '<=', '==', 'cross'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'triggered', 'cancelled'
  triggered_at TIMESTAMP WITH TIME ZONE,
  tradingview_alert_id VARCHAR(100), -- TradingView'den gelen alert ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(asset_symbol, asset_type);

-- RLS Policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" ON alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON alerts
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Adım 2: Webhook Handler API Oluşturma

`pages/api/webhooks/tradingview-alert.js` dosyası oluşturun:

```javascript
// pages/api/webhooks/tradingview-alert.js
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TradingView'den gelen alert verisi
    const {
      symbol,
      price,
      condition,
      alert_id,
      timestamp,
      // TradingView alert formatına göre ek alanlar
    } = req.body;

    // Alert'i veritabanında bul
    const supabaseAdmin = createServerClient();
    const { data: alert, error: alertError } = await supabaseAdmin
      .from('alerts')
      .select('*, user_id')
      .eq('tradingview_alert_id', alert_id)
      .eq('status', 'active')
      .single();

    if (alertError || !alert) {
      console.error('Alert not found:', alertError);
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Alert'i triggered olarak işaretle
    await supabaseAdmin
      .from('alerts')
      .update({
        status: 'triggered',
        triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alert.id);

    // Kullanıcıya bildirim gönder (email, push notification, etc.)
    // Bu kısım implementasyonunuza göre değişir

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('TradingView alert webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Adım 3: TradingView Alert Oluşturma

TradingView'de alert oluşturmak için:

1. **TradingView Chart'ta Alert Oluşturma:**
   - TradingView widget'ında alert butonuna tıklayın
   - Alert koşulunu belirleyin (fiyat, RSI, MACD, vb.)
   - Webhook URL'ini ekleyin: `https://yourdomain.com/api/webhooks/tradingview-alert`
   - Alert'i kaydedin

2. **Platform Üzerinden Alert Oluşturma (Alternatif):**
   - Dashboard'daki "Alerts" bölümünden "+ Add" butonuna tıklayın
   - Alert formunu doldurun
   - Backend'de TradingView API kullanarak alert oluşturun (TradingView API gerektirir)

## Adım 4: Frontend Alert Yönetimi

Dashboard'daki Alerts bölümünü güncelleyin:

```javascript
// Alert oluşturma modal'ı
const [showAlertModal, setShowAlertModal] = useState(false);
const [alertSymbol, setAlertSymbol] = useState('');
const [alertCondition, setAlertCondition] = useState('');
const [alertValue, setAlertValue] = useState('');

const handleCreateAlert = async () => {
  // Alert'i veritabanına kaydet
  // TradingView'e webhook ile gönder (veya TradingView API kullan)
};
```

## Adım 5: TradingView Widget Konfigürasyonu

Trade sayfasındaki TradingView widget'ına alert özelliğini ekleyin:

```javascript
// pages/trade.js içinde
const widgetConfig = {
  // ... mevcut config
  hide_side_toolbar: false, // Alert butonunu göster
  alerts: [
    {
      symbol: selectedAsset,
      condition: 'price_cross',
      value: alertValue,
    }
  ],
};
```

## Notlar

1. **TradingView Webhook Formatı:**
   TradingView alert'leri JSON formatında POST isteği olarak gönderir. Format şu şekilde olabilir:
   ```json
   {
     "symbol": "BTCUSDT",
     "price": 51200,
     "condition": "price_cross",
     "alert_id": "unique_alert_id",
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```

2. **Güvenlik:**
   - Webhook endpoint'ini korumak için API key veya signature doğrulaması ekleyin
   - Rate limiting uygulayın
   - IP whitelist kullanın (TradingView IP'leri)

3. **Alternatif Yaklaşım:**
   TradingView API kullanmak yerine, kendi alert sisteminizi oluşturabilirsiniz:
   - Backend'de periyodik olarak fiyatları kontrol edin
   - Koşulları kontrol edin
   - Alert tetiklendiğinde kullanıcıya bildirim gönderin

## Test

1. TradingView'de test alert'i oluşturun
2. Webhook URL'ini test edin (webhook.site gibi servisler kullanabilirsiniz)
3. Alert tetiklendiğinde veritabanını kontrol edin
4. Kullanıcıya bildirim gönderildiğini doğrulayın
















