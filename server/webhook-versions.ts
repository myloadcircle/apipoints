import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import * as crypto from 'crypto'

interface WebhookConfig {
  url: string
  method: string
  secret: string
  retry_enabled: boolean
  max_attempts: number
  retry_strategy: string
  retry_interval_seconds: number
  backoff_factor: number
  circuit_breaker_enabled: boolean
  failure_threshold: number
  rate_limit_enabled: boolean
  max_requests_per_minute: number
  max_requests_per_hour: number
  transform_type?: string
  mapping_rules?: any
  template_body?: string
  script_body?: string
  preferred_region: string
  failover_regions: string[]
  region_strategy: string
  sla_enabled: boolean
  max_latency_ms: number
  max_failure_rate: number
}

/**
 * Create a new version snapshot
 */
export async function createVersion(
  webhookId: string,
  userId: string,
  comment?: string
): Promise<number> {
  // Get current webhook config
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (error || !webhook) {
    throw new Error('Webhook not found or unauthorized')
  }

  // Get latest version number
  const { data: latestVersion } = await supabase
    .from('api_webhook_versions')
    .select('version_number')
    .eq('webhook_id', webhookId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const newVersionNumber = (latestVersion?.version_number || 0) + 1

  // Build config snapshot (mask secret)
  const config: WebhookConfig = {
    url: webhook.url,
    method: webhook.method || 'POST',
    secret: webhook.secret ? webhook.secret.slice(-4) : '', // Only last 4 chars
    retry_enabled: webhook.retry_enabled ?? true,
    max_attempts: webhook.max_attempts ?? 3,
    retry_strategy: webhook.retry_strategy ?? 'exponential',
    retry_interval_seconds: webhook.retry_interval_seconds ?? 30,
    backoff_factor: webhook.backoff_factor ?? 2.0,
    circuit_breaker_enabled: webhook.circuit_breaker_enabled ?? true,
    failure_threshold: webhook.failure_threshold ?? 5,
    rate_limit_enabled: webhook.rate_limit_enabled ?? false,
    max_requests_per_minute: webhook.max_requests_per_minute ?? 60,
    max_requests_per_hour: webhook.max_requests_per_hour ?? 1000,
    transform_type: webhook.transform_type,
    mapping_rules: webhook.mapping_rules,
    template_body: webhook.template_body,
    script_body: webhook.script_body,
    preferred_region: webhook.preferred_region ?? 'eu-west',
    failover_regions: webhook.failover_regions ?? ['us-east', 'ap-south'],
    region_strategy: webhook.region_strategy ?? 'primary',
    sla_enabled: webhook.sla_enabled ?? false,
    max_latency_ms: webhook.max_latency_ms ?? 2000,
    max_failure_rate: webhook.max_failure_rate ?? 0.05
  }

  // Insert version
  const { error: versionError } = await supabase
    .from('api_webhook_versions')
    .insert({
      webhook_id: webhookId,
      version_number: newVersionNumber,
      config,
      created_by: userId,
      comment
    })

  if (versionError) {
    throw new Error('Failed to create version')
  }

  await logActivity(userId, '', 'webhook_version_created', {
    webhook_id: webhookId,
    version_number: newVersionNumber,
    comment
  })

  return newVersionNumber
}

/**
 * Get all versions for a webhook
 */
export async function getVersions(webhookId: string, userId: string) {
  // Verify ownership
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', webhookId)
    .single()

  if (!webhook || webhook.user_id !== userId) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('api_webhook_versions')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to fetch versions')
  return data || []
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  webhookId: string,
  versionNumber: number,
  userId: string
) {
  // Get version
  const { data: version, error } = await supabase
    .from('api_webhook_versions')
    .select('*')
    .eq('webhook_id', webhookId)
    .eq('version_number', versionNumber)
    .single()

  if (error || !version) {
    throw new Error('Version not found')
  }

  const config = version.config as WebhookConfig

  // Restore config (except secret - handle separately)
  const updates: any = {
    url: config.url,
    method: config.method,
    retry_enabled: config.retry_enabled,
    max_attempts: config.max_attempts,
    retry_strategy: config.retry_strategy,
    retry_interval_seconds: config.retry_interval_seconds,
    backoff_factor: config.backoff_factor,
    circuit_breaker_enabled: config.circuit_breaker_enabled,
    failure_threshold: config.failure_threshold,
    rate_limit_enabled: config.rate_limit_enabled,
    max_requests_per_minute: config.max_requests_per_minute,
    max_requests_per_hour: config.max_requests_per_hour,
    preferred_region: config.preferred_region,
    failover_regions: config.failover_regions,
    region_strategy: config.region_strategy,
    sla_enabled: config.sla_enabled,
    max_latency_ms: config.max_latency_ms,
    max_failure_rate: config.max_failure_rate
  }

  // Handle transform fields
  if (config.transform_type) {
    updates.transform_type = config.transform_type
    updates.mapping_rules = config.mapping_rules
    updates.template_body = config.template_body
    updates.script_body = config.script_body
  }

  const { error: updateError } = await supabase
    .from('api_request_webhooks')
    .update(updates)
    .eq('id', webhookId)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error('Failed to rollback')
  }

  // Create new version marking the rollback
  await createVersion(webhookId, userId, `Rollback to version ${versionNumber}`)

  await logActivity(userId, '', 'webhook_version_rolled_back', {
    webhook_id: webhookId,
    rolled_back_to: versionNumber
  })
}

/**
 * Compare two versions and return diff
 */
export function compareVersions(version1: any, version2: any) {
  const config1 = version1.config
  const config2 = version2.config

  const changes: Array<{
    field: string
    oldValue: any
    newValue: any
    status: 'added' | 'removed' | 'changed'
  }> = []

  const allKeys = new Set([
    ...Object.keys(config1 || {}),
    ...Object.keys(config2 || {})
  ])

  const allKeysArray = Array.from(allKeys)
  for (const key of allKeysArray) {
    const val1 = (config1 as any)?.[key]
    const val2 = (config2 as any)?.[key]

    if (val1 === undefined && val2 !== undefined) {
      changes.push({ field: key, oldValue: null, newValue: val2, status: 'added' })
    } else if (val1 !== undefined && val2 === undefined) {
      changes.push({ field: key, oldValue: val1, newValue: null, status: 'removed' })
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changes.push({ field: key, oldValue: val1, newValue: val2, status: 'changed' })
    }
  }

  return changes
}
