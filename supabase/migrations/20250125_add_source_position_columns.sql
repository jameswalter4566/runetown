-- Add source position columns to track where player was when they clicked
ALTER TABLE player_positions 
ADD COLUMN IF NOT EXISTS source_x FLOAT,
ADD COLUMN IF NOT EXISTS source_y FLOAT;

-- Set default values for existing rows (spawn position)
UPDATE player_positions 
SET source_x = -80, source_y = 0 
WHERE source_x IS NULL;