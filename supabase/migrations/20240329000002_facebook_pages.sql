-- Create the facebook_pages table to support multi-page connections
CREATE TABLE IF NOT EXISTS public.facebook_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    page_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    field_mapping JSONB DEFAULT '{"full_name": "full_name", "email": "email", "phone": "phone"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, page_id)
);

-- Enable RLS for the new table
ALTER TABLE public.facebook_pages ENABLE ROW LEVEL SECURITY;

-- 1. Select Policy
CREATE POLICY "Enable select for authenticated workspace users" ON public.facebook_pages
    FOR SELECT TO authenticated USING (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Insert Policy
CREATE POLICY "Enable insert for authenticated workspace users" ON public.facebook_pages
    FOR INSERT TO authenticated WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));

-- 3. Update Policy
CREATE POLICY "Enable update for authenticated workspace users" ON public.facebook_pages
    FOR UPDATE TO authenticated USING (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));

-- 4. Delete Policy
CREATE POLICY "Enable delete for authenticated workspace users" ON public.facebook_pages
    FOR DELETE TO authenticated USING (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));
