-- Add real_name column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS real_name TEXT;
