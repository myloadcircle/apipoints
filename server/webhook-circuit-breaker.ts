import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import { createNotification } from './create-notification'

export type CircuitState = 'closed' | 'open' | 'half_open'

export interface CircuitBreakerConfig {
  circuit_breaker_enabled: boolean
  circuit_state: CircuitState
  failure_count: number
  failure_threshold: number
  open_until: string | null
  reset_timeout_seconds: number
}

/**
 * Check circuit breaker state
 */
export async function checkCircuitBreaker(webhookId: string): Promise<{ allowed: boolean; state: CircuitState }> {
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('circuit_breaker_enabled, circuit_state, open_until, failure_count, reset_timeout_seconds')
    .eq('id', webhookId)
    .single()

  if (error || !webhook || !webhook.circuit_breaker_enabled) {
    return { allowed: true, state: 'closed' }
  }

  const now = new Date()

  // If circuit is open, check if timeout has passed
  if (webhook.circuit_state === 'open') {
    if (webhook.open_until && new Date(webhook.open_until) <= now) {
      // Transition to half-open
      await supabase
        .from('api_request_webhooks')
        .update({ circuit_state: 'half_open' })
        .eq('id', webhookId)

      await logActivity(
        'system',
        '',
        'webhook_circuit_half_open',
        { webhook_id: webhookId }
      )

      return { allowed: true, state: 'half_open' }
    }

    return { allowed: false, state: 'open' }
  }

  return { allowed: true, state: webhook.circuit_state || 'closed' }
}

/**
 * Record success - close circuit if half-open
 */
export async function recordCircuitSuccess(webhookId: string) {
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('circuit_state, failure_count')
    .eq('id', webhookId)
    .single()

  if (webhook?.circuit_state === 'half_open') {
    // Close the circuit
    await supabase
      .from('api_request_webhooks')
      .update({
        circuit_state: 'closed',
        failure_count: 0,
        open_until: null
      })
      .eq('id', webhookId)

    await logActivity(
      'system',
      '',
      'webhook_circuit_closed',
      { webhook_id: webhookId }
    )
  }
}

/**
 * Record failure - may open circuit
 */
export async function recordCircuitFailure(webhookId: string, userId: string) {
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  if (!webhook || !webhook.circuit_breaker_enabled) return

  const newFailureCount = (webhook.failure_count || 0) + 1

  if (newFailureCount >= webhook.failure_threshold) {
    // Open the circuit
    const openUntil = new Date(Date.now() + (webhook.reset_timeout_seconds || 300) * 1000)

    await supabase
      .from('api_request_webhooks')
      .update({
        circuit_state: 'open',
        failure_count: newFailureCount,
        open_until: openUntil.toISOString()
      })
      .eq('id', webhookId)

    await logActivity(
      userId,
      '',
      'webhook_circuit_opened',
      { webhook_id: webhookId, failure_count: newFailureCount }
    )

    await createNotification(
      userId,
      '',
      'webhook_failed',
      { webhook_id: webhookId, reason: 'circuit_opened' }
    )
  } else {
    // Just increment failure count
    await supabase
      .from('api_request_webhooks')
      .update({ failure_count: newFailureCount })
      .eq('id', webhookId)
  }
}

/**
 * Manually reset circuit breaker
 */
export async function resetCircuitBreaker(webhookId: string, userId: string) {
  const { error } = await supabase
    .from('api_request_webhooks')
    .update({
      circuit_state: 'closed',
      failure_count: 0,
      open_until: null
    })
    .eq('id', webhookId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to reset circuit breaker')

  await logActivity(
    userId,
    '',
    'webhook_circuit_reset',
    { webhook_id: webhookId }
  )
}
