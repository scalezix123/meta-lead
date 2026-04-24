-- Add enhanced columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS inquiry_outcome TEXT,
ADD COLUMN IF NOT EXISTS calling_date DATE,
ADD COLUMN IF NOT EXISTS calling_remark TEXT,
ADD COLUMN IF NOT EXISTS last_action TEXT,
ADD COLUMN IF NOT EXISTS custom_tl TEXT,
ADD COLUMN IF NOT EXISTS custom_text_field TEXT,
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;

-- Update RLS if needed (should be covered by existing policies, but good for safety)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
