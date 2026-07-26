import { supabase } from '@/lib/supabase'
import { generateWebhookSignature, generateWebhookSecret } from './webhook-signature'

export async function triggerWebhook(
  webhookId: string,
  url: string,
  payload: any
) {
  // Get webhook with secret
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  if (error || !webhook) {
    throw new Error('Webhook not found')
  }

  const rawBody = JSON.stringify(payload)
  const timestamp = Date.now()
  const signature = generateWebhookSignature(webhook.secret, rawBody, timestamp)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-MyAPI-Signature': signature,
    'X-MyAPI-Timestamp': timestamp.toString()
  }

  const start = Date.now()
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: rawBody
    })

    const durationMs = Date.now() - start
    const responseBody = await response.text()
    const responseHeaders = Object.fromEntries(response.headers.entries())

    // Log the delivery
    await supabase
      .from('api_request_webhook_logs')
      .insert({
        webhook_id: webhookId,
        request_id: payload.requestId || null,
        url,
        method: 'POST',
        status_code: response.status,
        success: response.ok,
        request_headers: headers,
        request_body: payload,
        response_headers: responseHeaders,
        response_body: responseBody,
        duration_ms: durationMs
      })

    return {
      success: response.ok,
      statusCode: response.status,
      body: responseBody
    }
  } catch (error: any) {
    const durationMs = Date.now() - start

    // Log the failed delivery
    await supabase
      .from('api_request_webhook_logs')
      .insert({
        webhook_id: webhookId,
        request_id: payload.requestId || null,
        url,
        method: 'POST',
        success: false,
        request_headers: headers,
        request_body: payload,
        error_message: error.message,
        duration_ms: durationMs
      })

    throw error
  }
}

export async function regenerateWebhookSecret(webhookId: string, userId: string) {
  const newSecret = generateWebhookSecret()

  const { error } = await supabase
    .from('api_request_webhooks')
    .update({ secret: newSecret })
    .eq('id', webhookId)
    .eq('user_id', userId)

  if (error) throw error
  return newSecret
}
