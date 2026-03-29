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

            // 2. Find the specific linked page and workspace
            const { data: pageRecord, error: pageError } = await supabase
              .from('facebook_pages')
              .select('workspace_id, access_token, field_mapping, page_name')
              .eq('page_id', page_id)
              .eq('is_active', true)
              .single()

            if (pageError || !pageRecord) {
              console.error('Active linked page not found for ID:', page_id)
              continue
            }

            // 3. Fetch Lead Details from Meta Graph API
            const metaUrl = `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${pageRecord.access_token}`
            const leadResp = await fetch(metaUrl)
            const metaLeadData = await leadResp.json()

            // 4. Map Fields based on Client Configuration
            const fieldMap: Record<string, any> = {}
            metaLeadData.field_data?.forEach((field: any) => {
              fieldMap[field.name] = field.values[0]
            })

            // Apply custom mapping if defined
            const mapping = pageRecord.field_mapping || {
              full_name: 'full_name',
              email: 'email',
              phone: 'phone'
            }

            const getMappedValue = (targetKey: string) => {
              const metaKey = mapping[targetKey] || targetKey
              return fieldMap[metaKey]
            }

            const { error: insertError } = await supabase
              .from('leads')
              .insert({
                workspace_id: pageRecord.workspace_id,
                full_name: getMappedValue('full_name') || fieldMap.full_name || 'Prospect',
                email: getMappedValue('email') || fieldMap.email,
                phone: getMappedValue('phone') || fieldMap.phone || fieldMap.phone_number,
                source: 'meta',
                meta_data: { 
                  leadgen_id, 
                  form_id, 
                  page_id, 
                  page_name: pageRecord.page_name, 
                  raw_fields: fieldMap 
                }
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
