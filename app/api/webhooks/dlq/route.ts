import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    // Get user's webhooks
    const { data: webhooks, error: whError } = await supabase
      .from('api_request_webhooks')
      .select('id')
      .eq('user_id', userId)

    if (whError) {
      return NextResponse.json({ error: whError.message }, { status: 500 })
    }

    const webhookIds = webhooks?.map(wh => wh.id) || []

    if (webhookIds.length === 0) {
      return NextResponse.json({ dlq: [] })
    }

    const { data, error } = await supabase
      .from('api_webhook_dead_letter_queue')
      .select('*')
      .in('webhook_id', webhookIds)
      .order('moved_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ dlq: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
