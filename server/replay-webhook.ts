import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'

export async function replayWebhook(
  userId: string,
  requestId: string,
  webhookId: string,
  originalLogId?: string
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

  // Get original log if provided
  let requestBody = {}
  if (originalLogId) {
    const { data: log } = await supabase
      .from('api_request_webhook_logs')
      .select('request_body')
      .eq('id', originalLogId)
      .single()

    requestBody = log?.request_body || {}
  } else {
    // Get request details
    const { data: request } = await supabase
      .from('requests')
      .select('payload')
      .eq('id', requestId)
      .single()

    requestBody = request?.payload || {}
  }

  // Perform replay
  const start = Date.now()
  let statusCode = 0
  let success = false
  let errorMessage = ''
  let responseBody = ''
  let responseHeaders: any = {}

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: webhook.event,
        requestId,
        payload: requestBody,
        replay: true,
        timestamp: new Date().toISOString()
      })
    })

    statusCode = res.status
    responseHeaders = Object.fromEntries(res.headers.entries())
    responseBody = await res.text()
    success = res.ok
  } catch (error: any) {
    errorMessage = error.message
  }

  const durationMs = Date.now() - start

  // Log replay
  const { data: replay, error: replayError } = await supabase
    .from('api_request_webhook_replays')
    .insert({
      request_id: requestId,
      webhook_id: webhookId,
      original_log_id: originalLogId || null,
      triggered_by: userId,
      status_code: statusCode,
      success,
      error_message: errorMessage,
      response_headers: responseHeaders,
      response_body: responseBody,
      duration_ms: durationMs
    })
    .select()
    .single()

  if (replayError) {
    throw new Error('Failed to log replay')
  }

  // Log activity
  await logActivity(userId, requestId, 'webhook_replayed', {
    webhook_id: webhookId,
    replay_id: replay.id,
    status_code: statusCode,
    success
  })

  return {
    success,
    statusCode,
    responseBody,
    durationMs,
    replayId: replay.id
  }
}
