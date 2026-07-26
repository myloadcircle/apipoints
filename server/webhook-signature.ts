import { createHmac } from 'crypto'

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  secret: string,
  payload: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now()
  const message = timestamp ? `${ts}.${payload}` : payload
  
  const hmac = createHmac('sha256', secret)
  hmac.update(message)
  
  return hmac.digest('hex')
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string,
  timestamp?: string
): boolean {
  try {
    const expectedSig = timestamp 
      ? generateWebhookSignature(secret, payload, parseInt(timestamp))
      : generateWebhookSignature(secret, payload)
    
    // Use constant-time comparison to prevent timing attacks
    return require('crypto').timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Generate a new webhook secret
 */
export function generateWebhookSecret(): string {
  return require('crypto').randomBytes(32).toString('hex')
}
