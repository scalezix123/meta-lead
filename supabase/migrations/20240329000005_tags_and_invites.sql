-- [20240329000005] Tags and Invites Migration
-- 1. Add tags column to leads (string array)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Create workspace_invites table
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(workspace_id, email)
);

-- 3. Enable RLS
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Invites
CREATE POLICY "Workspace members can view invites"
ON public.workspace_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.workspace_id = workspace_invites.workspace_id
  )
);

CREATE POLICY "Admins/Members can create invites"
ON public.workspace_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.workspace_id = workspace_invites.workspace_id
  )
);
