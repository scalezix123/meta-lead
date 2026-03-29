-- Migration: Add RLS policies for workspaces and facebook_pages
-- This allows users to correctly save their Meta App IDs and Access Tokens

-- 1. Policies for workspaces
CREATE POLICY "Users can view their own workspace" ON public.workspaces
    FOR SELECT USING (
        id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Users can update their own workspace" ON public.workspaces
    FOR UPDATE USING (
        id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    )
    WITH CHECK (
        id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

-- 2. Policies for facebook_pages
CREATE POLICY "Users can view their own facebook pages" ON public.facebook_pages
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Users can insert their own facebook pages" ON public.facebook_pages
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Users can update their own facebook pages" ON public.facebook_pages
    FOR UPDATE USING (
        workspace_id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Users can delete their own facebook pages" ON public.facebook_pages
    FOR DELETE USING (
        workspace_id IN (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
    );
