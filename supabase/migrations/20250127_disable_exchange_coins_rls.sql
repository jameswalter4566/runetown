-- Disable RLS on exchange_coins table to allow all operations
ALTER TABLE exchange_coins DISABLE ROW LEVEL SECURITY;

-- Drop existing policies since we're disabling RLS
DROP POLICY IF EXISTS "Anyone can read exchange coins" ON exchange_coins;
DROP POLICY IF EXISTS "Authenticated users can insert coins" ON exchange_coins;
DROP POLICY IF EXISTS "Anyone can update likes" ON exchange_coins;