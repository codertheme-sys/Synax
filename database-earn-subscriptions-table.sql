-- Earn Subscriptions Table
-- This table stores user subscriptions to earn products

CREATE TABLE IF NOT EXISTS earn_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES earn_products(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, cancelled
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE, -- NULL for flexible products
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_user_id ON earn_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_product_id ON earn_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_status ON earn_subscriptions(status);

-- RLS Policies
ALTER TABLE earn_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own earn subscriptions" ON earn_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own earn subscriptions" ON earn_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all earn subscriptions" ON earn_subscriptions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admins can update all subscriptions
CREATE POLICY "Admins can update all earn subscriptions" ON earn_subscriptions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));






-- This table stores user subscriptions to earn products

CREATE TABLE IF NOT EXISTS earn_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES earn_products(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, cancelled
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE, -- NULL for flexible products
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_user_id ON earn_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_product_id ON earn_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_status ON earn_subscriptions(status);

-- RLS Policies
ALTER TABLE earn_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own earn subscriptions" ON earn_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own earn subscriptions" ON earn_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all earn subscriptions" ON earn_subscriptions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admins can update all subscriptions
CREATE POLICY "Admins can update all earn subscriptions" ON earn_subscriptions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));















