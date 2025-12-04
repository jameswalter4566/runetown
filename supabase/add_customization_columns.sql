-- Add customization columns to the users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS shirt_color TEXT,
ADD COLUMN IF NOT EXISTS pants_color TEXT,
ADD COLUMN IF NOT EXISTS skin_color TEXT;

-- Add constraints to ensure valid color values
ALTER TABLE public.users
ADD CONSTRAINT valid_shirt_color CHECK (shirt_color IN ('red', 'green', 'yellow', 'purple', 'blue')),
ADD CONSTRAINT valid_pants_color CHECK (pants_color IN ('red', 'green', 'yellow', 'purple', 'blue')),
ADD CONSTRAINT valid_skin_color CHECK (skin_color IN ('white', 'black'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_customization 
ON public.users(shirt_color, pants_color, skin_color);

-- Update existing users with default values if needed
UPDATE public.users
SET 
  shirt_color = 'blue',
  pants_color = 'blue', 
  skin_color = 'white'
WHERE shirt_color IS NULL OR pants_color IS NULL OR skin_color IS NULL;