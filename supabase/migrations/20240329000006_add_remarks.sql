-- Add remarks column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS remark TEXT;

-- Update RLS if needed (already covered by existing update policy)
