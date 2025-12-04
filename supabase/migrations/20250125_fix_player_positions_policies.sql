-- Ensure player_positions table has proper RLS policies for multiplayer

-- First, check if RLS is enabled (if not, enable it)
ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own positions" ON public.player_positions;
DROP POLICY IF EXISTS "Users can read positions" ON public.player_positions;

-- Create new policies that allow multiplayer functionality

-- Allow all authenticated users to insert positions
CREATE POLICY "Anyone can insert positions" ON public.player_positions
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Allow all users to read ALL player positions (required for multiplayer)
CREATE POLICY "Anyone can read all positions" ON public.player_positions
  FOR SELECT TO authenticated, anon
  USING (true);

-- Service role gets full access
CREATE POLICY "Service role full access to positions" ON public.player_positions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.player_positions TO anon;
GRANT ALL ON public.player_positions TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Anyone can read all positions" ON public.player_positions IS 'Essential for multiplayer - all players must see all other player positions';