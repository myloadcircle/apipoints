import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Initialize encryption - get master key from env
 */
function getMasterKey(): Buffer {
  const masterKey = process.env.WEBHOOK_MASTER_KEY
  if (!masterKey) {
    throw new Error('WEBHOOK_MASTER_KEY not configured')
  }
  return Buffer.from(masterKey, 'hex')
}

/**
 * Encrypt secret
 */
export function encryptSecret(secret: string): string {
  const masterKey = getMasterKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv)
  
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final()
  ])
  
  const authTag = cipher.getAuthTag()
  
  // Combine: iv + authTag + encrypted
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

/**
 * Decrypt secret (server-side only)
 */
export function decryptSecret(encryptedSecret: string): string {
  const masterKey = getMasterKey()
  const buffer = Buffer.from(encryptedSecret, 'base64')
  
  const iv = buffer.slice(0, IV_LENGTH)
  const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv)
  decipher.setAuthTag(authTag)
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
  
  return decrypted.toString('utf8')
}

/**
 * Generate new secret and encrypt it
 */
export function generateAndEncryptSecret(): { secret: string; encrypted: string } {
  const secret = crypto.randomBytes(32).toString('hex')
  const encrypted = encryptSecret(secret)
  return { secret, encrypted }
}

/**
 * Rotate secret for a webhook
 */
export async function rotateSecret(
  webhookId: string,
  userId: string,
  complianceMode: boolean = false
): Promise<{ secret?: string; encrypted: string }> {
  // Verify ownership
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('user_id, compliance_mode')
    .eq('id', webhookId)
    .single()

  if (error || !webhook || webhook.user_id !== userId) {
    throw new Error('Webhook not found or unauthorized')
  }

  // In compliance mode, never return plaintext
  const isCompliance = complianceMode || webhook.compliance_mode

  const { secret, encrypted } = generateAndEncryptSecret()

  const { error: updateError } = await supabase
    .from('api_request_webhooks')
    .update({
      secret: encrypted,
      secret_encrypted: encrypted,
      secret_last_rotated_at: new Date().toISOString()
    })
    .eq('id', webhookId)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error('Failed to rotate secret')
  }

  await logActivity(userId, '', 'webhook_secret_rotated', {
    webhook_id: webhookId,
    compliance_mode: isCompliance
  })

  return {
    secret: isCompliance ? undefined : secret,
    encrypted
  }
}

/**
 * Get masked secret for display
 */
export async function getMaskedSecret(webhookId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_webhooks')
    .select('secret, secret_encrypted, secret_last_rotated_at, secret_rotation_interval_days, secret_auto_rotate')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  const masked = data.secret
    ? data.secret.slice(0, 4) + '****' + data.secret.slice(-4)
    : ''

  return {
    masked_secret: masked,
    last_rotated_at: data.secret_last_rotated_at,
    rotation_interval_days: data.secret_rotation_interval_days,
    auto_rotate: data.secret_auto_rotate
  }
}

/**
 * Update secret rotation settings
 */
export async function updateRotationSettings(
  webhookId: string,
  userId: string,
  settings: {
    rotation_interval_days?: number
    auto_rotate?: boolean
  }
) {
  const { error } = await supabase
    .from('api_request_webhooks')
    .update(settings)
    .eq('id', webhookId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to update rotation settings')

  await logActivity(userId, '', 'webhook_secret_auto_rotation_enabled', {
    webhook_id: webhookId,
    ...settings
  })
}

/**
 * Auto-rotation engine (runs daily)
 */
export async function runAutoRotation() {
  const now = new Date()

  const { data: webhooks, error } = await supabase
    .from('api_request_webhooks')
    .select('id, user_id, secret_last_rotated_at, secret_rotation_interval_days')
    .eq('secret_auto_rotate', true)

  if (error || !webhooks) return

  for (const wh of webhooks) {
    if (!wh.secret_last_rotated_at) continue

    const lastRotated = new Date(wh.secret_last_rotated_at)
    const daysSinceRotation = (now.getTime() - lastRotated.getTime()) / (1000 * 60 * 60 * 24)
    const interval = wh.secret_rotation_interval_days || 90

    if (daysSinceRotation >= interval) {
      try {
        await rotateSecret(wh.id, wh.user_id)
      } catch (error) {
        console.error(`Failed to auto-rotate secret for webhook ${wh.id}:`, error)
      }
    }
  }
}
