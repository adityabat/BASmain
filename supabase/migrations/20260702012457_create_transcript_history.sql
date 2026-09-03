/*
# Create transcript_history table

1. New Tables
   - `transcript_history`
     - `id` (uuid, primary key)
     - `user_id` (uuid, not null, references auth.users)
     - `video_url` (text, not null)
     - `status` (text, 'success' or 'error')
     - `transcript` (text, nullable)
     - `error_message` (text, nullable)
     - `created_at` (timestamptz)

2. Security
   - RLS enabled, owner-scoped CRUD policies for authenticated users.
*/

CREATE TABLE IF NOT EXISTS transcript_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url     text NOT NULL,
  status        text NOT NULL CHECK (status IN ('success', 'error')),
  transcript    text,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transcript_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transcripts" ON transcript_history;
CREATE POLICY "select_own_transcripts" ON transcript_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transcripts" ON transcript_history;
CREATE POLICY "insert_own_transcripts" ON transcript_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transcripts" ON transcript_history;
CREATE POLICY "update_own_transcripts" ON transcript_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transcripts" ON transcript_history;
CREATE POLICY "delete_own_transcripts" ON transcript_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
