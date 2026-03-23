-- Migration: Add hospital_id and campaign_action_id to templates table
-- Run this in your Supabase SQL Editor to add the new columns

-- Add hospital_id column to templates table
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(50);

-- Add campaign_action_id column to templates table
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS campaign_action_id VARCHAR(32);

-- Add comments for documentation
COMMENT ON COLUMN templates.hospital_id IS 'Hospital identifier (hecad, crer, hds, hugol) - maps to Colmeia social network ID';
COMMENT ON COLUMN templates.campaign_action_id IS 'Colmeia campaign action ID (32 characters)';

-- Create index for hospital_id for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_hospital_id ON templates(hospital_id);
