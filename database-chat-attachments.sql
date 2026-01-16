-- Add attachment columns to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Create index for faster queries on attachments
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment_url ON chat_messages(attachment_url) WHERE attachment_url IS NOT NULL;
