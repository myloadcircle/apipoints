import { supabase } from '@/lib/supabase'

export interface MetricsSnapshot {
  delivery_latency_ms?: number
  queue_wait_time_ms?: number
  retry_count?: number
  throttle_count?: number
  circuit_breaker_events?: number
  region_failovers?: number
  sla_breaches?: number
  transform_execution_time_ms?: number
  health_check_latency_ms?: number
}

/**
 * Record a trace step
 */
export async function recordTraceStep(
  traceId: string,
  stepName: string,
  durationMs: number,
  metadata: any = {}
) {
  // Get existing trace
  const { data: trace } = await supabase
    .from('api_webhook_traces')
    .select('steps')
    .eq('trace_id', traceId)
    .single()

  const steps = trace?.steps || []
  steps.push({
    name: stepName,
    duration_ms: durationMs,
    timestamp: new Date().toISOString(),
    ...metadata
  })

  await supabase
    .from('api_webhook_traces')
    .update({ steps })
    .eq('trace_id', traceId)
}

/**
 * Complete a trace
 */
export async function completeTrace(traceId: string) {
  const { data: trace } = await supabase
    .from('api_webhook_traces')
    .select('started_at, steps')
    .eq('trace_id', traceId)
    .single()

  if (!trace) return

  const startedAt = new Date(trace.started_at).getTime()
  const completedAt = Date.now()
  const durationMs = completedAt - startedAt

  await supabase
    .from('api_webhook_traces')
    .update({
      completed_at: new Date().toISOString(),
      duration_ms: durationMs
    })
    .eq('trace_id', traceId)
}

/**
 * Get traces for a webhook
 */
export async function getTraces(webhookId: string, userId: string, limit: number = 50) {
  // Verify ownership
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (!webhook) return []

  const { data, error } = await supabase
    .from('api_webhook_traces')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error('Failed to fetch traces')
  return data || []
}

/**
 * Get trace details
 */
export async function getTraceDetails(traceId: string, userId: string) {
  const { data: trace, error } = await supabase
    .from('api_webhook_traces')
    .select('*')
    .eq('trace_id', traceId)
    .single()

  if (error || !trace) return null

  // Verify ownership via webhook
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', trace.webhook_id)
    .single()

  if (!webhook || webhook.user_id !== userId) return null

  return trace
}

/**
 * Aggregate hourly metrics
 */
export async function aggregateHourlyMetrics(webhookId: string) {
  const hourStart = new Date()
  hourStart.setMinutes(0, 0, 0)

  // Get logs for this hour
  const { data: logs } = await supabase
    .from('api_request_webhook_logs')
    .select('duration_ms, success')
    .eq('webhook_id', webhookId)
    .gte('created_at', hourStart.toISOString())

  if (!logs || logs.length === 0) return

  const latencies = logs.map(l => l.duration_ms || 0).sort((a, b) => a - b)
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
  const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0

  // Upsert hourly metrics
  await supabase
    .from('api_webhook_metrics_hourly')
    .upsert({
      webhook_id: webhookId,
      hour: hourStart.toISOString(),
      delivery_latency_p50: p50,
      delivery_latency_p90: p90,
      delivery_latency_p95: p95,
      delivery_latency_p99: p99
    }, { onConflict: 'webhook_id, hour' })
}

/**
 * Get metrics for UI
 */
export async function getObservabilityMetrics(webhookId: string, userId: string) {
  // Verify ownership
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (!webhook) return null

  // Get latest hourly metrics
  const { data: hourly } = await supabase
    .from('api_webhook_metrics_hourly')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('hour', { ascending: false })
    .limit(24) // Last 24 hours

  // Get daily metrics
  const { data: daily } = await supabase
    .from('api_webhook_metrics_daily')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('day', { ascending: false })
    .limit(30) // Last 30 days

  return {
    hourly: hourly || [],
    daily: daily || []
  }
}
