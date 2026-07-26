import { searchRequests } from '@/lib/actions/search-requests'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ params, searchParams }: { params: { id: string }, searchParams: { q?: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const q = searchParams.q || ''

  const results = q ? await searchRequests(apiId, userId, q) : []

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Search Requests</h1>

      <form className="space-y-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search payloads..."
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Search
        </button>
      </form>

      {q && (
        <p className="text-gray-700">
          Showing {results.length} result{results.length === 1 ? '' : 's'} for "{q}"
        </p>
      )}

      <div className="space-y-4">
        {results.length === 0 && q && (
          <p className="text-gray-600">No results found.</p>
        )}
        {results.map((r: any) => (
          <div key={r.id} className="border p-4 rounded bg-gray-50">
            <p className="text-xs text-gray-500">{r.created_at}</p>
            <pre className="text-sm bg-white p-3 rounded border mt-2 overflow-auto">
              {JSON.stringify(r.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
