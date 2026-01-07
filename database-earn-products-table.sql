-- Earn Products Table
-- This table stores available earn products (staking, savings, etc.)

CREATE TABLE IF NOT EXISTS earn_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol VARCHAR(20) NOT NULL, -- BTC, ETH, SOL, etc.
  asset_name VARCHAR(100) NOT NULL, -- Bitcoin, Ethereum, Solana, etc.
  product_type VARCHAR(20) NOT NULL, -- 'flexible' or 'locked'
  apr DECIMAL(5, 2) NOT NULL, -- Annual Percentage Rate (e.g., 6.80 for 6.80%)
  min_deposit DECIMAL(20, 8) NOT NULL DEFAULT 500, -- Minimum deposit in USD
  duration_days INT, -- NULL for flexible products, number of days for locked products
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_earn_products_is_active ON earn_products(is_active);
CREATE INDEX IF NOT EXISTS idx_earn_products_product_type ON earn_products(product_type);

-- RLS Policies
ALTER TABLE earn_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Everyone can view active earn products" ON earn_products
  FOR SELECT
  USING (is_active = true);

-- Admins can view all products
CREATE POLICY "Admins can view all earn products" ON earn_products
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admins can insert products
CREATE POLICY "Admins can insert earn products" ON earn_products
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admins can update products
CREATE POLICY "Admins can update earn products" ON earn_products
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Insert some default products
INSERT INTO earn_products (asset_symbol, asset_name, product_type, apr, min_deposit, duration_days, is_active)
VALUES
  ('BTC', 'Bitcoin', 'flexible', 3.50, 500, NULL, true),
  ('BTC', 'Bitcoin', 'locked', 5.20, 500, 60, true),
  ('ETH', 'Ethereum', 'flexible', 4.20, 500, NULL, true),
  ('ETH', 'Ethereum', 'locked', 6.80, 500, 60, true),
  ('SOL', 'Solana', 'flexible', 5.50, 500, NULL, true),
  ('SOL', 'Solana', 'locked', 8.50, 500, 60, true)
ON CONFLICT DO NOTHING;





