-- Layered AI + human handoff. Run in Supabase SQL Editor.

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_is_ai ON chat_messages(is_ai) WHERE is_ai = TRUE;

CREATE TABLE IF NOT EXISTS chat_handoff_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  human_handoff BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE chat_handoff_state ENABLE ROW LEVEL SECURITY;
