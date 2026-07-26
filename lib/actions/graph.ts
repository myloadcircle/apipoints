import { supabase } from '@/lib/supabase'

export interface GraphEntity {
  id: string
  entity_type: 'person' | 'company' | 'vehicle' | 'property' | 'email' | 'domain'
  entity_id: string
  display_name?: string
  metadata: any
}

export interface EntityRelationship {
  id: string
  source_type: string
  source_id: string
  target_type: string
  target_id: string
  relationship_type: string
  confidence: number
  metadata: any
}

/**
 * Upsert entity into graph
 */
export async function upsertEntity(
  entityType: string,
  entityId: string,
  displayName?: string,
  metadata?: any
) {
  const { data, error } = await supabase
    .from('api_entity_graph')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      display_name: displayName,
      metadata
    }, {
      onConflict: 'entity_type,entity_id'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert entity: ${error.message}`)
  return data
}

/**
 * Add relationship between entities
 */
export async function addRelationship(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  relationshipType: string,
  confidence = 1.0,
  metadata?: any
) {
  const { data, error } = await supabase
    .from('api_entity_relationships')
    .upsert({
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      relationship_type: relationshipType,
      confidence,
      metadata
    }, {
      onConflict: 'source_type,source_id,target_type,target_id,relationship_type'
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add relationship: ${error.message}`)
  return data
}

/**
 * Resolve entities - find matches across sources
 */
export async function resolveEntity(
  entityType: string,
  searchTerm: string
) {
  // Search by entity_id or display_name
  const { data, error } = await supabase
    .from('api_entity_graph')
    .select('*')
    .eq('entity_type', entityType)
    .or(`entity_id.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) throw new Error('Failed to resolve entity')
  return data || []
}

/**
 * Get entity relationships (both incoming and outgoing)
 */
export async function getEntityGraph(
  entityType: string,
  entityId: string
) {
  const { data: outgoing, error: outError } = await supabase
    .from('api_entity_relationships')
    .select('*, target:target_type,target_id')
    .eq('source_type', entityType)
    .eq('source_id', entityId)

  const { data: incoming, error: inError } = await supabase
    .from('api_entity_relationships')
    .select('*, source:source_type,source_id')
    .eq('target_type', entityType)
    .eq('target_id', entityId)

  if (outError || inError) throw new Error('Failed to fetch relationships')

  return {
    entity: await getEntity(entityType, entityId),
    outgoing: outgoing || [],
    incoming: incoming || []
  }
}

/**
 * Get single entity
 */
async function getEntity(entityType: string, entityId: string) {
  const { data } = await supabase
    .from('api_entity_graph')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  return data
}

/**
 * Link normalized data to graph
 */
export async function linkNormalizedToGraph(
  normalizedDataId: string,
  entityType: string,
  entityId: string
) {
  // Upsert entity from normalized data
  const { data: normData } = await supabase
    .from('api_normalized_data')
    .select('*')
    .eq('id', normalizedDataId)
    .single()

  if (!normData) throw new Error('Normalized data not found')

  const entity = await upsertEntity(
    entityType,
    entityId,
    normData.normalized_schema?.company_name || 
    normData.normalized_schema?.registration || 
    entityId,
    normData.normalized_schema
  )

  return entity
}
