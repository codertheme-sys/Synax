-- Alerts Tablosu - TradingView Alert Entegrasyonu
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
  webhook_url TEXT, -- TradingView webhook URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(asset_symbol, asset_type);
CREATE INDEX IF NOT EXISTS idx_alerts_tradingview_id ON alerts(tradingview_alert_id);

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
  webhook_url TEXT, -- TradingView webhook URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(asset_symbol, asset_type);
CREATE INDEX IF NOT EXISTS idx_alerts_tradingview_id ON alerts(tradingview_alert_id);

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
















