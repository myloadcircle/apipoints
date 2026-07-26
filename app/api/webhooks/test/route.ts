import { NextRequest, NextResponse } from 'next/server'
import { generateWebhookSignature } from '@/server/webhook-signature'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, method = 'POST', headers = {}, body: requestBody, secret } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Add signature if secret provided
    if (secret) {
      const rawBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
      const timestamp = Date.now()
      const signature = generateWebhookSignature(secret, rawBody, timestamp)
      
      requestHeaders['X-MyAPI-Signature'] = signature
      requestHeaders['X-MyAPI-Timestamp'] = timestamp.toString()
    }

    // Send test request
    const start = Date.now()
    let statusCode = 0
    let responseBody = ''
    let responseHeaders: Record<string, string> = {}
    let errorMessage = ''

    try {
      const res = await fetch(url, {
        method: method || 'POST',
        headers: requestHeaders,
        body: requestBody ? JSON.stringify(requestBody) : undefined
      })

      statusCode = res.status
      responseHeaders = Object.fromEntries(res.headers.entries())
      responseBody = await res.text()
    } catch (error: any) {
      errorMessage = error.message
    }

    const durationMs = Date.now() - start

    // Log activity (optional)
    try {
      const { logActivity } = await import('@/server/log-activity')
      await logActivity(
        'REPLACE_WITH_AUTH_USER_ID',
        '',
        'webhook_test_sent',
        { url, method, status_code: statusCode, duration_ms: durationMs }
      )
    } catch {
      // Ignore activity log errors
    }

    return NextResponse.json({
      success: !errorMessage,
      statusCode,
      responseHeaders,
      responseBody,
      durationMs,
      error: errorMessage || undefined
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
