import { upsertEntity, addRelationship, resolveEntity, getEntityGraph } from '@/lib/actions/graph'

export const dynamic = 'force-dynamic'

export default async function GraphPage({
  searchParams
}: {
  searchParams: { type?: string; id?: string; q?: string }
}) {
  const entityType = searchParams.type || 'company'
  const entityId = searchParams.id
  const query = searchParams.q

  let graphData = null
  let searchResults = null

  if (entityId) {
    graphData = await getEntityGraph(entityType, entityId)
  }

  if (query) {
    searchResults = await resolveEntity(entityType, query)
  }

  const types = [
    { value: 'company', label: 'Companies' },
    { value: 'person', label: 'People' },
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'property', label: 'Properties' }
  ]

  return (
    <div className='p-8 space-y-10 max-w-6xl'>
      <div>
        <h1 className='text-2xl font-bold'>Profile Graph</h1>
        <p className='text-gray-600 mt-2'>Unified entity resolution across all sources</p>
      </div>

      <form className='flex gap-2'>
        <select 
          name='type'
          defaultValue={entityType}
          className='border p-2 rounded'
        >
          {types.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input 
          name='q'
          placeholder='Search entities...'
          className='flex-1 border p-2 rounded'
        />
        <button type='submit' className='px-4 py-2 bg-black text-white rounded'>
          Search
        </button>
      </form>

      {searchResults && (
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Search Results ({searchResults.length})</h2>
          {searchResults.length > 0 ? (
            searchResults.map((e: any) => (
              <div key={e.id} className='border p-4 rounded bg-gray-50 flex items-center justify-between'>
                <div>
                  <p className='font-bold'>{e.display_name || e.entity_id}</p>
                  <p className='text-sm text-gray-600'>{e.entity_type} • {e.entity_id}</p>
                </div>
                <a
                  href={`/graph?type=${e.entity_type}&id=${e.entity_id}`}
                  className='px-3 py-1 bg-black text-white rounded text-sm'
                >
                  View Graph
                </a>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No entities found.</p>
          )}
        </div>
      )}

      {graphData && (
        <div className='space-y-6'>
          <div className='border p-6 rounded bg-gray-50'>
            <h2 className='text-xl font-bold'>{graphData.entity?.display_name || graphData.entity?.entity_id}</h2>
            <p className='text-sm text-gray-600 mt-1'>
              {graphData.entity?.entity_type} • {graphData.entity?.entity_id}
            </p>
            {graphData.entity?.metadata && (
              <pre className='mt-4 text-xs bg-white p-3 rounded overflow-auto'>
                {JSON.stringify(graphData.entity.metadata, null, 2)}
              </pre>
            )}
          </div>

          <div className='grid grid-cols-2 gap-6'>
            <div>
              <h3 className='font-bold mb-3'>Outgoing Relationships</h3>
              <div className='space-y-2'>
                {graphData.outgoing.length > 0 ? (
                  graphData.outgoing.map((r: any) => (
                    <div key={r.id} className='border p-3 rounded bg-white text-sm'>
                      <p className='font-bold'>{r.relationship_type}</p>
                      <p className='text-gray-600'>{r.target_type}: {r.target_id}</p>
                      <p className='text-xs text-gray-500'>Confidence: {(r.confidence * 100).toFixed(0)}%</p>
                    </div>
                  ))
                ) : (
                  <p className='text-gray-500 text-sm'>No outgoing relationships</p>
                )}
              </div>
            </div>

            <div>
              <h3 className='font-bold mb-3'>Incoming Relationships</h3>
              <div className='space-y-2'>
                {graphData.incoming.length > 0 ? (
                  graphData.incoming.map((r: any) => (
                    <div key={r.id} className='border p-3 rounded bg-white text-sm'>
                      <p className='font-bold'>{r.relationship_type}</p>
                      <p className='text-gray-600'>{r.source_type}: {r.source_id}</p>
                      <p className='text-xs text-gray-500'>Confidence: {(r.confidence * 100).toFixed(0)}%</p>
                    </div>
                  ))
                ) : (
                  <p className='text-gray-500 text-sm'>No incoming relationships</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
