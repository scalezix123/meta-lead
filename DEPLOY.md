# Deployment Guide: Scalezix CRM

This guide explains how to deploy the **Scalezix CRM** (Meta Lead Flow) application to production using **Vercel** and **Supabase**.

## 1. Supabase Production Setup

1.  **Create a New Project**: Go to [Supabase](https://supabase.com) and create a production project.
2.  **Run Migrations**: 
    - Copy the contents of `supabase/migrations/20240329000000_initial_schema.sql` and `20240329000001_add_assigned_to.sql`.
    - Paste them into the **SQL Editor** of your new Supabase project and run them.
3.  **Authentication**: Ensure Email Auth is enabled in the Supabase Dashboard.

## 2. Vercel Deployment

1.  **Connect Repository**: Connect your GitHub/Bitbucket repo to Vercel.
2.  **Build Settings**:
    - **Framework Preset**: Vite
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
3.  **Environment Variables**: Add the following in Vercel Project Settings:
    - `VITE_SUPABASE_URL`: Your production Supabase Project URL.
    - `VITE_SUPABASE_ANON_KEY`: Your production Supabase Anon Key.
4.  **SPA Support**: The project includes `vercel.json` which automatically handles routing for the Single Page Application.

## 3. Meta Integration (Webhook Setup)

To receive leads automatically:
1.  Set up a **Meta App** at [developers.facebook.com](https://developers.facebook.com).
2.  Add the **Webhooks** product.
3.  Create an **Edge Function** in Supabase (see `supabase/functions/meta-webhook`) or use a Zapier/Make.com bridge to push leads to the `leads` table.
4.  The `Integrations` page in the app is ready for the OAuth flow implementation.

---

**Scalezix CRM** - Built for high-performance lead management.
