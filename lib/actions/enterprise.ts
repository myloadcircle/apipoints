import { supabase } from '@/lib/supabase'

export interface EnterpriseSSO {
  id: string
  tenant_id: string
  provider: 'saml' | 'oauth' | 'azure_ad' | 'okta' | 'google_workspace'
  config: any
  active: boolean
}

export interface ComplianceSettings {
  id: string
  tenant_id: string
  compliance_mode: boolean
  require_mfa: boolean
  locked_templates: boolean
  audit_all_actions: boolean
  no_probabilistic_merges: boolean
  no_unbounded_loops: boolean
}

export interface EnterpriseContract {
  id: string
  tenant_id: string
  contract_number: string
  contract_type: string
  sla_uptime_percent: number
  custom_pricing?: any
  volume_discounts?: any
  dedicated_support: boolean
  private_deployments: boolean
  start_date: string
  end_date?: string
  status: string
}

/**
 * Configure SSO for tenant
 */
export async function configureSSO(
  tenantId: string,
  provider: string,
  config: any
) {
  const { data, error } = await supabase
    .from('api_enterprise_sso')
    .upsert({
      tenant_id: tenantId,
      provider,
      config
    }, {
      onConflict: 'tenant_id'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to configure SSO: ${error.message}`)
  return data
}

/**
 * Get SSO config
 */
export async function getSSOConfig(tenantId: string) {
  const { data, error } = await supabase
    .from('api_enterprise_sso')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Update compliance settings
 */
export async function updateComplianceSettings(
  tenantId: string,
  settings: Partial<ComplianceSettings>
) {
  const { data, error } = await supabase
    .from('api_compliance_settings')
    .upsert({
      tenant_id: tenantId,
      ...settings
    }, {
      onConflict: 'tenant_id'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to update compliance: ${error.message}`)
  return data
}

/**
 * Get compliance settings
 */
export async function getComplianceSettings(tenantId: string) {
  const { data, error } = await supabase
    .from('api_compliance_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    // Return defaults
    return {
      compliance_mode: false,
      require_mfa: false,
      locked_templates: false,
      audit_all_actions: false,
      no_probabilistic_merges: false,
      no_unbounded_loops: false
    }
  }
  return data
}

/**
 * Create enterprise contract
 */
export async function createContract(
  tenantId: string,
  contractType: string,
  slaUptime: number,
  startDate: string,
  endDate?: string
) {
  const contractNumber = `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

  const { data, error } = await supabase
    .from('api_enterprise_contracts')
    .insert({
      tenant_id: tenantId,
      contract_number: contractNumber,
      contract_type: contractType,
      sla_uptime_percent: slaUptime,
      start_date: startDate,
      end_date: endDate
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create contract: ${error.message}`)
  return data
}

/**
 * Get tenant contracts
 */
export async function getContracts(tenantId: string, status?: string) {
  let query = supabase
    .from('api_enterprise_contracts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch contracts')
  return data || []
}

/**
 * Check if tenant is in compliance mode
 */
export async function isComplianceMode(tenantId: string): Promise<boolean> {
  const settings = await getComplianceSettings(tenantId)
  return settings.compliance_mode || false
}

/**
 * Enforce compliance check
 */
export async function enforceCompliance(
  tenantId: string,
  action: string,
  metadata?: any
): Promise<{ allowed: boolean; reason?: string }> {
  const settings = await getComplianceSettings(tenantId)

  if (!settings.compliance_mode) {
    return { allowed: true }
  }

  // Compliance mode checks
  switch (action) {
    case 'create_template':
      if (settings.locked_templates) {
        return { allowed: false, reason: 'Templates are locked in compliance mode' }
      }
      break

    case 'probabilistic_merge':
      if (settings.no_probabilistic_merges) {
        return { allowed: false, reason: 'Probabilistic merges disabled in compliance mode' }
      }
      break

    case 'unbounded_loop':
      if (settings.no_unbounded_loops) {
        return { allowed: false, reason: 'Unbounded loops disabled in compliance mode' }
      }
      break
  }

  // Audit log if required
  if (settings.audit_all_actions) {
    try {
      await supabase
        .from('api_request_activity')
        .insert({
          actor_id: 'system',
          type: 'compliance_check',
          payload: { action, tenant_id: tenantId, metadata }
        })
    } catch (err: any) {
      console.error('Audit log failed:', err.message)
    }
  }

  return { allowed: true }
}
