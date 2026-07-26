import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    // Verify ownership
    const { data: webhook, error: whError } = await supabase
      .from('api_request_webhooks')
      .select('user_id')
      .eq('id', webhookId)
      .eq('user_id', userId)
      .single()

    if (whError || !webhook) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('api_webhook_sla_breaches')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('occurred_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ breaches: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
