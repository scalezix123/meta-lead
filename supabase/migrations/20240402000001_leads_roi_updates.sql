-- Add lead_value to leads for ROI tracking
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_value DECIMAL DEFAULT 0;

-- Create campaigns table for tracking Ad Spend across platforms
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'other')),
    name TEXT NOT NULL,
    ad_spend DECIMAL DEFAULT 0 NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON public.campaigns(workspace_id);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Dynamic workspace-based RLS policies
CREATE POLICY "Users can view campaigns in their workspace"
    ON public.campaigns FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert/update campaigns in their workspace"
    ON public.campaigns FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
        )
    );
