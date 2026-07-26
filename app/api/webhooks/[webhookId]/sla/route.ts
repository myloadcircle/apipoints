import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    // Get SLA policy
    const { data: policy, error: policyError } = await supabase
      .from('api_webhook_sla_policies')
      .select('*')
      .eq('webhook_id', webhookId)
      .single()

    if (policyError) {
      // No policy yet, return defaults
      return NextResponse.json({
        sla_enabled: false,
        max_latency_ms: 2000,
        max_failure_rate: 0.05,
        evaluation_window_minutes: 60,
        auto_escalate: false,
        auto_disable: false
      })
    }

    // Get recent breaches
    const { data: breaches } = await supabase
      .from('api_webhook_sla_breaches')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('occurred_at', { ascending: false })
      .limit(10)

    // Calculate live metrics (last 60 minutes)
    const windowStart = new Date(Date.now() - 60 * 60 * 1000)
    const { data: logs } = await supabase
      .from('api_request_webhook_logs')
      .select('status_code, duration_ms, success')
      .eq('webhook_id', webhookId)
      .gte('created_at', windowStart.toISOString())

    const totalRequests = logs?.length || 0
    const failedRequests = logs?.filter(l => !l.success).length || 0
    const failureRate = totalRequests > 0 ? failedRequests / totalRequests : 0
    const avgLatency = totalRequests > 0 
      ? logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalRequests 
      : 0

    return NextResponse.json({
      policy,
      live_metrics: {
        total_requests: totalRequests,
        failure_rate: failureRate,
        avg_latency_ms: Math.round(avgLatency),
        last_breach: breaches?.[0] || null
      },
      recent_breaches: breaches || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
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

    // Update SLA policy
    const { error } = await supabase
      .from('api_webhook_sla_policies')
      .upsert({
        webhook_id: webhookId,
        sla_enabled: body.sla_enabled,
        max_latency_ms: body.max_latency_ms,
        max_failure_rate: body.max_failure_rate,
        evaluation_window_minutes: body.evaluation_window_minutes,
        auto_escalate: body.auto_escalate,
        auto_disable: body.auto_disable,
        updated_at: new Date().toISOString()
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
