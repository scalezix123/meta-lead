-- Add lead_score column to leads table (1-100 scale)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;

-- Create a DB function to calculate lead score
-- Score factors:
--   +20 if lead has email
--   +20 if lead has phone
--   +10 if source is 'meta' (high intent platform)
--   +10 if source is 'google' (high intent platform)
--   +10 if lead has remark already (engaged)
--   -20 if lead is 'lost'
--   +20 if lead is 'won'
CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_email TEXT,
  p_phone TEXT,
  p_source TEXT,
  p_status TEXT,
  p_remark TEXT,
  p_lead_value DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 50;
BEGIN
  IF p_email IS NOT NULL AND p_email != '' THEN score := score + 15; END IF;
  IF p_phone IS NOT NULL AND p_phone != '' THEN score := score + 20; END IF;
  IF p_source = 'meta' THEN score := score + 10; END IF;
  IF p_source = 'google' THEN score := score + 10; END IF;
  IF p_remark IS NOT NULL AND p_remark != '' THEN score := score + 5; END IF;
  IF p_status = 'won' THEN score := score + 20; END IF;
  IF p_status = 'lost' THEN score := score - 20; END IF;
  IF p_status = 'qualified' THEN score := score + 10; END IF;
  IF p_status = 'contacted' THEN score := score + 5; END IF;
  IF p_lead_value > 0 THEN score := score + 10; END IF;
  -- Cap between 0 and 100
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;
