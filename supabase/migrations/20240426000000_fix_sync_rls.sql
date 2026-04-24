-- ALL-IN-ONE Lead Sync Fix
-- Run this in your Supabase SQL Editor to fix the 403 Forbidden errors

-- 1. LEADS: Clear and recreate all policies to ensure clean state
DROP POLICY IF EXISTS "Users can view leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Allow All Leads" ON public.leads;

-- SELECT
CREATE POLICY "leads_select_policy" ON public.leads
    FOR SELECT TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));

-- INSERT
CREATE POLICY "leads_insert_policy" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));

-- UPDATE (Critical for Sync/Upsert)
CREATE POLICY "leads_update_policy" ON public.leads
    FOR UPDATE TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));


-- 2. PROFILES: Ensure profile is always readable by the owner
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());


-- 3. FACEBOOK_PAGES: Ensure pages can be updated during sync
DROP POLICY IF EXISTS "Users can update their own facebook pages" ON public.facebook_pages;
CREATE POLICY "pages_update_policy" ON public.facebook_pages
    FOR UPDATE TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid()));
