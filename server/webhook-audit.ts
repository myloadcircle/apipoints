import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'

export type AuditEventType =
  | 'webhook_created' | 'webhook_updated' | 'webhook_deleted'
  | 'delivery_attempted' | 'delivery_succeeded' | 'delivery_failed'
  | 'retry_scheduled' | 'retry_exhausted'
  | 'dlq_moved' | 'dlq_replayed' | 'dlq_deleted'
  | 'circuit_opened' | 'circuit_closed' | 'circuit_half_open'
  | 'throttling_triggered' | 'global_throttle_triggered'
  | 'sla_breach' | 'sla_auto_disabled'
  | 'region_failover' | 'region_strategy_updated'
  | 'transform_updated' | 'secret_rotated' | 'secret_auto_rotation_enabled'
  | 'health_check_failed' | 'health_check_passed'
  | 'compliance_mode_enabled' | 'compliance_mode_disabled'
  | 'audit_logged' | 'retention_policy_updated'
  | 'version_created' | 'version_rolled_back'

/**
 * Log audit event (immutable)
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  webhookId: string,
  requestId: string | null,
  actorType: 'system' | 'user',
  actorId: string,
  metadata: any = {}
) {
  const { error } = await supabase
    .from('api_webhook_audit_logs')
    .insert({
      event_type: eventType,
      webhook_id: webhookId,
      request_id: requestId,
      actor_type: actorType,
      actor_id: actorId,
      metadata
    })

  if (error) throw new Error('Failed to log audit event')
}

/**
 * Get audit logs for a webhook
 */
export async function getAuditLogs(
  webhookId: string,
  userId: string,
  filters?: {
    eventType?: string
    dateFrom?: string
    dateTo?: string
  }
) {
  // Verify ownership
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', webhookId)
    .single()

  if (!webhook || webhook.user_id !== userId) {
    throw new Error('Unauthorized')
  }

  let query = supabase
    .from('api_webhook_audit_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters?.eventType) {
    query = query.eq('event_type', filters.eventType)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data, error } = await query

  if (error) throw new Error('Failed to fetch audit logs')
  return data || []
}

/**
 * Export audit logs (simplified - returns JSON)
 */
export async function exportAuditLogs(userId: string): Promise<any[]> {
  // Get all user's webhooks
  const { data: webhooks } = await supabase
    .from('api_request_webhooks')
    .select('id')
    .eq('user_id', userId)

  const webhookIds = webhooks?.map(wh => wh.id) || []

  if (webhookIds.length === 0) return []

  const { data, error } = await supabase
    .from('api_webhook_audit_logs')
    .select('*')
    .in('webhook_id', webhookIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to export audit logs')
  return data || []
}

/**
 * Update retention policy
 */
export async function updateRetentionPolicy(
  userId: string,
  policy: { retention_days?: number; purge_enabled?: boolean }
) {
  // Upsert policy
  const { error } = await supabase
    .from('api_webhook_retention_policies')
    .upsert({
      user_id: userId,
      ...policy,
      updated_at: new Date().toISOString()
    })

  if (error) throw new Error('Failed to update retention policy')

  await logActivity(userId, '', 'retention_policy_updated', policy)
}
