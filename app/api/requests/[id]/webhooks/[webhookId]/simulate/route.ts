import { supabase } from '@/lib/supabase'
import { generateWebhookSignature } from '@/server/webhook-signature'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; webhookId: string } }
) {
  const requestId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    const body = await req.json()
    const { log_id, override_body, override_headers, override_secret, simulate_signature } = body

    // Verify ownership
    const { data: request } = await supabase
      .from('requests')
      .select('user_id, payload')
      .eq('id', requestId)
      .single()

    if (!request || request.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get webhook details
    const { data: webhook, error: whError } = await supabase
      .from('api_request_webhooks')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (whError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Get original log if log_id provided
    let originalLog = null
    if (log_id) {
      const { data } = await supabase
        .from('api_request_webhook_logs')
        .select('*')
        .eq('id', log_id)
        .single()
      
      originalLog = data
    }

    // Build simulation
    const finalBody = override_body || originalLog?.request_body || request.payload || {}
    const finalHeaders = override_headers || originalLog?.request_headers || {}
    const secret = override_secret || webhook.secret
    const rawBody = typeof finalBody === 'string' ? finalBody : JSON.stringify(finalBody)

    // Compute signature if requested
    let signature = null
    let timestamp = null
    let signatureExplanation = null

    if (simulate_signature && secret) {
      timestamp = Date.now()
      signature = generateWebhookSignature(secret, rawBody, timestamp)
      signatureExplanation = `Signature generated using:
1. Secret: ${secret.slice(0, 8)}... (first 8 chars shown)
2. Timestamp: ${timestamp}
3. Message: "${timestamp}.${rawBody.slice(0, 50)}..." (truncated)
4. Algorithm: HMAC-SHA256
5. Encoding: Hex`
    }

    // Build final headers
    const finalRequestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...finalHeaders
    }

    if (signature) {
      finalRequestHeaders['X-MyAPI-Signature'] = signature
      finalRequestHeaders['X-MyAPI-Timestamp'] = timestamp.toString()
    }

    // Compute diff vs original if log exists
    let diff = null
    if (originalLog) {
      diff = {
        headers_changed: JSON.stringify(originalLog.request_headers) !== JSON.stringify(finalRequestHeaders),
        body_changed: JSON.stringify(originalLog.request_body) !== JSON.stringify(finalBody),
        original_body: originalLog.request_body,
        original_headers: originalLog.request_headers
      }
    }

    return NextResponse.json({
      success: true,
      simulation: {
        request_headers: finalRequestHeaders,
        request_body: finalBody,
        raw_body: rawBody,
        signature,
        timestamp,
        signature_explanation: signatureExplanation,
        webhook_url: webhook.url,
        webhook_event: webhook.event
      },
      diff,
      note: 'This is a simulation. No external HTTP request was made.'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
