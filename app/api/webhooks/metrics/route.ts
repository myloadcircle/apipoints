import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    // Get all request IDs owned by user
    const { data: userRequests } = await supabase
      .from('requests')
      .select('id')
      .eq('user_id', userId)

    const requestIds = userRequests?.map(r => r.id) || []

    if (requestIds.length === 0) {
      return NextResponse.json({
        success_count: 0,
        failure_count: 0,
        avg_duration: 0,
        recent_failures: [],
        slowest_webhooks: [],
        status_code_histogram: {},
        retry_stats: {},
        replay_stats: { total_replays: 0, success_replays: 0 }
      })
    }

    // Get all webhook logs for user's requests
    const { data: logs, error } = await supabase
      .from('api_request_webhook_logs')
      .select('*')
      .in('request_id', requestIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate metrics
    const successCount = logs?.filter(l => l.success).length || 0
    const failureCount = logs?.filter(l => !l.success).length || 0
    const totalDuration = logs?.reduce((sum, l) => sum + (l.duration_ms || 0), 0) || 0
    const avgDuration = logs?.length > 0 ? totalDuration / logs.length : 0

    // Status code histogram
    const statusCodeHistogram: Record<string, number> = {}
    logs?.forEach(l => {
      const code = Math.floor(l.status_code / 100) + 'xx'
      statusCodeHistogram[code] = (statusCodeHistogram[code] || 0) + 1
    })

    // Recent failures (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recentFailures = (logs || [])
      .filter(l => !l.success && l.created_at > oneDayAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    // Slowest webhooks
    const slowestWebhooks = (logs || [])
      .sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0))
      .slice(0, 10)

    // Retry stats
    const retryStats = {
      total_retries: logs?.filter(l => l.attempt_number > 1).length || 0,
      max_attempts: Math.max(...(logs?.map(l => l.attempt_number) || [0]))
    }

    // Replay stats
    const { data: replays } = await supabase
      .from('api_request_webhook_replays')
      .select('*')
      .in('request_id', requestIds)

    const replayStats = {
      total_replays: replays?.length || 0,
      success_replays: replays?.filter(r => r.success).length || 0
    }

    return NextResponse.json({
      success_count: successCount,
      failure_count: failureCount,
      avg_duration: Math.round(avgDuration),
      recent_failures: recentFailures,
      slowest_webhooks: slowestWebhooks,
      status_code_histogram: statusCodeHistogram,
      retry_stats: retryStats,
      replay_stats: replayStats
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
