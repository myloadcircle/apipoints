import { supabase } from '@/lib/supabase'

export interface Region {
  code: string
  name: string
  endpoint: string
  active: boolean
  latency_ms: number
  load_percentage: number
  status: 'healthy' | 'degraded' | 'down'
  last_health_check: string
}

export interface FailoverEvent {
  id: string
  from_region: string
  to_region: string
  reason?: string
  auto_triggered: boolean
  created_at: string
}

/**
 * List all regions
 */
export async function listRegions(activeOnly = true) {
  let query = supabase
    .from('api_regions')
    .select('*')
    .order('name')

  if (activeOnly) {
    query = query.eq('active', true)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch regions')
  return data || []
}

/**
 * Get region by code
 */
export async function getRegion(code: string) {
  const { data, error } = await supabase
    .from('api_regions')
    .select('*')
    .eq('code', code)
    .single()

  if (error || !data) throw new Error('Region not found')
  return data
}

/**
 * Update region health
 */
export async function updateRegionHealth(
  code: string,
  status: 'healthy' | 'degraded' | 'down',
  latencyMs?: number,
  loadPercentage?: number
) {
  const updates: any = { status, last_health_check: new Date().toISOString() }
  if (latencyMs !== undefined) updates.latency_ms = latencyMs
  if (loadPercentage !== undefined) updates.load_percentage = loadPercentage

  const { error } = await supabase
    .from('api_regions')
    .update(updates)
    .eq('code', code)

  if (error) throw new Error(`Failed to update region health: ${error.message}`)

  // Auto-failover if region goes down
  if (status === 'down') {
    await triggerFailover(code, 'Region marked as down')
  }
}

/**
 * Get tenant's primary region
 */
export async function getTenantRegion(tenantId: string) {
  const { data, error } = await supabase
    .from('api_tenant_regions')
    .select('region_code, api_regions(*)')
    .eq('tenant_id', tenantId)
    .eq('is_primary', true)
    .single()

  if (error || !data) {
    // Default to UK South
    return { code: 'uk-south', name: 'UK South', endpoint: process.env.UK_SOUTH_ENDPOINT || '' }
  }

  return (data as any).api_regions
}

/**
 * Route request to best region
 */
export async function routeToRegion(
  tenantId?: string,
  intent?: string
): Promise<{ region: Region; reason: string }> {
  // If tenant has preferred region
  if (tenantId) {
    try {
      const tenantRegion = await getTenantRegion(tenantId)
      if (tenantRegion && tenantRegion.status === 'healthy') {
        return { region: tenantRegion, reason: 'Tenant preference' }
      }
    } catch (e) {
      // Fall through to latency-based
    }
  }

  // Get healthy regions, sort by latency
  const regions = await listRegions(true)
  const healthy = regions.filter(r => r.status === 'healthy')

  if (healthy.length === 0) {
    throw new Error('No healthy regions available')
  }

  // Sort by latency, then load
  const sorted = healthy.sort((a, b) => {
    if (a.latency_ms !== b.latency_ms) return a.latency_ms - b.latency_ms
    return a.load_percentage - b.load_percentage
  })

  return { region: sorted[0], reason: 'Lowest latency' }
}

/**
 * Trigger failover
 */
export async function triggerFailover(
  fromRegionCode: string,
  reason: string,
  autoTriggered = true
) {
  // Find target region (lowest latency that's healthy)
  const regions = await listRegions(true)
  const target = regions
    .filter(r => r.code !== fromRegionCode && r.status === 'healthy')
    .sort((a, b) => a.latency_ms - b.latency_ms)[0]

  if (!target) {
    console.error('No healthy region available for failover')
    return
  }

  // Log failover event
  const { error } = await supabase
    .from('api_failover_events')
    .insert({
      from_region: fromRegionCode,
      to_region: target.code,
      reason,
      auto_triggered: autoTriggered
    })

  if (error) console.error('Failed to log failover:', error)

  // Update tenant regions (switch primary)
  await supabase
    .from('api_tenant_regions')
    .update({ is_primary: false })
    .eq('region_code', fromRegionCode)

  await supabase
    .from('api_tenant_regions')
    .update({ is_primary: true })
    .eq('region_code', target.code)
}

/**
 * Get failover history
 */
export async function getFailoverHistory(limit = 50) {
  const { data, error } = await supabase
    .from('api_failover_events')
    .select('*, from:from_region(*), to:to_region(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error('Failed to fetch failover history')
  return data || []
}
