-- CryptoGold Trading Platform - Veritabanı Şeması
-- GERÇEK PARA İŞLEMLERİ İÇİN

-- Profiles Tablosu (Kullanıcı profilleri ve bakiyeler)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  kyc_verified BOOLEAN NOT NULL DEFAULT false,
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  kyc_document_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlist Tablosu
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_id, asset_type)
);

-- Portfolio Tablosu (GERÇEK PARA)
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
  average_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  current_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_value DECIMAL(20, 8) NOT NULL DEFAULT 0,
  profit_loss DECIMAL(20, 8) NOT NULL DEFAULT 0,
  profit_loss_percent DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_id, asset_type)
);

-- Trading History Tablosu (GERÇEK PARA İŞLEMLERİ)
CREATE TABLE IF NOT EXISTS trading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  trade_type VARCHAR(10) NOT NULL, -- 'buy' veya 'sell'
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits Tablosu (Para Yatırma - GERÇEK PARA)
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL, -- stripe, bank_transfer, crypto
  payment_provider VARCHAR(50), -- stripe, paypal, etc.
  transaction_id TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  stripe_payment_intent_id TEXT,
  bank_receipt_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals Tablosu (Para Çekme - GERÇEK PARA)
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL, -- bank_transfer, crypto
  bank_account TEXT,
  crypto_address TEXT,
  crypto_network VARCHAR(20), -- TRC20, ERC20, BEP20
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, rejected, cancelled
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price History Tablosu (Cache)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  price_change_24h DECIMAL(10, 4) NOT NULL DEFAULT 0,
  price_change_percent_24h DECIMAL(10, 4) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20, 2),
  volume_24h DECIMAL(20, 2),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(asset_id, asset_type)
);

-- KYC Documents Tablosu
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- id_card, passport, driver_license, proof_of_address
  document_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_user_id ON trading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_created_at ON trading_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_price_history_asset ON price_history(asset_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can insert their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can delete their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can view their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can insert their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can view their own trading history" ON trading_history;
DROP POLICY IF EXISTS "Users can insert their own trading history" ON trading_history;
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can insert their own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Anyone can view price history" ON price_history;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON kyc_documents;
DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON kyc_documents;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Watchlist Policies
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Portfolio Policies
CREATE POLICY "Users can view their own portfolio"
  ON portfolio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio"
  ON portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio"
  ON portfolio FOR UPDATE
  USING (auth.uid() = user_id);

-- Trading History Policies
CREATE POLICY "Users can view their own trading history"
  ON trading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading history"
  ON trading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Deposits Policies
CREATE POLICY "Users can view their own deposits"
  ON deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposits"
  ON deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Withdrawals Policies
CREATE POLICY "Users can view their own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Price History - Public read
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO authenticated, anon
  USING (true);

-- KYC Documents Policies
CREATE POLICY "Users can view their own KYC documents"
  ON kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents"
  ON kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_portfolio_updated_at ON portfolio;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

