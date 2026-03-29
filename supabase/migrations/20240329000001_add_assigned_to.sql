-- Add assigned_to column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

-- Update RLS to allow updating leads by workspace members
CREATE POLICY "Users can update leads in their workspace" ON public.leads
FOR UPDATE USING (
    workspace_id IN (
        SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
);
