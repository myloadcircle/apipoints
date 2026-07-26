import { listCollections } from '@/lib/actions/collections'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const collections = await listCollections()

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Collections</h1>

      <div className="space-y-4">
        {collections.length === 0 && (
          <p className="text-gray-600">No collections yet.</p>
        )}
        {collections.map((c: any) => (
          <a
            key={c.id}
            href={`/collections/${c.id}`}
            className="block border p-4 rounded hover:bg-gray-50"
          >
            <h2 className="font-bold">{c.name}</h2>
            <p className="text-gray-600 text-sm">{c.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
