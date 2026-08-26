/*
# Lecture Notes Taker - core schema

1. Overview
   Multi-user app with Supabase email/password auth. Each user sees only
   their own notes, lectures, and profile. Owner columns default to
   auth.uid() so inserts that omit user_id still satisfy RLS.

2. New Tables
   - profiles: extends auth.users with display info (name, college, dept, avatar).
   - notes: saved/generated notes with structured content, tags, favorite, style.
   - lectures: lecture history (recordings or uploads) with transcript + status.

3. Columns
   profiles:
     id (uuid PK -> auth.users, ON DELETE CASCADE)
     full_name text
     college text
     department text
     avatar_url text
     created_at timestamptz default now()

   notes:
     id uuid PK default gen_random_uuid()
     user_id uuid NOT NULL DEFAULT auth.uid() -> auth.users ON DELETE CASCADE
     title text NOT NULL
     subject text
     tags text[] default '{}'
     content jsonb default '{}'  (structured AI output + editor body)
     raw_text text               (source transcript/uploaded text)
     style text default 'detailed'
     favorite boolean default false
     created_at timestamptz default now()
     updated_at timestamptz default now()

   lectures:
     id uuid PK default gen_random_uuid()
     user_id uuid NOT NULL DEFAULT auth.uid() -> auth.users ON DELETE CASCADE
     file_name text
     subject text
     duration_seconds integer default 0
     source_type text default 'recording'  -- 'recording' | 'upload'
     status text default 'completed'        -- 'processing' | 'completed' | 'failed'
     transcript text
     note_id uuid -> notes(id) ON DELETE SET NULL
     recorded_at timestamptz default now()
     created_at timestamptz default now()

4. Indexes
   - notes(user_id, created_at desc) - dashboard + saved notes listing
   - notes(user_id, favorite) - favorites filter
   - lectures(user_id, recorded_at desc) - history timeline
   - notes tags GIN index - tag search

5. Security (RLS)
   Enable RLS on all three tables. Owner-scoped CRUD for authenticated
   users via auth.uid() = user_id. profiles keyed on id = auth.uid().
   No anon access (app requires sign-in).
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  college text,
  department text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- notes
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  tags text[] DEFAULT '{}',
  content jsonb DEFAULT '{}',
  raw_text text,
  style text DEFAULT 'detailed',
  favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notes_user_created_idx ON notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_user_fav_idx ON notes(user_id, favorite);
CREATE INDEX IF NOT EXISTS notes_tags_gin_idx ON notes USING GIN(tags);

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- lectures
CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text,
  subject text,
  duration_seconds integer DEFAULT 0,
  source_type text DEFAULT 'recording',
  status text DEFAULT 'completed',
  transcript text,
  note_id uuid REFERENCES notes(id) ON DELETE SET NULL,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS lectures_user_recorded_idx ON lectures(user_id, recorded_at DESC);

DROP POLICY IF EXISTS "select_own_lectures" ON lectures;
CREATE POLICY "select_own_lectures" ON lectures FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_lectures" ON lectures;
CREATE POLICY "insert_own_lectures" ON lectures FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_lectures" ON lectures;
CREATE POLICY "update_own_lectures" ON lectures FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_lectures" ON lectures;
CREATE POLICY "delete_own_lectures" ON lectures FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger for notes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notes_updated_at ON notes;
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();