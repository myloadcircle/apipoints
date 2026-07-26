import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { webhookId: string; traceId: string } }
) {
  const { webhookId, traceId } = params
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

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
      .eq('trace_id', traceId)
      .eq('webhook_id', webhookId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Trace not found' }, { status: 404 })
    }

    return NextResponse.json({ trace: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { webhookId: string; traceId: string } }
) {
  const { webhookId, traceId } = params
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const body = await req.json()

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

    const { error } = await supabase
      .from('api_webhook_traces')
      .update(body)
      .eq('trace_id', traceId)
      .eq('webhook_id', webhookId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
