-- Create lead_activities table for interaction history
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('status_change', 'assignment', 'whatsapp', 'call', 'note', 'task', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_workspace_id ON public.lead_activities(workspace_id);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Dynamic workspace-based RLS policies
DROP POLICY IF EXISTS "Users can view activities in their workspace" ON public.lead_activities;
CREATE POLICY "Users can view activities in their workspace"
    ON public.lead_activities FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert activities in their workspace" ON public.lead_activities;
CREATE POLICY "Users can insert activities in their workspace"
    ON public.lead_activities FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
        )
    );
