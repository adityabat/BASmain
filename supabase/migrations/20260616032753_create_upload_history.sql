CREATE TABLE IF NOT EXISTS upload_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  webhook_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_upload_history" ON upload_history
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_insert_upload_history" ON upload_history
  FOR INSERT TO anon WITH CHECK (true);
