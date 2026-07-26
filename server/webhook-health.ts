import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import { createNotification } from './create-notification'

export async function runHealthCheck(webhookId: string) {
  // Get webhook details
  const { data: webhook, error: whError } = await supabase
    .from('api_request_webhooks')
    .select('*, request:api_id(user_id)')
    .eq('id', webhookId)
    .single()

  if (whError || !webhook) {
    throw new Error('Webhook not found')
  }

  const start = Date.now()
  let statusCode = 0
  let success = false
  let errorMessage = ''
  let responseTimeMs = 0

  try {
    // Send HEAD request (or GET if HEAD not supported)
    const res = await fetch(webhook.url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'APIPoints-HealthCheck/1.0' }
    })

    statusCode = res.status
    success = res.ok
    responseTimeMs = Date.now() - start
  } catch (error: any) {
    errorMessage = error.message
    responseTimeMs = Date.now() - start
    success = false
  }

  // Get existing health record
  const { data: existingHealth } = await supabase
    .from('api_request_webhook_health')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const consecutiveFailures = success 
    ? 0 
    : (existingHealth?.consecutive_failures || 0) + 1

  // Insert health check record
  const { error: insertError } = await supabase
    .from('api_request_webhook_health')
    .insert({
      webhook_id: webhookId,
      last_check_at: new Date().toISOString(),
      last_status_code: statusCode,
      last_success: success,
      error_message: errorMessage,
      response_time_ms: responseTimeMs,
      consecutive_failures: consecutiveFailures
    })

  if (insertError) {
    throw new Error('Failed to log health check')
  }

  // Log activity
  await logActivity(
    webhook.request?.user_id || 'system',
    webhook.request_id || '',
    success ? 'webhook_health_check_passed' : 'webhook_health_check_failed',
    { webhook_id: webhookId, status_code: statusCode }
  )

  // Check for unhealthy status (3+ consecutive failures)
  if (consecutiveFailures >= 3) {
    await logActivity(
      webhook.request?.user_id || 'system',
      webhook.request_id || '',
      'webhook_unhealthy',
      { webhook_id: webhookId, consecutive_failures: consecutiveFailures }
    )

    await createNotification(
      webhook.request?.user_id || 'system',
      webhook.request_id || '',
      'webhook_failed',
      { webhook_id: webhookId, consecutive_failures: consecutiveFailures }
    )
  }

  // Check for recovery (was unhealthy, now healthy)
  if (success && existingHealth && existingHealth.consecutive_failures >= 3) {
    await logActivity(
      webhook.request?.user_id || 'system',
      webhook.request_id || '',
      'webhook_recovered',
      { webhook_id: webhookId }
    )
  }

  return {
    success,
    statusCode,
    responseTimeMs,
    consecutiveFailures
  }
}

export async function runAllHealthChecks(userId: string) {
  // Get all webhooks for user
  const { data: webhooks, error } = await supabase
    .from('api_request_webhooks')
    .select('id')
    .eq('user_id', userId)

  if (error || !webhooks) {
    throw new Error('Failed to fetch webhooks')
  }

  const results = []
  for (const wh of webhooks) {
    try {
      const result = await runHealthCheck(wh.id)
      results.push({ webhookId: wh.id, ...result })
    } catch (error: any) {
      results.push({ webhookId: wh.id, error: error.message })
    }
  }

  return results
}
