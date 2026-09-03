/*
# Create user_plans table

1. Purpose
   Tracks the subscription plan for each authenticated user. Controls feature limits.

2. New Tables
   - `user_plans`
     - `user_id` (uuid, primary key, references auth.users) — one row per user
     - `plan` (text, not null, default 'free') — 'free' or 'pro'
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

3. Business Rules
   - Free plan: max 3 document uploads, max 3 transcript extractions
   - Pro plan: unlimited
   - A row is auto-created on first sign-in defaulting to 'free'

4. Security
   - RLS enabled. Authenticated users can only read/insert/update their own row.
*/

CREATE TABLE IF NOT EXISTS user_plans (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan       text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plan" ON user_plans;
CREATE POLICY "select_own_plan" ON user_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plan" ON user_plans;
CREATE POLICY "insert_own_plan" ON user_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plan" ON user_plans;
CREATE POLICY "update_own_plan" ON user_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
