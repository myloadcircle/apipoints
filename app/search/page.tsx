import { unifiedSearch, getSearchSuggestions } from '@/lib/actions/search'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string; type?: string; offset?: string }
}) {
  const query = searchParams.q || ''
  const type = searchParams.type || ''
  const offset = parseInt(searchParams.offset || '0')

  const results = query 
    ? await unifiedSearch(query, { entity_type: type }, 20, offset)
    : null

  const types = [
    { value: '', label: 'All' },
    { value: 'api', label: 'APIs' },
    { value: 'connector', label: 'Connectors' },
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'business', label: 'Businesses' },
    { value: 'person', label: 'People' }
  ]

  return (
    <div className='p-8 space-y-10 max-w-6xl'>
      <div>
        <h1 className='text-2xl font-bold'>Search</h1>
        <p className='text-gray-600 mt-2'>Unified search across APIs, connectors, entities, and graph</p>
      </div>

      <form className='space-y-4'>
        <div className='flex gap-2'>
          <input 
            name='q'
            defaultValue={query}
            placeholder='Search APIs, connectors, entities...'
            className='flex-1 border p-3 rounded'
          />
          <button type='submit' className='px-6 py-3 bg-black text-white rounded'>
            Search
          </button>
        </div>

        <div className='flex gap-2 flex-wrap'>
          {types.map(t => (
            <button
              key={t.value}
              name='type'
              value={t.value}
              className={`px-3 py-1 rounded text-sm ${
                type === t.value || (!type && !t.value)
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </form>

      {results && (
        <div className='space-y-4'>
          <p className='text-sm text-gray-600'>
            Found {results.total} results for "{results.query}"
          </p>

          {results.results.length > 0 ? (
            results.results.map((r: any, idx: number) => (
              <a 
                key={`${r.type}_${r.id}_${idx}`}
                href={r.url}
                className='block border p-4 rounded bg-gray-50 hover:bg-gray-100'
              >
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-bold'>{r.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        r.type === 'api' ? 'bg-blue-100 text-blue-800' :
                        r.type === 'connector' ? 'bg-green-100 text-green-800' :
                        r.type === 'entity' || r.type === 'graph' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {r.type}
                      </span>
                    </div>
                    {r.description && (
                      <p className='text-sm text-gray-600 mt-1'>{r.description}</p>
                    )}
                  </div>
                  <span className='text-xs text-gray-500'>{r.category || r.entity_type}</span>
                </div>
              </a>
            ))
          ) : (
            <p className='text-gray-500'>No results found.</p>
          )}

          {offset > 0 && (
            <a 
              href={`/search?q=${query}&type=${type}&offset=${Math.max(0, offset - 20)}`}
              className='px-4 py-2 border rounded inline-block'
            >
              ← Previous
            </a>
          )}

          {results.results.length === 20 && (
            <a 
              href={`/search?q=${query}&type=${type}&offset=${offset + 20}`}
              className='px-4 py-2 border rounded inline-block ml-2'
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
