-- Add attachment columns to chat_messages table if they don't exist
DO $$ 
BEGIN
  -- Add attachment_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT;
  END IF;

  -- Add attachment_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_name TEXT;
  END IF;

  -- Add attachment_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_type'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_type TEXT;
  END IF;
END $$;

-- Create index for faster queries on attachments
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment_url ON chat_messages(attachment_url) WHERE attachment_url IS NOT NULL;
