-- Binary Trades Tablosu Oluşturma
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Önce mevcut tabloyu kontrol et (çalıştırmak zorunda değilsiniz, sadece kontrol için)
-- SELECT EXISTS (
--    SELECT FROM information_schema.tables 
--    WHERE table_schema = 'public' 
--    AND table_name = 'binary_trades'
-- );

-- Tablo oluştur (IF NOT EXISTS kullanıyoruz, var olan tabloya zarar vermez)
CREATE TABLE IF NOT EXISTS binary_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL,
  asset_id VARCHAR(100) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100) NOT NULL,
  side VARCHAR(10) NOT NULL,
  time_frame INTEGER NOT NULL,
  potential_profit_percentage DECIMAL(5, 2) NOT NULL,
  trade_amount DECIMAL(20, 8) NOT NULL,
  initial_price DECIMAL(20, 8) NOT NULL,
  last_price DECIMAL(20, 8),
  win_lost VARCHAR(10),
  admin_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_approved_by UUID REFERENCES auth.users(id),
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes oluştur
CREATE INDEX IF NOT EXISTS idx_binary_trades_user_id ON binary_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_trades_status ON binary_trades(status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_admin_status ON binary_trades(admin_status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_created_at ON binary_trades(created_at DESC);

-- RLS aktif et
ALTER TABLE binary_trades ENABLE ROW LEVEL SECURITY;

-- Tablo oluşturuldu mu kontrol et
SELECT 'binary_trades table created successfully' AS result;

