import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { shortLivedToken, workspaceId } = await req.json()

    if (!shortLivedToken || !workspaceId) {
      throw new Error('Missing shortLivedToken or workspaceId')
    }

    // 1. Initialize Supabase Client (Service Role for admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch App ID and Secret from Database
    const { data: workspace, error: wError } = await supabaseAdmin
      .from('workspaces')
      .select('meta_app_id, meta_app_secret')
      .eq('id', workspaceId)
      .single()

    if (wError || !workspace?.meta_app_id || !workspace?.meta_app_secret) {
      throw new Error('Meta App ID or Secret missing in workspace settings.')
    }

    // 3. Exchange for Long-Lived Token via Meta Graph API
    const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${workspace.meta_app_id}&client_secret=${workspace.meta_app_secret}&fb_exchange_token=${shortLivedToken}`
    
    const exchangeRes = await fetch(exchangeUrl)
    const exchangeData = await exchangeRes.json()

    if (exchangeData.error) {
      console.error('Meta Exchange API Error:', exchangeData.error)
      throw new Error(exchangeData.error.message || 'Meta token exchange failed.')
    }

    const { access_token: longLivedToken, expires_in } = exchangeData

    // 4. Save Long-Lived Token to Database
    const { error: uError } = await supabaseAdmin
      .from('workspaces')
      .update({ 
        meta_access_token: longLivedToken 
      })
      .eq('id', workspaceId)

    if (uError) throw uError

    return new Response(JSON.stringify({ 
      success: true, 
      access_token: longLivedToken,
      expires_in: expires_in 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
