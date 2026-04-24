import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { workspace_id, lead_name, lead_source, lead_email, lead_phone } = await req.json()

    if (!workspace_id) {
      return new Response(JSON.stringify({ error: 'workspace_id required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get workspace name and admin emails
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('name')
      .eq('id', workspace_id)
      .single()

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('workspace_id', workspace_id)

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'leads@scalezix.com'

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email notification')
      return new Response(JSON.stringify({ success: true, warning: 'Email not sent: RESEND_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const teamCount = profiles?.length || 0
    const workspaceName = workspace?.name || 'Your Workspace'
    const sourceIcon = lead_source?.toLowerCase().includes('google') ? '🔍' : '📘'

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, sans-serif; background: #f8fafc; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 32px;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">🎯 New Lead Arrived!</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Scalezix CRM — ${workspaceName}</p>
            </div>
            <div style="padding: 28px 32px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Name</td><td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${lead_name || 'Unknown'}</td></tr>
                  <tr style="border-top: 1px solid #e2e8f0;"><td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Source</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${sourceIcon} ${lead_source || 'Unknown'}</td></tr>
                  ${lead_phone ? `<tr style="border-top: 1px solid #e2e8f0;"><td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Phone</td><td style="padding: 6px 0; font-size: 14px; text-align: right;"><a href="tel:${lead_phone}" style="color: #6366f1;">${lead_phone}</a></td></tr>` : ''}
                  ${lead_email ? `<tr style="border-top: 1px solid #e2e8f0;"><td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Email</td><td style="padding: 6px 0; font-size: 14px; text-align: right;"><a href="mailto:${lead_email}" style="color: #6366f1;">${lead_email}</a></td></tr>` : ''}
                </table>
              </div>
              <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">⚡ Speed to Lead is Critical!</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #92400e;">Leads contacted within 5 minutes are 9x more likely to convert. Call now!</p>
              </div>
              <a href="${Deno.env.get('SITE_URL') || 'https://scalezix.com'}/leads" style="display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 14px;">Open Scalezix CRM →</a>
            </div>
            <div style="padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Scalezix CRM • ${teamCount} team member${teamCount !== 1 ? 's' : ''} in workspace</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Scalezix CRM <noreply@scalezix.com>',
        to: [NOTIFY_EMAIL],
        subject: `🎯 New Lead: ${lead_name || 'Unknown'} from ${lead_source || 'Unknown'}`,
        html: emailHtml
      })
    })

    const emailResult = await emailRes.json()

    return new Response(JSON.stringify({ success: true, email: emailResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
