import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const stats = req.nextUrl.searchParams.get('stats')

  try {
    if (stats === 'true') {
      // Return queue statistics
      const { data: webhooks } = await supabase
        .from('api_request_webhooks')
        .select('id')
        .eq('user_id', userId)

      const webhookIds = webhooks?.map(wh => wh.id) || []

      if (webhookIds.length === 0) {
        return NextResponse.json({
          pending_count: 0,
          processing_count: 0,
          failed_count: 0,
          completed_count: 0,
          avg_wait_time: 0
        })
      }

      const { data: queueItems } = await supabase
        .from('api_webhook_outbound_queue')
        .select('status, created_at')
        .in('webhook_id', webhookIds)

      const pending = queueItems?.filter(q => q.status === 'pending') || []
      const processing = queueItems?.filter(q => q.status === 'processing') || []
      const failed = queueItems?.filter(q => q.status === 'failed') || []
      const completed = queueItems?.filter(q => q.status === 'completed') || []

      const now = Date.now()
      const totalWait = pending.reduce((sum, q) => {
        return sum + (now - new Date(q.created_at).getTime())
      }, 0)
      const avgWaitTime = pending.length > 0 ? totalWait / pending.length : 0

      return NextResponse.json({
        pending_count: pending.length,
        processing_count: processing.length,
        failed_count: failed.length,
        completed_count: completed.length,
        avg_wait_time: Math.round(avgWaitTime)
      })
    } else {
      // Return queue items for user
      const { data: webhooks } = await supabase
        .from('api_request_webhooks')
        .select('id')
        .eq('user_id', userId)

      const webhookIds = webhooks?.map(wh => wh.id) || []

      if (webhookIds.length === 0) {
        return NextResponse.json({ queue: [] })
      }

      const { data, error } = await supabase
        .from('api_webhook_outbound_queue')
        .select('*')
        .in('webhook_id', webhookIds)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ queue: data || [] })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  try {
    const body = await req.json()
    const { webhookId, requestId, payload, headers, delayMs } = body

    // Verify ownership
    const { data: webhook, error: whError } = await supabase
      .from('api_request_webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', userId)
      .single()

    if (whError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found or unauthorized' }, { status: 403 })
    }

    const { enqueueWebhook } = await import('@/server/webhook-queue')
    const result = await enqueueWebhook(webhookId, requestId, payload, headers, delayMs)

    return NextResponse.json({ success: true, queueId: result.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
