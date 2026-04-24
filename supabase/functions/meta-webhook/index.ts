import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { method } = req
  const url = new URL(req.url)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle GET for Webhook Verification
  if (method === 'GET') {
    const hubMode = url.searchParams.get('hub.mode')
    const hubVerifyToken = url.searchParams.get('hub.verify_token')
    const hubChallenge = url.searchParams.get('hub.challenge')

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
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const { leadgen_id, lead_id, page_id, form_id } = change.value
            const finalLeadId = leadgen_id || lead_id

            if (!finalLeadId) {
              console.error('No lead ID found in webhook payload:', change.value)
              continue
            }

            // 1. Find ALL linked workspaces for this Page ID (Multi-tenant)
            const { data: pageRecords, error: pageError } = await supabaseAdmin
              .from('facebook_pages')
              .select('workspace_id, access_token, field_mapping, page_name')
              .eq('page_id', String(page_id))
              .eq('is_active', true)

            if (pageError || !pageRecords || pageRecords.length === 0) {
              console.error(`No active workspace found for Page ID: ${page_id}`)
              continue
            }

            // 2. Process for each workspace
            for (const record of pageRecords) {
              try {
                let metaLeadData: any = {};
                let fieldMap: Record<string, any> = {};

                // Handle Dummy Test Leads from the "Test Webhook" button
                if (String(finalLeadId).startsWith('test_lead_')) {
                  metaLeadData = {
                    id: finalLeadId,
                    created_time: new Date().toISOString(),
                    field_data: [
                      { name: 'full_name', values: ['Test Lead (Manual)'] },
                      { name: 'email', values: ['test@example.com'] },
                      { name: 'phone', values: ['+919876543210'] }
                    ]
                  }
                } else {
                  // Fetch Real Lead Details from Meta Graph API
                  const metaUrl = `https://graph.facebook.com/v19.0/${finalLeadId}?access_token=${record.access_token}`
                  const leadResp = await fetch(metaUrl)
                  metaLeadData = await leadResp.json()
                }

                if (metaLeadData.error) {
                  console.error(`Meta API Error for lead ${finalLeadId} in workspace ${record.workspace_id}:`, metaLeadData.error)
                  continue
                }

                // Map Fields
                metaLeadData.field_data?.forEach((field: any) => {
                  fieldMap[field.name] = field.values[0]
                })

                const mapping = record.field_mapping || {
                  full_name: 'full_name',
                  email: 'email',
                  phone: 'phone'
                }

                const getFieldValue = (name: string, fallbacks: string[] = []) => {
                  const metaKey = mapping[name] || name;
                  if (fieldMap[metaKey]) return fieldMap[metaKey]
                  for (const fb of fallbacks) {
                      if (fieldMap[fb]) return fieldMap[fb]
                  }
                  return ""
                }

                const { error: insertError } = await supabaseAdmin
                  .from('leads')
                  .upsert({
                    workspace_id: record.workspace_id,
                    full_name: getFieldValue('full_name', ['name', 'first_name', 'fullname', 'full_name']) || 'Prospect',
                    email: getFieldValue('email', ['email_address', 'email']),
                    phone: getFieldValue('phone', ['phone_number', 'work_phone_number', 'phonenumber', 'phone']),
                    source: 'meta',
                    lead_score: 70, // Meta leads start at 70 (high intent)
                    facebook_lead_id: finalLeadId,
                    meta_data: { 
                      leadgen_id: finalLeadId, 
                      form_id: form_id || metaLeadData.form_id, 
                      page_id: page_id, 
                      page_name: record.page_name, 
                      raw_fields: fieldMap 
                    }
                  }, { onConflict: 'facebook_lead_id' })

                if (!insertError) {
                  // Increment total leads count for this page/workspace
                  await supabaseAdmin.rpc('increment_page_leads', { 
                    p_page_id: String(page_id), 
                    p_workspace_id: record.workspace_id 
                  })
                  // Send email notification (non-blocking)
                  try {
                    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-lead-notification`, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                      },
                      body: JSON.stringify({ 
                        workspace_id: record.workspace_id,
                        lead_name: getFieldValue('full_name', ['name', 'full_name']) || 'Prospect',
                        lead_source: 'Meta Ads',
                        lead_email: getFieldValue('email', ['email_address']),
                        lead_phone: getFieldValue('phone', ['phone_number'])
                      })
                    })
                  } catch (emailErr) {
                    console.warn('Email notification failed (non-blocking):', emailErr)
                  }
                } else {
                  console.error('Error inserting lead:', insertError)
                }
              } catch (innerError) {
                console.error(`Error processing lead for workspace ${record.workspace_id}:`, innerError)
              }
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
