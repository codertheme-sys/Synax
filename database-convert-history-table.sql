-- Convert History Table
-- Stores all coin to USDT conversion operations

CREATE TABLE IF NOT EXISTS convert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_type VARCHAR(20) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  usd_value DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_convert_history_user_id ON convert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_convert_history_created_at ON convert_history(created_at DESC);

-- Enable RLS
ALTER TABLE convert_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own convert history
CREATE POLICY "Users can view own convert history"
  ON convert_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own convert history (via API)
CREATE POLICY "Users can insert own convert history"
  ON convert_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

