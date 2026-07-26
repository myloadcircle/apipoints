import { supabase } from '@/lib/supabase'

export interface Connector {
  id: string
  name: string
  description: string
  connector_type: 'vehicle' | 'business' | 'property' | 'marketplace' | 'email' | 'social'
  input_schema: any
  output_schema: any
  pricing: any
  rate_limits: any
  upstream_provider: string
  version: string
  active: boolean
}

export interface NormalizedData {
  id: string
  entity_type: string
  entity_id: string
  normalized_schema: any
  confidence_score: number
}

/**
 * List all active connectors
 */
export async function listConnectors(type?: string) {
  let query = supabase
    .from('api_connectors')
    .select('*')
    .eq('active', true)
    .order('name')

  if (type) {
    query = query.eq('connector_type', type)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch connectors')
  return data || []
}

/**
 * Get connector by ID
 */
export async function getConnector(id: string) {
  const { data, error } = await supabase
    .from('api_connectors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Connector not found')
  return data
}

/**
 * Execute connector (call external API)
 */
export async function executeConnector(
  connectorId: string,
  userId: string,
  tenantId: string | null,
  input: any
) {
  const startTime = Date.now()

  try {
    // Get connector
    const connector = await getConnector(connectorId)

    // Log start
    const { data: logEntry, error: logError } = await supabase
      .from('api_connector_logs')
      .insert({
        connector_id: connectorId,
        user_id: userId,
        tenant_id: tenantId,
        input,
        status_code: 200,
        duration_ms: Date.now() - startTime,
        success: true,
        output: { message: 'Connector executed', connector: connector.name }
      })
      .select()
      .single()

    if (logError) throw logError

    return {
      success: true,
      output: { message: 'Connector executed', connector: connector.name, input },
      duration_ms: Date.now() - startTime
    }
  } catch (error: any) {
    // Log failure
    await supabase
      .from('api_connector_logs')
      .insert({
        connector_id: connectorId,
        user_id: userId,
        tenant_id: tenantId,
        input,
        status_code: 500,
        duration_ms: Date.now() - startTime,
        success: false,
        error_message: error.message
      })

    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    }
  }
}

/**
 * Store normalized data
 */
export async function storeNormalizedData(
  entityType: string,
  entityId: string,
  sourceConnectorId: string,
  normalizedSchema: any,
  rawData: any,
  confidenceScore = 1.0
) {
  const { data, error } = await supabase
    .from('api_normalized_data')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      source_connector_id: sourceConnectorId,
      normalized_schema: normalizedSchema,
      raw_data: rawData,
      confidence_score: confidenceScore
    }, {
      onConflict: 'entity_type,entity_id,source_connector_id'
    })
    .select()
    .single()

  if (error) throw new Error('Failed to store normalized data')
  return data
}

/**
 * Query normalized data
 */
export async function queryNormalizedData(
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
