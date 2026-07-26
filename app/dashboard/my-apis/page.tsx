import { listMyAPIs } from '@/lib/actions/my-apis'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MyAPIsPage() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'
  const apis = await listMyAPIs(ownerId)

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">My APIs</h1>
      {apis.length === 0 && (
        <p className="text-gray-600">You haven't published any APIs yet.</p>
      )}
      {apis.map((api: any) => (
        <Link key={api.id} href={`/apis/${api.id}`}>
          <div className="border p-4 rounded bg-gray-50 hover:bg-gray-100">
            <h2 className="font-bold">{api.name}</h2>
            <p className="text-gray-600">{api.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              ${api.price_per_request}/request
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
