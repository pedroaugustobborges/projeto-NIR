-- Migration: Add phone_list column to sending_history table for bulk sends
-- Run this in your Supabase SQL Editor

-- Add phone_list column to store phone numbers used in bulk sends (as JSON array)
ALTER TABLE sending_history
ADD COLUMN IF NOT EXISTS phone_list TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sending_history.phone_list IS 'JSON array of phone numbers used in bulk sends';
