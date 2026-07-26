import { listAPIs } from '@/lib/actions/list'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function APIsPage() {
  const apis = await listAPIs()

  return (
    <div className="p-8 space-y-4">
      {apis.map((api: any) => (
        <Link key={api.id} href={'/apis/' + api.id}>
          <div className="border p-4 rounded hover:bg-gray-50">
            <h2 className="font-bold">{api.name}</h2>
            <p className="text-gray-600">{api.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
