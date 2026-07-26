import { supabase } from '@/lib/supabase'

export interface AutonomousAgent {
  id: string
  name: string
  agent_type: string
  status: string
  config?: any
  last_run?: string
  run_count: number
}

export interface SelfDrivingMission {
  id: string
  title: string
  description?: string
  mission_type: string
  priority: string
  status: string
  input_data?: any
  result_data?: any
  started_at?: string
  completed_at?: string
}

export interface LearningEntry {
  id: string
  context_type: string
  context_key: string
  learning_data: any
  confidence: number
  applied: boolean
}

/**
 * Get autonomous agents
 */
export async function getAutonomousAgents(type?: string) {
  let query = supabase
    .from('autonomous_agents')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('agent_type', type)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch agents')
  return data || []
}

/**
 * Create autonomous agent
 */
export async function createAutonomousAgent(agent: {
  name: string
  agent_type: string
  config?: any
}) {
  const { data, error } = await supabase
    .from('autonomous_agents')
    .insert({
      name: agent.name,
      agent_type: agent.agent_type,
      config: agent.config || {}
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create agent: ${error.message}`)
  return data
}

/**
 * Toggle agent status
 */
export async function toggleAgentStatus(id: string, status: string) {
  const { error } = await supabase
    .from('autonomous_agents')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(`Failed to toggle agent: ${error.message}`)
}

/**
 * Get missions
 */
export async function getMissions(status?: string, missionType?: string) {
  let query = supabase
    .from('self_driving_missions')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (missionType) query = query.eq('mission_type', missionType)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch missions')
  return data || []
}

/**
 * Create mission
 */
export async function createMission(mission: {
  title: string
  description?: string
  mission_type: string
  priority?: string
  input_data?: any
}) {
  const { data, error } = await supabase
    .from('self_driving_missions')
    .insert({
      title: mission.title,
      description: mission.description,
      mission_type: mission.mission_type,
      priority: mission.priority || 'medium',
      input_data: mission.input_data
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create mission: ${error.message}`)
  return data
}

/**
 * Complete mission
 */
export async function completeMission(id: string, resultData?: any) {
  const { data, error } = await supabase
    .from('self_driving_missions')
    .update({
      status: 'completed',
      result_data: resultData,
      completed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to complete mission: ${error.message}`)
  return data
}

/**
 * Get learning entries
 */
export async function getLearningEntries(contextType?: string, applied?: boolean) {
  let query = supabase
    .from('learning_entries')
    .select('*')
    .order('confidence', { ascending: false })
    .order('created_at', { ascending: false })

  if (contextType) query = query.eq('context_type', contextType)
  if (applied !== undefined) query = query.eq('applied', applied)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch learning entries')
  return data || []
}

/**
 * Add learning entry
 */
export async function addLearningEntry(entry: {
  context_type: string
  context_key: string
  learning_data: any
  confidence?: number
}) {
  const { data, error } = await supabase
    .from('learning_entries')
    .insert({
      context_type: entry.context_type,
      context_key: entry.context_key,
      learning_data: entry.learning_data,
      confidence: entry.confidence || 0.5
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add learning entry: ${error.message}`)
  return data
}

/**
 * Apply learning
 */
export async function applyLearning(id: string) {
  const { error } = await supabase
    .from('learning_entries')
    .update({ applied: true })
    .eq('id', id)

  if (error) throw new Error(`Failed to apply learning: ${error.message}`)
}

/**
 * Log autonomous decision
 */
export async function logDecision(decision: {
  agent_id?: string
  mission_id?: string
  decision_type: string
  reasoning?: string
  action_taken?: any
  outcome?: any
  success?: boolean
}) {
  const { error } = await supabase
    .from('autonomous_decisions')
    .insert(decision)

  if (error) console.error('Failed to log decision:', error)
}

/**
 * Initialize default autonomous agents
 */
export async function initializeAutonomousAgents() {
  const defaultAgents = [
    { name: 'API Discovery Agent', agent_type: 'discovery', config: { scan_interval: 300 } },
    { name: 'Performance Optimizer', agent_type: 'optimizer', config: { threshold_ms: 500 } },
    { name: 'Self-Healing Agent', agent_type: 'healer', config: { auto_retry: true } },
    { name: 'Smart Router', agent_type: 'router', config: { strategy: 'latency_based' } },
    { name: 'System Monitor', agent_type: 'monitor', config: { check_interval: 60 } },
    { name: 'Compliance Checker', agent_type: 'compliance', config: { strict_mode: true } }
  ]

  const { data, error } = await supabase
    .from('autonomous_agents')
    .upsert(defaultAgents, { onConflict: 'name' })
    .select()

  if (error) throw new Error(`Failed to initialize agents: ${error.message}`)
  return data
}
