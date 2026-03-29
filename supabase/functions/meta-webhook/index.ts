import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { method } = req
  const url = new URL(req.url)

  // Handle GET for Webhook Verification
  if (method === 'GET') {
    const hubMode = url.searchParams.get('hub.mode')
    const hubVerifyToken = url.searchParams.get('hub.verify_token')
    const hubChallenge = url.searchParams.get('hub.challenge')

    // Use an environment variable for the verify token
    const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'my_lead_flow_token'

    if (hubMode === 'subscribe' && hubVerifyToken === VERIFY_TOKEN) {
      return new Response(hubChallenge, { status: 200 })
    }
    return new Response('Verification failed', { status: 403 })
  }

  // Handle POST for Lead Notification
  if (method === 'POST') {
    try {
      const body = await req.json()
      
      // Meta sends a list of entries
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const { leadgen_id, page_id, form_id } = change.value
            
            // 1. Initialize Supabase Client
            const supabase = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 2. Find workspace by page_id
            const { data: workspace, error: wsError } = await supabase
              .from('workspaces')
              .select('id, meta_access_token')
              .eq('page_id', page_id)
              .single()

            if (wsError || !workspace) {
              console.error('Workspace not found for page:', page_id)
              continue
            }

            // 3. Fetch Lead Details from Meta Graph API
            const metaUrl = `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${workspace.meta_access_token}`
            const leadResp = await fetch(metaUrl)
            const metaLeadData = await leadResp.json()

            // 4. Map and Insert Lead into DB
            // Assuming field_data contains: email, full_name, etc.
            const fieldMap: Record<string, any> = {}
            metaLeadData.field_data?.forEach((field: any) => {
              fieldMap[field.name] = field.values[0]
            })

            const { error: insertError } = await supabase
              .from('leads')
              .insert({
                workspace_id: workspace.id,
                full_name: fieldMap.full_name || fieldMap.first_name + ' ' + fieldMap.last_name || 'Prospect',
                email: fieldMap.email,
                phone: fieldMap.phone || fieldMap.phone_number,
                source: 'meta',
                meta_data: { leadgen_id, form_id, raw_fields: fieldMap }
              })

            if (insertError) {
              console.error('Error inserting lead:', insertError)
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
  }

  return new Response('Not found', { status: 404 })
})
