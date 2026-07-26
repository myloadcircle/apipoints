import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'

export interface RateLimitConfig {
  rate_limit_enabled: boolean
  max_requests_per_minute: number
  max_requests_per_hour: number
  burst_limit: number
  tokens: number
  token_refill_rate: number
  last_request_at: string | null
}

/**
 * Check rate limit using token bucket algorithm
 */
export async function checkRateLimit(webhookId: string): Promise<{ allowed: boolean; tokensRemaining: number; retryAfterMs: number }> {
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  if (error || !webhook || !webhook.rate_limit_enabled) {
    return { allowed: true, tokensRemaining: 999, retryAfterMs: 0 }
  }

  const now = Date.now()
  const lastRequest = webhook.last_request_at ? new Date(webhook.last_request_at).getTime() : 0
  const elapsedSeconds = (now - lastRequest) / 1000

  // Refill tokens
  const refillAmount = elapsedSeconds * (webhook.token_refill_rate || 1.0)
  const newTokens = Math.min(
    webhook.burst_limit || 10,
    (webhook.tokens || 0) + refillAmount
  )

  if (newTokens >= 1) {
    // Allow request
    const updatedTokens = newTokens - 1
    await supabase
      .from('api_request_webhooks')
      .update({
        tokens: updatedTokens,
        last_request_at: new Date().toISOString()
      })
      .eq('id', webhookId)

    return { allowed: true, tokensRemaining: Math.floor(updatedTokens), retryAfterMs: 0 }
  } else {
    // Throttled
    const retryAfterMs = ((1 - newTokens) / (webhook.token_refill_rate || 1.0)) * 1000

    await logActivity(
      'system',
      '',
      'webhook_throttled',
      { webhook_id: webhookId, tokens: newTokens }
    )

    return { allowed: false, tokensRemaining: 0, retryAfterMs }
  }
}

/**
 * Check global rate limits
 */
export async function checkGlobalRateLimit(): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = new Date()
  const minuteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

  const { data: globalLimit } = await supabase
    .from('api_webhook_global_limits')
    .select('*')
    .gte('window_start', hourStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .single()

  if (!globalLimit) {
    // Create new window
    await supabase
      .from('api_webhook_global_limits')
      .insert({
        window_start: hourStart.toISOString(),
        requests_sent: 1
      })
    return { allowed: true, retryAfterMs: 0 }
  }

  // Check limits
  const requestsLastMinute = globalLimit.requests_sent || 0
  const requestsLastHour = globalLimit.requests_sent || 0

  if (requestsLastMinute >= (globalLimit.max_requests_per_minute || 5000)) {
    await logActivity(
      'system',
      '',
      'webhook_global_throttle_triggered',
      { requests_sent: requestsLastMinute }
    )
    return { allowed: false, retryAfterMs: 60000 } // Retry after 1 minute
  }

  if (requestsLastHour >= (globalLimit.max_requests_per_hour || 100000)) {
    await logActivity(
      'system',
      '',
      'webhook_global_throttle_triggered',
      { requests_sent: requestsLastHour }
    )
    return { allowed: false, retryAfterMs: 3600000 } // Retry after 1 hour
  }

  // Increment counter
  await supabase
    .from('api_webhook_global_limits')
    .update({ requests_sent: requestsLastHour + 1 })
    .eq('id', globalLimit.id)

  return { allowed: true, retryAfterMs: 0 }
}
