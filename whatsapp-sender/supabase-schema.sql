-- WhatsApp Sender - Supabase Database Schema
-- Execute this in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parameter_1 VARCHAR(100),
  parameter_2 VARCHAR(100),
  parameter_3 VARCHAR(100),
  parameter_4 VARCHAR(100),
  parameter_5 VARCHAR(100),
  parameter_6 VARCHAR(100),
  parameter_7 VARCHAR(100),
  parameter_8 VARCHAR(100),
  parameter_9 VARCHAR(100),
  parameter_10 VARCHAR(100),
  parameter_11 VARCHAR(100),
  parameter_12 VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sending history table
CREATE TABLE IF NOT EXISTS sending_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  phone VARCHAR(20),
  sending_type VARCHAR(20) NOT NULL CHECK (sending_type IN ('individual', 'bulk')),
  status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  total_sent INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sending_history_created_at ON sending_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sending_history_template_id ON sending_history(template_id);
CREATE INDEX IF NOT EXISTS idx_sending_history_sending_type ON sending_history(sending_type);
CREATE INDEX IF NOT EXISTS idx_sending_history_status ON sending_history(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on templates
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sending_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your use case)
-- These allow all operations for authenticated and anonymous users
CREATE POLICY "Allow all operations on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sending_history" ON sending_history
  FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for template images
-- Note: Run this in the Supabase Dashboard > Storage section or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('template-images', 'template-images', true);
