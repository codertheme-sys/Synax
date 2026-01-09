-- Update earn_subscriptions table to support cancellation and earnings tracking
-- Run this AFTER earn_subscriptions table is created

-- Add new columns for earnings and cancellation tracking
ALTER TABLE earn_subscriptions 
ADD COLUMN IF NOT EXISTS earned_amount DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_type VARCHAR(20), -- 'early', 'completed', 'user_cancelled', NULL
ADD COLUMN IF NOT EXISTS total_earned DECIMAL(20, 8) DEFAULT 0;

-- Add index for cancellation queries
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_cancelled_at ON earn_subscriptions(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_cancellation_type ON earn_subscriptions(cancellation_type);






-- Run this AFTER earn_subscriptions table is created

-- Add new columns for earnings and cancellation tracking
ALTER TABLE earn_subscriptions 
ADD COLUMN IF NOT EXISTS earned_amount DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_type VARCHAR(20), -- 'early', 'completed', 'user_cancelled', NULL
ADD COLUMN IF NOT EXISTS total_earned DECIMAL(20, 8) DEFAULT 0;

-- Add index for cancellation queries
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_cancelled_at ON earn_subscriptions(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_earn_subscriptions_cancellation_type ON earn_subscriptions(cancellation_type);
















