import { supabase } from '@/lib/supabase'
import { applyTransform } from './webhook-transform'
import { generateWebhookSignature } from './webhook-signature'
import { logActivity } from './log-activity'
import { createNotification } from './create-notification'

/**
 * Add webhook to outbound queue
 */
export async function enqueueWebhook(
  webhookId: string,
  requestId: string | null,
  payload: any,
  headers: any = {},
  delayMs: number = 0
) {
  // Get webhook details
  const { data: webhook, error: whError } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  if (whError || !webhook) {
    throw new Error('Webhook not found')
  }

  // Apply transformation if configured
  let finalPayload = payload
  try {
    finalPayload = await applyTransform(webhookId, payload)
  } catch (error: any) {
    console.error('Transform failed, using original payload:', error)
  }

  // Add signature if secret exists
  const finalHeaders = { ...headers }
  if (webhook.secret) {
    const timestamp = Date.now()
    const signature = generateWebhookSignature(webhook.secret, JSON.stringify(finalPayload), timestamp)
    finalHeaders['X-MyAPI-Signature'] = signature
    finalHeaders['X-MyAPI-Timestamp'] = timestamp.toString()
  }

  // Calculate scheduled time
  const scheduledAt = new Date(Date.now() + delayMs).toISOString()

  // Insert into queue
  const { data, error } = await supabase
    .from('api_webhook_outbound_queue')
    .insert({
      webhook_id: webhookId,
      request_id: requestId,
      payload: finalPayload,
      headers: finalHeaders,
      url: webhook.url,
      method: 'POST',
      scheduled_at: scheduledAt,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to enqueue webhook')
  }

  // Log activity
  await logActivity(
    webhook.user_id || 'system',
    requestId || '',
    'webhook_queued',
    { webhook_id: webhookId, queue_id: data.id }
  )

  return data
}

/**
 * Process next pending job from queue
 */
export async function processNextJob(workerId: string): Promise<boolean> {
  // Get next pending job
  const { data: jobs, error } = await supabase
    .from('api_webhook_outbound_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)

  if (error || !jobs || jobs.length === 0) {
    return false // No jobs to process
  }

  const job = jobs[0]

  // Try to lock the job
  const { error: lockError } = await supabase
    .from('api_webhook_outbound_queue')
    .update({
      status: 'processing',
      locked_at: new Date().toISOString(),
      locked_by: workerId
    })
    .eq('id', job.id)
    .eq('status', 'pending') // Only lock if still pending

  if (lockError) {
    return false // Failed to lock (already locked by another worker)
  }

  // Process the job
  const start = Date.now()
  let statusCode = 0
  let success = false
  let errorMessage = ''
  let responseBody = ''

  try {
    const res = await fetch(job.url, {
      method: job.method || 'POST',
      headers: job.headers || {},
      body: JSON.stringify(job.payload)
    })

    statusCode = res.status
    responseBody = await res.text()
    success = res.ok
  } catch (error: any) {
    errorMessage = error.message
  }

  const durationMs = Date.now() - start

  // Log the delivery
  await supabase
    .from('api_request_webhook_logs')
    .insert({
      webhook_id: job.webhook_id,
      request_id: job.request_id,
      url: job.url,
      method: job.method,
      status_code: statusCode,
      success,
      request_headers: job.headers,
      request_body: job.payload,
      response_body: responseBody,
      error_message: errorMessage,
      duration_ms: durationMs
    })

  if (success) {
    // Mark as completed
    await supabase
      .from('api_webhook_outbound_queue')
      .update({
        status: 'completed',
        locked_at: null,
        locked_by: null
      })
      .eq('id', job.id)

    await logActivity(
      'system',
      job.request_id || '',
      'webhook_dequeued',
      { webhook_id: job.webhook_id, queue_id: job.id, status: 'completed' }
    )
  } else {
    // Check retry policy
    const { data: webhook } = await supabase
      .from('api_request_webhooks')
      .select('*')
      .eq('id', job.webhook_id)
      .single()

    const maxAttempts = webhook?.max_attempts || 3
    const retryEnabled = webhook?.retry_enabled ?? true

    if (retryEnabled && job.attempt_number < maxAttempts) {
      // Schedule retry with exponential backoff
      const backoffMs = (webhook.retry_interval_seconds || 30) * 1000 * Math.pow(webhook.backoff_factor || 2, job.attempt_number - 1)

      await supabase
        .from('api_webhook_outbound_queue')
        .update({
          status: 'pending',
          attempt_number: job.attempt_number + 1,
          scheduled_at: new Date(Date.now() + backoffMs).toISOString(),
          locked_at: null,
          locked_by: null,
          error_message: errorMessage
        })
        .eq('id', job.id)
    } else {
      // Mark as failed
      await supabase
        .from('api_webhook_outbound_queue')
        .update({
          status: 'failed',
          locked_at: null,
          locked_by: null,
          error_message: errorMessage
        })
        .eq('id', job.id)

      await logActivity(
        'system',
        job.request_id || '',
        'webhook_queue_failed',
        { webhook_id: job.webhook_id, queue_id: job.id, error: errorMessage }
      )

      // Notify owner
      if (webhook?.user_id) {
        await createNotification(
          webhook.user_id,
          job.request_id || '',
          'webhook_failed',
          { webhook_id: job.webhook_id, error: errorMessage }
        )
      }
    }
  }

  return true
}

/**
 * Get queue statistics
 */
export async function getQueueStats(userId: string) {
  // Get user's webhooks
  const { data: webhooks } = await supabase
    .from('api_request_webhooks')
    .select('id')
    .eq('user_id', userId)

  const webhookIds = webhooks?.map(wh => wh.id) || []

  if (webhookIds.length === 0) {
    return {
      pending_count: 0,
      processing_count: 0,
      failed_count: 0,
      completed_count: 0,
      avg_wait_time: 0
    }
  }

  // Get counts by status
  const { data: queueItems } = await supabase
    .from('api_webhook_outbound_queue')
    .select('status, scheduled_at, created_at')
    .in('webhook_id', webhookIds)

  const pending = queueItems?.filter(q => q.status === 'pending') || []
  const processing = queueItems?.filter(q => q.status === 'processing') || []
  const failed = queueItems?.filter(q => q.status === 'failed') || []
  const completed = queueItems?.filter(q => q.status === 'completed') || []

  // Calculate average wait time for pending items
  const now = Date.now()
  const totalWait = pending.reduce((sum, q) => {
    return sum + (now - new Date(q.created_at).getTime())
  }, 0)
  const avgWaitTime = pending.length > 0 ? totalWait / pending.length : 0

  return {
    pending_count: pending.length,
    processing_count: processing.length,
    failed_count: failed.length,
    completed_count: completed.length,
    avg_wait_time: Math.round(avgWaitTime)
  }
}
