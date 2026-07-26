import { supabase } from '@/lib/supabase'

export interface Insight {
  id: string
  entity_type: string
  entity_id: string
  insight_type: string
  score?: number
  risk_level?: 'low' | 'medium' | 'high'
  signals: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'critical' }>
  confidence: number
  generated_by: string
}

export interface ScoringModel {
  id: string
  name: string
  entity_type: string
  model_version: string
  rules: any
  active: boolean
}

/**
 * Generate vehicle insights
 */
export async function generateVehicleInsights(entityId: string, data: any) {
  const signals: any[] = []
  let score = 100
  let riskLevel: 'low' | 'medium' | 'high' = 'low'

  // MOT status check
  if (data.mot_status === 'expired') {
    signals.push({
      type: 'mot_expired',
      message: 'MOT has expired',
      severity: 'critical' as const
    })
    score -= 30
    riskLevel = 'high'
  }

  // Mileage anomaly
  if (data.mileage && data.year) {
    const age = new Date().getFullYear() - data.year
    const expectedMileage = age * 10000
    if (data.mileage > expectedMileage * 1.5) {
      signals.push({
        type: 'mileage_anomaly',
        message: `Mileage (${data.mileage}) is higher than expected (${expectedMileage})`,
        severity: 'warning' as const
      })
      score -= 15
      if (riskLevel === 'low') riskLevel = 'medium'
    }
  }

  // No MOT history
  if (data.mot_status === 'no_mot') {
    signals.push({
      type: 'no_mot',
      message: 'Vehicle has no MOT history',
      severity: 'warning' as const
    })
    score -= 10
  }

  score = Math.max(0, score)

  if (score < 50) riskLevel = 'high'
  else if (score < 75) riskLevel = 'medium'

  // Store insight
  const { data: insight, error } = await supabase
    .from('api_insights')
    .upsert({
      entity_type: 'vehicle',
      entity_id: entityId,
      insight_type: 'vehicle_health',
      score,
      risk_level: riskLevel,
      signals,
      confidence: 0.95
    }, {
      onConflict: 'entity_type,entity_id,insight_type'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to store insight: ${error.message}`)
  return insight
}

/**
 * Generate business insights
 */
export async function generateBusinessInsights(entityId: string, data: any) {
  const signals: any[] = []
  let score = 100
  let riskLevel: 'low' | 'medium' | 'high' = 'low'

  // Company status
  if (data.status === 'dissolved' || data.status === 'liquidation') {
    signals.push({
      type: 'company_dissolved',
      message: `Company is ${data.status}`,
      severity: 'critical' as const
    })
    score -= 50
    riskLevel = 'high'
  }

  // Multiple directorships (risk factor)
  if (data.directors && data.directors.length > 5) {
    signals.push({
      type: 'multiple_directorships',
      message: `${data.directors.length} directors listed`,
      severity: 'warning' as const
    })
    score -= 10
    if (riskLevel === 'low') riskLevel = 'medium'
  }

  // New company (less than 2 years)
  if (data.incorporation_date) {
    const age = (Date.now() - new Date(data.incorporation_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (age < 2) {
      signals.push({
        type: 'new_company',
        message: 'Company less than 2 years old',
        severity: 'info' as const
      })
      score -= 5
    }
  }

  score = Math.max(0, score)

  if (score < 50) riskLevel = 'high'
  else if (score < 75) riskLevel = 'medium'

  const { data: insight, error } = await supabase
    .from('api_insights')
    .upsert({
      entity_type: 'business',
      entity_id: entityId,
      insight_type: 'business_risk',
      score,
      risk_level: riskLevel,
      signals,
      confidence: 0.90
    }, {
      onConflict: 'entity_type,entity_id,insight_type'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to store insight: ${error.message}`)
  return insight
}

/**
 * Get insights for entity
 */
export async function getInsights(entityType: string, entityId?: string) {
  let query = supabase
    .from('api_insights')
    .select('*')
    .eq('entity_type', entityType)
    .order('score', { ascending: false })

  if (entityId) {
    query = query.eq('entity_id', entityId)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch insights')
  return data || []
}

/**
 * Get insight bundles
 */
export async function getInsightBundles(entityType?: string) {
  let query = supabase
    .from('api_insight_bundles')
    .select('*')
    .eq('active', true)

  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  const { data, error } = await query.order('name')
  if (error) throw new Error('Failed to fetch bundles')
  return data || []
}

/**
 * Create scoring model
 */
export async function createScoringModel(
  name: string,
  entityType: string,
  rules: any
) {
  const { data, error } = await supabase
    .from('api_scoring_models')
    .insert({
      name,
      entity_type: entityType,
      rules
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create model: ${error.message}`)
  return data
}
