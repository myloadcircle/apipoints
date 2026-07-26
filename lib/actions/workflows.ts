import { supabase } from '@/lib/supabase'

export interface Workflow {
  id: string
  name: string
  description?: string
  owner_id: string
  tenant_id?: string
  mission_graph: any
  version: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  active: boolean
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  triggered_by?: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  current_step: number
  input: any
  output: any
  cost: number
  started_at: string
  completed_at?: string
}

export interface WorkflowStep {
  id: string
  execution_id: string
  step_index: number
  step_type: 'api_call' | 'transform' | 'condition' | 'loop' | 'wait' | 'webhook'
  config: any
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input?: any
  output?: any
  error_message?: string
}

/**
 * List workflows
 */
export async function listWorkflows(ownerId: string, tenantId?: string) {
  let query = supabase
    .from('api_workflows')
    .select('*')
    .eq('owner_id', ownerId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error('Failed to fetch workflows')
  return data || []
}

/**
 * Get workflow by ID
 */
export async function getWorkflow(id: string) {
  const { data, error } = await supabase
    .from('api_workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Workflow not found')
  return data
}

/**
 * Create workflow
 */
export async function createWorkflow(
  name: string,
  ownerId: string,
  missionGraph: any,
  tenantId?: string,
  description?: string
) {
  const { data, error } = await supabase
    .from('api_workflows')
    .insert({
      name,
      owner_id: ownerId,
      tenant_id: tenantId,
      mission_graph: missionGraph,
      description
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create workflow: ${error.message}`)
  return data
}

/**
 * Update workflow
 */
export async function updateWorkflow(id: string, updates: any) {
  const { data, error } = await supabase
    .from('api_workflows')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update workflow: ${error.message}`)
  return data
}

/**
 * Start workflow execution
 */
export async function startExecution(
  workflowId: string,
  triggeredBy: string,
  input: any = {}
) {
  const workflow = await getWorkflow(workflowId)

  const { data, error } = await supabase
    .from('api_workflow_executions')
    .insert({
      workflow_id: workflowId,
      triggered_by: triggeredBy,
      input,
      status: 'running'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to start execution: ${error.message}`)

  // In production, this would trigger the actual execution
  // For now, simulate completion after delay
  const executionId = data.id
  const workflowName = workflow.name
  const missionGraph = workflow.mission_graph

  setTimeout(async () => {
    try {
      // Update execution status
      const { error: updateError } = await supabase
        .from('api_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: { message: 'Workflow completed', workflow: workflowName }
        })
        .eq('id', executionId)

      if (updateError) {
        console.error('Failed to update execution:', updateError.message)
        return
      }

      // Log step completion
      const { error: stepError } = await supabase
        .from('api_workflow_steps')
        .insert({
          execution_id: executionId,
          step_index: 0,
          step_type: 'api_call',
          config: missionGraph,
          status: 'completed',
          output: { result: 'simulated' },
          completed_at: new Date().toISOString()
        })

      if (stepError) {
        console.error('Failed to log step:', stepError.message)
      }
    } catch (err: any) {
      console.error('Failed to complete simulation:', err.message)
    }
  }, 1000)

  return data
}

/**
 * Get workflow executions
 */
export async function getExecutions(workflowId: string, status?: string) {
  let query = supabase
    .from('api_workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch executions')
  return data || []
}

/**
 * Get execution steps
 */
export async function getExecutionSteps(executionId: string) {
  const { data, error } = await supabase
    .from('api_workflow_steps')
    .select('*')
    .eq('execution_id', executionId)
    .order('step_index')

  if (error) throw new Error('Failed to fetch steps')
  return data || []
}

/**
 * Calculate workflow cost
 */
export async function calculateWorkflowCost(workflowId: string): Promise<number> {
  const workflow = await getWorkflow(workflowId)
  const graph = workflow.mission_graph

  // Simple cost calculation based on number of steps
  const steps = graph.steps || []
  const estimatedCost = steps.reduce((total: number, step: any) => {
    switch (step.type) {
      case 'api_call': return total + (step.cost || 0.05)
      case 'transform': return total + 0.01
      case 'condition': return total + 0.001
      case 'loop': return total + 0.05
      case 'wait': return total + 0.001
      case 'webhook': return total + 0.02
      default: return total
    }
  }, 0)

  return estimatedCost
}
