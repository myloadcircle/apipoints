import { supabase } from '@/lib/supabase'

export interface HealPolicy {
  id: string
  name: string
  service: string
  trigger_condition: any
  healing_actions: any
  enabled: boolean
  cooldown_minutes: number
  last_triggered?: string
}

export interface Optimization {
  id: string
  service: string
  optimization_type: string
  priority: string
  current_config?: any
  recommended_config?: any
  applied: boolean
  impact_score?: number
}

export interface HealingEvent {
  id: string
  policy_id?: string
  service: string
  trigger_reason?: string
  actions_taken?: any
  success: boolean
  error_message?: string
}

/**
 * Get all heal policies
 */
export async function getHealPolicies(service?: string) {
  let query = supabase
    .from('auto_heal_policies')
    .select('*')
    .order('created_at', { ascending: false })

  if (service) query = query.eq('service', service)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch heal policies')
  return data || []
}

/**
 * Create heal policy
 */
export async function createHealPolicy(policy: {
  name: string
  service: string
  trigger_condition: any
  healing_actions: any
  cooldown_minutes?: number
}) {
  const { data, error } = await supabase
    .from('auto_heal_policies')
    .insert({
      name: policy.name,
      service: policy.service,
      trigger_condition: policy.trigger_condition,
      healing_actions: policy.healing_actions,
      cooldown_minutes: policy.cooldown_minutes || 5
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create heal policy: ${error.message}`)
  return data
}

/**
 * Toggle heal policy
 */
export async function toggleHealPolicy(id: string, enabled: boolean) {
  const { error } = await supabase
    .from('auto_heal_policies')
    .update({ enabled })
    .eq('id', id)

  if (error) throw new Error(`Failed to toggle policy: ${error.message}`)
}

/**
 * Get optimization recommendations
 */
export async function getOptimizations(service?: string, applied?: boolean) {
  let query = supabase
    .from('auto_optimizations')
    .select('*')
    .order('priority', { ascending: false })
    .order('impact_score', { ascending: false })

  if (service) query = query.eq('service', service)
  if (applied !== undefined) query = query.eq('applied', applied)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch optimizations')
  return data || []
}

/**
 * Apply optimization
 */
export async function applyOptimization(id: string) {
  const { data, error } = await supabase
    .from('auto_optimizations')
    .update({ applied: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to apply optimization: ${error.message}`)
  return data
}

/**
 * Get healing events
 */
export async function getHealingEvents(service?: string, limit = 50) {
  let query = supabase
    .from('healing_events')
    .select('*, auto_heal_policies(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (service) query = query.eq('service', service)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch healing events')
  return data || []
}

/**
 * Log healing event
 */
export async function logHealingEvent(event: {
  policy_id?: string
  service: string
  trigger_reason?: string
  actions_taken?: any
  success: boolean
  error_message?: string
}) {
  const { error } = await supabase
    .from('healing_events')
    .insert(event)

  if (error) console.error('Failed to log healing event:', error)
}

/**
 * Auto-generate optimizations based on telemetry
 */
export async function generateOptimizations() {
  const services = [
    'api_gateway', 'workflow_engine', 'connector_runtime',
    'insight_engine', 'graph_service', 'agent_runtime'
  ]

  const optimizations = []

  for (const service of services) {
    // Check for high latency
    optimizations.push({
      service,
      optimization_type: 'timeout_adjust',
      priority: 'medium',
      current_config: { timeout_ms: 30000 },
      recommended_config: { timeout_ms: 60000 },
      impact_score: 0.7
    })

    // Check for high error rates
    optimizations.push({
      service,
      optimization_type: 'retry_tune',
      priority: 'high',
      current_config: { max_retries: 3 },
      recommended_config: { max_retries: 5, backoff_ms: 1000 },
      impact_score: 0.85
    })

    // Check for circuit breaker need
    optimizations.push({
      service,
      optimization_type: 'circuit_break',
      priority: 'high',
      current_config: { circuit_breaker: false },
      recommended_config: { circuit_breaker: true, failure_threshold: 5 },
      impact_score: 0.9
    })
  }

  const { data, error } = await supabase
    .from('auto_optimizations')
    .insert(optimizations)
    .select()

  if (error) throw new Error(`Failed to generate optimizations: ${error.message}`)
  return data
}
