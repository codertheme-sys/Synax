-- Admin Chat Fix: Admin kullanıcısının chat mesajlarını görebilmesi için
-- Supabase SQL Editor'da çalıştırın

-- 1. Mevcut admin kullanıcıları kontrol et
SELECT id, email, full_name, is_admin 
FROM profiles 
WHERE is_admin = true;

-- 2. Tüm kullanıcıları listele (admin yapmak istediğinizi bulun)
SELECT id, email, full_name, is_admin 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Belirli bir email ile admin yap (EMAIL'i kendi admin email'inizle değiştirin)
UPDATE profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@synax.vip')
RETURNING id, email, is_admin;

-- 4. Profil yoksa: auth.users'dan profil oluştur ve admin yap
-- (Sadece profiles'da kaydı olmayan kullanıcılar için)
INSERT INTO profiles (id, full_name, email, is_admin)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email, true
FROM auth.users 
WHERE email = 'admin@synax.vip'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id)
ON CONFLICT (id) DO UPDATE SET is_admin = true;
