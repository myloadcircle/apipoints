import { supabase } from '@/lib/supabase'

export interface NormalizedSchema {
  entity_type: 'vehicle' | 'business' | 'property' | 'person' | 'email'
  entity_id: string
  // Vehicle fields
  registration?: string
  make?: string
  model?: string
  year?: number
  mot_status?: 'valid' | 'expired' | 'no_mot'
  mot_expiry?: string
  mileage?: number
  score?: number
  risk_level?: 'low' | 'medium' | 'high'
  // Business fields
  company_name?: string
  company_number?: string
  status?: string
  incorporation_date?: string
  directors?: Array<{ name: string; role: string }>
  // Property fields
  address?: string
  value?: number
  tenure?: string
  // Common
  raw_source?: string
  confidence_score?: number
}

/**
 * Normalize vehicle data from any provider into canonical schema
 */
export function normalizeVehicleData(
  provider: string,
  rawData: any
): NormalizedSchema {
  const base = {
    entity_type: 'vehicle' as const,
    entity_id: '',
    raw_source: provider,
    confidence_score: 1.0
  }

  switch (provider) {
    case 'DVLA':
      return {
        ...base,
        entity_id: rawData.registration || rawData.vrm || '',
        registration: rawData.registration || rawData.vrm,
        make: rawData.make,
        model: rawData.model,
        year: rawData.year || rawData.first_registration_year,
        mot_status: mapMOTStatus(rawData.mot_status),
        mot_expiry: rawData.mot_expiry || rawData.motTestDueDate,
        mileage: rawData.mileage || rawData.odometerReading
      }

    case 'VehicleScore':
      return {
        ...base,
        entity_id: rawData.vrm || '',
        registration: rawData.vrm,
        score: rawData.score || rawData.overall_score,
        risk_level: rawData.risk || rawData.risk_level,
        make: rawData.make,
        model: rawData.model
      }

    case 'MyCarCheck':
      return {
        ...base,
        entity_id: rawData.registration || '',
        registration: rawData.registration,
        make: rawData.vehicle?.make,
        model: rawData.vehicle?.model,
        year: rawData.vehicle?.year,
        mileage: rawData.vehicle?.mileage
      }

    default:
      return {
        ...base,
        entity_id: rawData.id || rawData.vrm || '',
        registration: rawData.registration || rawData.vrm
      }
  }
}

/**
 * Normalize business data from any provider
 */
export function normalizeBusinessData(
  provider: string,
  rawData: any
): NormalizedSchema {
  const base = {
    entity_type: 'business' as const,
    entity_id: '',
    raw_source: provider,
    confidence_score: 1.0
  }

  switch (provider) {
    case 'CompaniesHouse':
      return {
        ...base,
        entity_id: rawData.company_number || '',
        company_name: rawData.company_name || rawData.name,
        company_number: rawData.company_number,
        status: rawData.status || rawData.company_status,
        incorporation_date: rawData.incorporation_date || rawData.date_of_creation,
        directors: rawData.directors || rawData.officers || []
      }

    default:
      return {
        ...base,
        entity_id: rawData.id || rawData.company_number || '',
        company_name: rawData.name || rawData.company_name
      }
  }
}

/**
 * Normalize property data
 */
export function normalizePropertyData(
  provider: string,
  rawData: any
): NormalizedSchema {
  return {
    entity_type: 'property',
    entity_id: rawData.id || rawData.address || '',
    address: rawData.address || rawData.full_address,
    value: rawData.value || rawData.price || rawData.estimated_value,
    tenure: rawData.tenure,
    raw_source: provider,
    confidence_score: 1.0
  }
}

function mapMOTStatus(status: string): 'valid' | 'expired' | 'no_mot' {
  if (!status) return 'no_mot'
  const s = status.toLowerCase()
  if (s.includes('valid') || s.includes('pass')) return 'valid'
  if (s.includes('expir') || s.includes('fail')) return 'expired'
  return 'no_mot'
}

/**
 * Store normalized data
 */
export async function storeNormalized(
  schema: NormalizedSchema,
  rawData: any,
  sourceConnectorId: string
) {
  const { data, error } = await supabase
    .from('api_normalized_data')
    .upsert({
      entity_type: schema.entity_type,
      entity_id: schema.entity_id,
      source_connector_id: sourceConnectorId,
      normalized_schema: schema,
      raw_data: rawData,
      confidence_score: schema.confidence_score || 1.0
    }, {
      onConflict: 'entity_type,entity_id,source_connector_id'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to store normalized data: ${error.message}`)
  return data
}

/**
 * Query normalized data by entity
 */
export async function queryNormalized(
  entityType: string,
  entityId?: string
) {
  let query = supabase
    .from('api_normalized_data')
    .select('*')
    .eq('entity_type', entityType)
    .order('updated_at', { ascending: false })

  if (entityId) {
    query = query.eq('entity_id', entityId)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to query normalized data')
  return data || []
}
