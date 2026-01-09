-- Fix RLS Policies for KYC Documents and Profiles
-- Run this in Supabase SQL Editor

-- 1. Add INSERT policy for profiles table (if not exists)
-- This allows users to insert their own profile during signup
-- Note: The trigger handle_new_user() already creates profiles with SECURITY DEFINER,
-- but this policy allows manual inserts from the client side if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Ensure KYC documents policies are correct
-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON kyc_documents;
DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON kyc_documents;

CREATE POLICY "Users can view their own KYC documents"
  ON kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents"
  ON kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Verify all policies are enabled
-- Check if RLS is enabled on all tables
DO $$
BEGIN
  -- Enable RLS on profiles if not already enabled
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  -- Enable RLS on kyc_documents if not already enabled
  ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
END $$;

-- 4. Grant necessary permissions for authenticated users
-- This ensures authenticated users can perform operations
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.kyc_documents TO authenticated;









-- Run this in Supabase SQL Editor

-- 1. Add INSERT policy for profiles table (if not exists)
-- This allows users to insert their own profile during signup
-- Note: The trigger handle_new_user() already creates profiles with SECURITY DEFINER,
-- but this policy allows manual inserts from the client side if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Ensure KYC documents policies are correct
-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON kyc_documents;
DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON kyc_documents;

CREATE POLICY "Users can view their own KYC documents"
  ON kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents"
  ON kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Verify all policies are enabled
-- Check if RLS is enabled on all tables
DO $$
BEGIN
  -- Enable RLS on profiles if not already enabled
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  -- Enable RLS on kyc_documents if not already enabled
  ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
END $$;

-- 4. Grant necessary permissions for authenticated users
-- This ensures authenticated users can perform operations
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.kyc_documents TO authenticated;

















