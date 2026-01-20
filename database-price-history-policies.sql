-- Price History Table - INSERT/UPDATE Policies
-- Service role key kullanıldığında RLS bypass edilir, ama yine de policy ekleyelim

-- Önce mevcut policy'leri drop et (varsa)
DROP POLICY IF EXISTS "Service role can insert price history" ON price_history;
DROP POLICY IF EXISTS "Service role can update price history" ON price_history;
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON price_history;
DROP POLICY IF EXISTS "Authenticated users can update price history" ON price_history;

-- Price History - Herkes okuyabilir (zaten var, tekrar oluşturmuyoruz)
-- CREATE POLICY "Anyone can view price history" ON price_history FOR SELECT TO authenticated, anon USING (true);

-- Price History - Service role veya authenticated users insert/update yapabilir
-- Service role key kullanıldığında bu policy'ye gerek yok, ama güvenlik için ekliyoruz
-- NOT: Service role key kullanıldığında (supabaseAdmin) RLS bypass edilir

-- INSERT Policy - Service role için
CREATE POLICY "Service role can insert price history"
  ON price_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE Policy - Service role için  
CREATE POLICY "Service role can update price history"
  ON price_history FOR UPDATE
  TO service_role
  USING (true);
