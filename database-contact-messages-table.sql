-- Contact Messages Table
-- This table stores customer service requests from the contact form

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new', -- 'new', 'read', 'replied', 'closed'
  admin_notes TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  attachment_url TEXT, -- URL to uploaded file in Supabase Storage
  attachment_name VARCHAR(255), -- Original filename
  attachment_type VARCHAR(50), -- File type (jpeg, png, pdf, txt)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- RLS Policies
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can insert contact messages (public form)
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all contact messages
CREATE POLICY "Admins can view all contact messages" ON contact_messages
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admins can update contact messages
CREATE POLICY "Admins can update all contact messages" ON contact_messages
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

