-- Update penguin_color column to support longer model filenames
ALTER TABLE public.users 
ALTER COLUMN penguin_color TYPE VARCHAR(30);

-- Add comment to clarify the column purpose
COMMENT ON COLUMN public.users.penguin_color IS 'Stores the penguin model filename (e.g., wAddleRED.glb)';