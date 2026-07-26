import { supabase } from '@/lib/supabase'

export interface DashboardMetrics {
  total_apis: number
  total_requests: number
  total_revenue: number
  active_tenants: number
  total_connectors: number
  total_insights: number
  recent_requests: Array<{
    id: string
    api_id: string
    status: string
    created_at: string
  }>
  revenue_by_day: Array<{
    date: string
    revenue: number
  }>
}

export interface UsageMetrics {
  total_requests: number
  total_tokens_in: number
  total_tokens_out: number
  total_tokens: number
  total_cost: number
  recent_usage: Array<{
    id: string
    endpoint: string
    tokens: number
    status: string
    created_at: string
  }>
}

export interface DashboardLogEntry {
  id: string
  agent_name: string
  event_type: string
  message: string
  status: string
  created_at: string
}

export interface WorkflowRun {
  id: string
  workflow_name: string
  steps_executed: number
  duration: number | null
  status: string
  output_summary: string
  started_at: string
}

/**
 * Get dashboard metrics for user
 */
export async function getDashboardMetrics(userId: string) {
  const { count: apiCount } = await supabase
    .from('apis')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: requestCount } = await supabase
    .from('api_billing_ledger')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { data: revenueData } = await supabase
    .from('api_billing_ledger')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'completed')

  const totalRevenue = (revenueData || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0)

  const { count: tenantCount } = await supabase
    .from('api_tenant_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: connectorCount } = await supabase
    .from('api_connectors')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  const { count: insightCount } = await supabase
    .from('api_insights')
    .select('*', { count: 'exact', head: true })

  const { data: recentRequests } = await supabase
    .from('api_billing_ledger')
    .select('id, api_id, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: dailyRevenue } = await supabase
    .from('api_billing_ledger')
    .select('amount, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', sevenDaysAgo)

  const revenueByDay = (dailyRevenue || []).reduce((acc: any, r: any) => {
    const date = new Date(r.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + (r.amount || 0)
    return acc
  }, {})

  const revenueArray = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue
  })).sort((a, b) => a.date.localeCompare(b.date))

  return {
    total_apis: apiCount || 0,
    total_requests: requestCount || 0,
    total_revenue: totalRevenue,
    active_tenants: tenantCount || 0,
    total_connectors: connectorCount || 0,
    total_insights: insightCount || 0,
    recent_requests: recentRequests || [],
    revenue_by_day: revenueArray
  }
}

/**
 * Get usage metrics from api_usage and credit_events
 */
export async function getUsageMetrics(userId: string): Promise<UsageMetrics> {
  const { data: usageData } = await supabase
    .from('api_usage')
    .select('tokens_in, tokens_out, cost')
    .eq('user_id', userId)

  const totalTokensIn = (usageData || []).reduce((s: number, r: any) => s + (r.tokens_in || 0), 0)
  const totalTokensOut = (usageData || []).reduce((s: number, r: any) => s + (r.tokens_out || 0), 0)
  const totalCost = (usageData || []).reduce((s: number, r: any) => s + (r.cost || 0), 0)

  const { count: requestCount } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { data: recentUsage } = await supabase
    .from('api_usage')
    .select('id, endpoint, tokens, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    total_requests: requestCount || 0,
    total_tokens_in: totalTokensIn,
    total_tokens_out: totalTokensOut,
    total_tokens: totalTokensIn + totalTokensOut,
    total_cost: totalCost,
    recent_usage: (recentUsage || []).map((r: any) => ({
      id: r.id,
      endpoint: r.endpoint || 'unknown',
      tokens: r.tokens || 0,
      status: r.status || 'completed',
      created_at: r.created_at
    }))
  }
}

/**
 * Get dashboard logs from agent_logs with optional filters
 */
export async function getDashboardLogs(
  userId: string,
  filters?: {
    agent?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<DashboardLogEntry[]> {
  let query = supabase
    .from('agent_logs')
    .select('id, agent_name, event_type, message, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters?.agent) {
    query = query.eq('agent_name', filters.agent)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Get distinct agent names for log filter dropdown
 */
export async function getAgentNames(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('agent_logs')
    .select('agent_name')
    .eq('user_id', userId)
    .order('agent_name')

  if (error) throw new Error(error.message)
  const nameSet = new Set((data || []).map((r: any) => r.agent_name).filter(Boolean))
  return Array.from(nameSet) as string[]
}

/**
 * Get workflow runs
 */
export async function getWorkflowRuns(userId: string): Promise<WorkflowRun[]> {
  const { data, error } = await supabase
    .from('api_workflow_executions')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      workflow_id,
      output,
      workflow:workflow_id ( name )
    `)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  const runs: WorkflowRun[] = (data || []).map((r: any) => {
    const started = new Date(r.started_at).getTime()
    const completed = r.completed_at ? new Date(r.completed_at).getTime() : Date.now()
    const durationMs = completed - started
    const outputRaw = typeof r.output === 'string' ? JSON.parse(r.output) : r.output
    const outputSummary = outputRaw?.message || outputRaw?.result || JSON.stringify(outputRaw).slice(0, 120)

    return {
      id: r.id,
      workflow_name: r.workflow?.name || 'Unknown',
      steps_executed: 0,
      duration: Math.round(durationMs / 1000),
      status: r.status || 'unknown',
      output_summary: outputSummary,
      started_at: r.started_at
    }
  })

  return runs
}
