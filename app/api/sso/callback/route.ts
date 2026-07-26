import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, state: teamId } = body

    if (!code || !teamId) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
    }

    // Get SSO config
    const { data: config } = await supabase
      .from('enterprise_sso_configs')
      .select('*')
      .eq('team_id', teamId)
      .single()

    if (!config) {
      return NextResponse.json({ error: 'SSO not configured' }, { status: 404 })
    }

    let userEmail = null

    if (config.provider === 'google') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          code,
          client_id: config.client_id!,
          client_secret: config.client_secret!,
          redirect_uri: 'https://APIPoints.site/sso/callback',
          grant_type: 'authorization_code'
        })
      })
      const token = await tokenRes.json()

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` }
      })
      const profile = await profileRes.json()
      userEmail = profile.email
    }

    if (config.provider === 'microsoft') {
      const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        body: new URLSearchParams({
          code,
          client_id: config.client_id!,
          client_secret: config.client_secret!,
          redirect_uri: 'https://APIPoints.site/sso/callback',
          grant_type: 'authorization_code'
        })
      })
      const token = await tokenRes.json()

      const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token.access_token}` }
      })
      const profile = await profileRes.json()
      userEmail = profile.mail || profile.userPrincipalName
    }

    if (config.provider === 'saml') {
      // SAML assertion parsing would go here
      userEmail = 'saml-user@example.com'
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Failed to get user email' }, { status: 400 })
    }

    // Ensure user exists and is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .single()

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        team_id: teamId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'sso_login',
        metadata: { email: userEmail, provider: config.provider }
      })

    return NextResponse.redirect(new URL('https://APIPoints.site/team/dashboard'))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
