import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jhtgbonvqxeiplqiumtk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodGdib252cXhlaXBscWl1bXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjkzMjIsImV4cCI6MjA4OTUwNTMyMn0.VgLHSFoeU-vuqB_c2ET9F-2pVTuZRiHvAzftcXQ68XQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name for template images
export const STORAGE_BUCKET = 'template-images';
