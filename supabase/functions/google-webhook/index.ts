import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { method } = req

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Google Lead Form Extensions send POST with JSON
  if (method === 'POST') {
    try {
      const body = await req.json()
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Google Lead Form payload structure:
      // { google_key, lead_id, campaign_id, campaign_name, ad_id, ad_group_id, 
      //   form_id, gcl_id, api_version, user_column_data: [{column_name, string_value}] }
      const {
        google_key,
        lead_id,
        campaign_name,
        user_column_data = [],
        form_id
      } = body

      // Verify Google Key (acts as our verify token)
      const GOOGLE_VERIFY_TOKEN = Deno.env.get('GOOGLE_VERIFY_TOKEN') || 'google_ads_sync_scalezix'
      if (google_key && google_key !== GOOGLE_VERIFY_TOKEN) {
        return new Response(JSON.stringify({ error: 'Invalid google_key' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        })
      }

      // Map user_column_data array to a flat object
      const fieldMap: Record<string, string> = {}
      for (const col of user_column_data) {
        const key = (col.column_name || col.column_id || '').toLowerCase().replace(/\s+/g, '_')
        fieldMap[key] = col.string_value || ''
      }

      const getField = (names: string[]) => {
        for (const n of names) {
          if (fieldMap[n]) return fieldMap[n]
        }
        return ''
      }

      const full_name = getField(['full_name', 'name', 'first_name', 'FULL_NAME']) || 'Google Lead'
      const email = getField(['email', 'email_address', 'EMAIL'])
      const phone = getField(['phone_number', 'phone', 'PHONE_NUMBER', 'work_phone'])

      // We need to find the right workspace. For Google we match by verify token.
      // Admins must store their workspace_id mapping. For now, insert into ALL active workspaces.
      // In production, you'd link google_key -> workspace_id in a DB table.
      // We use a fallback: find workspaces that have the google_verify_token set (future enhancement).
      // For now, we require workspace_id in the webhook URL query param or body.
      const url = new URL(req.url)
      const workspace_id = url.searchParams.get('workspace_id') || body.workspace_id

      if (!workspace_id) {
        return new Response(JSON.stringify({ error: 'workspace_id required as query param' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }

      const { error: insertError } = await supabaseAdmin
        .from('leads')
        .upsert({
          workspace_id,
          full_name,
          email,
          phone,
          source: 'google',
          lead_score: 60, // Default score for Google leads (high intent)
          meta_data: {
            google_lead_id: lead_id,
            campaign_name: campaign_name || 'Google Ads',
            form_id,
            raw_fields: fieldMap
          }
        }, { onConflict: 'facebook_lead_id' }) // we reuse facebook_lead_id column or skip dedup for google

      if (insertError) {
        console.error('Error inserting Google lead:', insertError)
        return new Response(JSON.stringify({ error: insertError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }

      // Send notification email for new Google lead
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-lead-notification`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ workspace_id, lead_name: full_name, lead_source: 'Google Ads', lead_email: email, lead_phone: phone })
        })
      } catch (e) {
        console.warn('Notification email failed (non-blocking):', e)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }
  }

  return new Response('Not found', { status: 404 })
})
