-- Update penguin_name column to enforce 9 character limit
ALTER TABLE public.users 
ALTER COLUMN penguin_name TYPE VARCHAR(9);

-- Add a check constraint to ensure the name is between 4 and 9 characters
ALTER TABLE public.users 
ADD CONSTRAINT penguin_name_length_check 
CHECK (char_length(penguin_name) >= 4 AND char_length(penguin_name) <= 9);