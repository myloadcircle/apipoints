import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'

export type Region = 'eu-west' | 'us-east' | 'ap-south'
export type RegionStrategy = 'primary' | 'round_robin' | 'geo_ip'

interface RegionConfig {
  preferred_region: Region
  failover_regions: Region[]
  region_strategy: RegionStrategy
}

const REGION_LATENCY: Record<Region, number> = {
  'eu-west': 50,
  'us-east': 100,
  'ap-south': 150
}

let roundRobinCounter = 0

/**
 * Determine region for webhook delivery
 */
export async function selectRegion(webhookId: string): Promise<Region> {
  // Get webhook region config
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('preferred_region, failover_regions, region_strategy')
    .eq('id', webhookId)
    .single()

  if (error || !webhook) {
    return 'eu-west' // Default
  }

  const config: RegionConfig = {
    preferred_region: webhook.preferred_region || 'eu-west',
    failover_regions: webhook.failover_regions || ['us-east', 'ap-south'],
    region_strategy: webhook.region_strategy || 'primary'
  }

  switch (config.region_strategy) {
    case 'primary':
      return config.preferred_region

    case 'round_robin':
      const regions: Region[] = [config.preferred_region, ...config.failover_regions]
      const selected = regions[roundRobinCounter % regions.length]
      roundRobinCounter++
      return selected

    case 'geo_ip':
      // In production, use IP geolocation
      // For now, default to preferred
      return config.preferred_region

    default:
      return config.preferred_region
  }
}

/**
 * Handle region failover
 */
export async function handleRegionFailover(
  webhookId: string,
  failedRegion: Region,
  userId: string
): Promise<Region | null> {
  // Get webhook config
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('preferred_region, failover_regions')
    .eq('id', webhookId)
    .single()

  if (error || !webhook) return null

  const failoverRegions: Region[] = webhook.failover_regions || []
  
  // Find next region in failover list
  const currentIndex = failoverRegions.indexOf(failedRegion)
  const nextRegion = failoverRegions[currentIndex + 1] || failoverRegions[0]

  if (nextRegion) {
    // Log failover event
    await logActivity(
      userId,
      '',
      'webhook_region_failover',
      {
        webhook_id: webhookId,
        from_region: failedRegion,
        to_region: nextRegion
      }
    )

    return nextRegion
  }

  return null
}

/**
 * Get region metrics (simulated)
 */
export async function getRegionMetrics(webhookId: string): Promise<{
  region: Region
  latency_ms: number
  success_rate: number
  failover_count: number
}[]> {
  const regions: Region[] = ['eu-west', 'us-east', 'ap-south']
  
  return regions.map(region => ({
    region,
    latency_ms: REGION_LATENCY[region] + Math.random() * 20 - 10,
    success_rate: 0.95 + Math.random() * 0.05,
    failover_count: Math.floor(Math.random() * 5)
  }))
}

/**
 * Update region configuration
 */
export async function updateRegionConfig(
  webhookId: string,
  userId: string,
  config: Partial<RegionConfig>
) {
  const { error } = await supabase
    .from('api_request_webhooks')
    .update(config)
    .eq('id', webhookId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to update region config')

  await logActivity(
    userId,
    '',
    'webhook_region_strategy_updated',
    {
      webhook_id: webhookId,
      ...config
    }
  )
}
