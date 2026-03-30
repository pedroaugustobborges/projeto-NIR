-- Migration: Add parameters 7-12 to templates table
-- Execute this in your Supabase SQL Editor to add support for up to 12 parameters

-- Add new parameter columns to templates table
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS parameter_7 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parameter_8 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parameter_9 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parameter_10 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parameter_11 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parameter_12 VARCHAR(100);

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'templates'
  AND column_name LIKE 'parameter_%'
ORDER BY column_name;
