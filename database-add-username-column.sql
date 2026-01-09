-- Add username column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Add last_marketing_email_sent column for tracking weekly emails
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_marketing_email_sent TIMESTAMP WITH TIME ZONE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update existing profiles to use full_name as username if username is null
UPDATE profiles
SET username = full_name
WHERE username IS NULL AND full_name IS NOT NULL;
