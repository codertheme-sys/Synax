-- Create storage bucket for contact attachments
-- Run this in Supabase SQL Editor

-- Create bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-attachments', 'contact-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contact-attachments bucket
-- Allow public uploads (for contact form)
CREATE POLICY "Public can upload contact attachments"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'contact-attachments');

-- Allow public read access
CREATE POLICY "Public can read contact attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contact-attachments');

-- Admins can delete attachments
CREATE POLICY "Admins can delete contact attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contact-attachments' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);






-- Run this in Supabase SQL Editor

-- Create bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-attachments', 'contact-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contact-attachments bucket
-- Allow public uploads (for contact form)
CREATE POLICY "Public can upload contact attachments"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'contact-attachments');

-- Allow public read access
CREATE POLICY "Public can read contact attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contact-attachments');

-- Admins can delete attachments
CREATE POLICY "Admins can delete contact attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contact-attachments' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);














