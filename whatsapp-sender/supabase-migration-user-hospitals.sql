-- Migration: Add user_hospitals junction table for hospital-based access control
-- Run this in your Supabase SQL Editor

-- Create junction table for user-hospital relationships
CREATE TABLE IF NOT EXISTS user_hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  hospital_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, hospital_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_hospitals_user_id ON user_hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hospitals_hospital_id ON user_hospitals(hospital_id);

-- Enable RLS
ALTER TABLE user_hospitals ENABLE ROW LEVEL SECURITY;

-- Allow all operations (app-level auth handles permissions)
CREATE POLICY "Allow all operations on user_hospitals" ON user_hospitals
  FOR ALL USING (true) WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE user_hospitals IS 'Junction table linking users to hospitals they can access. Admin users have access to all hospitals regardless of this table.';
COMMENT ON COLUMN user_hospitals.hospital_id IS 'Hospital ID matching HOSPITALS constant in types/index.ts (hecad, crer, hds, hugol)';
