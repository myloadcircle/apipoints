import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import { createNotification } from './create-notification'

export interface SLAPolicy {
  sla_enabled: boolean
  max_latency_ms: number
  max_failure_rate: number
  evaluation_window_minutes: number
  auto_escalate: boolean
  auto_disable: boolean
}

/**
 * Get SLA policy for a webhook
 */
export async function getSLAPolicy(webhookId: string): Promise<SLAPolicy | null> {
  const { data, error } = await supabase
    .from('api_webhook_sla_policies')
    .select('*')
    .eq('webhook_id', webhookId)
    .single()

  if (error || !data) return null
  return {
    sla_enabled: data.sla_enabled ?? false,
    max_latency_ms: data.max_latency_ms ?? 2000,
    max_failure_rate: data.max_failure_rate ?? 0.05,
    evaluation_window_minutes: data.evaluation_window_minutes ?? 60,
    auto_escalate: data.auto_escalate ?? false,
    auto_disable: data.auto_disable ?? false
  }
}

/**
 * Update SLA policy
 */
export async function updateSLAPolicy(
  webhookId: string,
  userId: string,
  policy: Partial<SLAPolicy>
) {
  // Verify ownership
  const { data: webhook, error: whError } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (whError || !webhook) {
    throw new Error('Webhook not found or unauthorized')
  }

  // Upsert policy
  const { error } = await supabase
    .from('api_webhook_sla_policies')
    .upsert({
      webhook_id: webhookId,
      ...policy,
      updated_at: new Date().toISOString()
    })

  if (error) throw new Error('Failed to update SLA policy')

  await logActivity(
    userId,
    '',
    'webhook_sla_updated',
    { webhook_id: webhookId, ...policy }
  )
}

/**
 * Evaluate SLA for a webhook
 */
export async function evaluateSLA(webhookId: string, userId: string): Promise<{
  sla_breached: boolean
  breach_type?: string
  observed_value?: number
  threshold?: number
}> {
  const policy = await getSLAPolicy(webhookId)
  if (!policy || !policy.sla_enabled) {
    return { sla_breached: false }
  }

  // Calculate window start
  const windowStart = new Date(Date.now() - policy.evaluation_window_minutes * 60 * 1000)

  // Get logs within window
  const { data: logs, error } = await supabase
    .from('api_request_webhook_logs')
    .select('status_code, duration_ms, success')
    .eq('webhook_id', webhookId)
    .gte('created_at', windowStart.toISOString())

  if (error || !logs || logs.length === 0) {
    return { sla_breached: false }
  }

  // Calculate metrics
  const totalRequests = logs.length
  const failedRequests = logs.filter(l => !l.success).length
  const failureRate = failedRequests / totalRequests
  const avgLatency = logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalRequests

  // Check latency SLA
  if (avgLatency > policy.max_latency_ms) {
    await recordSLABreach(webhookId, userId, 'latency', avgLatency, policy.max_latency_ms)
    return {
      sla_breached: true,
      breach_type: 'latency',
      observed_value: avgLatency,
      threshold: policy.max_latency_ms
    }
  }

  // Check failure rate SLA
  if (failureRate > policy.max_failure_rate) {
    await recordSLABreach(webhookId, userId, 'failure_rate', failureRate, policy.max_failure_rate)
    return {
      sla_breached: true,
      breach_type: 'failure_rate',
      observed_value: failureRate,
      threshold: policy.max_failure_rate
    }
  }

  return { sla_breached: false }
}

/**
 * Record SLA breach
 */
async function recordSLABreach(
  webhookId: string,
  userId: string,
  breachType: string,
  observedValue: number,
  thresholdValue: number
) {
  await supabase
    .from('api_webhook_sla_breaches')
    .insert({
      webhook_id: webhookId,
      breach_type: breachType,
      observed_value: observedValue,
      threshold_value: thresholdValue
    })

  await logActivity(
    userId,
    '',
    'webhook_sla_breach',
    {
      webhook_id: webhookId,
      breach_type: breachType,
      observed_value: observedValue,
      threshold: thresholdValue
    }
  )

  // Get SLA policy for escalation/disable
  const policy = await getSLAPolicy(webhookId)
  if (!policy) return

  // Auto-escalate
  if (policy.auto_escalate) {
    await createNotification(
      userId,
      '',
      'webhook_failed',
      {
        webhook_id: webhookId,
        reason: 'sla_breach',
        breach_type: breachType,
        observed_value: observedValue,
        threshold: thresholdValue
      }
    )
  }

  // Auto-disable
  if (policy.auto_disable) {
    await supabase
      .from('api_request_webhooks')
      .update({ active: false })
      .eq('id', webhookId)

    await logActivity(
      userId,
      '',
      'webhook_sla_auto_disabled',
      { webhook_id: webhookId, breach_type: breachType }
    )
  }
}

/**
 * Get SLA breaches history
 */
export async function getSLABreaches(webhookId: string, userId: string) {
  // Verify ownership
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (!webhook) return []

  const { data, error } = await supabase
    .from('api_webhook_sla_breaches')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('occurred_at', { ascending: false })
    .limit(100)

  if (error) return []
  return data || []
}
