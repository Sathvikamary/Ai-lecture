/*
# Fix set_updated_at search_path

1. Changes
   - Recreate the set_updated_at trigger function with an explicit
     search_path to resolve the function_search_path_mutable advisor.
   - No data changes; purely a security hardening fix.
*/

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;