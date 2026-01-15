-- Add trade_win_lost_mode column to profiles table
-- This column determines if user's trades will be automatically "win" or "lost"

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trade_win_lost_mode VARCHAR(10) NOT NULL DEFAULT 'lost' 
CHECK (trade_win_lost_mode IN ('win', 'lost'));

-- Add comment
COMMENT ON COLUMN profiles.trade_win_lost_mode IS 'Determines automatic trade result: win or lost. Default is lost.';

-- Update existing users to have default value (if any exist without this column)
UPDATE profiles 
SET trade_win_lost_mode = 'lost' 
WHERE trade_win_lost_mode IS NULL;




-- This column determines if user's trades will be automatically "win" or "lost"

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trade_win_lost_mode VARCHAR(10) NOT NULL DEFAULT 'lost' 
CHECK (trade_win_lost_mode IN ('win', 'lost'));

-- Add comment
COMMENT ON COLUMN profiles.trade_win_lost_mode IS 'Determines automatic trade result: win or lost. Default is lost.';

-- Update existing users to have default value (if any exist without this column)
UPDATE profiles 
SET trade_win_lost_mode = 'lost' 
WHERE trade_win_lost_mode IS NULL;
















