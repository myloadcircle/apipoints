import { supabase } from '@/lib/supabase'

export const AGENT_TEMPLATES = {
  researcher: {
    name: 'Research Agent',
    role: 'Researcher',
    systemPrompt: 'You are a research agent. Your job is to gather information, summarise sources, and extract insights.'
  },
  writer: {
    name: 'Writing Agent',
    role: 'Writer',
    systemPrompt: 'You are a writing agent. Your job is to produce clean, structured, high-quality written output.'
  },
  coder: {
    name: 'Coding Agent',
    role: 'Coder',
    systemPrompt: 'You are a coding agent. Your job is to generate code, fix bugs, and explain technical concepts.'
  },
  analyst: {
    name: 'Analysis Agent',
    role: 'Analyst',
    systemPrompt: 'You are an analysis agent. Your job is to evaluate data, compare options, and produce conclusions.'
  }
}

export interface Agent {
  id: string
  user_id: string
  name: string
  role: string
  system_prompt: string
}

export interface Workflow {
  id: string
  user_id: string
  name: string
}

export interface WorkflowStep {
  id: string
  workflow_id: string
  agent_id: string
  step_order: number
}

/**
 * Get user's agents
 */
export async function getAgents(userId: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch agents')
  return data || []
}

/**
 * Create agent
 */
export async function createAgent(agent: {
  user_id: string
  name: string
  role: string
  system_prompt: string
}) {
  const { data, error } = await supabase
    .from('agents')
    .insert(agent)
    .select()
    .single()

  if (error) throw new Error(`Failed to create agent: ${error.message}`)
  return data
}

/**
 * Get user's workflows
 */
export async function getWorkflows(userId: string) {
  const { data, error } = await supabase
    .from('workflows')
    .select('*, workflow_steps(*, agents(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch workflows')
  return data || []
}

/**
 * Create workflow
 */
export async function createWorkflow(workflow: {
  user_id: string
  name: string
  agentIds: string[]
}) {
  // Create workflow
  const { data: wf, error: wfError } = await supabase
    .from('workflows')
    .insert({ user_id: workflow.user_id, name: workflow.name })
    .select()
    .single()

  if (wfError) throw new Error(`Failed to create workflow: ${wfError.message}`)

  // Add workflow steps
  const steps = workflow.agentIds.map((agentId, index) => ({
    workflow_id: wf.id,
    agent_id: agentId,
    step_order: index + 1
  }))

  const { error: stepsError } = await supabase
    .from('workflow_steps')
    .insert(steps)

  if (stepsError) throw new Error(`Failed to add steps: ${stepsError.message}`)

  return wf
}

/**
 * Run single agent
 */
export async function runAgent(agentId: string, input: string, userId: string) {
  // Get agent
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single()

  if (error || !agent) throw new Error('Agent not found')

  // Calculate burn
  const { calculateBurn } = await import('@/lib/actions/credits')
  const burn = calculateBurn({ providers: 1, retries: 0, fallbacks: 0 })

  // Burn credits
  const { burnCredits } = await import('@/lib/actions/credits')
  await burnCredits(userId, burn, 'agent_call', { agentId, input })

  // Call OpenAI (mock for now)
  let output = `Mock response from ${agent.name} for input: ${input}`

  // Log execution
  await supabase
    .from('agent_logs')
    .insert({
      user_id: userId,
      agent_name: agent.name,
      input,
      output,
      credits_burned: burn
    })

  return output
}

/**
 * Run workflow
 */
export async function runWorkflow(workflowId: string, initialInput: string, userId: string) {
  // Get workflow steps
  const { data: steps, error } = await supabase
    .from('workflow_steps')
    .select('*, agents(*)')
    .eq('workflow_id', workflowId)
    .order('step_order', { ascending: true })

  if (error) throw new Error('Failed to fetch workflow steps')

  let output = initialInput

  for (const step of steps) {
    output = await runAgent(step.agent_id, output, userId)
  }

  return output
}

/**
 * Publish agent to marketplace
 */
export async function publishAgent(agentId: string, userId: string) {
  // Get agent
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single()

  if (error || !agent) throw new Error('Agent not found')

  // Publish to shared_agents
  const { data, error: publishError } = await supabase
    .from('shared_agents')
    .insert({
      creator_id: userId,
      name: agent.name,
      role: agent.role,
      system_prompt: agent.system_prompt
    })
    .select()
    .single()

  if (publishError) throw new Error(`Failed to publish agent: ${publishError.message}`)
  return data
}

/**
 * Get shared agents (marketplace)
 */
export async function getSharedAgents(role?: string) {
  let query = supabase
    .from('shared_agents')
    .select('*, auth.users(email)')
    .order('downloads', { ascending: false })

  if (role) query = query.eq('role', role)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch shared agents')
  return data || []
}

/**
 * Import agent from marketplace
 */
export async function importAgent(sharedAgentId: string, userId: string) {
  // Get shared agent
  const { data: shared, error } = await supabase
    .from('shared_agents')
    .select('*')
    .eq('id', sharedAgentId)
    .single()

  if (error || !shared) throw new Error('Shared agent not found')

  // Import to user's agents
  const { data, error: importError } = await supabase
    .from('agents')
    .insert({
      user_id: userId,
      name: shared.name,
      role: shared.role,
      system_prompt: shared.system_prompt
    })
    .select()
    .single()

  if (importError) throw new Error(`Failed to import agent: ${importError.message}`)

  // Track import
  await supabase
    .from('imported_agents')
    .insert({
      user_id: userId,
      shared_agent_id: sharedAgentId
    })

  // Increment downloads
  await supabase
    .from('shared_agents')
    .update({ downloads: shared.downloads + 1 })
    .eq('id', sharedAgentId)

  return data
}

export const WORKFLOW_TEMPLATES = {
  research_pipeline: {
    name: 'Research Pipeline',
    steps: ['researcher', 'analyst', 'writer']
  },
  content_pipeline: {
    name: 'Content Pipeline',
    steps: ['researcher', 'writer']
  },
  coding_pipeline: {
    name: 'Coding Pipeline',
    steps: ['researcher', 'coder', 'analyst']
  }
}

/**
 * Create workflow from template
 */
export async function createWorkflowFromTemplate(templateKey: string, userId: string) {
  const template = WORKFLOW_TEMPLATES[templateKey as keyof typeof WORKFLOW_TEMPLATES]
  if (!template) throw new Error('Template not found')

  // Create workflow
  const { data: wf, error: wfError } = await supabase
    .from('workflows')
    .insert({ user_id: userId, name: template.name })
    .select()
    .single()

  if (wfError) throw new Error(`Failed to create workflow: ${wfError.message}`)

  // Get agents for each step
  for (let i = 0; i < template.steps.length; i++) {
    const role = template.steps[i]

    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .limit(1)

    if (agents && agents.length > 0) {
      await supabase
        .from('workflow_steps')
        .insert({
          workflow_id: wf.id,
          agent_id: agents[0].id,
          step_order: i + 1
        })
    }
  }

  return wf
}

/**
 * Search marketplace
 */
export async function searchMarketplace(query?: string, role?: string, minRating?: number) {
  let supabaseQuery = supabase
    .from('shared_agents')
    .select(`
      *,
      agent_ratings(rating)
    `)
    .order('downloads', { ascending: false })

  if (query) {
    supabaseQuery = supabaseQuery.ilike('name', `%${query}%`)
  }

  if (role) {
    supabaseQuery = supabaseQuery.eq('role', role)
  }

  const { data, error } = await supabaseQuery

  if (error) throw new Error('Search failed')

  // Calculate average ratings
  const results = (data || []).map((agent: any) => {
    const ratings = agent.agent_ratings || []
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0
    return {
      ...agent,
      avg_rating: avgRating,
      rating_count: ratings.length
    }
  })

  // Filter by min rating
  if (minRating && minRating > 0) {
    return results.filter(r => r.avg_rating >= minRating)
  }

  return results
}

/**
 * Rate a shared agent
 */
export async function rateAgent(sharedAgentId: string, userId: string, rating: number, review?: string) {
  const { error } = await supabase
    .from('agent_ratings')
    .insert({
      shared_agent_id: sharedAgentId,
      user_id: userId,
      rating,
      review
    })

  if (error) throw new Error(`Failed to rate agent: ${error.message}`)
}

/**
 * Get workflow analytics
 */
export async function getWorkflowAnalytics(userId: string) {
  const { data, error } = await supabase
    .rpc('get_workflow_analytics', { user_id: userId })

  if (error) {
    // Fallback if RPC not available
    const { data: workflows } = await supabase
      .from('workflows')
      .select(`
        *,
        workflow_steps(
          *,
          agents(name)
        )
      `)
      .eq('user_id', userId)

    return workflows || []
  }

  return data || []
}

/**
 * Create team
 */
export async function createTeam(name: string, userId: string) {
  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ owner_id: userId, name })
    .select()
    .single()

  if (teamError) throw new Error(`Failed to create team: ${teamError.message}`)

  // Add owner as team member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: userId,
      role: 'owner'
    })

  if (memberError) throw new Error(`Failed to add team member: ${memberError.message}`)

  return team
}

/**
 * Get user's teams
 */
export async function getTeams(userId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      teams(*)
    `)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to fetch teams')
  return (data || []).map((tm: any) => tm.teams)
}

/**
 * Share agent with team
 */
export async function shareAgentWithTeam(teamId: string, agentId: string, userId: string) {
  // Verify user is team member
  const { data: membership } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (!membership) throw new Error('Not a team member')

  const { error } = await supabase
    .from('team_shared_agents')
    .insert({
      team_id: teamId,
      agent_id: agentId
    })

  if (error) throw new Error(`Failed to share agent: ${error.message}`)
}

export const TEAM_SUBSCRIPTION_PLANS = {
  starter: { price: 'price_team_starter_4999', credits: 10000000 },
  pro: { price: 'price_team_pro_14999', credits: 50000000 },
  enterprise: { price: 'price_team_enterprise_49999', credits: 250000000 }
}

/**
 * Get or create team Stripe customer
 */
export async function getOrCreateTeamStripeCustomer(teamId: string) {
  const { data: existing } = await supabase
    .from('team_stripe_customers')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (existing) return existing

  const stripeCustomerId = `cus_team_mock_${Date.now()}`

  const { data, error } = await supabase
    .from('team_stripe_customers')
    .insert({ team_id: teamId, stripe_customer_id: stripeCustomerId })
    .select()
    .single()

  if (error) throw new Error(`Failed to create team Stripe customer: ${error.message}`)
  return data
}

/**
 * Create team subscription session
 */
export async function createTeamSubscriptionSession(teamId: string, tier: string) {
  const customer = await getOrCreateTeamStripeCustomer(teamId)
  const plan = TEAM_SUBSCRIPTION_PLANS[tier as keyof typeof TEAM_SUBSCRIPTION_PLANS]

  if (!plan) throw new Error('Invalid subscription tier')

  const mockSessionUrl = `https://APIPoints.site/team/dashboard?sub=success&tier=${tier}&session=mock_${Date.now()}`
  return mockSessionUrl
}

/**
 * Create team top-up session
 */
export async function createTeamTopUpSession(teamId: string) {
  const customer = await getOrCreateTeamStripeCustomer(teamId)

  const mockSessionUrl = `https://APIPoints.site/team/dashboard?topup=success&session=mock_${Date.now()}`
  return mockSessionUrl
}

/**
 * Burn team credits
 */
export async function burnTeamCredits(teamId: string, burnAmount: number, details?: any) {
  const { error } = await supabase
    .from('team_credit_pools')
    .update({
      credits_remaining: supabase.rpc('decrement', { amount: burnAmount }),
      credits_used: supabase.rpc('increment', { amount: burnAmount }),
      last_updated: new Date().toISOString()
    })
    .eq('team_id', teamId)

  if (error) throw new Error(`Failed to burn team credits: ${error.message}`)

  await supabase
    .from('usage_events')
    .insert({
      user_id: teamId, // Using user_id field for team_id
      event_type: 'team_agent_execution',
      credits_burned: burnAmount,
      metadata: details
    })
}

/**
 * Get or create SSO config
 */
export async function getSSOConfig(teamId: string) {
  const { data, error } = await supabase
    .from('enterprise_sso_configs')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get SSO config: ${error.message}`)
  }
  return data
}

/**
 * Start SSO login
 */
export async function startSSOLogin(teamId: string) {
  const config = await getSSOConfig(teamId)
  if (!config) throw new Error('SSO not configured for this team')

  if (config.provider === 'google') {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.client_id}&redirect_uri=https://APIPoints.site/sso/callback&response_type=code&scope=openid email profile&state=${teamId}`
  }

  if (config.provider === 'microsoft') {
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.client_id}&response_type=code&redirect_uri=https://APIPoints.site/sso/callback&scope=openid email profile&state=${teamId}`
  }

  if (config.provider === 'saml') {
    return config.saml_metadata // Redirect to IdP
  }

  throw new Error('Unsupported SSO provider')
}

/**
 * Log audit event
 */
export async function logAudit(teamId: string, userId: string, action: string, metadata?: any) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      team_id: teamId,
      user_id: userId,
      action,
      metadata
    })

  if (error) console.error('Failed to log audit:', error)
}

/**
 * Check team rate limit
 */
export async function checkTeamRateLimit(teamId: string) {
  const now = new Date()
  
  const { data: limit, error } = await supabase
    .from('team_rate_limits')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (error || !limit) {
    // Create default rate limit
    await supabase
      .from('team_rate_limits')
      .insert({ team_id: teamId })
    return true
  }

  const windowStart = new Date(limit.current_window_start)
  const diffSeconds = (now.getTime() - windowStart.getTime()) / 1000

  // Reset if window expired (>60 seconds)
  if (diffSeconds > 60) {
    await supabase
      .from('team_rate_limits')
      .update({
        current_window_start: now.toISOString(),
        request_count: 1
      })
      .eq('team_id', teamId)
    return true
  }

  // Check if over limit
  if (limit.request_count >= limit.max_requests_per_minute) {
    return false
  }

  // Increment count
  await supabase
    .from('team_rate_limits')
    .update({ request_count: limit.request_count + 1 })
    .eq('team_id', teamId)

  return true
}

/**
 * Get audit logs
 */
export async function getAuditLogs(teamId: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, auth.users(email)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error('Failed to fetch audit logs')
  return data || []
}

/**
 * Get team rate limit status
 */
export async function getTeamRateLimit(teamId: string) {
  const { data, error } = await supabase
    .from('team_rate_limits')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to fetch rate limit')
  }
  return data || { max_requests_per_minute: 200, request_count: 0 }
}

/**
 * Get org policies
 */
export async function getOrgPolicies(teamId: string) {
  const { data, error } = await supabase
    .from('org_policies')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to fetch org policies')
  }
  return data || {
    allow_external_api: true,
    allow_code_execution: false,
    max_agent_runtime_ms: 20000,
    max_parallel_agents: 5
  }
}

/**
 * Update org policies
 */
export async function updateOrgPolicies(teamId: string, policies: {
  allow_external_api?: boolean
  allow_code_execution?: boolean
  max_agent_runtime_ms?: number
  max_parallel_agents?: number
}) {
  const existing = await getOrgPolicies(teamId)

  if (existing.id) {
    const { error } = await supabase
      .from('org_policies')
      .update(policies)
      .eq('team_id', teamId)

    if (error) throw new Error(`Failed to update policies: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('org_policies')
      .insert({ team_id: teamId, ...policies })

    if (error) throw new Error(`Failed to create policies: ${error.message}`)
  }
}

/**
 * Enforce org policies
 */
export async function enforceOrgPolicies(teamId: string, agentId: string) {
  const { data: policy } = await supabase
    .from('org_policies')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (policy && !policy.allow_external_api) {
    throw new Error('External API calls are disabled by org policy.')
  }

  if (policy && !policy.allow_code_execution) {
    throw new Error('Code execution is disabled by org policy.')
  }

  // Check quota
  await enforceAgentQuota(teamId, agentId)
}

/**
 * Enforce agent quota
 */
export async function enforceAgentQuota(teamId: string, agentId: string) {
  const { data: quota } = await supabase
    .from('agent_execution_quotas')
    .select('*')
    .eq('team_id', teamId)
    .eq('agent_id', agentId)
    .single()

  const today = new Date().toISOString().slice(0, 10)

  if (!quota) {
    await supabase
      .from('agent_execution_quotas')
      .insert({
        team_id: teamId,
        agent_id: agentId,
        runs_today: 1,
        last_reset: today
      })
    return
  }

  if (quota.last_reset !== today) {
    await supabase
      .from('agent_execution_quotas')
      .update({
        runs_today: 1,
        last_reset: today
      })
      .eq('id', quota.id)
    return
  }

  if (quota.runs_today >= quota.max_runs_per_day) {
    throw new Error('Daily execution quota exceeded for this agent.')
  }

  await supabase
    .from('agent_execution_quotas')
    .update({ runs_today: quota.runs_today + 1 })
    .eq('id', quota.id)
}

/**
 * Run sandboxed agent
 */
export async function runSandboxedAgent(teamId: string, agentId: string, input: string) {
  // Enforce policies
  await enforceOrgPolicies(teamId, agentId)

  const { data: policy } = await supabase
    .from('org_policies')
    .select('max_agent_runtime_ms')
    .eq('team_id', teamId)
    .single()

  const maxRuntime = policy?.max_agent_runtime_ms || 20000

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), maxRuntime)

  try {
    // Mock execution (replace with actual in production)
    const output = `Sandboxed execution (max ${maxRuntime}ms): ${input}`

    clearTimeout(timeout)
    return output
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Agent execution exceeded runtime limit.')
    }
    throw err
  }
}

/**
 * Audit-safe logging
 */
export async function auditSafeLog(teamId: string, userId: string, action: string, metadata: any = {}) {
  // Truncate metadata to prevent log overflow
  const safeMetadata = JSON.stringify(metadata).slice(0, 5000)

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      team_id: teamId,
      user_id: userId,
      action,
      metadata: safeMetadata
    })

  if (error) console.error('Failed to log audit:', error)
}

/**
 * Get team usage analytics
 */
export async function getTeamUsageAnalytics(teamId: string) {
  const { data: stats, error } = await supabase
    .from('usage_events')
    .select('*')
    .eq('user_id', teamId)
    .eq('event_type', 'team_agent_execution')

  if (error) throw new Error('Failed to fetch team analytics')

  const totalCredits = (stats || []).reduce((sum: number, e: any) => sum + e.credits_burned, 0)
  const totalEvents = (stats || []).length
  const firstUsage = stats && stats.length > 0 ? stats[stats.length - 1].created_at : null
  const lastUsage = stats && stats.length > 0 ? stats[0].created_at : null

  // Get per-agent stats
  const perAgent = (stats || []).reduce((acc: any, e: any) => {
    const agentName = e.metadata?.agentName || 'Unknown'
    if (!acc[agentName]) {
      acc[agentName] = { runs: 0, credits: 0 }
    }
    acc[agentName].runs++
    acc[agentName].credits += e.credits_burned
    return acc
  }, {})

  return {
    stats: { total_credits: totalCredits, total_events: totalEvents, first_usage: firstUsage, last_usage: lastUsage },
    perAgent: Object.entries(perAgent).map(([name, data]: [string, any]) => ({ agent_name: name, ...data }))
  }
}
