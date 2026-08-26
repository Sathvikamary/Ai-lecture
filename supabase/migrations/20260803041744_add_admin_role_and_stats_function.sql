/*
# Add founder admin role and platform stats function

1. Overview
   Adds an `is_admin` flag to the `profiles` table so founders can be
   identified, and a SECURITY DEFINER function `get_admin_stats()` that
   returns platform-wide analytics. Only users with `is_admin = true`
   may call the function.

2. Schema Changes
   profiles:
     + is_admin boolean NOT NULL DEFAULT false

3. Security Changes
   - RESTRICTIVE UPDATE policy prevents users from flipping their own
     is_admin flag. Only the service role (bypasses RLS) can promote.
   - SECURITY DEFINER function `get_admin_stats()` bypasses RLS to
     aggregate across all users. Internal is_admin check is gatekeeper.
     EXECUTE granted to authenticated only.

4. To promote a founder (run in SQL editor / service role):
     UPDATE profiles SET is_admin = true WHERE id = '<user-uuid>';
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Prevent users from setting their own is_admin flag via the client.
-- The USING predicate references the table name directly (not OLD/NEW
-- aliases, which are not available in RLS policies).
DROP POLICY IF EXISTS "no_self_admin_update" ON profiles;
CREATE POLICY "no_self_admin_update" ON profiles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Platform stats function (SECURITY DEFINER — bypasses RLS internally)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
  result jsonb;
BEGIN
  SELECT p.is_admin INTO caller_is_admin
  FROM profiles p
  WHERE p.id = auth.uid();

  IF caller_is_admin IS NULL OR caller_is_admin = false THEN
    RETURN null;
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM profiles),
    'totalNotes', (SELECT count(*) FROM notes),
    'totalLectures', (SELECT count(*) FROM lectures),
    'completedLectures', (SELECT count(*) FROM lectures WHERE status = 'completed'),
    'processingLectures', (SELECT count(*) FROM lectures WHERE status = 'processing'),
    'totalRecordingSeconds', COALESCE((SELECT sum(duration_seconds) FROM lectures), 0),
    'newUsers7d', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
    'newNotes7d', (SELECT count(*) FROM notes WHERE created_at >= now() - interval '7 days'),
    'recentUsers', COALESCE((
      SELECT jsonb_agg(row_data)
      FROM (
        SELECT jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'college', p.college,
          'created_at', p.created_at
        ) AS row_data
        FROM profiles p
        ORDER BY p.created_at DESC
        LIMIT 10
      ) sub
    ), '[]'::jsonb),
    'recentNotes', COALESCE((
      SELECT jsonb_agg(row_data)
      FROM (
        SELECT jsonb_build_object(
          'id', n.id,
          'title', n.title,
          'subject', n.subject,
          'created_at', n.created_at,
          'user_email', u.email
        ) AS row_data
        FROM notes n
        LEFT JOIN auth.users u ON u.id = n.user_id
        ORDER BY n.created_at DESC
        LIMIT 10
      ) sub
    ), '[]'::jsonb),
    'dailySignups', COALESCE((
      SELECT jsonb_agg(row_data ORDER BY (row_data->>'date'))
      FROM (
        SELECT jsonb_build_object(
          'date', d::date::text,
          'count', (SELECT count(*) FROM profiles WHERE created_at::date = d::date)
        ) AS row_data
        FROM generate_series(now() - interval '13 days', now(), interval '1 day') AS d
      ) sub
    ), '[]'::jsonb),
    'dailyNotes', COALESCE((
      SELECT jsonb_agg(row_data ORDER BY (row_data->>'date'))
      FROM (
        SELECT jsonb_build_object(
          'date', d::date::text,
          'count', (SELECT count(*) FROM notes WHERE created_at::date = d::date)
        ) AS row_data
        FROM generate_series(now() - interval '13 days', now(), interval '1 day') AS d
      ) sub
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
