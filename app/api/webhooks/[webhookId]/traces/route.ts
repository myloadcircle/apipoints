import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

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
      .from('api_webhook_traces')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ traces: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const body = await req.json()
  const { trace_id, steps } = body

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
      .from('api_webhook_traces')
      .insert({
        trace_id,
        webhook_id: webhookId,
        steps: steps || [],
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trace: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
