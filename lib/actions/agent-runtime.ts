import { supabase } from '@/lib/supabase'

export interface AgentRuntime {
  id: string
  agent_id: string
  status: 'running' | 'paused' | 'stopped' | 'error'
  memory: any
  context: any
  current_task?: string
  started_at?: string
  last_heartbeat: string
}

export interface AgentMessage {
  id: string
  from_agent_id?: string
  to_agent_id?: string
  message_type: string
  payload: any
  read: boolean
  created_at: string
}

export interface AgentMemory {
  id: string
  agent_id: string
  memory_type: 'short_term' | 'long_term' | 'mission' | 'scratchpad'
  key: string
  value: any
  expires_at?: string
}

/**
 * Start agent runtime
 */
export async function startAgentRuntime(agentId: string) {
  const { data, error } = await supabase
    .from('api_agent_runtime')
    .upsert({
      agent_id: agentId,
      status: 'running',
      started_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString()
    }, {
      onConflict: 'agent_id'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to start runtime: ${error.message}`)
  return data
}

/**
 * Stop agent runtime
 */
export async function stopAgentRuntime(agentId: string) {
  const { error } = await supabase
    .from('api_agent_runtime')
    .update({
      status: 'stopped',
      started_at: null
    })
    .eq('agent_id', agentId)

  if (error) throw new Error(`Failed to stop runtime: ${error.message}`)
}

/**
 * Update heartbeat
 */
export async function updateHeartbeat(agentId: string) {
  const { error } = await supabase
    .from('api_agent_runtime')
    .update({ last_heartbeat: new Date().toISOString() })
    .eq('agent_id', agentId)

  if (error) console.error('Failed to update heartbeat:', error)
}

/**
 * Send message between agents
 */
export async function sendAgentMessage(
  fromAgentId: string,
  toAgentId: string,
  messageType: string,
  payload: any
) {
  const { data, error } = await supabase
    .from('api_agent_messages')
    .insert({
      from_agent_id: fromAgentId,
      to_agent_id: toAgentId,
      message_type: messageType,
      payload
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to send message: ${error.message}`)
  return data
}

/**
 * Get agent's messages
 */
export async function getAgentMessages(agentId: string, unreadOnly = false) {
  let query = supabase
    .from('api_agent_messages')
    .select('*, from_agent:from_agent_id(name), to_agent:to_agent_id(name)')
    .or(`to_agent_id.eq.${agentId},from_agent_id.eq.${agentId}`)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch messages')
  return data || []
}

/**
 * Mark message as read
 */
export async function markMessageRead(messageId: string) {
  const { error } = await supabase
    .from('api_agent_messages')
    .update({ read: true })
    .eq('id', messageId)

  if (error) throw new Error('Failed to mark message as read')
}

/**
 * Store agent memory
 */
export async function storeAgentMemory(
  agentId: string,
  memoryType: string,
  key: string,
  value: any,
  expiresInHours?: number
) {
  const expiresAt = expiresInHours 
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('api_agent_memory')
    .upsert({
      agent_id: agentId,
      memory_type: memoryType,
      key,
      value,
      expires_at: expiresAt
    }, {
      onConflict: 'agent_id,memory_type,key'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to store memory: ${error.message}`)
  return data
}

/**
 * Retrieve agent memory
 */
export async function getAgentMemory(
  agentId: string,
  memoryType?: string,
  key?: string
) {
  let query = supabase
    .from('api_agent_memory')
    .select('*')
    .eq('agent_id', agentId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

  if (memoryType) {
    query = query.eq('memory_type', memoryType)
  }
  if (key) {
    query = query.eq('key', key)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error('Failed to fetch memory')
  return data || []
}

/**
 * Clear expired memory
 */
export async function clearExpiredMemory() {
  const { error } = await supabase
    .from('api_agent_memory')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) console.error('Failed to clear expired memory:', error)
}

/**
 * Get runtime status
 */
export async function getRuntimeStatus(agentId: string) {
  const { data, error } = await supabase
    .from('api_agent_runtime')
    .select('*')
    .eq('agent_id', agentId)
    .single()

  if (error || !data) return null
  return data
}
