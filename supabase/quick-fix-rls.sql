-- QUICK FIX: Run this in Supabase SQL Editor to fix the RLS issue
-- This is a temporary solution until proper migration is applied

-- Option 1: Add a policy that allows anyone to register (less secure but works)
CREATE POLICY IF NOT EXISTS "Allow public user registration" ON public.users
  FOR INSERT WITH CHECK (true);

-- Option 2: Update SELECT policy to allow public read (needed for login)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Public read access for login" ON public.users
  FOR SELECT USING (true);

-- Option 3: If you want to completely disable RLS temporarily (NOT recommended for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;