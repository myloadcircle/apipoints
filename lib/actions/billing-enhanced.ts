import { supabase } from '@/lib/supabase'

export interface BillingAlert {
  id: string
  user_id: string
  tenant_id?: string
  alert_type: string
  threshold_percent: number
  message: string
  read: boolean
}

export interface Invoice {
  id: string
  user_id: string
  tenant_id?: string
  invoice_period_start: string
  invoice_period_end: string
  total_amount: number
  currency: string
  status: string
  line_items: any[]
}

/**
 * Check if user/agent has budget remaining
 */
export async function checkBudget(
  userId: string,
  tenantId: string | null,
  estimatedCost: number
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  // Check user's agent spending
  const { data: agents } = await supabase
    .from('api_agents')
    .select('cost_ceiling, current_spend')
    .eq('owner_id', userId)

  const totalAgentSpend = (agents || []).reduce((sum, a) => sum + (a.current_spend || 0), 0)
  const totalCeiling = (agents || []).reduce((sum, a) => sum + (a.cost_ceiling || 0), 0)

  if (totalAgentSpend + estimatedCost > totalCeiling) {
    return {
      allowed: false,
      remaining: totalCeiling - totalAgentSpend,
      message: 'Agent cost ceiling reached'
    }
  }

  // Check tenant budget if applicable
  if (tenantId) {
    const { data: tenant } = await supabase
      .from('api_tenants')
      .select('monthly_budget, current_spend')
      .eq('id', tenantId)
      .single()

    if (tenant) {
      const tenantRemaining = (tenant.monthly_budget || 0) - (tenant.current_spend || 0)
      if (tenantRemaining < estimatedCost) {
        return {
          allowed: false,
          remaining: tenantRemaining,
          message: 'Tenant monthly budget exceeded'
        }
      }
    }
  }

  return { allowed: true, remaining: 999999 }
}

/**
 * Update spend after operation
 */
export async function updateSpend(
  userId: string,
  tenantId: string | null,
  amount: number
) {
  // Update agent spend (find first active agent for user)
  const { data: agents } = await supabase
    .from('api_agents')
    .select('id, current_spend')
    .eq('owner_id', userId)
    .eq('status', 'running')
    .limit(1)

  if (agents && agents.length > 0) {
    await supabase
      .from('api_agents')
      .update({ current_spend: (agents[0].current_spend || 0) + amount })
      .eq('id', agents[0].id)
  }

  // Update tenant spend
  if (tenantId) {
    const { data: tenant } = await supabase
      .from('api_tenants')
      .select('current_spend')
      .eq('id', tenantId)
      .single()

    if (tenant) {
      await supabase
        .from('api_tenants')
        .update({ current_spend: (tenant.current_spend || 0) + amount })
        .eq('id', tenantId)

      // Check if threshold reached
      const { data: updatedTenant } = await supabase
        .from('api_tenants')
        .select('monthly_budget, current_spend')
        .eq('id', tenantId)
        .single()

      if (updatedTenant) {
        const percentUsed = (updatedTenant.current_spend / updatedTenant.monthly_budget) * 100
        if (percentUsed >= 80) {
          await createBillingAlert(
            userId,
            tenantId,
            'threshold',
            80,
            `Tenant budget ${percentUsed.toFixed(0)}% used`
          )
        }
      }
    }
  }
}

/**
 * Create billing alert
 */
async function createBillingAlert(
  userId: string,
  tenantId: string | null,
  alertType: string,
  thresholdPercent: number,
  message: string
) {
  const { error } = await supabase
    .from('api_billing_alerts')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      alert_type: alertType,
      threshold_percent: thresholdPercent,
      message
    })

  if (error) console.error('Failed to create billing alert:', error)
}

/**
 * Get user's billing alerts
 */
export async function getBillingAlerts(userId: string, unreadOnly = false) {
  let query = supabase
    .from('api_billing_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch alerts')
  return data || []
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: string) {
  const { error } = await supabase
    .from('api_billing_alerts')
    .update({ read: true })
    .eq('id', alertId)

  if (error) throw new Error('Failed to mark alert as read')
}

/**
 * Generate monthly invoice
 */
export async function generateInvoice(
  userId: string,
  tenantId: string | null,
  periodStart: string,
  periodEnd: string
) {
  // Get billing entries for period
  const { data: entries } = await supabase
    .from('api_billing_ledger')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
    .eq('status', 'completed')

  if (!entries || entries.length === 0) {
    return null
  }

  const lineItems = entries.map(e => ({
    api_id: e.api_id,
    amount: e.amount,
    currency: e.currency,
    description: e.description
  }))

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0)

  const { data, error } = await supabase
    .from('api_invoices')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      invoice_period_start: periodStart,
      invoice_period_end: periodEnd,
      total_amount: total,
      line_items: lineItems
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to generate invoice: ${error.message}`)
  return data
}

/**
 * Get user's invoices
 */
export async function getInvoices(userId: string, status?: string) {
  let query = supabase
    .from('api_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('invoice_period_start', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch invoices')
  return data || []
}
