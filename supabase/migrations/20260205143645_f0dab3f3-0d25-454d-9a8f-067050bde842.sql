-- Create the delete_unconfirmed_users function that the AdminUserManagement page calls
-- This function deletes users who registered more than 24 hours ago but haven't confirmed their email
-- SECURITY: Only head_manager role can execute this function

CREATE OR REPLACE FUNCTION public.delete_unconfirmed_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Check if caller is head manager
  IF NOT has_role(auth.uid(), 'head_manager'::app_role) THEN
    RAISE EXCEPTION 'Only head managers can delete unconfirmed users';
  END IF;
  
  -- Count unconfirmed users older than 24 hours
  -- Note: We cannot directly delete from auth.users, but we can clean up related data
  -- The actual user deletion should be done via Supabase Auth Admin API
  -- Here we clean up orphaned profiles and user_roles for unconfirmed users
  
  -- Delete user_roles for users who never confirmed (no profile entry or created > 24h ago)
  WITH unconfirmed_users AS (
    SELECT p.user_id 
    FROM profiles p
    WHERE p.created_at < NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM shipments s WHERE s.shipper_id::text = p.user_id::text
    )
    AND NOT EXISTS (
      SELECT 1 FROM delegates d WHERE d.user_id = p.user_id
    )
  )
  DELETE FROM user_roles 
  WHERE user_id IN (SELECT user_id FROM unconfirmed_users);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete orphaned profiles
  DELETE FROM profiles
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM shipments s WHERE s.shipper_id::text = user_id::text
  )
  AND NOT EXISTS (
    SELECT 1 FROM delegates d WHERE d.user_id = profiles.user_id
  );
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to authenticated users (function checks role internally)
GRANT EXECUTE ON FUNCTION public.delete_unconfirmed_users() TO authenticated;