-- [20240329000007] Enterprise Roles and Activities Migration

-- 1. Add roles to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- 2. Restrict Lead Visibility (Role-Based Access Control)
DROP POLICY IF EXISTS "Users can view leads in their workspace" ON public.leads;

CREATE POLICY "Users can view leads in their workspace" ON public.leads
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  ) AND (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- 3. Create historical lead activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    activity_type TEXT NOT NULL, -- 'remark', 'status_change', 'assignment', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on lead activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their workspace" ON public.lead_activities
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert activities in their workspace" ON public.lead_activities
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);
