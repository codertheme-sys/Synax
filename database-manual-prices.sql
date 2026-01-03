-- Synax Platform - Manuel Fiyat Müdahalesi Sistemi
-- Bu dosya mevcut şemaya eklenecek

-- Price Override Tablosu (Admin manuel fiyat ayarları)
CREATE TABLE IF NOT EXISTS price_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  manual_price DECIMAL(20, 8) NOT NULL,
  manual_price_change_24h DECIMAL(10, 4) DEFAULT 0,
  manual_price_change_percent_24h DECIMAL(10, 4) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source VARCHAR(50) DEFAULT 'manual', -- manual, webhook, stripe
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(asset_id, asset_type)
);

-- Price Override History (Değişiklik geçmişi)
CREATE TABLE IF NOT EXISTS price_override_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id UUID REFERENCES price_overrides(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  old_price DECIMAL(20, 8),
  new_price DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50) NOT NULL, -- manual, webhook, stripe, auto
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_overrides_asset ON price_overrides(asset_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_price_overrides_active ON price_overrides(is_active);
CREATE INDEX IF NOT EXISTS idx_price_override_history_override_id ON price_override_history(override_id);
CREATE INDEX IF NOT EXISTS idx_price_override_history_created_at ON price_override_history(created_at DESC);

-- RLS Policies
ALTER TABLE price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_override_history ENABLE ROW LEVEL SECURITY;

-- Price Overrides - Herkes okuyabilir (fiyatlar public)
CREATE POLICY "Anyone can view price overrides"
  ON price_overrides FOR SELECT
  TO authenticated, anon
  USING (true);

-- Price Overrides - Sadece admin ekleyebilir/güncelleyebilir
CREATE POLICY "Admins can manage price overrides"
  ON price_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Price Override History - Herkes okuyabilir
CREATE POLICY "Anyone can view price override history"
  ON price_override_history FOR SELECT
  TO authenticated, anon
  USING (true);

-- Price Override History - Sadece admin ekleyebilir
CREATE POLICY "Admins can insert price override history"
  ON price_override_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Function to update price override updated_at
CREATE OR REPLACE FUNCTION update_price_override_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for price override updated_at
CREATE TRIGGER update_price_override_updated_at
  BEFORE UPDATE ON price_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_price_override_updated_at();

-- Function to log price override changes
CREATE OR REPLACE FUNCTION log_price_override_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.manual_price != NEW.manual_price THEN
    INSERT INTO price_override_history (
      override_id,
      asset_type,
      asset_id,
      old_price,
      new_price,
      source,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.asset_type,
      NEW.asset_id,
      OLD.manual_price,
      NEW.manual_price,
      NEW.source,
      NEW.created_by,
      NEW.notes
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO price_override_history (
      override_id,
      asset_type,
      asset_id,
      old_price,
      new_price,
      source,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.asset_type,
      NEW.asset_id,
      NULL,
      NEW.manual_price,
      NEW.source,
      NEW.created_by,
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log price override changes
CREATE TRIGGER log_price_override_change
  AFTER INSERT OR UPDATE ON price_overrides
  FOR EACH ROW
  EXECUTE FUNCTION log_price_override_change();

