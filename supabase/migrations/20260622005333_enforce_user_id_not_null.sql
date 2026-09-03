
-- Remove orphaned rows that have no owner (uploaded before user isolation was added)
DELETE FROM upload_history WHERE user_id IS NULL;

-- Enforce user_id is always required going forward
ALTER TABLE upload_history ALTER COLUMN user_id SET NOT NULL;

-- Remove the DEFAULT auth.uid() fallback — user_id must now be explicitly supplied by the app
ALTER TABLE upload_history ALTER COLUMN user_id DROP DEFAULT;
