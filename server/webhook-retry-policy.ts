import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import { createNotification } from './create-notification'

export interface RetryPolicy {
  retry_enabled: boolean
  max_attempts: number
  retry_strategy: 'immediate' | 'linear' | 'exponential' | 'custom'
  retry_interval_seconds: number
  backoff_factor: number
  max_retry_duration_seconds: number
  retry_on_status_codes: number[]
  retry_on_timeout: boolean
  retry_on_network_error: boolean
}

export function computeNextRetryTime(
  policy: RetryPolicy,
  attemptNumber: number,
  baseTime: Date = new Date()
): Date {
  const base = baseTime.getTime()
  
  switch (policy.retry_strategy) {
    case 'immediate':
      return baseTime
    
    case 'linear':
      return new Date(base + policy.retry_interval_seconds * 1000)
    
    case 'exponential':
      const delay = policy.retry_interval_seconds * Math.pow(policy.backoff_factor, attemptNumber - 1)
      return new Date(base + delay * 1000)
    
    case 'custom':
      // Custom logic can be implemented here
      return new Date(base + policy.retry_interval_seconds * 1000)
    
    default:
      return new Date(base + 30000) // Default 30s
  }
}

export function shouldRetry(
  policy: RetryPolicy,
  statusCode: number | null,
  isTimeout: boolean,
  isNetworkError: boolean,
  attemptNumber: number
): boolean {
  // Check if retries are enabled
  if (!policy.retry_enabled) return false
  
  // Check max attempts
  if (attemptNumber >= policy.max_attempts) return false
  
  // Check timeout
  if (isTimeout && policy.retry_on_timeout) return true
  
  // Check network error
  if (isNetworkError && policy.retry_on_network_error) return true
  
  // Check status code
  if (statusCode && policy.retry_on_status_codes.includes(statusCode)) return true
  
  return false
}

export async function scheduleRetry(
  webhookId: string,
  requestId: string,
  userId: string,
  attemptNumber: number,
  policy: RetryPolicy
) {
  const nextRetryTime = computeNextRetryTime(policy, attemptNumber)
  const now = new Date()
  const maxDuration = policy.max_retry_duration_seconds * 1000
  
  // Check if we're within max retry duration
  if (nextRetryTime.getTime() - now.getTime() > maxDuration) {
    // Retry duration exceeded
    await logActivity(userId, requestId, 'webhook_retry_exhausted', {
      webhook_id: webhookId,
      reason: 'max_duration_exceeded'
    })
    return null
  }
  
  // Log the scheduled retry
  await logActivity(userId, requestId, 'webhook_retry_scheduled', {
    webhook_id: webhookId,
    attempt_number: attemptNumber + 1,
    scheduled_for: nextRetryTime.toISOString()
  })
  
  return nextRetryTime
}

export async function executeRetry(
  webhookId: string,
  requestId: string,
  userId: string,
  attemptNumber: number
) {
  // Get webhook with policy
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('*, request:request_id(payload, api_id, user_id)')
    .eq('id', webhookId)
    .single()
  
  if (error || !webhook) {
    throw new Error('Webhook not found')
  }
  
  const policy: RetryPolicy = {
    retry_enabled: webhook.retry_enabled ?? true,
    max_attempts: webhook.max_attempts ?? 3,
    retry_strategy: webhook.retry_strategy ?? 'exponential',
    retry_interval_seconds: webhook.retry_interval_seconds ?? 30,
    backoff_factor: webhook.backoff_factor ?? 2.0,
    max_retry_duration_seconds: webhook.max_retry_duration_seconds ?? 600,
    retry_on_status_codes: webhook.retry_on_status_codes ?? [500, 502, 503, 504],
    retry_on_timeout: webhook.retry_on_timeout ?? true,
    retry_on_network_error: webhook.retry_on_network_error ?? true
  }
  
  // Check if we should still retry
  if (!shouldRetry(policy, null, false, false, attemptNumber)) {
    await logActivity(userId, requestId, 'webhook_retry_exhausted', {
      webhook_id: webhookId,
      reason: 'max_attempts_exceeded'
    })
    
    await createNotification(
      webhook.request?.user_id || userId,
      requestId,
      'webhook_failed',
      { webhook_id: webhookId, reason: 'retries_exhausted' }
    )
    
    return { success: false, exhausted: true }
  }
  
  // Execute the retry
  const start = Date.now()
  let statusCode = 0
  let success = false
  let errorMessage = ''
  let responseBody = ''
  
  try {
    const payload = {
      event: webhook.event,
      requestId,
      payload: webhook.request?.payload,
      retry: true,
      attempt: attemptNumber + 1,
      timestamp: new Date().toISOString()
    }
    
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    statusCode = res.status
    responseBody = await res.text()
    success = res.ok
    
    // Log the retry attempt
    await supabase
      .from('api_request_webhook_logs')
      .insert({
        webhook_id: webhookId,
        request_id: requestId,
        url: webhook.url,
        method: 'POST',
        attempt_number: attemptNumber + 1,
        status_code: statusCode,
        success,
        request_body: payload,
        response_body: responseBody,
        duration_ms: Date.now() - start
      })
    
    // Log activity
    await logActivity(userId, requestId, 'webhook_retry_attempted', {
      webhook_id: webhookId,
      attempt_number: attemptNumber + 1,
      status_code: statusCode,
      success
    })
    
    if (!success && shouldRetry(policy, statusCode, false, false, attemptNumber + 1)) {
      // Schedule next retry
      await scheduleRetry(webhookId, requestId, userId, attemptNumber + 1, policy)
    } else if (!success) {
      // Retries exhausted
      await logActivity(userId, requestId, 'webhook_retry_exhausted', {
        webhook_id: webhookId,
        reason: 'max_attempts_exceeded'
      })
    }
    
    return { success, statusCode, attemptNumber: attemptNumber + 1 }
  } catch (error: any) {
    errorMessage = error.message
    
    // Log the failed retry
    await supabase
      .from('api_request_webhook_logs')
      .insert({
        webhook_id: webhookId,
        request_id: requestId,
        url: webhook.url,
        method: 'POST',
        attempt_number: attemptNumber + 1,
        success: false,
        error_message: errorMessage,
        duration_ms: Date.now() - start
      })
    
    if (shouldRetry(policy, null, false, true, attemptNumber + 1)) {
      await scheduleRetry(webhookId, requestId, userId, attemptNumber + 1, policy)
    }
    
    return { success: false, error: errorMessage }
  }
}
