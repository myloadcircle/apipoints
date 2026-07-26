import { listFavourites } from '@/lib/actions/favourites'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getAPIs(ids: string[]) {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('apis')
    .select('*')
    .in('id', ids)

  return data || []
}

export default async function FavouritesPage() {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const favouriteIds = await listFavourites(userId)
  const apis = await getAPIs(favouriteIds)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Favourites</h1>

      {apis.length === 0 && (
        <p className="text-gray-600">You haven't favourited any APIs yet.</p>
      )}

      <div className="space-y-4">
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
