-- Fix RLS policies for users table to allow registration

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow public registration" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (register)
CREATE POLICY "Allow public registration" ON public.users
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to view all penguins (for game)
CREATE POLICY "Allow public read" ON public.users
  FOR SELECT 
  USING (true);

-- Allow users to update their own data (future feature)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (true); -- For now allow all updates, refine later

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'users';