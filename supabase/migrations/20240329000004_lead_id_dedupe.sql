-- [20240329000004] Lead De-duplication Migration
-- Adds facebook_lead_id column to the leads table to prevent duplicate imports during manual syncs.

-- 1. Add column if not exists
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS facebook_lead_id TEXT;

-- 2. Add unique constraint
-- Note: This requires existing data to NOT have duplicate lead IDs. 
-- For a fresh system, this is fine.
ALTER TABLE public.leads 
ADD CONSTRAINT leads_facebook_lead_id_key UNIQUE (facebook_lead_id);

-- 3. Update RLS policies (No additional policy needed, existing workspace_id polices apply)
