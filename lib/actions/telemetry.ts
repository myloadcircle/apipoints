import { supabase } from '@/lib/supabase'

export interface Telemetry {
  id: string
  service: string
  metric_type: string
  value: number
  tags?: any
  timestamp: string
}

export interface Diagnostic {
  id: string
  service: string
  diagnostic_type: string
  severity: 'info' | 'warning' | 'critical'
  details?: any
  resolved: boolean
}

export interface Mitigation {
  id: string
  diagnostic_id: string
  action_type: string
  status: string
  details?: any
}

/**
 * Log telemetry data
 */
export async function logTelemetry(
  service: string,
  metricType: string,
  value: number,
  tags?: any
) {
  const { error } = await supabase
    .from('api_telemetry')
    .insert({
      service,
      metric_type: metricType,
      value,
      tags
    })

  if (error) console.error('Failed to log telemetry:', error)
}

/**
 * Get telemetry data
 */
export async function getTelemetry(
  service?: string,
  metricType?: string,
  limit = 100
) {
  let query = supabase
    .from('api_telemetry')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (service) query = query.eq('service', service)
  if (metricType) query = query.eq('metric_type', metricType)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch telemetry')
  return data || []
}

/**
 * Create diagnostic
 */
export async function createDiagnostic(
  service: string,
  diagnosticType: string,
  severity = 'warning',
  details?: any
) {
  const { data, error } = await supabase
    .from('api_diagnostics')
    .insert({
      service,
      diagnostic_type: diagnosticType,
      severity,
      details
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create diagnostic: ${error.message}`)
  return data
}

/**
 * Get active diagnostics
 */
export async function getDiagnostics(
  service?: string,
  severity?: string,
  unresolvedOnly = true
) {
  let query = supabase
    .from('api_diagnostics')
    .select('*')
    .order('created_at', { ascending: false })

  if (service) query = query.eq('service', service)
  if (severity) query = query.eq('severity', severity)
  if (unresolvedOnly) query = query.eq('resolved', false)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch diagnostics')
  return data || []
}

/**
 * Trigger auto-mitigation
 */
export async function triggerMitigation(
  diagnosticId: string,
  actionType: string,
  details?: any
) {
  // Log mitigation action
  const { data, error } = await supabase
    .from('api_mitigations')
    .insert({
      diagnostic_id: diagnosticId,
      action_type: actionType,
      details,
      status: 'completed' // Simplified - in production would be async
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to trigger mitigation: ${error.message}`)

  // Mark diagnostic as resolved
  await supabase
    .from('api_diagnostics')
    .update({ resolved: true })
    .eq('id', diagnosticId)

  return data
}

/**
 * Get system health summary
 */
export async function getSystemHealth() {
  const { data: telemetry } = await supabase
    .from('api_telemetry')
    .select('service, metric_type, value')
    .gt('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())

  const { data: diagnostics } = await supabase
    .from('api_diagnostics')
    .select('severity', { count: 'exact' })
    .eq('resolved', false)

  const health: any = {
    services: {},
    open_diagnostics: diagnostics?.length || 0
  }

  ;(telemetry || []).forEach((t: any) => {
    if (!health.services[t.service]) {
      health.services[t.service] = {
        latency: 0,
        error_rate: 0,
        throughput: 0,
        last_update: t.timestamp
      }
    }

    switch (t.metric_type) {
      case 'latency':
        health.services[t.service].latency = Math.max(health.services[t.service].latency, t.value)
        break
      case 'error_rate':
        health.services[t.service].error_rate = t.value
        break
      case 'throughput':
        health.services[t.service].throughput += t.value
        break
    }
  })

  return health
}
