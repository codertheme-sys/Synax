-- Price History Table - INSERT/UPDATE Policies
-- Service role key kullanıldığında RLS bypass edilir, ama yine de policy ekleyelim

-- Price History - Herkes okuyabilir (zaten var, tekrar oluşturmuyoruz)
-- CREATE POLICY "Anyone can view price history" ON price_history FOR SELECT TO authenticated, anon USING (true);

-- Price History - Service role veya authenticated users insert/update yapabilir
-- Service role key kullanıldığında bu policy'ye gerek yok, ama güvenlik için ekliyoruz
-- NOT: Service role key kullanıldığında (supabaseAdmin) RLS bypass edilir

-- INSERT Policy - Service role ve system users için
CREATE POLICY IF NOT EXISTS "Service role can insert price history"
  ON price_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE Policy - Service role ve system users için  
CREATE POLICY IF NOT EXISTS "Service role can update price history"
  ON price_history FOR UPDATE
  TO service_role
  USING (true);

-- INSERT Policy - Authenticated users (opsiyonel, gerekirse)
-- CREATE POLICY IF NOT EXISTS "Authenticated users can insert price history"
--   ON price_history FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- UPDATE Policy - Authenticated users (opsiyonel, gerekirse)
-- CREATE POLICY IF NOT EXISTS "Authenticated users can update price history"
--   ON price_history FOR UPDATE
--   TO authenticated
--   USING (true);
