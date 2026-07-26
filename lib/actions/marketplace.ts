import { supabase } from '@/lib/supabase'

export interface MarketplaceListing {
  id: string
  item_id: string
  item_type: 'api' | 'connector' | 'workflow' | 'insight_bundle' | 'template' | 'agent'
  name: string
  description?: string
  pricing: any
  version: string
  reliability_score: number
  usage_count: number
  active: boolean
  featured: boolean
}

export interface RevenueShare {
  id: string
  listing_id: string
  creator_id: string
  platform_fee_percent: number
  creator_earning_percent: number
  min_price: number
}

/**
 * List marketplace items
 */
export async function listMarketplaceItems(
  itemType?: string,
  sortBy = 'reliability_score'
) {
  let query = supabase
    .from('api_marketplace_listings')
    .select('*')
    .eq('active', true)

  if (itemType) {
    query = query.eq('item_type', itemType)
  }

  // Apply sorting
  switch (sortBy) {
    case 'reliability_score':
      query = query.order('reliability_score', { ascending: false })
      break
    case 'usage_count':
      query = query.order('usage_count', { ascending: false })
      break
    case 'featured':
      query = query.order('featured', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch marketplace items')
  return data || []
}

/**
 * Get listing by ID
 */
export async function getListing(id: string) {
  const { data, error } = await supabase
    .from('api_marketplace_listings')
    .select('*, revenue:api_revenue_shares(*)')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Listing not found')
  return data
}

/**
 * Create marketplace listing
 */
export async function createListing(
  itemId: string,
  itemType: string,
  name: string,
  pricing: any,
  description?: string
) {
  const { data, error } = await supabase
    .from('api_marketplace_listings')
    .insert({
      item_id: itemId,
      item_type: itemType,
      name,
      description,
      pricing
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create listing: ${error.message}`)
  return data
}

/**
 * Record purchase/usage
 */
export async function recordUsage(listingId: string, amount: number) {
  const { error } = await supabase
    .from('api_marketplace_listings')
    .update({ 
      usage_count: supabase.rpc('increment', { row_id: listingId, table_name: 'api_marketplace_listings', column_name: 'usage_count' })
    })
    .eq('id', listingId)

  if (error) throw new Error('Failed to record usage')

  // Update analytics
  const today = new Date().toISOString().split('T')[0]
  await supabase
    .from('api_marketplace_analytics')
    .upsert({
      listing_id: listingId,
      date: today,
      purchases: 1,
      revenue: amount
    }, {
      onConflict: 'listing_id,date'
    })
}

/**
 * Get creator earnings
 */
export async function getCreatorEarnings(creatorId: string) {
  const { data, error } = await supabase
    .from('api_revenue_shares')
    .select('*, listing:listing_id(name, item_type)')
    .eq('creator_id', creatorId)

  if (error) throw new Error('Failed to fetch earnings')
  return data || []
}

/**
 * Feature listing
 */
export async function featureListing(listingId: string, featured = true) {
  const { error } = await supabase
    .from('api_marketplace_listings')
    .update({ featured })
    .eq('id', listingId)

  if (error) throw new Error('Failed to update listing')
}

/**
 * Get marketplace analytics
 */
export async function getMarketplaceAnalytics(listingId?: string) {
  let query = supabase
    .from('api_marketplace_analytics')
    .select('*, listing:listing_id(name)')
    .order('date', { ascending: false })

  if (listingId) {
    query = query.eq('listing_id', listingId)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch analytics')
  return data || []
}
