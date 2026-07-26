import { supabase } from '@/lib/supabase'

/**
 * Unified search across all entities
 */
export async function unifiedSearch(
  query: string,
  filters?: {
    entity_type?: string
    intent?: string
    tenant_id?: string
  },
  limit = 20,
  offset = 0
) {
  const results: any[] = []
  const seen = new Set<string>()

  // Search APIs
  const { data: apis } = await supabase
    .from('apis')
    .select('id, name, description, category')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('active', true)
    .limit(limit)

  if (apis) {
    apis.forEach(api => {
      const key = `api_${api.id}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          type: 'api',
          id: api.id,
          title: api.name,
          description: api.description,
          category: api.category,
          url: `/apis/${api.id}`
        })
      }
    })
  }

  // Search connectors
  const { data: connectors } = await supabase
    .from('api_connectors')
    .select('id, name, description, connector_type')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('active', true)
    .limit(limit)

  if (connectors) {
    connectors.forEach(conn => {
      const key = `connector_${conn.id}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          type: 'connector',
          id: conn.id,
          title: conn.name,
          description: conn.description,
          category: conn.connector_type,
          url: `/connectors/${conn.id}`
        })
      }
    })
  }

  // Search normalized data
  const { data: normalized } = await supabase
    .from('api_normalized_data')
    .select('entity_type, entity_id, normalized_schema')
    .or(`entity_id.ilike.%${query}%,normalized_schema::text.ilike.%${query}%`)
    .limit(limit)

  if (normalized) {
    normalized.forEach((n: any) => {
      const key = `normalized_${n.entity_type}_${n.entity_id}`
      if (!seen.has(key)) {
        seen.add(key)
        const schema = n.normalized_schema || {}
        results.push({
          type: 'entity',
          entity_type: n.entity_type,
          id: n.entity_id,
          title: schema.company_name || schema.registration || n.entity_id,
          description: `${n.entity_type} entity`,
          url: `/normalized?type=${n.entity_type}&id=${n.entity_id}`
        })
      }
    })
  }

  // Search graph entities
  const { data: graph } = await supabase
    .from('api_entity_graph')
    .select('entity_type, entity_id, display_name, metadata')
    .or(`entity_id.ilike.%${query}%,display_name.ilike.%${query}%,metadata::text.ilike.%${query}%`)
    .limit(limit)

  if (graph) {
    graph.forEach((g: any) => {
      const key = `graph_${g.entity_type}_${g.entity_id}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          type: 'graph',
          entity_type: g.entity_type,
          id: g.entity_id,
          title: g.display_name || g.entity_id,
          description: `${g.entity_type} in graph`,
          url: `/graph?type=${g.entity_type}&id=${g.entity_id}`
        })
      }
    })
  }

  // Apply filters
  let filtered = results
  if (filters?.entity_type) {
    filtered = filtered.filter(r => 
      r.entity_type === filters.entity_type || r.type === filters.entity_type
    )
  }

  return {
    results: filtered.slice(offset, offset + limit),
    total: filtered.length,
    query,
    filters
  }
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(query: string, limit = 10) {
  if (!query || query.length < 2) return { suggestions: [] }

  const suggestions: any[] = []
  const seen = new Set<string>()

  // API names
  const { data: apis } = await supabase
    .from('apis')
    .select('name')
    .ilike('name', `%${query}%`)
    .eq('active', true)
    .limit(limit)

  if (apis) {
    apis.forEach(api => {
      if (!seen.has(api.name)) {
        seen.add(api.name)
        suggestions.push({ text: api.name, type: 'api' })
      }
    })
  }

  // Connector names
  const { data: connectors } = await supabase
    .from('api_connectors')
    .select('name')
    .ilike('name', `%${query}%`)
    .eq('active', true)
    .limit(limit)

  if (connectors) {
    connectors.forEach(conn => {
      if (!seen.has(conn.name)) {
        seen.add(conn.name)
        suggestions.push({ text: conn.name, type: 'connector' })
      }
    })
  }

  return { suggestions: suggestions.slice(0, limit) }
}
