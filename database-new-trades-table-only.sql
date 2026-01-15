-- New Binary Options Trades Table (Tablo ve Index'ler - Policy'ler olmadan)
-- Bu dosyayı sadece tablo yoksa çalıştırın

-- Tablo oluşturma
CREATE TABLE IF NOT EXISTS binary_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'buy' (LONG) veya 'sell' (SHORT)
  time_frame INTEGER NOT NULL, -- 60, 80, 90, 100, 120 seconds
  potential_profit_percentage DECIMAL(5, 2) NOT NULL, -- 10, 20, 30, 40, 50
  trade_amount DECIMAL(20, 8) NOT NULL, -- USD amount
  initial_price DECIMAL(20, 8) NOT NULL, -- Price at trade start
  last_price DECIMAL(20, 8), -- Price at trade end (set by admin)
  win_lost VARCHAR(10), -- 'win' or 'lost' (set by admin)
  admin_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_approved_by UUID REFERENCES auth.users(id),
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  expires_at TIMESTAMP WITH TIME ZONE, -- initial_price + time_frame
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_binary_trades_user_id ON binary_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_trades_status ON binary_trades(status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_admin_status ON binary_trades(admin_status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_created_at ON binary_trades(created_at DESC);

-- RLS Policies (Eğer policy'ler zaten varsa, bu kısım hata verebilir - o zaman policy kısmını atlayın)
ALTER TABLE binary_trades ENABLE ROW LEVEL SECURITY;







-- Bu dosyayı sadece tablo yoksa çalıştırın

-- Tablo oluşturma
CREATE TABLE IF NOT EXISTS binary_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'buy' (LONG) veya 'sell' (SHORT)
  time_frame INTEGER NOT NULL, -- 60, 80, 90, 100, 120 seconds
  potential_profit_percentage DECIMAL(5, 2) NOT NULL, -- 10, 20, 30, 40, 50
  trade_amount DECIMAL(20, 8) NOT NULL, -- USD amount
  initial_price DECIMAL(20, 8) NOT NULL, -- Price at trade start
  last_price DECIMAL(20, 8), -- Price at trade end (set by admin)
  win_lost VARCHAR(10), -- 'win' or 'lost' (set by admin)
  admin_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_approved_by UUID REFERENCES auth.users(id),
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  expires_at TIMESTAMP WITH TIME ZONE, -- initial_price + time_frame
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_binary_trades_user_id ON binary_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_trades_status ON binary_trades(status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_admin_status ON binary_trades(admin_status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_created_at ON binary_trades(created_at DESC);

-- RLS Policies (Eğer policy'ler zaten varsa, bu kısım hata verebilir - o zaman policy kısmını atlayın)
ALTER TABLE binary_trades ENABLE ROW LEVEL SECURITY;



















