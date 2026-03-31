-- Add Meta App Credentials to Workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS meta_app_id TEXT,
ADD COLUMN IF NOT EXISTS meta_app_secret TEXT;

-- Add tracking columns to facebook_pages
ALTER TABLE public.facebook_pages
ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;

-- Ensure RLS is still valid for new columns
-- (Existing policies on workspaces and facebook_pages cover these columns)
