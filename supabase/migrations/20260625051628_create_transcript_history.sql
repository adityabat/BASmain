CREATE TABLE IF NOT EXISTS transcript_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  transcript text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transcript_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_transcripts" ON transcript_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_transcripts" ON transcript_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_transcripts" ON transcript_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_transcripts" ON transcript_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
