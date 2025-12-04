-- Migration to fix user registration with RLS enabled

-- First, update the SELECT policy to allow public read access (needed for login)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Public read access for login" ON public.users
  FOR SELECT USING (true);

-- Create a secure function for user registration that bypasses RLS
CREATE OR REPLACE FUNCTION public.register_user(
  p_penguin_name TEXT,
  p_password_hash TEXT,
  p_penguin_color TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  result json;
BEGIN
  -- Validate input
  IF LENGTH(p_penguin_name) < 4 OR LENGTH(p_penguin_name) > 12 THEN
    RETURN json_build_object('success', false, 'error', 'Penguin name must be 4-12 characters');
  END IF;

  -- Check if penguin name already exists
  IF EXISTS (SELECT 1 FROM users WHERE penguin_name = p_penguin_name) THEN
    RETURN json_build_object('success', false, 'error', 'Penguin name already taken');
  END IF;

  -- Insert the new user
  INSERT INTO users (penguin_name, password_hash, penguin_color)
  VALUES (p_penguin_name, p_password_hash, p_penguin_color)
  RETURNING id INTO new_user_id;

  -- Return success with user data
  SELECT json_build_object(
    'success', true,
    'data', json_build_object(
      'id', id,
      'penguin_name', penguin_name,
      'penguin_color', penguin_color,
      'created_at', created_at
    )
  ) INTO result
  FROM users
  WHERE id = new_user_id;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to anonymous users (for registration)
GRANT EXECUTE ON FUNCTION public.register_user TO anon;

-- Also ensure authenticated users can execute it
GRANT EXECUTE ON FUNCTION public.register_user TO authenticated;