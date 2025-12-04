-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Token launches are viewable by all authenticated users" ON public.token_launches;

-- Create new policy that allows public read access
CREATE POLICY "Token launches are viewable by everyone" ON public.token_launches
  FOR SELECT
  USING (true);

-- Also grant permissions to anon role
GRANT SELECT ON public.token_launches TO anon;