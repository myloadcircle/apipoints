import { listCollectionAPIs } from '@/lib/actions/collections'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getCollection(id: string) {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single()

  return data
}

async function getAPIs(ids: string[]) {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('apis')
    .select('*')
    .in('id', ids)

  return data || []
}

export default async function CollectionPage({ params }: { params: { id: string } }) {
  const collection = await getCollection(params.id)
  const apiIds = await listCollectionAPIs(params.id)
  const apis = await getAPIs(apiIds)

  if (!collection) {
    return <div className="p-8">Collection not found.</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">{collection.name}</h1>
      <p className="text-gray-600">{collection.description}</p>

      <div className="space-y-4">
        {apis.length === 0 && (
          <p className="text-gray-600">No APIs in this collection yet.</p>
        )}
        {apis.map((api: any) => (
          <a
            key={api.id}
            href={`/apis/${api.id}`}
            className="block border p-4 rounded hover:bg-gray-50"
          >
            <h2 className="font-bold">{api.name}</h2>
            <p className="text-gray-600 text-sm">{api.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
