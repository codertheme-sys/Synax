-- Binary Trades Table - Sadece Policy'ler (Policy'ler yoksa çalıştırın)
-- Eğer policy'ler zaten varsa, bu dosyayı çalıştırmayın

-- RLS Policies
DO $$
BEGIN
  -- Users can view their own trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Users can view their own binary trades'
  ) THEN
    CREATE POLICY "Users can view their own binary trades" ON binary_trades
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Users can insert their own binary trades'
  ) THEN
    CREATE POLICY "Users can insert their own binary trades" ON binary_trades
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Users can update their own binary trades'
  ) THEN
    CREATE POLICY "Users can update their own binary trades" ON binary_trades
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Admins can view all trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Admins can view all binary trades'
  ) THEN
    CREATE POLICY "Admins can view all binary trades" ON binary_trades
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;

  -- Admins can update all trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Admins can update all binary trades'
  ) THEN
    CREATE POLICY "Admins can update all binary trades" ON binary_trades
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;







-- Eğer policy'ler zaten varsa, bu dosyayı çalıştırmayın

-- RLS Policies
DO $$
BEGIN
  -- Users can view their own trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Users can view their own binary trades'
  ) THEN
    CREATE POLICY "Users can view their own binary trades" ON binary_trades
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Users can insert their own binary trades'
  ) THEN
    CREATE POLICY "Users can insert their own binary trades" ON binary_trades
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Users can update their own binary trades'
  ) THEN
    CREATE POLICY "Users can update their own binary trades" ON binary_trades
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Admins can view all trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Admins can view all binary trades'
  ) THEN
    CREATE POLICY "Admins can view all binary trades" ON binary_trades
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;

  -- Admins can update all trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'binary_trades' 
    AND policyname = 'Admins can update all binary trades'
  ) THEN
    CREATE POLICY "Admins can update all binary trades" ON binary_trades
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;
















