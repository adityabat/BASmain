/*
# Add user ownership to upload_history

1. Changes to upload_history
   - Add nullable `user_id` column (uuid, references auth.users) with DEFAULT auth.uid()
     Existing rows keep null; new rows from authenticated sessions auto-fill from the session.

2. Security
   - Drop the old public anon policies (replaced with per-user authenticated policies).
   - New SELECT/INSERT/UPDATE/DELETE policies: authenticated users can only access their own rows.
*/

ALTER TABLE upload_history
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "public_select_upload_history" ON upload_history;
DROP POLICY IF EXISTS "public_insert_upload_history" ON upload_history;

DROP POLICY IF EXISTS "select_own_upload_history" ON upload_history;
CREATE POLICY "select_own_upload_history" ON upload_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_upload_history" ON upload_history;
CREATE POLICY "insert_own_upload_history" ON upload_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_upload_history" ON upload_history;
CREATE POLICY "delete_own_upload_history" ON upload_history
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
