-- Migration: Add warning status and warning_message column to sending_history table
-- Execute this in your Supabase SQL Editor

-- Update the status check constraint to include 'warning'
ALTER TABLE sending_history DROP CONSTRAINT IF EXISTS sending_history_status_check;
ALTER TABLE sending_history ADD CONSTRAINT sending_history_status_check
  CHECK (status IN ('success', 'failed', 'pending', 'warning'));

-- Add warning_message column
ALTER TABLE sending_history
  ADD COLUMN IF NOT EXISTS warning_message TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sending_history'
ORDER BY ordinal_position;
