-- Fix Supabase Storage Bucket Policies
-- Run this in Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error for Storage

-- 1. Create storage bucket policies for kyc-documents
-- Allow authenticated users to upload their own KYC documents

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;

-- Policy: Allow authenticated users to upload files to kyc-documents bucket
-- Files must be in the kyc/ folder and match the user's ID
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = 'kyc' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to view their own KYC documents
CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = 'kyc' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to delete their own KYC documents
CREATE POLICY "Users can delete their own KYC documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = 'kyc' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- 2. Create storage bucket policies for deposit-receipts (if used)
-- Allow authenticated users to upload their own deposit receipts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own deposit receipts" ON storage.objects;

-- Policy: Allow authenticated users to upload deposit receipts
CREATE POLICY "Users can upload their own deposit receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deposit-receipts' AND
    (storage.foldername(name))[1] = 'deposits' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to view their own deposit receipts
CREATE POLICY "Users can view their own deposit receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposit-receipts' AND
    (storage.foldername(name))[1] = 'deposits' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to delete their own deposit receipts
CREATE POLICY "Users can delete their own deposit receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deposit-receipts' AND
    (storage.foldername(name))[1] = 'deposits' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- 3. Alternative: Simpler policy that allows all authenticated users to upload to kyc-documents
-- (Less secure but easier to debug - use this if the above doesn't work)
-- Uncomment the following if the above policies don't work:

/*
-- Allow all authenticated users to upload to kyc-documents bucket
CREATE POLICY "Authenticated users can upload to kyc-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents');

-- Allow all authenticated users to view files in kyc-documents bucket
CREATE POLICY "Authenticated users can view kyc-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'kyc-documents');

-- Allow all authenticated users to delete files in kyc-documents bucket
CREATE POLICY "Authenticated users can delete kyc-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'kyc-documents');
*/

-- 4. Verify storage buckets exist and are public/private as needed
-- Note: You may need to configure bucket settings in Supabase Dashboard > Storage
-- Make sure the bucket is set to "Private" if you want RLS policies to apply









-- Run this in Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error for Storage

-- 1. Create storage bucket policies for kyc-documents
-- Allow authenticated users to upload their own KYC documents

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;

-- Policy: Allow authenticated users to upload files to kyc-documents bucket
-- Files must be in the kyc/ folder and match the user's ID
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = 'kyc' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to view their own KYC documents
CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = 'kyc' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to delete their own KYC documents
CREATE POLICY "Users can delete their own KYC documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = 'kyc' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- 2. Create storage bucket policies for deposit-receipts (if used)
-- Allow authenticated users to upload their own deposit receipts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own deposit receipts" ON storage.objects;

-- Policy: Allow authenticated users to upload deposit receipts
CREATE POLICY "Users can upload their own deposit receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deposit-receipts' AND
    (storage.foldername(name))[1] = 'deposits' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to view their own deposit receipts
CREATE POLICY "Users can view their own deposit receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposit-receipts' AND
    (storage.foldername(name))[1] = 'deposits' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- Policy: Allow authenticated users to delete their own deposit receipts
CREATE POLICY "Users can delete their own deposit receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deposit-receipts' AND
    (storage.foldername(name))[1] = 'deposits' AND
    (storage.foldername(name))[2] LIKE (auth.uid()::text || '%')
  );

-- 3. Alternative: Simpler policy that allows all authenticated users to upload to kyc-documents
-- (Less secure but easier to debug - use this if the above doesn't work)
-- Uncomment the following if the above policies don't work:

/*
-- Allow all authenticated users to upload to kyc-documents bucket
CREATE POLICY "Authenticated users can upload to kyc-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents');

-- Allow all authenticated users to view files in kyc-documents bucket
CREATE POLICY "Authenticated users can view kyc-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'kyc-documents');

-- Allow all authenticated users to delete files in kyc-documents bucket
CREATE POLICY "Authenticated users can delete kyc-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'kyc-documents');
*/

-- 4. Verify storage buckets exist and are public/private as needed
-- Note: You may need to configure bucket settings in Supabase Dashboard > Storage
-- Make sure the bucket is set to "Private" if you want RLS policies to apply

















