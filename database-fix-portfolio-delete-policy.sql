-- Fix Portfolio DELETE Policy and Convert History RLS
-- Run this in Supabase SQL Editor

-- 1. Add DELETE policy for portfolio table
DROP POLICY IF EXISTS "Users can delete their own portfolio" ON portfolio;

CREATE POLICY "Users can delete their own portfolio"
  ON portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Fix convert_history RLS to allow service role inserts
-- Service role key bypasses RLS, but we should ensure the policy is correct
DROP POLICY IF EXISTS "Users can view their own convert history" ON convert_history;
DROP POLICY IF EXISTS "Users can insert their own convert history" ON convert_history;

-- Recreate policies
CREATE POLICY "Users can view their own convert history"
  ON convert_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own convert history"
  ON convert_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Service role key (SUPABASE_SERVICE_ROLE_KEY) automatically bypasses RLS,
-- so API endpoints using createServerClient() will work regardless of these policies.
-- However, these policies ensure that direct client-side access is properly secured.
