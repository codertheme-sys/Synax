-- Fix: Kullanıcıların kendi mesajlarını okuyabilmesi için RLS politikasını düzelt
-- Sorun: Kullanıcı chat'i kapatıp açınca kendi mesajları kayboluyordu (admin mesajları kalıyordu)
-- Sebep: "Users can read their own messages" politikası auth.uid() = user_id koşulunu içermeli

-- Mevcut politikayı kaldır (varsa)
DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;

-- Doğru politikayı yeniden oluştur
-- Kullanıcılar: Kendi mesajlarını (user_id = auth.uid()) VE kendilerine gelen admin mesajlarını (is_admin = true, user_id = auth.uid()) okuyabilir
CREATE POLICY "Users can read their own messages"
  ON chat_messages FOR SELECT
  USING (
    auth.uid() = user_id  -- Kendi mesajları (is_admin=false) veya kendisine ait konuşmadaki admin mesajları (is_admin=true, user_id=conversation user)
  );
