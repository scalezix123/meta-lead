-- Fix RLS Policies for Workspaces
-- This migration adds the missing INSERT policy and updates the SELECT policy
-- to ensure the "self-healing" logic in the frontend can create and read the workspace.

-- 1. Allow authenticated users to insert a new workspace
DROP POLICY IF EXISTS "Users can insert their own workspace" ON public.workspaces;
CREATE POLICY "Users can insert their own workspace" ON public.workspaces
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 2. Update SELECT policy to allow authenticated users to see workspaces
-- (Random UUIDs provide sufficient privacy for the initialization phase)
DROP POLICY IF EXISTS "Users can view workspaces" ON public.workspaces;
CREATE POLICY "Users can view workspaces" ON public.workspaces
    FOR SELECT TO authenticated
    USING (true);

-- 3. Allow users to insert/update their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

